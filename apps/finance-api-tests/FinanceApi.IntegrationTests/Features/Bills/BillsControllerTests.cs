using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Bills.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Bills;

[Collection("Finance Integration")]
public class BillsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public BillsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetBills_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/bills");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var bills = await response.Content.ReadFromJsonAsync<List<BillResponse>>();
        bills.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetBills_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/bills");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateBill_WhenValidRequest_Returns201WithBillData()
    {
        var request = new CreateBillRequest("Netflix", 9.99m, BillFrequency.Monthly, 1, 3, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/bills", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var bill = await response.Content.ReadFromJsonAsync<BillResponse>();
        bill.Should().NotBeNull();
        bill!.Name.Should().Be("Netflix");
        bill.Amount.Should().Be(9.99m);
        bill.IsActive.Should().BeTrue();
        bill.AccountId.Should().BeNull();
        bill.AccountName.Should().BeNull();
    }

    [Fact]
    public async Task CreateBill_WhenAmountIsZero_Returns400()
    {
        var request = new CreateBillRequest("Bad Bill", 0m, BillFrequency.Monthly, 1, 3, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/bills", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBill_WeeklyWithDueDayOutOfWeekdayRange_Returns400()
    {
        var request = new CreateBillRequest("Cleaner", 25m, BillFrequency.Weekly, 8, 3, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/bills", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBill_WeeklyWithValidWeekday_Returns201()
    {
        var request = new CreateBillRequest("Cleaner", 25m, BillFrequency.Weekly, 5, 3, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/bills", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var bill = await response.Content.ReadFromJsonAsync<BillResponse>();
        bill!.DueDay.Should().Be(5);
    }

    [Fact]
    public async Task UpdateBill_WeeklyWithDueDayOutOfWeekdayRange_Returns400()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/bills",
            new CreateBillRequest("Cleaner", 25m, BillFrequency.Monthly, 1, 3, null));
        var bill = await created.Content.ReadFromJsonAsync<BillResponse>();

        var response = await _client.PutAsJsonAsync($"/api/v1/finance/bills/{bill!.Id}",
            new UpdateBillRequest(Frequency: BillFrequency.Weekly, DueDay: 15));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetUpcomingBills_WhenNoBillsExist_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/v1/finance/bills/upcoming");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var upcoming = await response.Content.ReadFromJsonAsync<List<UpcomingBillResponse>>();
        upcoming.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task MarkAsPaid_WhenBillExists_Returns204()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/bills",
            new CreateBillRequest("Electric", 60m, BillFrequency.Monthly, 15, 5, null));
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var bill = await created.Content.ReadFromJsonAsync<BillResponse>();

        var response = await _client.PatchAsync($"/api/v1/finance/bills/{bill!.Id}/pay", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteBill_WhenBillExists_Returns204AndRemovesBill()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/bills",
            new CreateBillRequest("Gym", 30m, BillFrequency.Monthly, 10, 3, null));
        var bill = await created.Content.ReadFromJsonAsync<BillResponse>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/finance/bills/{bill!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var listResponse = await _client.GetAsync("/api/v1/finance/bills");
        var bills = await listResponse.Content.ReadFromJsonAsync<List<BillResponse>>();
        bills.Should().NotContain(b => b.Id == bill.Id);
    }

    [Fact]
    public async Task GetBills_WithAccountIdFilter_ReturnsOnlyLinkedBills()
    {
        // Create two bills, neither linked — filter by random account should return empty
        await _client.PostAsJsonAsync("/api/v1/finance/bills",
            new CreateBillRequest("Netflix", 9.99m, BillFrequency.Monthly, 1, 3, null));

        var randomAccountId = Guid.NewGuid();
        var response = await _client.GetAsync($"/api/v1/finance/bills?accountId={randomAccountId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var bills = await response.Content.ReadFromJsonAsync<List<BillResponse>>();
        bills.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBill_WithCategoryId_ReturnsCategoryOnResponse()
    {
        // "Subscriptions" system category, seeded via AddBillCategories/original seed
        var subscriptionsCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000705");
        var request = new CreateBillRequest("Spotify", 11.99m, BillFrequency.Monthly, 1, 3, subscriptionsCategoryId);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/bills", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var bill = await response.Content.ReadFromJsonAsync<BillResponse>();
        bill!.CategoryId.Should().Be(subscriptionsCategoryId);
        bill.CategoryName.Should().Be("Subscriptions");
    }

    [Fact]
    public async Task DetectRecurring_WhenNoTransactions_ReturnsEmptyList()
    {
        var response = await _client.PostAsync("/api/v1/finance/bills/detect-recurring", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var patterns = await response.Content.ReadFromJsonAsync<List<RecurringPattern>>();
        patterns.Should().NotBeNull().And.BeEmpty();
    }
}
