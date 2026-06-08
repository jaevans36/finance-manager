namespace FinanceApi.Features.Transactions.Services;

public interface IMerchantNormalisationService
{
    /// <summary>
    /// Returns a clean merchant name for the given raw bank description,
    /// or the original input if no pattern matches.
    /// </summary>
    string Normalise(string rawDescription);
}
