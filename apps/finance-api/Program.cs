using System.Reflection;
using System.Text;
using FinanceApi.Data;
using FinanceApi.Infrastructure.Encryption;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Affordability.Services;
using FinanceApi.Features.Assets.Services;
using FinanceApi.Features.IncomeStreams.Services;
using FinanceApi.Features.Debt.Services;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.Features.Categories.Services;
using FinanceApi.Features.CategoryRules.Services;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Insights.Services;
using FinanceApi.Features.SavingsGoals.Services;
using FinanceApi.Features.Transactions.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Serilog;
using Serilog.Events;

// Configure Serilog early so any startup failures are captured
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        "logs/finance-api-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14)
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Finance API");

    var builder = WebApplication.CreateBuilder(args);

    // One-time maintenance mode: encrypt existing plaintext rows in columns that just gained
    // encryption, then exit — never reaches app.Run(). Must be run after `dotnet ef database
    // update` (which widens the columns to `text`) and before the app is started normally
    // (which would otherwise try to decrypt still-plaintext rows and throw). Safe to re-run —
    // already-encrypted rows (ENC1: prefix) are skipped. See apps/finance-api/README.md.
    if (args.Contains("--backfill-encrypt-columns"))
    {
        await EncryptionBackfill.RunAsync(builder.Configuration);
        return;
    }

    builder.Host.UseSerilog((context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
            .WriteTo.Console()
            .WriteTo.File(
                "logs/finance-api-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 14));

    // ── Controllers + JSON ──────────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(opts =>
        {
            opts.JsonSerializerOptions.DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
            opts.JsonSerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter());
        });

    // ── Swagger ─────────────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Finance API",
            Version = "v1",
            Description = "Finance Manager API — personal finance tracking, budgeting, and CSV import.",
            Contact = new OpenApiContact { Name = "Life Manager" }
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });

        var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }

        options.CustomSchemaIds(type => type.FullName);
    });

    // ── Column encryption ───────────────────────────────────────────────────
    // Factory-registered (not read eagerly here) so the config lookup happens at first
    // resolution, after every configuration source — including test-host overrides — has been
    // layered in. Same fail-fast intent as Jwt:Secret: no default fallback, a default key would
    // defeat the point. Generate a real key with `openssl rand -base64 32`.
    builder.Services.AddSingleton<IColumnEncryptionService>(sp =>
    {
        var keyBase64 = sp.GetRequiredService<IConfiguration>()["Encryption:Key"]
            ?? throw new InvalidOperationException("Encryption:Key is not configured");
        return new AesColumnEncryptionService(Convert.FromBase64String(keyBase64));
    });

    // ── Database ─────────────────────────────────────────────────────────────
    builder.Services.AddDbContext<FinanceDbContext>(opts =>
        opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // ── JWT Authentication ────────────────────────────────────────────────────
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured");
        var key = Encoding.ASCII.GetBytes(jwtSecret);
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();

    // ── CORS ──────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .GetChildren()
        .Select(c => c.Value)
        .Where(v => !string.IsNullOrWhiteSpace(v))
        .ToArray();

    if (allowedOrigins.Length == 0)
    {
        allowedOrigins = new[] { "http://localhost:5173" };
    }

    var allowedOriginsSet = new HashSet<string>(
        allowedOrigins.Where(o => o is not null).Select(o => o!),
        StringComparer.OrdinalIgnoreCase);

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(corsBuilder =>
        {
            corsBuilder
                .SetIsOriginAllowed(origin => allowedOriginsSet.Contains(origin))
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });

    // ── Application Services ──────────────────────────────────────────────────
    builder.Services.AddScoped<IAccountService, AccountService>();
    builder.Services.AddScoped<IAccountSharingService, AccountSharingService>();
    builder.Services.AddScoped<ITransactionService, TransactionService>();
    builder.Services.AddScoped<ICategoryService, CategoryService>();
    builder.Services.AddSingleton<IMerchantNormalisationService, MerchantNormalisationService>();
    builder.Services.AddScoped<ICsvImportService, CsvImportService>();
    builder.Services.AddScoped<IBudgetService, BudgetService>();
    builder.Services.AddScoped<ISpendingPotService, SpendingPotService>();
    builder.Services.AddScoped<IBillService, BillService>();
    builder.Services.AddScoped<IRecurringPaymentDetector, RecurringPaymentDetector>();
    builder.Services.AddScoped<ISavingsGoalService, SavingsGoalService>();
    builder.Services.AddScoped<ICategoryRulesService, CategoryRulesService>();
    builder.Services.AddScoped<IAffordabilityService, AffordabilityService>();
    builder.Services.AddScoped<IIncomeStreamService, IncomeStreamService>();
    builder.Services.AddScoped<IDebtSeverityService, DebtSeverityService>();
    builder.Services.AddScoped<IDebtProjectionService, DebtProjectionService>();
    builder.Services.AddScoped<ISpendingVelocityService, SpendingVelocityService>();
    builder.Services.AddScoped<IAnomalyDetectionService, AnomalyDetectionService>();
    builder.Services.AddScoped<ISubscriptionAuditorService, SubscriptionAuditorService>();
    builder.Services.AddScoped<INegotiationEngineService, NegotiationEngineService>();
    builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
    builder.Services.AddScoped<IAssetService, AssetService>();

    // ── Build + Middleware Pipeline ───────────────────────────────────────────
    var app = builder.Build();

    // Run migrations on startup (skip for in-memory test databases)
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        if (db.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            db.Database.Migrate();
        }
    }

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.GetLevel = (httpContext, elapsed, ex) => ex != null
            ? LogEventLevel.Error
            : elapsed > 1000
                ? LogEventLevel.Warning
                : LogEventLevel.Information;
    });

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseRouting();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Finance API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Exposes the implicit Program class to the integration test project
public partial class Program { }

