# Phase 42: Budgeting & Spending Pots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add monthly category budgets and envelope-style spending pots to the Finance API, with progress calculation, threshold alerts, and matching frontend components.

**Architecture:** Backend adds `Budget` and `SpendingPot` entities to the existing `finance` PostgreSQL schema. `BudgetService` calculates spent amounts by joining transactions for the requested month/category. `SpendingPotService` aggregates across multiple mapped categories. Frontend components use raw `useEffect`/`useState` (matching AccountsDashboard convention) and mock `finance-api-client` in tests.

**Tech Stack:** .NET 8 / EF Core 8 / xUnit / FluentAssertions (backend); React 18 / TypeScript / Tailwind / shadcn/ui / Recharts (frontend); Jest + React Testing Library (frontend tests)

---

## File Map

**Create (backend):**
- `apps/finance-api/Features/Budgets/Models/Budget.cs`
- `apps/finance-api/Features/Budgets/Models/SpendingPot.cs`
- `apps/finance-api/Features/Budgets/Services/IBudgetService.cs` — DTOs + interface
- `apps/finance-api/Features/Budgets/Services/BudgetService.cs`
- `apps/finance-api/Features/Budgets/Services/ISpendingPotService.cs` — DTOs + interface
- `apps/finance-api/Features/Budgets/Services/SpendingPotService.cs`
- `apps/finance-api/Features/Budgets/Controllers/BudgetsController.cs`
- `apps/finance-api/Features/Budgets/Controllers/PotsController.cs`

**Modify (backend):**
- `apps/finance-api/Data/FinanceDbContext.cs` — add DbSets + ModelBuilder config
- `apps/finance-api/Program.cs` — register services

**Create (tests):**
- `apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/BudgetServiceTests.cs`
- `apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/SpendingPotServiceTests.cs`
- `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/BudgetsControllerTests.cs`
- `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/PotsControllerTests.cs`

**Create (frontend):**
- `apps/web/src/services/budget-service.ts`
- `apps/web/src/services/pot-service.ts`
- `apps/web/src/components/finance/BudgetDashboard.tsx`
- `apps/web/src/components/finance/SpendingPots.tsx`
- `apps/web/src/components/finance/BudgetForm.tsx`
- `apps/web/src/components/finance/BudgetTrends.tsx`

**Modify (frontend):**
- `apps/web/src/types/finance.ts` — add Budget, SpendingPot, trend types

**Create (frontend tests):**
- `apps/web/tests/components/BudgetDashboard.test.tsx`
- `apps/web/tests/components/SpendingPots.test.tsx`
- `apps/web/tests/components/BudgetForm.test.tsx`

---

## Task 1: Budget and SpendingPot entities (T1182)

**Files:**
- Create: `apps/finance-api/Features/Budgets/Models/Budget.cs`
- Create: `apps/finance-api/Features/Budgets/Models/SpendingPot.cs`

- [ ] **Step 1: Create Budget entity**

```csharp
// apps/finance-api/Features/Budgets/Models/Budget.cs
using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Budgets.Models;

public class Budget
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public int Month { get; set; }   // 1–12
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public decimal RolloverFromPrevious { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Category? Category { get; set; }
}
```

- [ ] **Step 2: Create SpendingPot entity**

```csharp
// apps/finance-api/Features/Budgets/Models/SpendingPot.cs
namespace FinanceApi.Features.Budgets.Models;

public enum PotType
{
    Groceries, Fuel, EatingOut, Kids, Clothing,
    Entertainment, Bills, Subscriptions, Savings,
    EmergencyFund, Holiday, Custom
}

public class SpendingPot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public PotType Type { get; set; }
    public decimal BudgetAmount { get; set; }
    public bool RolloverEnabled { get; set; }
    public string? Icon { get; set; }
    public string? Colour { get; set; }

    /// <summary>IDs of categories whose transactions count toward this pot's spending.</summary>
    public List<Guid> CategoryIds { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/finance-api/Features/Budgets/
git commit -m "feat: add Budget and SpendingPot entities (T1182)"
```

---

## Task 2: FinanceDbContext updates + EF migration (T1183)

**Files:**
- Modify: `apps/finance-api/Data/FinanceDbContext.cs`
- Generated: `apps/finance-api/Migrations/*_AddBudgetsAndPots.cs`

- [ ] **Step 1: Add DbSets and model configuration to FinanceDbContext**

Add the two `using` statements at the top of `FinanceDbContext.cs`:

```csharp
using FinanceApi.Features.Budgets.Models;
using Microsoft.EntityFrameworkCore.ChangeTracking;
```

Add the DbSets alongside the existing ones:

```csharp
public DbSet<Budget> Budgets => Set<Budget>();
public DbSet<SpendingPot> SpendingPots => Set<SpendingPot>();
```

Add the following two blocks inside `OnModelCreating`, after the `Transaction` block and before `SeedCategories`:

```csharp
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

    // Store List<Guid> as a JSON string — compatible with both InMemory and PostgreSQL
    entity.Property(p => p.CategoryIds)
          .HasConversion(
              v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
              v => System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<Guid>())
          .Metadata.SetValueComparer(new ValueComparer<List<Guid>>(
              (c1, c2) => c1!.SequenceEqual(c2!),
              c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
              c => c.ToList()));
});
```

- [ ] **Step 2: Generate migration**

```powershell
cd apps/finance-api
dotnet ef migrations add AddBudgetsAndPots
```

Expected: new file `Migrations/*_AddBudgetsAndPots.cs` with `CreateTable` calls for `finance.Budgets` and `finance.SpendingPots`.

- [ ] **Step 3: Verify the migration creates tables in the `finance` schema**

Open the generated migration file and confirm both `CreateTable` calls have `schema: "finance"` in the table definition.

- [ ] **Step 4: Commit**

```bash
git add apps/finance-api/Data/ apps/finance-api/Migrations/
git commit -m "feat: add Budgets and SpendingPots tables to finance schema (T1183)"
```

---

## Task 3: BudgetService — interfaces, unit tests, and implementation (T1184, T1187)

**Files:**
- Create: `apps/finance-api/Features/Budgets/Services/IBudgetService.cs`
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/BudgetServiceTests.cs`
- Create: `apps/finance-api/Features/Budgets/Services/BudgetService.cs`

- [ ] **Step 1: Create IBudgetService.cs with DTOs and interface**

```csharp
// apps/finance-api/Features/Budgets/Services/IBudgetService.cs
namespace FinanceApi.Features.Budgets.Services;

public record BudgetWithProgress(
    Guid Id,
    Guid CategoryId,
    string? CategoryName,
    string? CategoryColour,
    string? CategoryIcon,
    int Month,
    int Year,
    decimal Amount,
    decimal Spent,
    decimal RolloverFromPrevious,
    decimal PercentageUsed,
    bool IsWarning,
    bool IsExceeded
);

public record CreateBudgetRequest(Guid CategoryId, int Month, int Year, decimal Amount);

public record UpdateBudgetRequest(decimal? Amount);

public record CategoryBudgetSpend(string CategoryName, string? CategoryColour, decimal Budgeted, decimal Spent);

public record BudgetTrendPoint(int Month, int Year, string MonthLabel, IEnumerable<CategoryBudgetSpend> Categories);

