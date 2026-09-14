using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Common.Users.Models;

/// <summary>
/// A read-only view into life-api's "public.users" table — finance-api and life-api share the
/// same physical Postgres instance (see docker-compose.vps.yml's design note), each isolated
/// into its own schema. finance-api doesn't own this table (no migrations, no writes here — see
/// FinanceDbContext's ExcludeFromMigrations config) but needs it to resolve a username/email
/// into a user id when sharing an account, since finance-api validates life-api's JWTs but keeps
/// no user records of its own.
/// </summary>
public class LifeManagerUser
{
    public Guid Id { get; set; }

    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Username { get; set; }
}
