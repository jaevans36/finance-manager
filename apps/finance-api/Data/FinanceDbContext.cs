using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinanceApi.Data;

/// <summary>
/// Entity Framework Core DbContext for the Finance API.
/// All tables live in the "finance" PostgreSQL schema — isolated from the life-api "public" schema.
/// </summary>
public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<SpendingPot> SpendingPots => Set<SpendingPot>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<CategoryRule> CategoryRules => Set<CategoryRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // All tables in the "finance" schema
        modelBuilder.HasDefaultSchema("finance");

        // ── Account ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Name).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Currency).HasMaxLength(3).IsRequired();
            entity.Property(a => a.Balance).HasPrecision(18, 4);
            entity.Property(a => a.Institution).HasMaxLength(200);
            entity.Property(a => a.AccountNumberSuffix).HasMaxLength(4);
            entity.Property(a => a.Colour).HasMaxLength(7);
            entity.Property(a => a.Icon).HasMaxLength(100);
            entity.Property(a => a.Type)
                  .HasConversion<string>()
                  .HasMaxLength(50);

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
        });

        // ── Budget ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Amount).HasPrecision(18, 4);
            entity.Property(b => b.RolloverFromPrevious).HasPrecision(18, 4);
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
            entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
            entity.Property(p => p.BudgetAmount).HasPrecision(18, 4);
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
            entity.Property(b => b.Name).HasMaxLength(200).IsRequired();
            entity.Property(b => b.Amount).HasPrecision(18, 4);
            entity.Property(b => b.Frequency).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(b => b.UserId);

            entity.HasOne(b => b.Category)
                  .WithMany()
                  .HasForeignKey(b => b.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── SavingsGoal ───────────────────────────────────────────────────────
        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Name).HasMaxLength(200).IsRequired();
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
            entity.Property(r => r.Pattern).HasMaxLength(200).IsRequired();
            entity.Property(r => r.MatchType).HasConversion<string>().HasMaxLength(20);
            entity.HasIndex(r => r.UserId);
            entity.HasOne(r => r.Category)
                  .WithMany()
                  .HasForeignKey(r => r.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
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
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000701"), Name = "Electricity",   Icon = "zap",         Colour = "#D97706", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000702"), Name = "Gas",           Icon = "flame",       Colour = "#B45309", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000703"), Name = "Broadband",     Icon = "wifi",        Colour = "#F59E0B", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000704"), Name = "Mobile Phone",  Icon = "smartphone",  Colour = "#FBBF24", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000705"), Name = "Subscriptions", Icon = "repeat",      Colour = "#FCD34D", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000007"), CreatedAt = now, UpdatedAt = now },
            // Sub-categories — Income
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000901"), Name = "Salary",        Icon = "banknote",    Colour = "#059669", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000902"), Name = "Freelance",     Icon = "briefcase",   Colour = "#10B981", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000903"), Name = "Benefits",      Icon = "landmark",    Colour = "#34D399", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
            new Category { Id = Guid.Parse("10000000-0000-0000-0000-000000000904"), Name = "Dividends",     Icon = "trending-up", Colour = "#6EE7B7", IsSystem = true, ParentId = Guid.Parse("10000000-0000-0000-0000-000000000009"), CreatedAt = now, UpdatedAt = now },
        };

        modelBuilder.Entity<Category>().HasData(systemCategories);
    }
}
