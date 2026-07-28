using System.Security.Claims;
using FinanceApi.Features.Transactions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Transactions.Controllers;

/// <summary>Transaction management and CSV import endpoints.</summary>
[ApiController]
[Route("api/v1/finance/transactions")]
[Authorize]
[Produces("application/json")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactions;
    private readonly ICsvImportService _csvImport;

    public TransactionsController(ITransactionService transactions, ICsvImportService csvImport)
    {
        _transactions = transactions;
        _csvImport = csvImport;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>List transactions for an account with optional filters and pagination.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] Guid accountId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] Guid? categoryId,
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (accountId == Guid.Empty) return BadRequest("accountId is required");
        if (page < 1 || pageSize < 1 || pageSize > 200)
            return BadRequest("Invalid pagination parameters");

        Models.TransactionType? txType = null;
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<Models.TransactionType>(type, ignoreCase: true, out var parsed))
                return BadRequest($"Invalid transaction type: {type}");
            txType = parsed;
        }

        var request = new TransactionListRequest(accountId, from, to, categoryId, txType, search, page, pageSize);
        var result = await _transactions.GetTransactionsAsync(GetUserId(), request, ct);
        return Ok(result);
    }

    /// <summary>Get a single transaction by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransaction(Guid id, CancellationToken ct)
    {
        var transaction = await _transactions.GetTransactionByIdAsync(GetUserId(), id, ct);
        return transaction is null ? NotFound() : Ok(transaction);
    }

    /// <summary>Create a new transaction manually.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var transaction = await _transactions.CreateTransactionAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
    }

    /// <summary>Update a transaction (category, description, notes, reviewed flag).</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] UpdateTransactionRequest request, CancellationToken ct)
    {
        var transaction = await _transactions.UpdateTransactionAsync(GetUserId(), id, request, ct);
        return transaction is null ? NotFound() : Ok(transaction);
    }

    /// <summary>Delete a transaction.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTransaction(Guid id, CancellationToken ct)
    {
        var deleted = await _transactions.DeleteTransactionAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Import transactions from a bank CSV file.</summary>
    /// <param name="accountId">Target account ID.</param>
    /// <param name="bankFormat">Bank format identifier (barclays, hsbc, lloyds, monzo, starling, natwest, generic).</param>
    /// <param name="file">The CSV file to import.</param>
    [HttpPost("import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportCsv(
        [FromQuery] Guid accountId,
        [FromQuery] string bankFormat,
        IFormFile file,
        CancellationToken ct)
    {
        if (accountId == Guid.Empty) return BadRequest("accountId is required");
        if (string.IsNullOrWhiteSpace(bankFormat)) return BadRequest("bankFormat is required");
        if (file is null || file.Length == 0) return BadRequest("No file provided");

        // Limit upload to 10 MB
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File exceeds maximum allowed size of 10 MB");

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv" && extension != ".txt")
            return BadRequest("Only CSV files are supported");

        await using var stream = file.OpenReadStream();
        var result = await _csvImport.ImportAsync(GetUserId(), accountId, stream, bankFormat, ct);
        return Ok(result);
    }

    /// <summary>List supported bank CSV formats.</summary>
    [HttpGet("import/formats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetSupportedFormats()
    {
        return Ok(_csvImport.GetSupportedFormats());
    }
}
