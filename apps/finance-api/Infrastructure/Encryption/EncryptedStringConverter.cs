using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FinanceApi.Infrastructure.Encryption;

/// <summary>
/// EF Core value converter that transparently encrypts a string column at write time and
/// decrypts it at read time via the injected <see cref="IColumnEncryptionService"/>. Works for
/// both nullable and non-nullable string properties (nullability is compile-time only; the
/// runtime CLR type is the same). Applied per-property in FinanceDbContext.OnModelCreating —
/// see the field-scope table in the encryption ADR for which columns use this.
/// </summary>
public class EncryptedStringConverter : ValueConverter<string?, string?>
{
    public EncryptedStringConverter(IColumnEncryptionService encryption)
        : base(
            plaintext => encryption.Encrypt(plaintext),
            stored => encryption.Decrypt(stored))
    {
    }
}
