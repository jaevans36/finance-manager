namespace FinanceApi.Infrastructure.Encryption;

/// <summary>
/// Encrypts/decrypts individual string values for at-rest column encryption.
/// Null in, null out — absence of a value is never encrypted.
/// </summary>
public interface IColumnEncryptionService
{
    string? Encrypt(string? plaintext);

    string? Decrypt(string? stored);
}
