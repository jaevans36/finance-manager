using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Transactions.Models;
using FinanceApi.Features.Transactions.Services;

namespace FinanceApi.UnitTests.Features.Transactions.Services;

public class CsvImportServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly CsvImportService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();

    public CsvImportServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new FinanceDbContext(options);

        _db.Accounts.Add(new Account
        {
            Id = _accountId,
            UserId = _userId,
            Name = "Test Account",
            Type = AccountType.Checking,
            Currency = "GBP",
            Balance = 500m
        });
        _db.SaveChanges();

        _sut = new CsvImportService(_db, new MerchantNormalisationService());
    }

    public void Dispose() => _db.Dispose();

    // ── GetSupportedFormats ───────────────────────────────────────────────────

    [Fact]
    public void GetSupportedFormats_ReturnsAllSupportedBankFormats()
    {
        var formats = _sut.GetSupportedFormats().ToList();

        formats.Should().HaveCountGreaterThanOrEqualTo(7);
        formats.Should().Contain(new[] { "barclays", "hsbc", "lloyds", "monzo", "starling", "natwest", "generic" });
    }

    // ── Barclays parser ───────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenBarclaysCsv_ImportsCorrectTransactions()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,TESCO,\"-25.50\"\n02/01/2025,SALARY,\"1500.00\"";
        var result = await ImportCsvAsync(csv, "barclays");

        result.Imported.Should().Be(2);
        result.Errors.Should().Be(0);
        var transactions = await _db.Transactions.Where(t => t.AccountId == _accountId).ToListAsync();
        transactions.Should().HaveCount(2);
    }

    [Fact]
    public async Task ImportAsync_WhenBarclaysCsvCreditRow_SetsTypeToCredit()
    {
        var csv = "Date,Memo,Amount\n02/01/2025,SALARY,\"1500.00\"";
        await ImportCsvAsync(csv, "barclays");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Type.Should().Be(TransactionType.Credit);
    }

    [Fact]
    public async Task ImportAsync_WhenBarclaysCsvDebitRow_SetsTypeToDebit()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,TESCO,\"-25.50\"";
        await ImportCsvAsync(csv, "barclays");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Type.Should().Be(TransactionType.Debit);
    }

    // ── Monzo parser ──────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenMonzoCsv_UsesNameColumnAsDescription()
    {
        var csv = "Transaction ID,Date,Time,Type,Name,Emoji,Category,Amount,Currency,Local amount,Local currency,Notes and #tags,Address,Description,Receipt,Money Out,Money In\n" +
                  "tx_001,01/01/2025,10:00,card,Costa Coffee,☕,eating_out,-3.50,GBP,-3.50,GBP,,,,,3.50,";
        await ImportCsvAsync(csv, "monzo");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Description.Should().Contain("Costa Coffee");
    }

    [Fact]
    public async Task ImportAsync_WhenMonzoCsvNegativeAmount_SetsTypeToDebit()
    {
        var csv = "Transaction ID,Date,Time,Type,Name,Emoji,Category,Amount,Currency,Local amount,Local currency,Notes and #tags,Address,Description,Receipt,Money Out,Money In\n" +
                  "tx_001,01/01/2025,10:00,card,TESCO,🛒,groceries,-32.10,GBP,-32.10,GBP,,,,,32.10,";
        await ImportCsvAsync(csv, "monzo");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Type.Should().Be(TransactionType.Debit);
    }

    // ── Starling parser ───────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenStarlingCsv_UsesCounterPartyAsDescription()
    {
        var csv = "Date,Counter Party,Reference,Type,Amount (GBP),Balance (GBP)\n" +
                  "01/01/2025,Amazon,ORD-123,FASTER_PAYMENT,-49.99,450.01";
        await ImportCsvAsync(csv, "starling");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Description.Should().Contain("Amazon");
    }

    [Fact]
    public async Task ImportAsync_WhenStarlingCsvPositiveAmount_SetsTypeToCredit()
    {
        var csv = "Date,Counter Party,Reference,Type,Amount (GBP),Balance (GBP)\n" +
                  "01/01/2025,Employer,Salary,FASTER_PAYMENT,2000.00,2500.00";
        await ImportCsvAsync(csv, "starling");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Type.Should().Be(TransactionType.Credit);
    }

    // ── Lloyds parser ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenLloydsCsv_ParsesSeparateDebitCreditColumns()
    {
        var csv = "Transaction Date,Transaction Type,Sort Code,Account Number,Transaction Description,Debit Amount,Credit Amount,Balance\n" +
                  "01/01/2025,DEB,12-34-56,12345678,ASDA,55.20,,444.80\n" +
                  "02/01/2025,CR,12-34-56,12345678,DIRECT CREDIT,,500.00,944.80";
        var result = await ImportCsvAsync(csv, "lloyds");

        result.Imported.Should().Be(2);
        var transactions = await _db.Transactions.Where(t => t.AccountId == _accountId).OrderBy(t => t.TransactionDate).ToListAsync();
        transactions[0].Type.Should().Be(TransactionType.Debit);
        transactions[1].Type.Should().Be(TransactionType.Credit);
    }

    // ── HSBC parser ───────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenHsbcCsvSpaceDateFormat_ParsesCorrectly()
    {
        var csv = "Date,Description,Debit,Credit,Balance\n" +
                  "01 01 2025,SAINSBURY'S,42.00,,458.00";
        var result = await ImportCsvAsync(csv, "hsbc");

        result.Imported.Should().Be(1);
        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.TransactionDate.Should().Be(new DateOnly(2025, 1, 1));
    }

    // ── NatWest parser ────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenNatwestCsv_ImportsCorrectTransactions()
    {
        var csv = "Date,Type,Description,Value,Balance,Account Name,Account Number\n" +
                  "01/01/2025,DEB,WAITROSE,-67.40,432.60,Current Account,12345678\n" +
                  "02/01/2025,CR,SALARY,2500.00,2932.60,Current Account,12345678";
        var result = await ImportCsvAsync(csv, "natwest");

        result.Imported.Should().Be(2);
    }

    // ── Generic parser ────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenGenericCsvDdMmYyyyDate_ImportsCorrectly()
    {
        var csv = "Date,Description,Amount\n01/01/2025,LIDL,-28.90";
        var result = await ImportCsvAsync(csv, "generic");

        result.Imported.Should().Be(1);
        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.TransactionDate.Should().Be(new DateOnly(2025, 1, 1));
    }

    [Fact]
    public async Task ImportAsync_WhenGenericCsvIsoDate_ParsesCorrectly()
    {
        var csv = "Date,Description,Amount\n2025-03-15,NETFLIX,-10.99";
        var result = await ImportCsvAsync(csv, "generic");

        result.Imported.Should().Be(1);
        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.TransactionDate.Should().Be(new DateOnly(2025, 3, 15));
    }

    // ── Duplicate detection ───────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenSameRowImportedTwice_MarksSecondAsDuplicate()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,TESCO,-25.50";

        await ImportCsvAsync(csv, "barclays");
        await ImportCsvAsync(csv, "barclays");

        var transactions = await _db.Transactions.Where(t => t.AccountId == _accountId).ToListAsync();
        transactions.Should().HaveCount(2);
        transactions.Count(t => t.IsDuplicate).Should().Be(1);
    }

    [Fact]
    public async Task ImportAsync_WhenFirstImport_DoesNotMarkTransactionAsDuplicate()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,ASDA,-18.00";
        await ImportCsvAsync(csv, "barclays");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.IsDuplicate.Should().BeFalse();
    }

    // ── Balance updates ───────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenDebitTransaction_DecreasesAccountBalance()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,TESCO,-100.00";
        await ImportCsvAsync(csv, "barclays");

        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance.Should().Be(400m); // 500 - 100
    }

    [Fact]
    public async Task ImportAsync_WhenCreditTransaction_IncreasesAccountBalance()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,SALARY,2000.00";
        await ImportCsvAsync(csv, "barclays");

        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance.Should().Be(2500m); // 500 + 2000
    }

    // ── Batch ID ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_AssignsSharedBatchIdToAllRowsFromSameImport()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,TESCO,-25.00\n02/01/2025,SAINSBURY,-30.00";
        var result = await ImportCsvAsync(csv, "barclays");

        var transactions = await _db.Transactions.Where(t => t.AccountId == _accountId).ToListAsync();
        transactions.Select(t => t.ImportBatchId).Distinct().Should().HaveCount(1);
        transactions[0].ImportBatchId.Should().Be(result.BatchId);
    }

    // ── Description normalisation ─────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenDescriptionHasBankPrefix_NormalisesDescription()
    {
        var csv = "Date,Memo,Amount\n01/01/2025,\"PURCHASE TESCO METRO\",-12.50";
        await ImportCsvAsync(csv, "barclays");

        var tx = await _db.Transactions.SingleAsync(t => t.AccountId == _accountId);
        tx.Description.Should().Be("TESCO METRO");
        tx.OriginalDescription.Should().Be("PURCHASE TESCO METRO");
    }

    // ── Empty / invalid input ─────────────────────────────────────────────────

    [Fact]
    public async Task ImportAsync_WhenCsvHasHeaderOnlyNoRows_ReturnsZeroImported()
    {
        var csv = "Date,Memo,Amount";
        var result = await ImportCsvAsync(csv, "barclays");

        result.Imported.Should().Be(0);
        result.Duplicates.Should().Be(0);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<CsvImportResult> ImportCsvAsync(string csvContent, string bankFormat)
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
        return await _sut.ImportAsync(_userId, _accountId, stream, bankFormat);
    }
}
