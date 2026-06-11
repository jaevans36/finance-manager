using CsvHelper;
using CsvHelper.Configuration;
using FinanceApi.Data;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FinanceApi.Features.Transactions.Services;

/// <summary>
/// Parses bank CSV exports and imports them as transactions.
/// Duplicate detection: exact match on AccountId + TransactionDate + Amount + Description.
/// </summary>
public class CsvImportService : ICsvImportService
{
    private readonly FinanceDbContext _db;
    private readonly IMerchantNormalisationService _merchantNormaliser;

    private static readonly HashSet<string> SupportedFormats = new(StringComparer.OrdinalIgnoreCase)
    {
        "barclays",
        "hsbc",
        "lloyds",
        "monzo",
        "starling",
        "natwest",
        "generic"
    };

    public CsvImportService(FinanceDbContext db, IMerchantNormalisationService merchantNormaliser)
    {
        _db = db;
        _merchantNormaliser = merchantNormaliser;
    }

    public IEnumerable<string> GetSupportedFormats() => SupportedFormats;

    public async Task<CsvImportResult> ImportAsync(
        Guid userId,
        Guid accountId,
        Stream csvStream,
        string bankFormat,
        CancellationToken ct = default)
    {
        var batchId = Guid.NewGuid();
        var errors = new List<string>();
        var imported = 0;
        var duplicates = 0;

        List<ParsedCsvRow> rows;
        List<string> skipMessages;
        try
        {
            (rows, skipMessages) = ParseCsv(csvStream, bankFormat);
        }
        catch (Exception ex)
        {
            return new CsvImportResult(0, 0, 1, new[] { $"CSV parse error: {ex.Message}" }, batchId);
        }

        foreach (var row in rows)
        {
            var isDuplicate = await _db.Transactions.AnyAsync(t =>
                t.AccountId == accountId &&
                t.TransactionDate == row.TransactionDate &&
                t.Amount == Math.Abs(row.Amount) &&
                t.OriginalDescription == row.Description,
                ct);

            var stripped = NormaliseDescription(row.Description);
            var payee = _merchantNormaliser.Normalise(stripped);

            var transaction = new Transaction
            {
                UserId = userId,
                AccountId = accountId,
                ImportBatchId = batchId,
                Type = row.Type,
                Amount = Math.Abs(row.Amount),
                BaseCurrencyAmount = Math.Abs(row.Amount),
                Currency = "GBP",
                Description = stripped,
                Payee = payee != stripped ? payee : null,
                OriginalDescription = row.Description,
                Reference = row.Reference,
                TransactionDate = row.TransactionDate,
                IsDuplicate = isDuplicate,
                ImportSource = ImportSource.CsvImport
            };

            _db.Transactions.Add(transaction);

            if (isDuplicate)
            {
                duplicates++;
            }
            else
            {
                imported++;
                // Update account balance for non-duplicate transactions
                var account = await _db.Accounts.FindAsync(new object[] { accountId }, ct);
                if (account is not null)
                {
                    account.Balance += row.Type == TransactionType.Credit
                        ? Math.Abs(row.Amount)
                        : -Math.Abs(row.Amount);
                    account.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _db.SaveChangesAsync(ct);

        // Cap skip messages at 20 to avoid overwhelming the response
        const int MaxSkipMessages = 20;
        var cappedSkips = skipMessages.Count > MaxSkipMessages
            ? skipMessages.Take(MaxSkipMessages)
                .Append($"… and {skipMessages.Count - MaxSkipMessages} more skipped row(s) not shown")
                .ToList()
            : skipMessages;

        return new CsvImportResult(imported, duplicates, errors.Count, errors, batchId,
            Skipped: skipMessages.Count, SkipMessages: cappedSkips);
    }

    private (List<ParsedCsvRow> Rows, List<string> Skipped) ParseCsv(Stream stream, string format)
    {
        return format.ToLowerInvariant() switch
        {
            "barclays" => ParseBarclays(stream),
            "monzo" => ParseMonzo(stream),
            "starling" => ParseStarling(stream),
            "lloyds" => ParseLloyds(stream),
            "hsbc" => ParseHsbc(stream),
            "natwest" => ParseNatwest(stream),
            _ => ParseGeneric(stream)
        };
    }

    // ── Bank-specific parsers ─────────────────────────────────────────────────

    /// <summary>
    /// Barclays CSV: Date,Memo,Amount — date dd/MM/yyyy, signed amount.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseBarclays(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField(0) ?? string.Empty;
            var description = csv.GetField(1) ?? string.Empty;
            var amountStr = csv.GetField(2) ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr, "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }
            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{amountStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, description, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, null));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// Monzo CSV: Transaction ID,Date,…,Name,…,Amount,… — date dd/MM/yyyy, signed amount.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseMonzo(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        while (csv.Read())
        {
            rowNum++;
            var txId = csv.GetField("Transaction ID") ?? string.Empty;
            var dateStr = csv.GetField("Date") ?? string.Empty;
            var name = csv.GetField("Name") ?? string.Empty;
            var amountStr = csv.GetField("Amount") ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr, "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }
            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{amountStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, name, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, txId));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// Starling CSV: Date,Counter Party,Reference,Type,Amount (GBP),Balance (GBP) — date dd/MM/yyyy.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseStarling(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField("Date") ?? string.Empty;
            var counterParty = csv.GetField("Counter Party") ?? string.Empty;
            var reference = csv.GetField("Reference") ?? string.Empty;
            var amountStr = csv.GetField("Amount (GBP)") ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr, "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }
            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{amountStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, counterParty, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, reference));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// Lloyds CSV: Transaction Date,…,Transaction Description,Debit Amount,Credit Amount,Balance — date dd/MM/yyyy.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseLloyds(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField("Transaction Date") ?? string.Empty;
            var description = csv.GetField("Transaction Description") ?? string.Empty;
            var debitStr = csv.GetField("Debit Amount") ?? string.Empty;
            var creditStr = csv.GetField("Credit Amount") ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr, "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }

            decimal amount;
            TransactionType type;

            if (!string.IsNullOrWhiteSpace(creditStr) &&
                decimal.TryParse(creditStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var credit))
            { amount = credit; type = TransactionType.Credit; }
            else if (decimal.TryParse(debitStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var debit))
            { amount = debit; type = TransactionType.Debit; }
            else
            { skipped.Add($"Row {rowNum}: could not parse debit '{debitStr}' or credit '{creditStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, description, amount, type, null));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// HSBC UK CSV: no header row; Date / Description / SignedAmount — date dd/MM/yyyy.
    /// Amounts may be quoted with thousands separators, e.g. "-2,300.00".
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseHsbc(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = false, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField(0) ?? string.Empty;
            var description = csv.GetField(1) ?? string.Empty;
            var amountStr = csv.GetField(2) ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr.Trim(), "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }
            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{amountStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, description, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, null));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// NatWest CSV: Date,Type,Description,Value,Balance,… — date dd/MM/yyyy, signed Value.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseNatwest(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField("Date") ?? string.Empty;
            var description = csv.GetField("Description") ?? string.Empty;
            var valueStr = csv.GetField("Value") ?? string.Empty;

            if (!DateOnly.TryParseExact(dateStr, "dd/MM/yyyy", out var date))
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}' — expected dd/MM/yyyy"); continue; }
            if (!decimal.TryParse(valueStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{valueStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, description, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, null));
        }

        return (rows, skipped);
    }

    /// <summary>
    /// Generic CSV: Date,Description,Amount — tries common date formats.
    /// </summary>
    private static (List<ParsedCsvRow>, List<string>) ParseGeneric(Stream stream)
    {
        var rows = new List<ParsedCsvRow>();
        var skipped = new List<string>();
        var rowNum = 0;
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true, MissingFieldFound = null, TrimOptions = TrimOptions.Trim
        });

