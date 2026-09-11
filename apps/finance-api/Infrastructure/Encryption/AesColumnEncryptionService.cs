using System.Security.Cryptography;
using System.Text;

namespace FinanceApi.Infrastructure.Encryption;

/// <summary>
/// AES-256-GCM column encryption. Each call to <see cref="Encrypt"/> uses a fresh random
/// nonce, so the same plaintext never produces the same ciphertext twice (semantic security) —
/// deliberate: none of the encrypted columns need SQL-side equality, so there is no reason to
/// weaken this with deterministic encryption.
///
/// Stored format: "ENC1:" + base64(nonce[12] ++ ciphertext ++ tag[16]). The version prefix lets
/// the one-time backfill tool (Program.cs --backfill-encrypt-columns) skip already-migrated rows
/// idempotently, and lets Decrypt fail with a clear message instead of a cryptic AES exception if
/// it ever sees data the backfill hasn't touched yet.
/// </summary>
public class AesColumnEncryptionService : IColumnEncryptionService
{
    public const string VersionPrefix = "ENC1:";

    private const int NonceSizeBytes = 12;
    private const int TagSizeBytes = 16;

    private readonly byte[] _key;

    public AesColumnEncryptionService(byte[] key)
    {
        if (key.Length is not (16 or 24 or 32))
        {
            throw new ArgumentException(
                $"Encryption key must be 16, 24 or 32 bytes (AES-128/192/256); got {key.Length}.",
                nameof(key));
        }

        _key = key;
    }

    public string? Encrypt(string? plaintext)
    {
        if (plaintext is null)
        {
            return null;
        }

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[TagSizeBytes];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        var payload = new byte[NonceSizeBytes + ciphertext.Length + TagSizeBytes];
        Buffer.BlockCopy(nonce, 0, payload, 0, NonceSizeBytes);
        Buffer.BlockCopy(ciphertext, 0, payload, NonceSizeBytes, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, payload, NonceSizeBytes + ciphertext.Length, TagSizeBytes);

        return VersionPrefix + Convert.ToBase64String(payload);
    }

    public string? Decrypt(string? stored)
    {
        if (stored is null)
        {
            return null;
        }

        if (!stored.StartsWith(VersionPrefix, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Value is not in the expected encrypted format (missing \"{VersionPrefix}\" prefix). " +
                "Has the one-time backfill (Program.cs --backfill-encrypt-columns) been run?");
        }

        var payload = Convert.FromBase64String(stored[VersionPrefix.Length..]);
        if (payload.Length < NonceSizeBytes + TagSizeBytes)
        {
            throw new InvalidOperationException("Encrypted value is truncated or corrupt.");
        }

        var nonce = payload[..NonceSizeBytes];
        var tag = payload[^TagSizeBytes..];
        var ciphertext = payload[NonceSizeBytes..^TagSizeBytes];
        var plaintextBytes = new byte[ciphertext.Length];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Decrypt(nonce, ciphertext, tag, plaintextBytes);

        return Encoding.UTF8.GetString(plaintextBytes);
    }
}
