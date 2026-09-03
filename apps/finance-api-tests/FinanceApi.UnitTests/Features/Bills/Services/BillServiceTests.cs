using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Categories.Models;

namespace FinanceApi.UnitTests.Features.Bills.Services;

public class BillServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly BillService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public BillServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new BillService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetBillsAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBillsAsync_WhenNoBillsExist_ReturnsEmpty()
    {
        var result = await _sut.GetBillsAsync(_userId);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetBillsAsync_ReturnsOnlyBillsForRequestingUser()
    {
        _db.Bills.Add(MakeBill(_userId, "Netflix"));
        _db.Bills.Add(MakeBill(Guid.NewGuid(), "Other"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Netflix");
    }

    [Fact]
    public async Task GetBillsAsync_ExcludesInactiveBills()
    {
        _db.Bills.Add(MakeBill(_userId, "Active", isActive: true));
        _db.Bills.Add(MakeBill(_userId, "Inactive", isActive: false));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Active");
    }

    [Fact]
    public async Task GetBillsAsync_WhenLinkedToAccount_IncludesAccountName()
    {
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        var bill = MakeBill(_userId, "Electricity", accountId: account.Id);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().AccountName.Should().Be("Barclays Current");
        result.First().AccountId.Should().Be(account.Id);
    }

    [Fact]
    public async Task GetBillsAsync_WhenNotLinkedToAccount_AccountNameIsNull()
    {
        _db.Bills.Add(MakeBill(_userId, "Netflix"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().AccountName.Should().BeNull();
        result.First().AccountId.Should().BeNull();
    }

    [Fact]
    public async Task GetBillsAsync_LinkedAccountCurrentPaymentMatchesBillAmount_NoMismatch()
    {
        var account = MakeAccount("Barclaycard", currentMonthlyPayment: 100m);
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Barclaycard DD", amount: 100m, accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().LinkedAccountPayment.Should().Be(100m);
        result.First().HasPaymentMismatch.Should().BeFalse();
    }

    [Fact]
    public async Task GetBillsAsync_LinkedAccountCurrentPaymentDiffersFromBillAmount_FlagsMismatch()
    {
        // Both the Bill and the Account are supposed to represent the same real-world
        // payment — if they've drifted apart, the user needs a nudge to reconcile them.
        var account = MakeAccount("Barclaycard", currentMonthlyPayment: 120m);
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Barclaycard DD", amount: 100m, accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().LinkedAccountPayment.Should().Be(120m);
        result.First().HasPaymentMismatch.Should().BeTrue();
    }

    [Fact]
    public async Task GetBillsAsync_LinkedAccountHasNoCurrentPaymentSet_NoMismatch()
    {
        // Nothing to compare against — the bill itself is the only source of truth here.
        var account = MakeAccount("Tandem Loan");
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Tandem DD", amount: 572.66m, accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().LinkedAccountPayment.Should().BeNull();
        result.First().HasPaymentMismatch.Should().BeFalse();
    }

    [Fact]
    public async Task GetBillsAsync_NotLinkedToAccount_NoMismatchFieldsSet()
    {
        _db.Bills.Add(MakeBill(_userId, "Netflix"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().LinkedAccountPayment.Should().BeNull();
        result.First().HasPaymentMismatch.Should().BeFalse();
    }

    [Fact]
    public async Task GetBillsAsync_MinimumMonthlyPaymentDiffersFromBill_DoesNotFlagMismatch()
    {
        // A lender minimum legitimately differing from what's actually paid is normal
        // (e.g. paying more than the minimum) — only CurrentMonthlyPayment counts.
        var account = MakeAccount("Barclaycard");
        account.MinimumMonthlyPayment = 30m;
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Barclaycard DD", amount: 100m, accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().HasPaymentMismatch.Should().BeFalse();
    }

    [Fact]
    public async Task GetBillsAsync_WeeklyBillMonthlyEquivalentMatchesAccountPayment_NoMismatch()
    {
        // £23.08/week ≈ £100.01/mo (52/12) — must compare against the monthly
        // equivalent, not the raw weekly amount, and tolerate sub-penny rounding.
        var account = MakeAccount("Barclaycard", currentMonthlyPayment: 100.01m);
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Barclaycard DD", amount: 23.08m, frequency: BillFrequency.Weekly, accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().HasPaymentMismatch.Should().BeFalse();
    }

    [Fact]
    public async Task GetBillsAsync_WhenLinkedToCategory_IncludesCategoryName()
    {
        var category = MakeCategory("Streaming & Media");
        _db.Categories.Add(category);
        var bill = MakeBill(_userId, "Netflix", categoryId: category.Id);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().CategoryName.Should().Be("Streaming & Media");
        result.First().CategoryId.Should().Be(category.Id);
    }

    [Fact]
    public async Task GetBillsAsync_WhenNotLinkedToCategory_CategoryNameIsNull()
    {
        _db.Bills.Add(MakeBill(_userId, "Netflix"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.First().CategoryName.Should().BeNull();
        result.First().CategoryId.Should().BeNull();
    }

    // ── GetByAccountIdAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetByAccountIdAsync_ReturnsOnlyBillsLinkedToSpecifiedAccount()
    {
        var account1 = MakeAccount("Account 1");
        var account2 = MakeAccount("Account 2");
        _db.Accounts.AddRange(account1, account2);
        _db.Bills.Add(MakeBill(_userId, "Netflix", accountId: account1.Id));
        _db.Bills.Add(MakeBill(_userId, "Spotify", accountId: account2.Id));
        _db.Bills.Add(MakeBill(_userId, "Unlinked"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetByAccountIdAsync(_userId, account1.Id);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Netflix");
    }

    [Fact]
    public async Task GetByAccountIdAsync_WhenNoBillsLinked_ReturnsEmpty()
    {
        var account = MakeAccount("Empty Account");
        _db.Accounts.Add(account);
        _db.Bills.Add(MakeBill(_userId, "Unlinked"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetByAccountIdAsync(_userId, account.Id);

        result.Should().BeEmpty();
    }

    // ── GetUpcomingBillsAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenMonthlyBillDueLaterThisMonth_IncludesInResults()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Broadband", dueDay: 28, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.Should().HaveCount(1);
        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 28));
        result.First().DaysUntilDue.Should().Be(21);
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenMonthlyBillAlreadyPassedThisMonth_ShowsNextMonth()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Electricity", dueDay: 5, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today, daysAhead: 30);

        result.Should().HaveCount(1);
        result.First().NextDueDate.Should().Be(new DateTime(2026, 7, 5));
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenBillDueBeyondWindow_ExcludesFromResults()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Insurance", dueDay: 5, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today, daysAhead: 20);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenWithinReminderWindow_SetsIsReminderDueTrue()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Gas", dueDay: 10, frequency: BillFrequency.Monthly, reminderDaysBefore: 5));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().IsReminderDue.Should().BeTrue();
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WeeklyBill_DueLaterThisWeek_ReturnsThatWeekday()
    {
        // 2026-06-10 is a Wednesday; DueDay 5 = Friday (ISO weekday)
        var today = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Cleaner", dueDay: 5, frequency: BillFrequency.Weekly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 12));
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WeeklyBill_DueDayAlreadyPassedThisWeek_ReturnsNextWeek()
    {
        // 2026-06-10 is a Wednesday; DueDay 1 = Monday (already passed this week)
        var today = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Newspaper", dueDay: 1, frequency: BillFrequency.Weekly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 15));
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WeeklyBill_DueToday_ReturnsToday()
    {
        // 2026-06-10 is a Wednesday; DueDay 3 = Wednesday
        var today = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Standing order", dueDay: 3, frequency: BillFrequency.Weekly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 10));
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WeeklyBill_WhenAlreadyPaidForThisOccurrence_ShowsNextWeek()
    {
        // 2026-06-10 is a Wednesday; DueDay 3 = Wednesday, already paid today
        var today = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);
        var bill = MakeBill(_userId, "Standing order", dueDay: 3, frequency: BillFrequency.Weekly);
        bill.LastPaidDate = today;
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 17));
    }

    // ── CreateBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBillAsync_WithValidRequest_CreatesBillAndReturnsIt()
    {
        var request = new CreateBillRequest("Spotify", 9.99m, BillFrequency.Monthly, 1, 3, null);

        var result = await _sut.CreateBillAsync(_userId, request);

        result.Name.Should().Be("Spotify");
        result.Amount.Should().Be(9.99m);
        result.IsActive.Should().BeTrue();
        _db.Bills.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateBillAsync_WithAccountId_LinksToAccount()
    {
        var account = MakeAccount("Monzo");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var request = new CreateBillRequest("Gym", 40m, BillFrequency.Monthly, 1, 3, null, AccountId: account.Id);
        var result = await _sut.CreateBillAsync(_userId, request);

        result.AccountId.Should().Be(account.Id);
        result.AccountName.Should().Be("Monzo");
    }

    [Fact]
    public async Task CreateBillAsync_WithCategoryId_IncludesCategoryName()
    {
        var category = MakeCategory("Credit Card Payment");
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        var request = new CreateBillRequest("Barclaycard", 100m, BillFrequency.Monthly, 1, 3, category.Id);
        var result = await _sut.CreateBillAsync(_userId, request);

        result.CategoryId.Should().Be(category.Id);
        result.CategoryName.Should().Be("Credit Card Payment");
    }

    // ── UpdateBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBillAsync_WhenBillExists_UpdatesAmount()
    {
        var bill = MakeBill(_userId, "Water", amount: 30m);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(Amount: 35m));

        result.Should().NotBeNull();
        result!.Amount.Should().Be(35m);
    }

    [Fact]
    public async Task UpdateBillAsync_CanLinkBillToAccount()
    {
        var account = MakeAccount("Starling");
        _db.Accounts.Add(account);
        var bill = MakeBill(_userId, "Broadband");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(AccountId: account.Id));

        result!.AccountId.Should().Be(account.Id);
        result.AccountName.Should().Be("Starling");
    }

    [Fact]
    public async Task UpdateBillAsync_CanUnlinkBillFromAccount()
    {
        var account = MakeAccount("HSBC");
        _db.Accounts.Add(account);
        var bill = MakeBill(_userId, "Netflix", accountId: account.Id);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(AccountId: null));

        result!.AccountId.Should().BeNull();
        result.AccountName.Should().BeNull();
    }

    [Fact]
    public async Task UpdateBillAsync_CanChangeCategory()
    {
        var oldCategory = MakeCategory("Subscriptions");
        var newCategory = MakeCategory("Streaming & Media");
        _db.Categories.AddRange(oldCategory, newCategory);
        var bill = MakeBill(_userId, "Disney+", categoryId: oldCategory.Id);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(CategoryId: newCategory.Id));

        result!.CategoryId.Should().Be(newCategory.Id);
        result.CategoryName.Should().Be("Streaming & Media");
    }

    [Fact]
    public async Task UpdateBillAsync_CanUnlinkCategory()
    {
        var category = MakeCategory("Insurance");
        _db.Categories.Add(category);
        var bill = MakeBill(_userId, "Home Insurance", categoryId: category.Id);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(CategoryId: null));

        result!.CategoryId.Should().BeNull();
        result.CategoryName.Should().BeNull();
    }

    [Fact]
    public async Task UpdateBillAsync_WhenBillBelongsToOtherUser_ReturnsNull()
    {
        var bill = MakeBill(Guid.NewGuid(), "Other");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(Amount: 50m));

        result.Should().BeNull();
    }

    // ── MarkAsPaidAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task MarkAsPaidAsync_WhenBillExists_UpdatesIsPaidAndRecordsDate()
    {
        var bill = MakeBill(_userId, "Council Tax");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.MarkAsPaidAsync(_userId, bill.Id);

        success.Should().BeTrue();
        var updated = await _db.Bills.FindAsync(bill.Id);
        updated!.IsPaid.Should().BeTrue();
        updated.LastPaidDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task MarkAsPaidAsync_WhenBillBelongsToOtherUser_ReturnsFalse()
    {
        var bill = MakeBill(Guid.NewGuid(), "Someone Else's Bill");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.MarkAsPaidAsync(_userId, bill.Id);

        success.Should().BeFalse();
    }

    // ── DeleteBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBillAsync_WhenBillExists_RemovesItFromDatabase()
    {
        var bill = MakeBill(_userId, "Mortgage");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteBillAsync(_userId, bill.Id);

        success.Should().BeTrue();
        var stored = await _db.Bills.FindAsync(bill.Id);
        stored.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBillAsync_WhenBillBelongsToOtherUser_ReturnsFalse()
    {
        var bill = MakeBill(Guid.NewGuid(), "Other");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteBillAsync(_userId, bill.Id);

        success.Should().BeFalse();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Bill MakeBill(
        Guid userId,
        string name,
        decimal amount = 20m,
        int dueDay = 1,
        BillFrequency frequency = BillFrequency.Monthly,
        int reminderDaysBefore = 3,
        bool isActive = true,
        Guid? accountId = null,
        Guid? categoryId = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Amount = amount,
        Frequency = frequency,
        DueDay = dueDay,
        ReminderDaysBefore = reminderDaysBefore,
        IsActive = isActive,
        AccountId = accountId,
        CategoryId = categoryId,
    };

    private Account MakeAccount(string name, decimal? currentMonthlyPayment = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = name,
        Type = AccountType.Checking,
        Currency = "GBP",
        Balance = 0m,
        CurrentMonthlyPayment = currentMonthlyPayment,
    };

    private static Category MakeCategory(string name) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        IsSystem = true,
    };
}