/// <summary>
/// One-time data migration: encrypts existing plaintext values in columns that have just
/// gained an EncryptedStringConverter. Run via `dotnet run --project apps/finance-api --
/// --backfill-encrypt-columns` after `dotnet ef database update` and before starting the app
/// normally. Bypasses FinanceDbContext/EF entirely (raw Npgsql) so there is no read-path/
/// write-path converter duality to reason about. Idempotent: already-encrypted values (the
/// "ENC1:" prefix) are skipped, so a re-run after an interruption just picks up where it left off.
/// </summary>
internal static class EncryptionBackfill
{
    private static readonly (string Table, string Column)[] EncryptedColumns =
    {
        ("Accounts", "Name"),
        ("Accounts", "Institution"),
        ("Accounts", "AccountNumberSuffix"),
        ("Accounts", "Notes"),
        ("Transactions", "Notes"),
        ("Bills", "Name"),
        ("Bills", "Description"),
        ("Budgets", "Title"),
        ("Budgets", "Note"),
        ("CategoryRules", "Pattern"),
        ("IncomeStreams", "Name"),
        ("SavingsGoals", "Name"),
        ("SpendingPots", "Name"),
    };

    public static async System.Threading.Tasks.Task RunAsync(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured");
        var encryptionKeyBase64 = configuration["Encryption:Key"]
            ?? throw new InvalidOperationException("Encryption:Key is not configured");
        var encryption = new AesColumnEncryptionService(Convert.FromBase64String(encryptionKeyBase64));

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        Console.WriteLine("[backfill-encrypt-columns] Starting...");
        var totalEncrypted = 0;

        foreach (var (table, column) in EncryptedColumns)
        {
            var rows = new List<(Guid Id, string Value)>();

            await using (var select = new NpgsqlCommand(
                $"SELECT \"Id\", \"{column}\" FROM finance.\"{table}\" " +
                $"WHERE \"{column}\" IS NOT NULL AND \"{column}\" NOT LIKE '{AesColumnEncryptionService.VersionPrefix}%'",
                connection))
            await using (var reader = await select.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    rows.Add((reader.GetGuid(0), reader.GetString(1)));
                }
            }

            foreach (var (id, value) in rows)
            {
                var encrypted = encryption.Encrypt(value);
                await using var update = new NpgsqlCommand(
                    $"UPDATE finance.\"{table}\" SET \"{column}\" = @value WHERE \"Id\" = @id",
                    connection);
                update.Parameters.AddWithValue("value", encrypted!);
                update.Parameters.AddWithValue("id", id);
                await update.ExecuteNonQueryAsync();
            }

            totalEncrypted += rows.Count;
            Console.WriteLine($"[backfill-encrypt-columns] {table}.{column}: encrypted {rows.Count} row(s).");
        }

        Console.WriteLine($"[backfill-encrypt-columns] Done — {totalEncrypted} value(s) encrypted across {EncryptedColumns.Length} columns.");
    }
}