public interface IBudgetService
{
    Task<IEnumerable<BudgetWithProgress>> GetBudgetsAsync(Guid userId, int month, int year, CancellationToken ct = default);
    Task<IEnumerable<BudgetWithProgress>> GetCurrentBudgetsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<BudgetTrendPoint>> GetTrendsAsync(Guid userId, int months = 6, CancellationToken ct = default);
    Task<BudgetWithProgress> CreateBudgetAsync(Guid userId, CreateBudgetRequest request, CancellationToken ct = default);
    Task<BudgetWithProgress?> UpdateBudgetAsync(Guid userId, Guid budgetId, UpdateBudgetRequest request, CancellationToken ct = default);
    Task<bool> DeleteBudgetAsync(Guid userId, Guid budgetId, CancellationToken ct = default);
    Task<IEnumerable<BudgetWithProgress>> CopyFromPreviousMonthAsync(Guid userId, int month, int year, CancellationToken ct = default);
}
```

- [ ] **Step 2: Write BudgetServiceTests.cs (RED — will fail until BudgetService exists)**

```csharp
// apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/BudgetServiceTests.cs
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Budgets.Services;

public class BudgetServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly BudgetService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();
    private readonly Guid _categoryId = Guid.NewGuid();

    public BudgetServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);

        _db.Accounts.Add(new Account
        {
            Id = _accountId, UserId = _userId, Name = "Test",
            Type = AccountType.Checking, Currency = "GBP", Balance = 0
        });
        _db.Categories.Add(new Category
        {
            Id = _categoryId, Name = "Groceries",
            Colour = "#22C55E", Icon = "shopping-cart", IsSystem = true
        });
        _db.SaveChanges();

        _sut = new BudgetService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenDebitTransactionInCategory_CalculatesSpentCorrectly()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(75m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].Spent.Should().Be(75m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenNoTransactions_SpentIsZero()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 300m));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenSpentIsEightyPercent_IsWarningTrueAndExceededFalse()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 100m));
        _db.Transactions.Add(MakeTx(80m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].IsWarning.Should().BeTrue();
        result[0].IsExceeded.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenSpentExceedsBudget_IsExceededTrue()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 50m));
        _db.Transactions.Add(MakeTx(75m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].IsExceeded.Should().BeTrue();
        result[0].IsWarning.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountTransactionsFromOtherMonths()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(100m, TransactionType.Debit, DateOnly.FromDateTime(now.AddMonths(-1))));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountCreditTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(500m, TransactionType.Credit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountDuplicateTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        var tx = MakeTx(50m, TransactionType.Debit, DateOnly.FromDateTime(now));
        tx.IsDuplicate = true;
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task CreateBudgetAsync_StoresBudgetWithCorrectFields()
    {
        var request = new CreateBudgetRequest(_categoryId, 6, 2025, 250m);

        var result = await _sut.CreateBudgetAsync(_userId, request);

        result.CategoryId.Should().Be(_categoryId);
        result.Amount.Should().Be(250m);
        result.Month.Should().Be(6);
        result.Year.Should().Be(2025);
        result.Spent.Should().Be(0m);
    }

    [Fact]
    public async Task UpdateBudgetAsync_WhenBudgetExists_UpdatesAmount()
    {
        var now = DateTime.UtcNow;
        var budget = MakeBudget(now.Month, now.Year, 100m);
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBudgetAsync(_userId, budget.Id, new UpdateBudgetRequest(200m));

        result.Should().NotBeNull();
        result!.Amount.Should().Be(200m);
    }

    [Fact]
    public async Task UpdateBudgetAsync_WhenBudgetNotFound_ReturnsNull()
    {
        var result = await _sut.UpdateBudgetAsync(_userId, Guid.NewGuid(), new UpdateBudgetRequest(100m));

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBudgetAsync_WhenBudgetExists_RemovesBudgetAndReturnsTrue()
    {
        var budget = MakeBudget(1, 2025, 100m);
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteBudgetAsync(_userId, budget.Id);

        result.Should().BeTrue();
        (await _db.Budgets.FindAsync(budget.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteBudgetAsync_WhenBudgetNotFound_ReturnsFalse()
    {
        var result = await _sut.DeleteBudgetAsync(_userId, Guid.NewGuid());
        result.Should().BeFalse();
    }

    [Fact]
    public async Task CopyFromPreviousMonthAsync_WhenPreviousMonthHasBudgets_CreatesCopiesForTargetMonth()
    {
        var prev = DateTime.UtcNow.AddMonths(-1);
        _db.Budgets.Add(MakeBudget(prev.Month, prev.Year, 150m));
        await _db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var result = (await _sut.CopyFromPreviousMonthAsync(_userId, now.Month, now.Year)).ToList();

        result.Should().HaveCount(1);
        result[0].Month.Should().Be(now.Month);
        result[0].Year.Should().Be(now.Year);
        result[0].Amount.Should().Be(150m);
    }

    [Fact]
    public async Task GetTrendsAsync_DoesNotReturnOtherUsersData()
    {
        var otherUser = Guid.NewGuid();
        _db.Budgets.Add(new Budget
        {
            UserId = otherUser, CategoryId = _categoryId, Month = 1, Year = 2025, Amount = 100m
        });
        await _db.SaveChangesAsync();

        var result = (await _sut.GetTrendsAsync(_userId, 12)).ToList();

        result.Should().BeEmpty();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Budget MakeBudget(int month, int year, decimal amount) =>
        new() { UserId = _userId, CategoryId = _categoryId, Month = month, Year = year, Amount = amount };

    private Transaction MakeTx(decimal amount, TransactionType type, DateOnly date) =>
        new()
        {
            UserId = _userId, AccountId = _accountId, CategoryId = _categoryId,
            Type = type, Amount = amount, BaseCurrencyAmount = amount,
            Currency = "GBP", Description = "TEST", TransactionDate = date
        };
}
```

- [ ] **Step 3: Run tests to confirm RED**

```powershell
cd "c:\Projects\Finance Manager"
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj --filter "FullyQualifiedName~BudgetServiceTests"
```

Expected: Build failure (BudgetService doesn't exist yet).

- [ ] **Step 4: Create BudgetService.cs**

```csharp
// apps/finance-api/Features/Budgets/Services/BudgetService.cs
using FinanceApi.Data;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Budgets.Services;

public class BudgetService : IBudgetService
{
    private readonly FinanceDbContext _db;

    public BudgetService(FinanceDbContext db) => _db = db;

    public Task<IEnumerable<BudgetWithProgress>> GetCurrentBudgetsAsync(Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return GetBudgetsAsync(userId, now.Month, now.Year, ct);
    }

    public async Task<IEnumerable<BudgetWithProgress>> GetBudgetsAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var budgets = await _db.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .OrderBy(b => b.Category!.Name)
            .ToListAsync(ct);

        var results = new List<BudgetWithProgress>(budgets.Count);
        foreach (var budget in budgets)
            results.Add(await BuildProgressAsync(budget, ct));

        return results;
    }

    public async Task<IEnumerable<BudgetTrendPoint>> GetTrendsAsync(Guid userId, int months = 6, CancellationToken ct = default)
    {
        var points = new List<BudgetTrendPoint>();
        var now = DateTime.UtcNow;

        for (var i = months - 1; i >= 0; i--)
        {
            var target = now.AddMonths(-i);
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && b.Month == target.Month && b.Year == target.Year)
                .ToListAsync(ct);

            if (!budgets.Any()) continue;

            var categorySpends = new List<CategoryBudgetSpend>();
            foreach (var budget in budgets)
            {
                var spent = await GetSpentAsync(userId, budget.CategoryId, target.Month, target.Year, ct);
                categorySpends.Add(new CategoryBudgetSpend(
                    budget.Category?.Name ?? "Unknown",
                    budget.Category?.Colour,
                    budget.Amount,
                    spent));
            }

            points.Add(new BudgetTrendPoint(target.Month, target.Year, target.ToString("MMM yyyy"), categorySpends));
        }

        return points;
    }

    public async Task<BudgetWithProgress> CreateBudgetAsync(Guid userId, CreateBudgetRequest request, CancellationToken ct = default)
    {
        var budget = new Budget
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Month = request.Month,
            Year = request.Year,
            Amount = request.Amount
        };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(budget).Reference(b => b.Category).LoadAsync(ct);
        return await BuildProgressAsync(budget, ct);
    }

    public async Task<BudgetWithProgress?> UpdateBudgetAsync(Guid userId, Guid budgetId, UpdateBudgetRequest request, CancellationToken ct = default)
    {
        var budget = await _db.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId, ct);

        if (budget is null) return null;

        if (request.Amount.HasValue) budget.Amount = request.Amount.Value;
        budget.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await BuildProgressAsync(budget, ct);
    }

    public async Task<bool> DeleteBudgetAsync(Guid userId, Guid budgetId, CancellationToken ct = default)
    {
        var budget = await _db.Budgets
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId, ct);

        if (budget is null) return false;
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IEnumerable<BudgetWithProgress>> CopyFromPreviousMonthAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var prev = new DateTime(year, month, 1).AddMonths(-1);
        var previousBudgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.Month == prev.Month && b.Year == prev.Year)
            .ToListAsync(ct);

        var existingCategoryIds = await _db.Budgets
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .Select(b => b.CategoryId)
            .ToListAsync(ct);

        var newBudgets = previousBudgets
            .Where(p => !existingCategoryIds.Contains(p.CategoryId))
            .Select(p => new Budget
            {
                UserId = userId,
                CategoryId = p.CategoryId,
                Month = month,
                Year = year,
                Amount = p.Amount
            })
            .ToList();

        _db.Budgets.AddRange(newBudgets);
        await _db.SaveChangesAsync(ct);
        return await GetBudgetsAsync(userId, month, year, ct);
    }

    private async Task<BudgetWithProgress> BuildProgressAsync(Budget budget, CancellationToken ct)
    {
        var spent = await GetSpentAsync(budget.UserId, budget.CategoryId, budget.Month, budget.Year, ct);
        var total = budget.Amount + budget.RolloverFromPrevious;
        var pct = total > 0 ? Math.Round(spent / total * 100, 1) : 0;

        return new BudgetWithProgress(
            budget.Id, budget.CategoryId,
            budget.Category?.Name, budget.Category?.Colour, budget.Category?.Icon,
            budget.Month, budget.Year, budget.Amount, spent, budget.RolloverFromPrevious,
            pct, pct is >= 80 and < 100, pct >= 100);
    }

    private Task<decimal> GetSpentAsync(Guid userId, Guid categoryId, int month, int year, CancellationToken ct)
        => _db.Transactions
            .Where(t => t.UserId == userId
                     && t.CategoryId == categoryId
                     && t.TransactionDate.Month == month
                     && t.TransactionDate.Year == year
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate)
            .SumAsync(t => t.Amount, ct);
}
```

- [ ] **Step 5: Run tests and confirm all GREEN**

```powershell
cd "c:\Projects\Finance Manager"
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj --filter "FullyQualifiedName~BudgetServiceTests"
```

Expected: `Passed! — Failed: 0, Passed: 13`

- [ ] **Step 6: Commit**

```bash
git add apps/finance-api/Features/Budgets/Services/IBudgetService.cs apps/finance-api/Features/Budgets/Services/BudgetService.cs apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/
git commit -m "feat: BudgetService with spending progress calculation (T1184, T1187)"
```

---

## Task 4: SpendingPotService — interfaces, unit tests, and implementation (T1185, T1187)

**Files:**
- Create: `apps/finance-api/Features/Budgets/Services/ISpendingPotService.cs`
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/SpendingPotServiceTests.cs`
- Create: `apps/finance-api/Features/Budgets/Services/SpendingPotService.cs`

