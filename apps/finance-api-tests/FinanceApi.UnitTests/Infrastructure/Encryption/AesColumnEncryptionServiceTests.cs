using System.Security.Cryptography;
using FinanceApi.Infrastructure.Encryption;
using FluentAssertions;
using Xunit;

namespace FinanceApi.UnitTests.Infrastructure.Encryption;

public class AesColumnEncryptionServiceTests
{
    private static AesColumnEncryptionService NewService() => new(RandomNumberGenerator.GetBytes(32));

    [Fact]
    public void Encrypt_ThenDecrypt_RoundTripsTheOriginalValue()
    {
        var service = NewService();

        var stored = service.Encrypt("Barclays Current Account");

        service.Decrypt(stored).Should().Be("Barclays Current Account");
    }

    [Fact]
    public void Encrypt_Null_ReturnsNull()
    {
        NewService().Encrypt(null).Should().BeNull();
    }

    [Fact]
    public void Decrypt_Null_ReturnsNull()
    {
        NewService().Decrypt(null).Should().BeNull();
    }

    [Fact]
    public void Encrypt_EmptyString_RoundTrips()
    {
        var service = NewService();
        service.Decrypt(service.Encrypt(string.Empty)).Should().Be(string.Empty);
    }

    [Fact]
    public void Encrypt_StoresWithTheVersionPrefix()
    {
        var stored = NewService().Encrypt("Groceries")!;
        stored.Should().StartWith(AesColumnEncryptionService.VersionPrefix);
    }

    [Fact]
    public void Encrypt_TwoCallsWithTheSamePlaintext_ProduceDifferentCiphertext()
    {
        // Semantic security — a fresh random nonce every call, deliberate since no encrypted
        // column needs SQL-side equality (see the encryption ADR).
        var service = NewService();

        var first = service.Encrypt("Tesco");
        var second = service.Encrypt("Tesco");

        first.Should().NotBe(second);
        service.Decrypt(first).Should().Be("Tesco");
        service.Decrypt(second).Should().Be("Tesco");
    }

    [Fact]
    public void Decrypt_ValueWithoutVersionPrefix_ThrowsAClearError()
    {
        var service = NewService();

        var act = () => service.Decrypt("plain old text that was never encrypted");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*ENC1:*backfill*");
    }

    [Fact]
    public void Decrypt_TamperedCiphertext_FailsAuthentication()
    {
        var service = NewService();
        var stored = service.Encrypt("£1,234.56 balance note")!;

        // Flip a character inside the base64 payload (after the prefix) to corrupt the GCM tag.
        var payloadStart = AesColumnEncryptionService.VersionPrefix.Length;
        var chars = stored.ToCharArray();
        chars[payloadStart] = chars[payloadStart] == 'A' ? 'B' : 'A';
        var tampered = new string(chars);

        var act = () => service.Decrypt(tampered);

        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void Decrypt_WithADifferentKey_FailsAuthentication()
    {
        var writer = NewService();
        var reader = NewService(); // different random key

        var stored = writer.Encrypt("Emergency Fund");

        var act = () => reader.Decrypt(stored);

        act.Should().Throw<CryptographicException>();
    }

    [Theory]
    [InlineData(15)]
    [InlineData(17)]
    [InlineData(31)]
    [InlineData(33)]
    public void Constructor_RejectsKeysThatAreNotValidAesLengths(int keyLength)
    {
        var act = () => new AesColumnEncryptionService(new byte[keyLength]);

        act.Should().Throw<ArgumentException>();
    }
}
