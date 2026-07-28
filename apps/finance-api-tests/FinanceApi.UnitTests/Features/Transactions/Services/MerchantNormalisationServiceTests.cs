using FluentAssertions;
using FinanceApi.Features.Transactions.Services;

namespace FinanceApi.UnitTests.Features.Transactions.Services;

public class MerchantNormalisationServiceTests
{
    private readonly MerchantNormalisationService _sut = new();

    // ── Known merchant patterns ───────────────────────────────────────────────

    [Theory]
    [InlineData("AMZN*1X2Y3Z LUXEMBOURG", "Amazon")]
    [InlineData("AMAZON.CO.UK", "Amazon")]
    [InlineData("amazon marketplace", "Amazon")]
    public void Normalise_WhenAmazonVariant_ReturnsAmazon(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("NETFLIX.COM", "Netflix")]
    [InlineData("NETFLIX INTERNATIONAL", "Netflix")]
    public void Normalise_WhenNetflixVariant_ReturnsNetflix(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("SPOTIFY AB", "Spotify")]
    [InlineData("Spotify Premium", "Spotify")]
    public void Normalise_WhenSpotifyVariant_ReturnsSpotify(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("TFL TRAVEL CH 00001234 LONDON", "Transport for London")]
    [InlineData("TFL.GOV.UK", "Transport for London")]
    public void Normalise_WhenTflVariant_ReturnsTransportForLondon(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("TESCO STORES 1234", "Tesco")]
    [InlineData("TESCO EXTRA", "Tesco")]
    [InlineData("TESCO METRO", "Tesco")]
    public void Normalise_WhenTescoVariant_ReturnsTesco(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("SAINSBURYS SUPERMARKETS", "Sainsbury's")]
    [InlineData("SAINSBURY'S LOCAL", "Sainsbury's")]
    public void Normalise_WhenSainsburysVariant_ReturnsSainsburys(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("DELIVEROO LTD", "Deliveroo")]
    [InlineData("deliveroo uk", "Deliveroo")]
    public void Normalise_WhenDeliverooVariant_ReturnsDeliveroo(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("OCTOPUS ENERGY LTD", "Octopus Energy")]
    [InlineData("BRITISH GAS TRADING", "British Gas")]
    [InlineData("EDF ENERGY CUSTOMERS", "EDF Energy")]
    public void Normalise_WhenEnergySupplierVariant_ReturnsCleansedName(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData("COSTA COFFEE 01234", "Costa Coffee")]
    [InlineData("COSTA LIMITED", "Costa Coffee")]
    public void Normalise_WhenCostaVariant_ReturnsCostaCoffe(string raw, string expected)
    {
        _sut.Normalise(raw).Should().Be(expected);
    }

    // ── No match — falls through unchanged ───────────────────────────────────

    [Theory]
    [InlineData("JOHN SMITH PLUMBING")]
    [InlineData("LOCAL NEWSAGENT")]
    [InlineData("")]
    public void Normalise_WhenNoMatchingPattern_ReturnsInputUnchanged(string raw)
    {
        _sut.Normalise(raw).Should().Be(raw);
    }

    // ── Case insensitivity ────────────────────────────────────────────────────

    [Fact]
    public void Normalise_IsCaseInsensitive()
    {
        _sut.Normalise("netflix.com").Should().Be("Netflix");
        _sut.Normalise("NETFLIX.COM").Should().Be("Netflix");
        _sut.Normalise("Netflix.COM").Should().Be("Netflix");
    }

    // ── Whitespace handling ───────────────────────────────────────────────────

    [Fact]
    public void Normalise_WhenInputHasLeadingTrailingWhitespace_TrimsBeforeMatching()
    {
        _sut.Normalise("  TESCO METRO  ").Should().Be("Tesco");
    }

    // ── PayPal passthrough ────────────────────────────────────────────────────

    [Fact]
    public void Normalise_WhenPaypalMerchant_ReturnsPayPalPrefix()
    {
        _sut.Normalise("PAYPAL *EBAY").Should().StartWith("PayPal");
    }
}