- [ ] **Step 1: Create ISpendingPotService.cs**

```csharp
// apps/finance-api/Features/Budgets/Services/ISpendingPotService.cs
using FinanceApi.Features.Budgets.Models;

namespace FinanceApi.Features.Budgets.Services;

public record SpendingPotWithProgress(
    Guid Id,
    string Name,
    PotType Type,
    decimal BudgetAmount,
    decimal Spent,
    decimal Remaining,
    bool RolloverEnabled,
    string? Icon,
    string? Colour,
    IReadOnlyList<Guid> CategoryIds,
    decimal PercentageUsed,
    bool IsWarning,
    bool IsExceeded
);

public record CreateSpendingPotRequest(
    string Name,
    PotType Type,
    decimal BudgetAmount,
    bool RolloverEnabled,
    string? Icon,
    string? Colour,
    IEnumerable<Guid> CategoryIds
);

public record UpdateSpendingPotRequest(
    string? Name,
    decimal? BudgetAmount,
    bool? RolloverEnabled,
    string? Icon,
    string? Colour,
    IEnumerable<Guid>? CategoryIds
);

public interface ISpendingPotService
{
    Task<IEnumerable<SpendingPotWithProgress>> GetPotsWithProgressAsync(Guid userId, int month, int year, CancellationToken ct = default);
    Task<SpendingPotWithProgress> CreatePotAsync(Guid userId, CreateSpendingPotRequest request, CancellationToken ct = default);
    Task<SpendingPotWithProgress?> UpdatePotAsync(Guid userId, Guid potId, UpdateSpendingPotRequest request, CancellationToken ct = default);
    Task<bool> DeletePotAsync(Guid userId, Guid potId, CancellationToken ct = default);
    Task<bool> AssignTransactionAsync(Guid userId, Guid potId, Guid transactionId, CancellationToken ct = default);
}
```

- [ ] **Step 2: Write SpendingPotServiceTests.cs (RED)**

