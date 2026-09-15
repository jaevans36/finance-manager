using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Alerts.Models;
using FinanceApi.Features.Assets.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.Users.Models;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.Features.Settings.Models;
using FinanceApi.Features.Transactions.Models;
using FinanceApi.Infrastructure.Encryption;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinanceApi.Data;

/// <summary>
/// Entity Framework Core DbContext for the Finance API.
/// All tables live in the "finance" PostgreSQL schema — isolated from the life-api "public" schema.
///
/// A subset of free-text columns are encrypted at rest via <see cref="IColumnEncryptionService"/>
/// (see the "ENCRYPTED" markers below). Amounts/balances and Transaction.Description/Payee/
/// OriginalDescription/Category.Name are deliberately NOT encrypted — they're used in SQL-side
/// Sum/Where/GroupBy/Contains across the analytics and search features, which ciphertext can't
/// support. See docs/ARCHITECTURAL_DECISIONS.md (encryption ADR) before changing this list.
/// </summary>
public class FinanceDbContext : DbContext
{
    private readonly IColumnEncryptionService _encryption;

    public FinanceDbContext(DbContextOptions<FinanceDbContext> options, IColumnEncryptionService encryption)
        : base(options)
    {
        _encryption = encryption;
    }

    // Typed as the non-generic base so callers bind to PropertyBuilder's non-generic
    // HasConversion(ValueConverter) overload — avoids a nullable-generic-inference mismatch
    // warning when applying this string?/string? converter to non-nullable `string` properties.
    private Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter Encrypted
        => new EncryptedStringConverter(_encryption);

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<SpendingPot> SpendingPots => Set<SpendingPot>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<CategoryRule> CategoryRules => Set<CategoryRule>();
    public DbSet<UserFinanceSettings> UserFinanceSettings => Set<UserFinanceSettings>();
    public DbSet<IncomeStream> IncomeStreams => Set<IncomeStream>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<AccountShare> AccountShares => Set<AccountShare>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<RecurringPaymentBaseline> RecurringPaymentBaselines => Set<RecurringPaymentBaseline>();
    public DbSet<NotificationRun> NotificationRuns => Set<NotificationRun>();

    /// <summary>Read-only — see LifeManagerUser's doc comment. Never written to from finance-api.</summary>
    public DbSet<LifeManagerUser> LifeManagerUsers => Set<LifeManagerUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // All tables in the "finance" schema
        modelBuilder.HasDefaultSchema("finance");

