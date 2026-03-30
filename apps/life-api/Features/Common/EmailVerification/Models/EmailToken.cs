using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;

namespace LifeApi.Features.Common.EmailVerification.Models;

public enum TokenType
{
    PasswordReset,
    EmailVerification
}

[Table("email_tokens")]
public class EmailToken
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("token")]
    [MaxLength(255)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [Column("type")]
    public TokenType Type { get; set; }

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("used_at")]
    public DateTime? UsedAt { get; set; }

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;
}