```csharp
// apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/Services/SpendingPotServiceTests.cs
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Budgets.Services;

public class SpendingPotServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly SpendingPotService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();
    private readonly Guid _groceriesCategoryId = Guid.NewGuid();
    private readonly Guid _fuelCategoryId = Guid.NewGuid();

    public SpendingPotServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);

        _db.Accounts.Add(new Account
        {
            Id = _accountId, UserId = _userId, Name = "Test",
            Type = AccountType.Checking, Currency = "GBP", Balance = 0
        });
        _db.Categories.AddRange(
            new Category { Id = _groceriesCategoryId, Name = "Groceries", IsSystem = true },
            new Category { Id = _fuelCategoryId, Name = "Fuel", IsSystem = true }
        );
        _db.SaveChanges();

        _sut = new SpendingPotService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenTransactionInMappedCategory_CountsTowardSpent()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Food", Type = PotType.Groceries,
            BudgetAmount = 300m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(60m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result.Should().HaveCount(1);
        result[0].Spent.Should().Be(60m);
        result[0].Remaining.Should().Be(240m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenTransactionInUnmappedCategory_NotCounted()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Groceries Pot", Type = PotType.Groceries,
            BudgetAmount = 200m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(50m, _fuelCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenPotMapsMultipleCategories_SumsAllTransactions()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Transport", Type = PotType.Fuel,
            BudgetAmount = 200m, CategoryIds = new List<Guid> { _groceriesCategoryId, _fuelCategoryId }
        });
        _db.Transactions.AddRange(
            MakeTx(30m, _groceriesCategoryId, DateOnly.FromDateTime(now)),
            MakeTx(45m, _fuelCategoryId, DateOnly.FromDateTime(now))
        );
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].Spent.Should().Be(75m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenSpentIs80Percent_IsWarningTrue()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(80m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].IsWarning.Should().BeTrue();
        result[0].IsExceeded.Should().BeFalse();
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenSpentExceedsBudget_RemainingIsNegative()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 50m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(80m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].IsExceeded.Should().BeTrue();
        result[0].Remaining.Should().BeNegative();
    }

    [Fact]
    public async Task CreatePotAsync_StoresPotWithCategoryIds()
    {
        var request = new CreateSpendingPotRequest(
            "Groceries", PotType.Groceries, 250m, false, "shopping-cart", "#22C55E",
            new[] { _groceriesCategoryId });

        var result = await _sut.CreatePotAsync(_userId, request);

        result.Name.Should().Be("Groceries");
        result.BudgetAmount.Should().Be(250m);
        result.CategoryIds.Should().Contain(_groceriesCategoryId);
    }

    [Fact]
    public async Task UpdatePotAsync_WhenPotExists_UpdatesFields()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "Old Name", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid>()
        };
        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdatePotAsync(_userId, pot.Id,
            new UpdateSpendingPotRequest("New Name", 200m, null, null, null, null));

        result.Should().NotBeNull();
        result!.Name.Should().Be("New Name");
        result.BudgetAmount.Should().Be(200m);
    }

    [Fact]
    public async Task UpdatePotAsync_WhenPotNotFound_ReturnsNull()
    {
        var result = await _sut.UpdatePotAsync(_userId, Guid.NewGuid(),
            new UpdateSpendingPotRequest("X", null, null, null, null, null));

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeletePotAsync_WhenPotExists_RemovesPotAndReturnsTrue()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "To Delete", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid>()
        };
        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync();

        var result = await _sut.DeletePotAsync(_userId, pot.Id);

        result.Should().BeTrue();
        (await _db.SpendingPots.FindAsync(pot.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeletePotAsync_WhenPotNotFound_ReturnsFalse()
    {
        var result = await _sut.DeletePotAsync(_userId, Guid.NewGuid());
        result.Should().BeFalse();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Transaction MakeTx(decimal amount, Guid categoryId, DateOnly date) =>
        new()
        {
            UserId = _userId, AccountId = _accountId, CategoryId = categoryId,
            Type = TransactionType.Debit, Amount = amount, BaseCurrencyAmount = amount,
            Currency = "GBP", Description = "TEST", TransactionDate = date
        };
}
```

- [ ] **Step 3: Run tests to confirm RED (build failure — SpendingPotService missing)**

```powershell
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj --filter "FullyQualifiedName~SpendingPotServiceTests"
```

- [ ] **Step 4: Create SpendingPotService.cs**

```csharp
// apps/finance-api/Features/Budgets/Services/SpendingPotService.cs
using FinanceApi.Data;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Budgets.Services;

public class SpendingPotService : ISpendingPotService
{
    private readonly FinanceDbContext _db;

    public SpendingPotService(FinanceDbContext db) => _db = db;

    public async Task<IEnumerable<SpendingPotWithProgress>> GetPotsWithProgressAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var pots = await _db.SpendingPots
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        var results = new List<SpendingPotWithProgress>(pots.Count);
        foreach (var pot in pots)
            results.Add(await BuildProgressAsync(pot, month, year, ct));

        return results;
    }

    public async Task<SpendingPotWithProgress> CreatePotAsync(Guid userId, CreateSpendingPotRequest request, CancellationToken ct = default)
    {
        var pot = new SpendingPot
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            BudgetAmount = request.BudgetAmount,
            RolloverEnabled = request.RolloverEnabled,
            Icon = request.Icon,
            Colour = request.Colour,
            CategoryIds = request.CategoryIds.ToList()
        };
        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        return await BuildProgressAsync(pot, now.Month, now.Year, ct);
    }

    public async Task<SpendingPotWithProgress?> UpdatePotAsync(Guid userId, Guid potId, UpdateSpendingPotRequest request, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots
            .FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);

        if (pot is null) return null;

        if (request.Name is not null) pot.Name = request.Name;
        if (request.BudgetAmount.HasValue) pot.BudgetAmount = request.BudgetAmount.Value;
        if (request.RolloverEnabled.HasValue) pot.RolloverEnabled = request.RolloverEnabled.Value;
        if (request.Icon is not null) pot.Icon = request.Icon;
        if (request.Colour is not null) pot.Colour = request.Colour;
        if (request.CategoryIds is not null) pot.CategoryIds = request.CategoryIds.ToList();
        pot.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        return await BuildProgressAsync(pot, now.Month, now.Year, ct);
    }

    public async Task<bool> DeletePotAsync(Guid userId, Guid potId, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots
            .FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);

        if (pot is null) return false;
        _db.SpendingPots.Remove(pot);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> AssignTransactionAsync(Guid userId, Guid potId, Guid transactionId, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots.FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);
        var tx = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId, ct);

        if (pot is null || tx is null) return false;

        if (tx.CategoryId.HasValue && !pot.CategoryIds.Contains(tx.CategoryId.Value))
        {
            pot.CategoryIds.Add(tx.CategoryId.Value);
            pot.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return true;
    }

    private async Task<SpendingPotWithProgress> BuildProgressAsync(SpendingPot pot, int month, int year, CancellationToken ct)
    {
        decimal spent = 0;
        if (pot.CategoryIds.Count > 0)
        {
            var categoryIds = pot.CategoryIds;
            var transactions = await _db.Transactions
                .Where(t => t.UserId == pot.UserId
                         && t.CategoryId.HasValue
                         && t.TransactionDate.Month == month
                         && t.TransactionDate.Year == year
                         && t.Type == TransactionType.Debit
                         && !t.IsDuplicate)
                .ToListAsync(ct);

            spent = transactions
                .Where(t => categoryIds.Contains(t.CategoryId!.Value))
                .Sum(t => t.Amount);
        }

        var pct = pot.BudgetAmount > 0 ? Math.Round(spent / pot.BudgetAmount * 100, 1) : 0;

        return new SpendingPotWithProgress(
            pot.Id, pot.Name, pot.Type, pot.BudgetAmount, spent,
            pot.BudgetAmount - spent, pot.RolloverEnabled, pot.Icon, pot.Colour,
            pot.CategoryIds, pct, pct is >= 80 and < 100, pct >= 100);
    }
}
```

- [ ] **Step 5: Run tests and confirm GREEN**

```powershell
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj --filter "FullyQualifiedName~SpendingPotServiceTests"
```

Expected: `Passed! — Failed: 0, Passed: 10`

- [ ] **Step 6: Run full unit suite to confirm no regressions**

```powershell
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj
```

Expected: All 58+ tests passing.

- [ ] **Step 7: Commit**

```bash
git add apps/finance-api/Features/Budgets/Services/ apps/finance-api-tests/FinanceApi.UnitTests/Features/Budgets/
git commit -m "feat: SpendingPotService with category-based spending calculation (T1185, T1187)"
```

---

