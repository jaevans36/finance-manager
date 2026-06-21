using FinanceApi.Features.Accounts.Models;

namespace FinanceApi.Features.Debt.Services;

/// <summary>
/// Scores debt accounts 0–100 (higher = more urgent to pay down).
/// Base: interest rate. Urgency additions for promotional expiry and utilisation.
/// </summary>
public class DebtSeverityService : IDebtSeverityService
{
    // Points per percentage point of interest rate, capped at 60
    private const int RateScoreCap = 60;

    // Maximum urgency bonus for promotional expiry
    private const int PromoExpiryBonusCap = 25;

    // Utilisation bonus cap (credit cards only)
    private const int UtilisationBonusCap = 15;

    public (int Score, string Label, string? Reason) Score(Account account, DateOnly today)
    {
        int score = 0;
        string? reason = null;

        // ── Base: interest rate ───────────────────────────────────────────────
        if (account.InterestRate is > 0)
        {
            int ratePoints = (int)Math.Round(account.InterestRate.Value * 2m);
            score += Math.Min(ratePoints, RateScoreCap);
        }

        // ── Urgency: promotional deal expiring soon ───────────────────────────
        if (account.PromotionalExpiry.HasValue && account.PromotionalBalance is > 0)
        {
            int daysUntilExpiry = account.PromotionalExpiry.Value.DayNumber - today.DayNumber;
            if (daysUntilExpiry <= 0)
            {
                // Already expired — treat as full revert rate urgency, no bonus but flag reason
                reason ??= "Promotional deal has expired";
            }
            else if (daysUntilExpiry <= 30)
            {
                score += PromoExpiryBonusCap;
                reason ??= $"Promotional deal expires in {daysUntilExpiry} day{(daysUntilExpiry == 1 ? "" : "s")}";
            }
            else if (daysUntilExpiry <= 90)
            {
                int bonus = (int)Math.Round(PromoExpiryBonusCap * (90 - daysUntilExpiry) / 60.0);
                score += bonus;
                reason ??= $"Promotional deal expires in {daysUntilExpiry} days";
            }
        }

        // ── Urgency: utilisation (credit cards) ───────────────────────────────
        if (account.Type == AccountType.Credit && account.CreditLimit is > 0 && account.Balance < 0)
        {
            decimal owed = Math.Abs(account.Balance);
            decimal utilisation = owed / account.CreditLimit.Value;
            if (utilisation >= 0.9m)
            {
                score += UtilisationBonusCap;
                reason ??= "Credit utilisation above 90%";
            }
            else if (utilisation >= 0.75m)
            {
                score += (int)Math.Round(UtilisationBonusCap * 0.67);
                reason ??= "Credit utilisation above 75%";
            }
            else if (utilisation >= 0.5m)
            {
                score += (int)Math.Round(UtilisationBonusCap * 0.33);
            }
        }

        score = Math.Clamp(score, 0, 100);

        string label = score >= 75 ? "Critical"
            : score >= 50 ? "High"
            : score >= 25 ? "Medium"
            : "Low";

        return (score, label, reason);
    }
}
