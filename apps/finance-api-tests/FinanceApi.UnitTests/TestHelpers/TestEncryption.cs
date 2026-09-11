using FinanceApi.Infrastructure.Encryption;

namespace FinanceApi.UnitTests.TestHelpers;

/// <summary>
/// A single fixed-key AesColumnEncryptionService shared across unit tests that construct
/// FinanceDbContext directly. Uses the real AES-GCM implementation (not a passthrough fake) so
/// the encrypted-column converters are genuinely exercised by the existing test suite — the same
/// principle as the InMemory provider already being trusted to exercise the CategoryIds/
/// IncomeAccountIds JSON converters. The key has no meaning beyond this test run.
/// </summary>
public static class TestEncryption
{
    private static readonly byte[] Key = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);

    public static readonly IColumnEncryptionService Service = new AesColumnEncryptionService(Key);
}