## Task 5: Controllers + service registration (T1186)

**Files:**
- Create: `apps/finance-api/Features/Budgets/Controllers/BudgetsController.cs`
- Create: `apps/finance-api/Features/Budgets/Controllers/PotsController.cs`
- Modify: `apps/finance-api/Program.cs`

- [ ] **Step 1: Create BudgetsController.cs**

```csharp
// apps/finance-api/Features/Budgets/Controllers/BudgetsController.cs
using System.Security.Claims;
using FinanceApi.Features.Budgets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Budgets.Controllers;

[ApiController]
[Route("api/v1/finance/budgets")]
[Authorize]
[Produces("application/json")]
public class BudgetsController : ControllerBase
{
    private readonly IBudgetService _budgets;

    public BudgetsController(IBudgetService budgets) => _budgets = budgets;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token"));

    /// <summary>List budgets for a given month/year (defaults to current month).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBudgets([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _budgets.GetBudgetsAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }

    /// <summary>Get budgets for the current calendar month with live spending progress.</summary>
    [HttpGet("current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentBudgets(CancellationToken ct) =>
        Ok(await _budgets.GetCurrentBudgetsAsync(GetUserId(), ct));

    /// <summary>Budget trends: budgeted vs actual for the last N months.</summary>
    [HttpGet("trends")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrends([FromQuery] int months = 6, CancellationToken ct = default) =>
        Ok(await _budgets.GetTrendsAsync(GetUserId(), months, ct));

    /// <summary>Create a budget for a category and month/year.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0) return BadRequest("Budget amount must be greater than zero");
        if (request.CategoryId == Guid.Empty) return BadRequest("Category ID is required");
        var budget = await _budgets.CreateBudgetAsync(GetUserId(), request, ct);
        return Created($"/api/v1/finance/budgets/{budget.Id}", budget);
    }

    /// <summary>Update a budget's amount.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] UpdateBudgetRequest request, CancellationToken ct)
    {
        var budget = await _budgets.UpdateBudgetAsync(GetUserId(), id, request, ct);
        return budget is null ? NotFound() : Ok(budget);
    }

    /// <summary>Delete a budget.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBudget(Guid id, CancellationToken ct)
    {
        var deleted = await _budgets.DeleteBudgetAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Copy budgets from the previous month into the target month (skips existing ones).</summary>
    [HttpPost("copy-from-previous")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CopyFromPrevious([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _budgets.CopyFromPreviousMonthAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }
}
```

- [ ] **Step 2: Create PotsController.cs**

```csharp
// apps/finance-api/Features/Budgets/Controllers/PotsController.cs
using System.Security.Claims;
using FinanceApi.Features.Budgets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Budgets.Controllers;

[ApiController]
[Route("api/v1/finance/pots")]
[Authorize]
[Produces("application/json")]
public class PotsController : ControllerBase
{
    private readonly ISpendingPotService _pots;

    public PotsController(ISpendingPotService pots) => _pots = pots;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token"));

    /// <summary>List all spending pots with live progress for the given month/year.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPots([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _pots.GetPotsWithProgressAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }

    /// <summary>Create a spending pot.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePot([FromBody] CreateSpendingPotRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Pot name is required");
        if (request.BudgetAmount <= 0) return BadRequest("Budget amount must be greater than zero");
        var pot = await _pots.CreatePotAsync(GetUserId(), request, ct);
        return Created($"/api/v1/finance/pots/{pot.Id}", pot);
    }

    /// <summary>Update a spending pot.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePot(Guid id, [FromBody] UpdateSpendingPotRequest request, CancellationToken ct)
    {
        var pot = await _pots.UpdatePotAsync(GetUserId(), id, request, ct);
        return pot is null ? NotFound() : Ok(pot);
    }

    /// <summary>Delete a spending pot.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePot(Guid id, CancellationToken ct)
    {
        var deleted = await _pots.DeletePotAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Manually assign a transaction's category to this pot.</summary>
    [HttpPost("{id:guid}/assign-transaction")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTransaction(Guid id, [FromQuery] Guid transactionId, CancellationToken ct)
    {
        var result = await _pots.AssignTransactionAsync(GetUserId(), id, transactionId, ct);
        return result ? Ok() : NotFound();
    }
}
```

- [ ] **Step 3: Register services in Program.cs**

Add after the existing `builder.Services.AddScoped<ICsvImportService, CsvImportService>();` line:

```csharp
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<ISpendingPotService, SpendingPotService>();
```

Add the missing usings at the top of `Program.cs`:

```csharp
using FinanceApi.Features.Budgets.Services;
```

- [ ] **Step 4: Build to confirm no errors**

```powershell
cd "c:\Projects\Finance Manager"
dotnet build apps\finance-api\FinanceApi.csproj
```

Expected: `Build succeeded.`

- [ ] **Step 5: Commit**

```bash
git add apps/finance-api/Features/Budgets/Controllers/ apps/finance-api/Program.cs
git commit -m "feat: BudgetsController and PotsController (T1186)"
```

---

## Task 6: Integration tests for budget and pot endpoints (T1188)

**Files:**
- Create: `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/BudgetsControllerTests.cs`
- Create: `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/PotsControllerTests.cs`

- [ ] **Step 1: Create BudgetsControllerTests.cs**

```csharp
// apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/BudgetsControllerTests.cs
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Budgets;

[Collection("Finance Integration")]
public class BudgetsControllerTests
{
    private readonly HttpClient _client;
    private readonly Guid _userId = Guid.NewGuid();

    // A seeded system category ID (from FinanceDbContext.SeedCategories)
    private static readonly Guid GroceriesCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000101");

    public BudgetsControllerTests(FinanceWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetCurrentBudgets_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/budgets/current");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var budgets = await response.Content.ReadFromJsonAsync<List<BudgetWithProgress>>();
        budgets.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateBudget_WhenValidRequest_Returns201WithBudget()
    {
        var request = new CreateBudgetRequest(GroceriesCategoryId, DateTime.UtcNow.Month, DateTime.UtcNow.Year, 200m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/budgets", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var budget = await response.Content.ReadFromJsonAsync<BudgetWithProgress>();
        budget.Should().NotBeNull();
        budget!.Amount.Should().Be(200m);
        budget.CategoryId.Should().Be(GroceriesCategoryId);
    }

    [Fact]
    public async Task CreateBudget_WhenAmountIsZero_Returns400()
    {
        var request = new CreateBudgetRequest(GroceriesCategoryId, 1, 2025, 0m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/budgets", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateBudget_WhenValidRequest_ReturnsUpdatedAmount()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/budgets",
            new CreateBudgetRequest(GroceriesCategoryId, 3, 2025, 100m));
        var created = await createResp.Content.ReadFromJsonAsync<BudgetWithProgress>();

        var updateResp = await _client.PutAsJsonAsync(
            $"/api/v1/finance/budgets/{created!.Id}", new UpdateBudgetRequest(300m));

        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResp.Content.ReadFromJsonAsync<BudgetWithProgress>();
        updated!.Amount.Should().Be(300m);
    }

    [Fact]
    public async Task UpdateBudget_WhenNotFound_Returns404()
    {
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/finance/budgets/{Guid.NewGuid()}", new UpdateBudgetRequest(100m));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteBudget_WhenExists_Returns204()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/budgets",
            new CreateBudgetRequest(GroceriesCategoryId, 4, 2025, 150m));
        var created = await createResp.Content.ReadFromJsonAsync<BudgetWithProgress>();

        var deleteResp = await _client.DeleteAsync($"/api/v1/finance/budgets/{created!.Id}");

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetTrends_Returns200()
    {
        var response = await _client.GetAsync("/api/v1/finance/budgets/trends?months=3");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetBudgets_WhenUnauthenticated_Returns401()
    {
        var unauthClient = new FinanceWebApplicationFactory().CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/budgets/current");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

- [ ] **Step 2: Create PotsControllerTests.cs**

```csharp
// apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/PotsControllerTests.cs
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Budgets;