        // ── Account ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(a => a.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext, IsRequired kept.
            entity.Property(a => a.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(a => a.Currency).HasMaxLength(3).IsRequired();
            entity.Property(a => a.Balance).HasPrecision(18, 4);
            entity.Property(a => a.Institution).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(a => a.AccountNumberSuffix).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(a => a.Notes).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(a => a.Colour).HasMaxLength(7);
            entity.Property(a => a.Icon).HasMaxLength(100);
            entity.Property(a => a.Type)
                  .HasConversion<string>()
                  .HasMaxLength(50);
            entity.Property(a => a.CreditLimit).HasPrecision(18, 4);
            entity.Property(a => a.InterestRate).HasPrecision(6, 3);
            entity.Property(a => a.PromotionalBalance).HasPrecision(18, 4);
            entity.Property(a => a.PromotionalRate).HasPrecision(6, 3);
            entity.Property(a => a.PromotionalRevertRate).HasPrecision(6, 3);
            entity.Property(a => a.MinimumMonthlyPayment).HasPrecision(18, 4);
            entity.Property(a => a.CurrentMonthlyPayment).HasPrecision(18, 4);

            entity.HasIndex(a => a.UserId);

            entity.HasMany(a => a.Transactions)
                  .WithOne(t => t.Account)
                  .HasForeignKey(t => t.AccountId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Category ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Colour).HasMaxLength(7);
            entity.Property(c => c.Icon).HasMaxLength(100);

            entity.HasOne(c => c.Parent)
                  .WithMany(c => c.Children)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(c => c.UserId);
        });

        // ── Transaction ───────────────────────────────────────────────────────
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Description).HasMaxLength(500).IsRequired();
            entity.Property(t => t.OriginalDescription).HasMaxLength(500);
            entity.Property(t => t.Payee).HasMaxLength(200);
            entity.Property(t => t.Reference).HasMaxLength(100);
            entity.Property(t => t.Notes).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(t => t.Currency).HasMaxLength(3).IsRequired();
            entity.Property(t => t.Amount).HasPrecision(18, 4);
            entity.Property(t => t.BaseCurrencyAmount).HasPrecision(18, 4);
            entity.Property(t => t.Type)
                  .HasConversion<string>()
                  .HasMaxLength(20);
            entity.Property(t => t.ImportSource)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            entity.HasIndex(t => t.UserId);
            entity.HasIndex(t => t.AccountId);
            entity.HasIndex(t => t.TransactionDate);
            entity.HasIndex(t => t.ImportBatchId);

            entity.HasOne(t => t.Category)
                  .WithMany()
                  .HasForeignKey(t => t.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Nullable FK to linked bill — set during CSV import matching
            entity.HasOne<Bill>()
                  .WithMany()
                  .HasForeignKey(t => t.BillId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Nullable FK to a named income stream — set when a credit is tagged as
            // belonging to it (see IncomeStreamId's doc comment on Transaction).
            entity.HasOne(t => t.IncomeStream)
                  .WithMany()
                  .HasForeignKey(t => t.IncomeStreamId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Budget ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Amount).HasPrecision(18, 4);
            entity.Property(b => b.RolloverFromPrevious).HasPrecision(18, 4);
            entity.Property(b => b.Title).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(b => b.Note).HasConversion(Encrypted); // ENCRYPTED
            entity.HasIndex(b => new { b.UserId, b.Month, b.Year });

            entity.HasOne(b => b.Category)
                  .WithMany()
                  .HasForeignKey(b => b.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── SpendingPot ───────────────────────────────────────────────────────
        modelBuilder.Entity<SpendingPot>(entity =>
        {
            entity.HasKey(p => p.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(p => p.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(p => p.BudgetAmount).HasPrecision(18, 4);
            entity.Property(p => p.AnnualAmount).HasPrecision(18, 4);
            entity.Property(p => p.AccumulatedAmount).HasPrecision(18, 4);
            entity.Property(p => p.Type)
                  .HasConversion<string>()
                  .HasMaxLength(50);
            entity.HasIndex(p => p.UserId);
            entity.Property(p => p.Icon).HasMaxLength(100);
            entity.Property(p => p.Colour).HasMaxLength(7);

            // Store List<Guid> as a JSON string — compatible with both InMemory and PostgreSQL
            entity.Property(p => p.CategoryIds)
                  .HasConversion(
                      v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                      v => System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<Guid>())
                  .Metadata.SetValueComparer(new ValueComparer<List<Guid>>(
                      (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                      c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                      c => c.ToList()));
        });

        // ── Bill ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<Bill>(entity =>
        {
            entity.HasKey(b => b.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(b => b.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(b => b.Description).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(b => b.Amount).HasPrecision(18, 4);
            entity.Property(b => b.Frequency).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(b => b.UserId);

            entity.HasOne(b => b.Category)
                  .WithMany()
                  .HasForeignKey(b => b.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(b => b.Account)
                  .WithMany()
                  .HasForeignKey(b => b.AccountId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── IncomeStream ─────────────────────────────────────────────────────
        modelBuilder.Entity<IncomeStream>(entity =>
        {
            entity.HasKey(s => s.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(s => s.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(s => s.MonthlyAmount).HasPrecision(18, 4);
            entity.HasIndex(s => s.UserId);

            entity.HasOne(s => s.Account)
                  .WithMany()
                  .HasForeignKey(s => s.AccountId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── SavingsGoal ───────────────────────────────────────────────────────
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.HasKey(g => g.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(g => g.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(g => g.TargetAmount).HasPrecision(18, 4);
            entity.Property(g => g.CurrentAmount).HasPrecision(18, 4);
            entity.Property(g => g.MonthlyContribution).HasPrecision(18, 4);
            entity.Property(g => g.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(g => g.UserId);
        });

        // ── CategoryRule ─────────────────────────────────────────────────────
        modelBuilder.Entity<CategoryRule>(entity =>
        {
            entity.HasKey(r => r.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(r => r.Pattern).IsRequired().HasConversion(Encrypted);
            entity.Property(r => r.MatchType).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(r => r.UserId);
            entity.HasOne(r => r.Category)
                  .WithMany()
                  .HasForeignKey(r => r.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── UserFinanceSettings ───────────────────────────────────────────────
        modelBuilder.Entity<UserFinanceSettings>(entity =>
        {
            entity.HasKey(s => s.UserId);
            entity.Property(s => s.EmergencyBuffer).HasPrecision(18, 4).HasDefaultValue(200m);

            // Store as JSON for InMemory test compatibility (PostgreSQL uses text column)
            entity.Property(s => s.IncomeAccountIds)
                .HasConversion(
                    v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => v == null ? null : System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(v, (System.Text.Json.JsonSerializerOptions?)null))
                .Metadata.SetValueComparer(new ValueComparer<List<Guid>?>(
                    (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                    c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c == null ? null : c.ToList()));
        });

        // ── ActivityLog ───────────────────────────────────────────────────────
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => l.UserId);
            // Not encrypted, and Description must never embed an encrypted column's plaintext —
            // see the class doc comment on ActivityLog.
        });

        // ── AccountShare ──────────────────────────────────────────────────────
        modelBuilder.Entity<AccountShare>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.AccountId);
            entity.HasIndex(s => s.SharedWithUserId);
            entity.HasOne(s => s.Account)
                  .WithMany()
                  .HasForeignKey(s => s.AccountId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Asset ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(a => a.Id);
            // ENCRYPTED — no HasMaxLength: widened to `text` to hold ciphertext.
            entity.Property(a => a.Name).IsRequired().HasConversion(Encrypted);
            entity.Property(a => a.Notes).HasConversion(Encrypted); // ENCRYPTED
            entity.Property(a => a.Value).HasPrecision(18, 4);
            entity.Property(a => a.Type)
                  .HasConversion<string>()
                  .HasMaxLength(50);
            entity.HasIndex(a => a.UserId);
        });

        modelBuilder.Entity<RecurringPaymentBaseline>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.MerchantName).IsRequired().HasMaxLength(500);
            entity.Property(b => b.LastAlertedAmount).HasPrecision(18, 4);
            entity.HasIndex(b => new { b.UserId, b.MerchantName, b.AccountId }).IsUnique();
        });

        modelBuilder.Entity<NotificationRun>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.RunDate).IsUnique();
        });

        // ── LifeManagerUser — read-only, owned by life-api's "public" schema ────
        modelBuilder.Entity<LifeManagerUser>(entity =>
        {
            entity.ToTable("users", "public", t => t.ExcludeFromMigrations());
            entity.HasKey(u => u.Id);
        });

        // ── Seed system categories ───────────────────────────────────────────
        SeedCategories(modelBuilder);
    }

    private static void SeedCategories(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var systemCategories = new[]
        {
            // Top-level
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Food & Drink",      Icon = "utensils",          Colour = "#22C55E", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "Transport",         Icon = "car",               Colour = "#3B82F6", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "Housing",           Icon = "home",              Colour = "#8B5CF6", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "Entertainment",     Icon = "tv",                Colour = "#F59E0B", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Health",            Icon = "heart-pulse",       Colour = "#EF4444", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Name = "Shopping",          Icon = "shopping-bag",      Colour = "#EC4899", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Name = "Bills & Utilities", Icon = "zap",               Colour = "#F97316", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Name = "Savings",           Icon = "piggy-bank",        Colour = "#0EA5E9", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Name = "Income",            Icon = "trending-up",       Colour = "#10B981", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Name = "Transfers",         Icon = "arrow-left-right",  Colour = "#6B7280", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Name = "Other",             Icon = "circle-dot",        Colour = "#94A3B8", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Name = "Debt Repayment",    Icon = "credit-card",       Colour = "#B91C1C", IsSystem = true, CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Food & Drink
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000101"), Name = "Groceries",  Icon = "shopping-cart", Colour = "#16A34A", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000001"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000102"), Name = "Restaurants",Icon = "utensils",      Colour = "#15803D", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000001"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000103"), Name = "Coffee",     Icon = "coffee",        Colour = "#78350F", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000001"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000104"), Name = "Alcohol",    Icon = "wine",          Colour = "#991B1B", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000001"), CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Transport
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000201"), Name = "Fuel",       Icon = "fuel",         Colour = "#1D4ED8", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000002"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000202"), Name = "Public Transport", Icon = "bus", Colour = "#2563EB", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000002"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000203"), Name = "Parking",    Icon = "square-parking", Colour = "#3B82F6", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000002"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000204"), Name = "Taxi / Ride Share", Icon = "car-taxi-front", Colour = "#60A5FA", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000002"), CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Bills & Utilities
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000701"), Name = "Utilities",     Icon = "zap",         Colour = "#D97706", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000703"), Name = "Broadband",     Icon = "wifi",        Colour = "#F59E0B", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000704"), Name = "Mobile Phone",  Icon = "smartphone",  Colour = "#FBBF24", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000705"), Name = "Subscriptions", Icon = "repeat",      Colour = "#FCD34D", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000707"), Name = "Council Tax",   Icon = "landmark",    Colour = "#CA8A04", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000708"), Name = "TV Licence",    Icon = "tv",          Colour = "#EA580C", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000709"), Name = "Insurance",     Icon = "shield",      Colour = "#4F46E5", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000710"), Name = "Streaming & Media", Icon = "clapperboard", Colour = "#DB2777", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Debt Repayment
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000001201"), Name = "Credit Card Payment", Icon = "credit-card", Colour = "#DC2626", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000012"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000001202"), Name = "Loan Repayment",     Icon = "hand-coins",  Colour = "#EA580C", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000012"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000001203"), Name = "Mortgage Payment",   Icon = "home",        Colour = "#C2410C", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000012"), CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Income
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000901"), Name = "Salary",        Icon = "banknote",    Colour = "#059669", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000902"), Name = "Freelance",     Icon = "briefcase",   Colour = "#10B981", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000903"), Name = "Benefits",      Icon = "landmark",    Colour = "#34D399", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000904"), Name = "Dividends",     Icon = "trending-up", Colour = "#6EE7B7", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
        };

        modelBuilder.Entity<Category>().HasData(systemCategories);
    }
}
