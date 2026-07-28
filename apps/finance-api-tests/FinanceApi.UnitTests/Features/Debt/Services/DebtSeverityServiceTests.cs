using FluentAssertions;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Debt.Services;

namespace FinanceApi.UnitTests.Features.Debt.Services;

public class DebtSeverityServiceTests
{
    private readonly DebtSeverityService _sut = new();
    private readonly DateOnly _today = new(2026, 6, 19);

    // ── Interest rate scoring ─────────────────────────────────────────────────

    [Fact]
    public void Score_WithZeroInterestRate_ReturnsLowScore()
    {
        var account = MakeCredit(interestRate: 0m, balance: -500m);

        var (score, label, _) = _sut.Score(account, _today);

        score.Should().Be(0);
        label.Should().Be("Low");
    }

    [Fact]
    public void Score_WithHighInterestRate_ReturnsMediumToHighScore()
    {
        var account = MakeCredit(interestRate: 24.9m, balance: -1000m);

        var (score, label, _) = _sut.Score(account, _today);

        score.Should().BeGreaterThan(30);
        label.Should().BeOneOf("Medium", "High");
    }

    [Fact]
    public void Score_InterestRateCappedAt60Points()
    {
        // 100% APR would be 200 pts without cap — capped at 60
        // credit limit set high so utilisation is low (no utilisation bonus)
        var account = MakeCredit(interestRate: 100m, balance: -1000m, creditLimit: 5000m);

        var (score, _, _) = _sut.Score(account, _today);

        score.Should().Be(60);
    }

    // ── Promotional expiry urgency ────────────────────────────────────────────

    [Fact]
    public void Score_WithPromoExpiringIn10Days_AddsMaxPromoBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -2000m,
            promotionalBalance: 2000m, promotionalExpiry: _today.AddDays(10));

        var (score, _, reason) = _sut.Score(account, _today);

        score.Should().Be(25);
        reason.Should().Contain("10 days");
    }

    [Fact]
    public void Score_WithPromoExpiringIn60Days_AddsPartialPromoBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -2000m,
            promotionalBalance: 2000m, promotionalExpiry: _today.AddDays(60));

        var (score, _, _) = _sut.Score(account, _today);

        score.Should().BeGreaterThan(0).And.BeLessThan(25);
    }

    [Fact]
    public void Score_WithPromoExpiringIn200Days_NoPromoBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -2000m,
            promotionalBalance: 2000m, promotionalExpiry: _today.AddDays(200));

        var (score, _, _) = _sut.Score(account, _today);

        score.Should().Be(0);
    }

    [Fact]
    public void Score_WithExpiredPromo_SetsReasonNotBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -2000m,
            promotionalBalance: 2000m, promotionalExpiry: _today.AddDays(-5));

        var (score, _, reason) = _sut.Score(account, _today);

        score.Should().Be(0);
        reason.Should().Contain("expired");
    }

    // ── Credit card utilisation ───────────────────────────────────────────────

    [Fact]
    public void Score_WithUtilisationAbove90Percent_AddsMaxUtilisationBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -950m, creditLimit: 1000m);

        var (score, _, reason) = _sut.Score(account, _today);

        score.Should().Be(15);
        reason.Should().Contain("90%");
    }

    [Fact]
    public void Score_WithUtilisationAbove75Percent_AddsPartialBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -800m, creditLimit: 1000m);

        var (score, _, _) = _sut.Score(account, _today);

        score.Should().BeGreaterThan(0).And.BeLessThan(15);
    }

    [Fact]
    public void Score_WithLowUtilisation_NoUtilisationBonus()
    {
        var account = MakeCredit(interestRate: 0m, balance: -100m, creditLimit: 1000m);

        var (score, _, _) = _sut.Score(account, _today);

        score.Should().Be(0);
    }

    // ── Label thresholds ──────────────────────────────────────────────────────

    // Rate-only scores top out at 60 (capped). Achievable range via rate alone is 0–60.
    [Theory]
    [InlineData(0, "Low")]
    [InlineData(24, "Low")]
    [InlineData(25, "Medium")]
    [InlineData(49, "Medium")]
    [InlineData(50, "High")]
    [InlineData(60, "High")]
    public void Score_LabelMatchesThreshold_ViaRateOnly(int rawScore, string expectedLabel)
    {
        var rate = rawScore / 2m;
        var account = MakeCredit(interestRate: rate, balance: -100m);

        var (_, label, _) = _sut.Score(account, _today);

        label.Should().Be(expectedLabel);
    }

    [Fact]
    public void Score_CriticalLabel_WhenRateCapPlusHighUtilisation()
    {
        // Rate cap (60pts) + >90% utilisation (15pts) = 75pts → Critical
        var account = MakeCredit(interestRate: 100m, balance: -950m, creditLimit: 1000m);

        var (score, label, _) = _sut.Score(account, _today);

        score.Should().Be(75);
        label.Should().Be("Critical");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Account MakeCredit(
        decimal interestRate = 0m,
        decimal balance = -500m,
        decimal? creditLimit = null,
        decimal? promotionalBalance = null,
        DateOnly? promotionalExpiry = null)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            Type = AccountType.Credit,
            Name = "Test Credit Card",
            Currency = "GBP",
            Balance = balance,
            InterestRate = interestRate,
            CreditLimit = creditLimit,
            PromotionalBalance = promotionalBalance,
            PromotionalExpiry = promotionalExpiry,
        };
    }
}
