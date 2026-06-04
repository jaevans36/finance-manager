using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FinanceApi.IntegrationTests.Helpers;

/// <summary>Generates JWT tokens signed with the test secret for integration tests.</summary>
public static class JwtTestHelper
{
    private const string Secret = "test-secret-key-minimum-32-characters-long!!";

    public static string GenerateToken(Guid userId)
    {
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("sub", userId.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: "finance-test",
            audience: "finance-test",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
