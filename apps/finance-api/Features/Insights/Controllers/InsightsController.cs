using System.Security.Claims;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Insights.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Insights.Controllers;

[ApiController]
[Route("api/v1/finance/insights")]
[Authorize]
public class InsightsController(
    ISpendingVelocityService velocityService,
    IAnomalyDetectionService anomalyService,
    ISubscriptionAuditorService subscriptionService,
    INegotiationEngineService negotiationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<InsightsSummaryResponse>> GetSummary(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var velocity = await velocityService.GetVelocityAsync(userId.Value, ct);
        var anomalies = await anomalyService.GetAnomaliesAsync(userId.Value, ct);
        var subscriptions = await subscriptionService.GetSubscriptionsAsync(userId.Value, ct);

        var cards = new List<InsightCard>();

        if (velocity.ProjectedOverspend is > 0)
        {
            cards.Add(new InsightCard(
                "velocity",
                InsightType.SpendingVelocity,
                InsightSeverity.Warning,
                "You're on track to overspend this month",
                $"£{velocity.TotalSpentSoFar:0.00} spent in {velocity.DaysElapsed} days — projected to overspend by £{velocity.ProjectedOverspend:0.00} at this rate.",
                "View breakdown"));
        }

        foreach (var anomaly in anomalies.Take(5))
        {
            cards.Add(new InsightCard(
                anomaly.Id,
                InsightType.Anomaly,
                anomaly.Severity,
                anomaly.MerchantName,
                anomaly.Description,
                "Review"));
        }

        var possiblyUnused = subscriptions.Subscriptions.Where(s => s.PossiblyUnused).ToList();
        if (possiblyUnused.Count > 0)
        {
            cards.Add(new InsightCard(
                "subscriptions-unused",
                InsightType.Subscription,
                InsightSeverity.Info,
                $"{possiblyUnused.Count} possibly unused subscription{(possiblyUnused.Count == 1 ? "" : "s")}",
                $"Costing £{possiblyUnused.Sum(s => s.MonthlyCost):0.00}/month combined — review to see if you still need them.",
                "Review subscriptions"));
        }

        foreach (var increasing in subscriptions.Subscriptions.Where(s => s.AmountTrend == "Increasing"))
        {
            cards.Add(new InsightCard(
                $"price-increase:{increasing.MerchantName}",
                InsightType.PriceIncrease,
                InsightSeverity.Warning,
                $"{increasing.MerchantName} price has increased",
                $"Now around £{increasing.MonthlyCost:0.00}/month. Consider negotiating a better rate.",
                "Generate negotiation script"));
        }

        return Ok(new InsightsSummaryResponse(cards));
    }

    [HttpGet("velocity")]
    public async Task<ActionResult<SpendingVelocityResponse>> GetVelocity(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        return Ok(await velocityService.GetVelocityAsync(userId.Value, ct));
    }

    [HttpGet("anomalies")]
    public async Task<ActionResult<IReadOnlyList<AnomalyAlert>>> GetAnomalies(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        return Ok(await anomalyService.GetAnomaliesAsync(userId.Value, ct));
    }

    [HttpGet("subscriptions")]
    public async Task<ActionResult<SubscriptionAuditResponse>> GetSubscriptions(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        return Ok(await subscriptionService.GetSubscriptionsAsync(userId.Value, ct));
    }

    [HttpGet("negotiation-script")]
    public async Task<ActionResult<NegotiationScriptResponse>> GetNegotiationScript(
        [FromQuery] string merchantName,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(merchantName))
            return BadRequest("merchantName is required.");

        var result = await negotiationService.GetScriptAsync(userId.Value, merchantName, ct);
        if (result is null)
            return NotFound("No transaction history found for this merchant.");

        return Ok(result);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
