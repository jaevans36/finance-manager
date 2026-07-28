using System.Security.Claims;
using FinanceApi.Features.Accounts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Accounts.Controllers;

/// <summary>Financial account management endpoints.</summary>
[ApiController]
[Route("api/v1/finance/accounts")]
[Authorize]
[Produces("application/json")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accounts;

    public AccountsController(IAccountService accounts)
    {
        _accounts = accounts;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>Get all accounts for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccounts(CancellationToken ct)
    {
        var accounts = await _accounts.GetAccountsAsync(GetUserId(), ct);
        return Ok(accounts);
    }

    /// <summary>Get a single account by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccount(Guid id, CancellationToken ct)
    {
        var account = await _accounts.GetAccountByIdAsync(GetUserId(), id, ct);
        return account is null ? NotFound() : Ok(account);
    }

    /// <summary>Create a new account.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Account name is required");
        if (string.IsNullOrWhiteSpace(request.Currency)) return BadRequest("Currency is required");
        var account = await _accounts.CreateAccountAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
    }

    /// <summary>Update an existing account.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] UpdateAccountRequest request, CancellationToken ct)
    {
        var account = await _accounts.UpdateAccountAsync(GetUserId(), id, request, ct);
        return account is null ? NotFound() : Ok(account);
    }

    /// <summary>Soft-delete an account (marks inactive).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount(Guid id, CancellationToken ct)
    {
        var deleted = await _accounts.DeleteAccountAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Get the user's net worth (sum of all active non-excluded account balances in GBP).</summary>
    [HttpGet("net-worth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNetWorth(CancellationToken ct)
    {
        var netWorth = await _accounts.GetNetWorthAsync(GetUserId(), ct);
        return Ok(new { netWorth });
    }
}