[Collection("Finance Integration")]
public class PotsControllerTests
{
    private readonly HttpClient _client;
    private readonly Guid _userId = Guid.NewGuid();
    private static readonly Guid GroceriesCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000101");

    public PotsControllerTests(FinanceWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetPots_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/pots");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var pots = await response.Content.ReadFromJsonAsync<List<SpendingPotWithProgress>>();
        pots.Should().NotBeNull();
    }

    [Fact]
    public async Task CreatePot_WhenValidRequest_Returns201WithPot()
    {
        var request = new CreateSpendingPotRequest(
            "Groceries", PotType.Groceries, 250m, false,
            "shopping-cart", "#22C55E", new[] { GroceriesCategoryId });

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var pot = await response.Content.ReadFromJsonAsync<SpendingPotWithProgress>();
        pot.Should().NotBeNull();
        pot!.Name.Should().Be("Groceries");
        pot.BudgetAmount.Should().Be(250m);
    }

    [Fact]
    public async Task CreatePot_WhenNameIsEmpty_Returns400()
    {
        var request = new CreateSpendingPotRequest(
            "", PotType.Custom, 100m, false, null, null, Array.Empty<Guid>());

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeletePot_WhenExists_Returns204()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("Fuel", PotType.Fuel, 80m, false, null, null, Array.Empty<Guid>()));
        var created = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var deleteResp = await _client.DeleteAsync($"/api/v1/finance/pots/{created!.Id}");

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
```

- [ ] **Step 3: Run integration tests**

```powershell
cd "c:\Projects\Finance Manager"
dotnet test apps\finance-api-tests\FinanceApi.IntegrationTests\FinanceApi.IntegrationTests.csproj
```

Expected: All tests pass (previous 17 + new 11 = 28 passing).

- [ ] **Step 4: Commit**

```bash
git add apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Budgets/
git commit -m "test: integration tests for BudgetsController and PotsController (T1188)"
```

---

## Task 7: Frontend types + service methods (T1189, T1190)

**Files:**
- Modify: `apps/web/src/types/finance.ts`
- Create: `apps/web/src/services/budget-service.ts`
- Create: `apps/web/src/services/pot-service.ts`

- [ ] **Step 1: Add budget and pot types to finance.ts**

Append the following to the end of `apps/web/src/types/finance.ts`:

```typescript
// ── Budget types ──────────────────────────────────────────────────────────────

export type PotType =
  | 'Groceries' | 'Fuel' | 'EatingOut' | 'Kids' | 'Clothing'
  | 'Entertainment' | 'Bills' | 'Subscriptions' | 'Savings'
  | 'EmergencyFund' | 'Holiday' | 'Custom';

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string | null;
  categoryColour: string | null;
  categoryIcon: string | null;
  month: number;
  year: number;
  amount: number;
  spent: number;
  rolloverFromPrevious: number;
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface CreateBudgetRequest {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
}

export interface UpdateBudgetRequest {
  amount?: number;
}

export interface CategoryBudgetSpend {
  categoryName: string;
  categoryColour: string | null;
  budgeted: number;
  spent: number;
}

export interface BudgetTrendPoint {
  month: number;
  year: number;
  monthLabel: string;
  categories: CategoryBudgetSpend[];
}

// ── Spending pot types ────────────────────────────────────────────────────────

export interface SpendingPotWithProgress {
  id: string;
  name: string;
  type: PotType;
  budgetAmount: number;
  spent: number;
  remaining: number;
  rolloverEnabled: boolean;
  icon: string | null;
  colour: string | null;
  categoryIds: string[];
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface CreateSpendingPotRequest {
  name: string;
  type: PotType;
  budgetAmount: number;
  rolloverEnabled: boolean;
  icon?: string;
  colour?: string;
  categoryIds: string[];
}

export interface UpdateSpendingPotRequest {
  name?: string;
  budgetAmount?: number;
  rolloverEnabled?: boolean;
  icon?: string;
  colour?: string;
  categoryIds?: string[];
}
```

- [ ] **Step 2: Create budget-service.ts**

```typescript
// apps/web/src/services/budget-service.ts
import financeApiClient from './finance-api-client';
import type {
  Budget,
  BudgetTrendPoint,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../types/finance';

export const budgetService = {
  getCurrentBudgets(): Promise<Budget[]> {
    return financeApiClient.get<Budget[]>('/api/v1/finance/budgets/current').then(r => r.data);
  },

  getBudgets(month: number, year: number): Promise<Budget[]> {
    return financeApiClient
      .get<Budget[]>('/api/v1/finance/budgets', { params: { month, year } })
      .then(r => r.data);
  },

  getTrends(months = 6): Promise<BudgetTrendPoint[]> {
    return financeApiClient
      .get<BudgetTrendPoint[]>('/api/v1/finance/budgets/trends', { params: { months } })
      .then(r => r.data);
  },

  createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return financeApiClient.post<Budget>('/api/v1/finance/budgets', data).then(r => r.data);
  },

  updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
    return financeApiClient.put<Budget>(`/api/v1/finance/budgets/${id}`, data).then(r => r.data);
  },

  deleteBudget(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/budgets/${id}`).then(() => undefined);
  },

  copyFromPrevious(month: number, year: number): Promise<Budget[]> {
    return financeApiClient
      .post<Budget[]>('/api/v1/finance/budgets/copy-from-previous', null, { params: { month, year } })
      .then(r => r.data);
  },
};
```

- [ ] **Step 3: Create pot-service.ts**

```typescript
// apps/web/src/services/pot-service.ts
import financeApiClient from './finance-api-client';
import type {
  SpendingPotWithProgress,
  CreateSpendingPotRequest,
  UpdateSpendingPotRequest,
} from '../types/finance';

export const potService = {
  getPots(month: number, year: number): Promise<SpendingPotWithProgress[]> {
    return financeApiClient
      .get<SpendingPotWithProgress[]>('/api/v1/finance/pots', { params: { month, year } })
      .then(r => r.data);
  },

  createPot(data: CreateSpendingPotRequest): Promise<SpendingPotWithProgress> {
    return financeApiClient.post<SpendingPotWithProgress>('/api/v1/finance/pots', data).then(r => r.data);
  },

  updatePot(id: string, data: UpdateSpendingPotRequest): Promise<SpendingPotWithProgress> {
    return financeApiClient
      .put<SpendingPotWithProgress>(`/api/v1/finance/pots/${id}`, data)
      .then(r => r.data);
  },

  deletePot(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/pots/${id}`).then(() => undefined);
  },
};
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
cd apps\web
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/finance.ts apps/web/src/services/budget-service.ts apps/web/src/services/pot-service.ts
git commit -m "feat: Budget and SpendingPot frontend types and service methods (T1189, T1190)"
```

---

## Task 8: BudgetDashboard component + tests (T1191, T1195)

**Files:**
- Create: `apps/web/tests/components/BudgetDashboard.test.tsx`
- Create: `apps/web/src/components/finance/BudgetDashboard.tsx`

- [ ] **Step 1: Write BudgetDashboard.test.tsx (RED)**

```tsx
// apps/web/tests/components/BudgetDashboard.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetDashboard } from '../../src/components/finance/BudgetDashboard';
import type { Budget } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: {
    getCurrentBudgets: jest.fn(),
  },
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'b1',
  categoryId: 'c1',
  categoryName: 'Groceries',
  categoryColour: '#22C55E',
  categoryIcon: 'shopping-cart',
  month: 6,
  year: 2025,
  amount: 200,
  spent: 0,
  rolloverFromPrevious: 0,
  percentageUsed: 0,
  isWarning: false,
  isExceeded: false,
  ...overrides,
});