        csv.Read();
        csv.ReadHeader();

        var dateFormats = new[] { "dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy" };

        while (csv.Read())
        {
            rowNum++;
            var dateStr = csv.GetField(0) ?? string.Empty;
            var description = csv.GetField(1) ?? string.Empty;
            var amountStr = csv.GetField(2) ?? string.Empty;

            DateOnly date = default;
            var dateParsed = false;
            foreach (var fmt in dateFormats)
            {
                if (DateOnly.TryParseExact(dateStr, fmt, out date)) { dateParsed = true; break; }
            }
            if (!dateParsed)
            { skipped.Add($"Row {rowNum}: unrecognised date '{dateStr}'"); continue; }

            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
            { skipped.Add($"Row {rowNum}: could not parse amount '{amountStr}'"); continue; }

            rows.Add(new ParsedCsvRow(date, description, amount,
                amount >= 0 ? TransactionType.Credit : TransactionType.Debit, null));
        }

        return (rows, skipped);
    }

    /// <summary>Normalise common bank description noise for cleaner display.</summary>
    private static string NormaliseDescription(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;

        // Strip common prefixes added by UK banks
        var prefixes = new[] { "PURCHASE ", "CONTACTLESS ", "FASTER PAYMENT ", "BACS CREDIT ", "DD " };
        foreach (var prefix in prefixes)
        {
            if (raw.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return raw[prefix.Length..].Trim();
        }

        return raw.Trim();
    }
}
