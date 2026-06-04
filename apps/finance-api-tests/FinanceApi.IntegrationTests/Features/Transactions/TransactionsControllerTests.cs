using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using FluentAssertions;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Transactions.Models;
using FinanceApi.Features.Transactions.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Transactions;

[Collection("Finance Integration")]
public class TransactionsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public TransactionsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    // ── GET /transactions ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetTransactions_WhenAccountIdMissing_Returns400()
    {
        var response = await _client.GetAsync("/api/v1/finance/transactions");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTransactions_WhenAccountIdIsEmpty_Returns400()
    {
        var response = await _client.GetAsync($"/api/v1/finance/transactions?accountId={Guid.Empty}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── POST /transactions ────────────────────────────────────────────────────

    [Fact]
    public async Task CreateTransaction_WhenValidRequest_Returns201WithTransaction()
    {
        var accountId = await CreateAccountAsync();

        var request = new CreateTransactionRequest(
            accountId, null, TransactionType.Debit, 45.99m, "GBP",
            "COSTA COFFEE", "Costa", new DateOnly(2025, 3, 1), null, null, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/transactions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var transaction = await response.Content.ReadFromJsonAsync<TransactionDto>();
        transaction.Should().NotBeNull();
        transaction!.Amount.Should().Be(45.99m);
        transaction.Description.Should().Be("COSTA COFFEE");
    }

    [Fact]
    public async Task CreateTransaction_DebitReducesAccountBalance()
    {
        var accountId = await CreateAccountAsync(initialBalance: 500m);

        var request = new CreateTransactionRequest(
            accountId, null, TransactionType.Debit, 100m, "GBP",
            "RENT", null, new DateOnly(2025, 3, 1), null, null, null);

        await _client.PostAsJsonAsync("/api/v1/finance/transactions", request);

        var accountResp = await _client.GetAsync($"/api/v1/finance/accounts/{accountId}");
        var account = await accountResp.Content.ReadFromJsonAsync<Account>();
        account!.Balance.Should().Be(400m);
    }

    // ── GET /transactions/import/formats ─────────────────────────────────────

    [Fact]
    public async Task GetImportFormats_ReturnsListOfSupportedFormats()
    {
        var response = await _client.GetAsync("/api/v1/finance/transactions/import/formats");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var formats = await response.Content.ReadFromJsonAsync<List<string>>();
        formats.Should().NotBeEmpty();
        formats.Should().Contain("barclays");
        formats.Should().Contain("monzo");
    }

    // ── POST /transactions/import ─────────────────────────────────────────────

    [Fact]
    public async Task ImportCsv_WhenValidBarclaysCsv_Returns200WithImportSummary()
    {
        var accountId = await CreateAccountAsync();

        var csvContent = "Date,Memo,Amount\n01/01/2025,TESCO,-25.50\n02/01/2025,SALARY,1500.00";
        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csvContent));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(fileContent, "file", "barclays.csv");

        var response = await _client.PostAsync(
            $"/api/v1/finance/transactions/import?accountId={accountId}&bankFormat=barclays",
            form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<CsvImportResult>();
        result.Should().NotBeNull();
        result!.Imported.Should().Be(2);
        result.Errors.Should().Be(0);
    }

    [Fact]
    public async Task ImportCsv_WhenNoFileProvided_Returns400()
    {
        var accountId = await CreateAccountAsync();

        using var emptyForm = new MultipartFormDataContent();
        var response = await _client.PostAsync(
            $"/api/v1/finance/transactions/import?accountId={accountId}&bankFormat=barclays",
            emptyForm);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ImportCsv_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        using var form = new MultipartFormDataContent();

        var response = await unauthClient.PostAsync(
            $"/api/v1/finance/transactions/import?accountId={Guid.NewGuid()}&bankFormat=barclays",
            form);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Guid> CreateAccountAsync(decimal initialBalance = 0m)
    {
        var request = new CreateAccountRequest(
            "Test Account", AccountType.Checking, "GBP",
            initialBalance, null, null, null, null, false, null);
        var response = await _client.PostAsJsonAsync("/api/v1/finance/accounts", request);
        var account = await response.Content.ReadFromJsonAsync<Account>();
        return account!.Id;
    }
}