describe('BudgetDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    budgetService.getCurrentBudgets.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<BudgetDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders budget name and amounts after loading', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget({ spent: 75, percentageUsed: 37.5 })]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(screen.getByText(/£75/)).toBeInTheDocument();
    expect(screen.getByText(/£200/)).toBeInTheDocument();
  });

  it('shows empty state when no budgets exist', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/no budgets/i)).toBeInTheDocument());
  });

  it('renders amber progress bar when budget is at warning threshold', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ spent: 80, percentageUsed: 80, isWarning: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('renders red progress bar when budget is exceeded', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ spent: 250, percentageUsed: 125, isExceeded: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('shows overspend amount when budget is exceeded', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ amount: 200, spent: 250, percentageUsed: 125, isExceeded: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/over by/i)).toBeInTheDocument());
  });

  it('shows error message when fetch fails', async () => {
    budgetService.getCurrentBudgets.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to confirm RED**

```powershell
cd apps\web
pnpm test -- --testPathPattern="BudgetDashboard" --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create BudgetDashboard.tsx**

```tsx
// apps/web/src/components/finance/BudgetDashboard.tsx
import { useEffect, useState } from 'react';
import { budgetService } from '../../services/budget-service';
import type { Budget } from '../../types/finance';
import { cn } from '../../lib/utils';

interface BudgetDashboardProps {
  onAddBudget?: () => void;
}

export function BudgetDashboard({ onAddBudget }: BudgetDashboardProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    budgetService.getCurrentBudgets()
      .then(setBudgets)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load budgets'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load budgets: {error}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No budgets set for this month.</p>
        {onAddBudget && (
          <button
            onClick={onAddBudget}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add your first budget
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map(budget => (
        <BudgetProgressRow key={budget.id} budget={budget} />
      ))}
    </div>
  );
}

function BudgetProgressRow({ budget }: { budget: Budget }) {
  const barColour = budget.isExceeded
    ? 'bg-red-500'
    : budget.isWarning
      ? 'bg-amber-500'
      : 'bg-green-500';

  const widthPct = Math.min(budget.percentageUsed, 100);
  const overspend = budget.spent - budget.amount;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {budget.categoryName ?? 'Uncategorised'}
        </span>
        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
          £{budget.spent.toFixed(2)} / £{budget.amount.toFixed(2)}
        </span>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-2 rounded-full transition-all', barColour)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      {budget.isExceeded && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Over by £{overspend.toFixed(2)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests and confirm GREEN**

```powershell
cd apps\web
pnpm test -- --testPathPattern="BudgetDashboard" --no-coverage
```

Expected: `Tests: 7 passed`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/finance/BudgetDashboard.tsx apps/web/tests/components/BudgetDashboard.test.tsx
git commit -m "feat: BudgetDashboard component with progress bars and threshold colours (T1191, T1195)"
```

---

## Task 9: SpendingPots component + tests (T1192, T1195)

**Files:**
- Create: `apps/web/tests/components/SpendingPots.test.tsx`
- Create: `apps/web/src/components/finance/SpendingPots.tsx`

- [ ] **Step 1: Write SpendingPots.test.tsx (RED)**

```tsx
// apps/web/tests/components/SpendingPots.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { SpendingPots } from '../../src/components/finance/SpendingPots';
import type { SpendingPotWithProgress } from '../../src/types/finance';

jest.mock('../../src/services/pot-service', () => ({
  potService: { getPots: jest.fn() },
}));

const { potService } = jest.requireMock('../../src/services/pot-service');

const makePot = (overrides: Partial<SpendingPotWithProgress> = {}): SpendingPotWithProgress => ({
  id: 'p1',
  name: 'Groceries',
  type: 'Groceries',
  budgetAmount: 300,
  spent: 0,
  remaining: 300,
  rolloverEnabled: false,
  icon: 'shopping-cart',
  colour: '#22C55E',
  categoryIds: [],
  percentageUsed: 0,
  isWarning: false,
  isExceeded: false,
  ...overrides,
});

describe('SpendingPots', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    potService.getPots.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<SpendingPots />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders pot name, budget, and remaining after loading', async () => {
    potService.getPots.mockResolvedValue([makePot({ spent: 120, remaining: 180 })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(screen.getByText(/£300/)).toBeInTheDocument();
    expect(screen.getByText(/£180 left/i)).toBeInTheDocument();
  });

  it('shows empty state when no pots exist', async () => {
    potService.getPots.mockResolvedValue([]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/no spending pots/i)).toBeInTheDocument());
  });

  it('shows warning colour when pot is at 80% threshold', async () => {
    potService.getPots.mockResolvedValue([makePot({ percentageUsed: 80, isWarning: true })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('shows rollover badge when rolloverEnabled is true', async () => {
    potService.getPots.mockResolvedValue([makePot({ rolloverEnabled: true })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/rollover/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to confirm RED**

```powershell
cd apps\web
pnpm test -- --testPathPattern="SpendingPots" --no-coverage
```

- [ ] **Step 3: Create SpendingPots.tsx**

```tsx
// apps/web/src/components/finance/SpendingPots.tsx
import { useEffect, useState } from 'react';
import { potService } from '../../services/pot-service';
import type { SpendingPotWithProgress } from '../../types/finance';
import { cn } from '../../lib/utils';

interface SpendingPotsProps {
  onAddPot?: () => void;
}

export function SpendingPots({ onAddPot }: SpendingPotsProps) {
  const now = new Date();
  const [pots, setPots] = useState<SpendingPotWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    potService.getPots(now.getMonth() + 1, now.getFullYear())
      .then(setPots)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load pots'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (pots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No spending pots set up.</p>
        {onAddPot && (
          <button
            onClick={onAddPot}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create a pot
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {pots.map(pot => (
        <PotCard key={pot.id} pot={pot} />
      ))}
    </div>
  );
}

function PotCard({ pot }: { pot: SpendingPotWithProgress }) {
  const barColour = pot.isExceeded
    ? 'bg-red-500'
    : pot.isWarning
      ? 'bg-amber-500'
      : 'bg-green-500';

  const widthPct = Math.min(pot.percentageUsed, 100);

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
      style={{ borderLeftColor: pot.colour ?? undefined, borderLeftWidth: pot.colour ? 4 : undefined }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {pot.name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {pot.rolloverEnabled && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Rollover
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Budget: £{pot.budgetAmount.toFixed(2)}
      </p>

      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColour)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          £{pot.spent.toFixed(2)} spent
        </span>
        <span className={cn(
          'font-medium',
          pot.remaining < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        )}>
          £{Math.abs(pot.remaining).toFixed(2)} {pot.remaining < 0 ? 'over' : 'left'}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests GREEN**

```powershell
cd apps\web
pnpm test -- --testPathPattern="SpendingPots" --no-coverage
```

Expected: `Tests: 5 passed`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/finance/SpendingPots.tsx apps/web/tests/components/SpendingPots.test.tsx
git commit -m "feat: SpendingPots component with envelope-style pot cards (T1192, T1195)"
```

---

## Task 10: BudgetForm component + tests (T1193, T1195)

**Files:**
- Create: `apps/web/tests/components/BudgetForm.test.tsx`
- Create: `apps/web/src/components/finance/BudgetForm.tsx`

- [ ] **Step 1: Write BudgetForm.test.tsx (RED)**

```tsx
// apps/web/tests/components/BudgetForm.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetForm } from '../../src/components/finance/BudgetForm';
import type { Category } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: { createBudget: jest.fn() },
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const mockCategories: Category[] = [
  { id: 'c1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
  { id: 'c2', name: 'Fuel', colour: '#3B82F6', icon: 'fuel', isSystem: true, parentId: null, children: null },
];

describe('BudgetForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders category selector and amount input', () => {
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/amount/i)).toBeInTheDocument();
  });

  it('shows validation error when amount is empty and form is submitted', async () => {
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/required/i)).toBeInTheDocument());
  });

  it('calls createBudget with correct values on valid submit', async () => {
    budgetService.createBudget.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '200');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(budgetService.createBudget).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1', amount: 200 })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error message when createBudget fails', async () => {
    budgetService.createBudget.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '100');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to confirm RED**

```powershell
cd apps\web
pnpm test -- --testPathPattern="BudgetForm" --no-coverage
```

- [ ] **Step 3: Install @testing-library/user-event if not present**

```powershell
cd apps\web
pnpm list @testing-library/user-event
```

If not listed, install it: `pnpm add -D @testing-library/user-event`

- [ ] **Step 4: Create BudgetForm.tsx**

```tsx
// apps/web/src/components/finance/BudgetForm.tsx
import { useState } from 'react';
import { budgetService } from '../../services/budget-service';
import type { Category } from '../../types/finance';
import { cn } from '../../lib/utils';

interface BudgetFormProps {
  categories: Category[];
  onSuccess: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  amount?: string;
}

export function BudgetForm({ categories, onSuccess, onCancel }: BudgetFormProps) {
  const now = new Date();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) next.amount = 'Amount is required and must be greater than zero';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await budgetService.createBudget({
        categoryId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        amount: parseFloat(amount),
      });
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Monthly budget (£)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.amount
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed: {submitError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save budget'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Run tests GREEN**

```powershell
cd apps\web
pnpm test -- --testPathPattern="BudgetForm" --no-coverage
```

Expected: `Tests: 4 passed`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/finance/BudgetForm.tsx apps/web/tests/components/BudgetForm.test.tsx
git commit -m "feat: BudgetForm with category selector, validation, and error handling (T1193, T1195)"
```

---

## Task 11: BudgetTrends component (T1194, T1195)

**Files:**
- Create: `apps/web/src/components/finance/BudgetTrends.tsx`

- [ ] **Step 1: Create BudgetTrends.tsx using existing BarChartWrapper**

```tsx
// apps/web/src/components/finance/BudgetTrends.tsx
import { useEffect, useState } from 'react';
import { budgetService } from '../../services/budget-service';
import { BarChartWrapper } from '../charts/BarChartWrapper';
import type { BudgetTrendPoint } from '../../types/finance';

interface BudgetTrendsProps {
  months?: number;
}

export function BudgetTrends({ months = 6 }: BudgetTrendsProps) {
  const [trends, setTrends] = useState<BudgetTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    budgetService.getTrends(months)
      .then(setTrends)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load trends'))
      .finally(() => setIsLoading(false));
  }, [months]);

  if (isLoading) {
    return <div className="h-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500 dark:text-gray-400">
        No budget data for the last {months} months.
      </div>
    );
  }

  // Build BarChartWrapper data: one row per month, columns per category
  const allCategories = Array.from(
    new Set(trends.flatMap(t => t.categories.map(c => c.categoryName)))
  );

  const chartData = trends.map(point => {
    const row: Record<string, string | number> = { name: point.monthLabel };
    point.categories.forEach(cat => {
      row[`${cat.categoryName} (budget)`] = cat.budgeted;
      row[`${cat.categoryName} (spent)`] = cat.spent;
    });
    return row;
  });

  // Alternate blue/green for budgeted/spent per category
  const palette = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const dataKeys = allCategories.flatMap((name, i) => [
    { key: `${name} (budget)`, name: `${name} budget`, color: palette[i % palette.length] },
    { key: `${name} (spent)`, name: `${name} spent`, color: palette[i % palette.length] + '99' },
  ]);

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Budgeted vs actual — last {months} months
      </p>
      <BarChartWrapper
        data={chartData}
        dataKeys={dataKeys}
        height={280}
        title="Budget trends"
        description={`Monthly budget vs spending for the last ${months} months`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd apps\web
pnpm tsc --noEmit
```

- [ ] **Step 3: Run the full frontend test suite to confirm no regressions**

```powershell
cd apps\web
pnpm test --no-coverage
```

Expected: All 356+ tests passing (including the new ones).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/finance/BudgetTrends.tsx
git commit -m "feat: BudgetTrends bar chart showing budgeted vs actual per month (T1194)"
```

---

## Final verification

- [ ] **Step 1: Run full backend test suite**

```powershell
cd "c:\Projects\Finance Manager"
dotnet test apps\finance-api-tests\FinanceApi.UnitTests\FinanceApi.UnitTests.csproj
dotnet test apps\finance-api-tests\FinanceApi.IntegrationTests\FinanceApi.IntegrationTests.csproj
```

Expected: All 58+ unit tests passing; all 28+ integration tests passing.

- [ ] **Step 2: Run full frontend test suite**

```powershell
cd apps\web
pnpm test --no-coverage
```

Expected: All 356+ tests passing.

- [ ] **Step 3: Mark tasks complete in tasks.md**

Open `specs/applications/finance/tasks.md` and mark T1182–T1196 as `[x]`.

---

## Self-Review Checklist

**Spec coverage:**
- T1182 Budget + SpendingPot entities → Task 1 ✓
- T1183 EF migration → Task 2 ✓
- T1184 BudgetService (CRUD, progress, 80%/100% threshold, copy-from-previous) → Task 3 ✓
- T1185 SpendingPotService (CRUD, category mapping, pot balance) → Task 4 ✓
- T1186 BudgetsController + PotsController → Task 5 ✓
- T1187 Unit tests (14+ for both services) → Tasks 3 + 4 ✓ (13 budget + 10 pot = 23)
- T1188 Integration tests (8+) → Task 6 ✓ (8 budget + 4 pot = 12)
- T1189 Budget + SpendingPot TS interfaces → Task 7 ✓
- T1190 budgetService + potService API methods → Task 7 ✓
- T1191 BudgetDashboard component → Task 8 ✓
- T1192 SpendingPots component → Task 9 ✓
- T1193 BudgetForm component → Task 10 ✓
- T1194 BudgetTrends component → Task 11 ✓
- T1195 Jest tests for components (10+) → Tasks 8–10 ✓ (7 + 5 + 4 = 16)
- T1196 E2E test → deferred (requires Playwright setup in finance domain)
