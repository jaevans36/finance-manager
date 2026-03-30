using System.Text.RegularExpressions;

namespace LifeApi.Features.Admin.Services;

/// <summary>
/// Reads and parses structured log entries from Serilog's daily-rolling log files.
/// </summary>
public class LogReaderService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LogReaderService> _logger;

    // Matches: [2026-03-09 12:34:56 INF] SourceContext Message
    private static readonly Regex LogLineRegex = new(
        @"^\[(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (?<level>[A-Z]{3})\] (?<message>.+)$",
        RegexOptions.Compiled);

    public LogReaderService(IWebHostEnvironment env, ILogger<LogReaderService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<IReadOnlyList<LogEntry>> ReadLogsAsync(int lines, string? levelFilter)
    {
        var logsDir = Path.Combine(_env.ContentRootPath, "logs");
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var logFile = Path.Combine(logsDir, $"life-api-{today}.log");

        if (!File.Exists(logFile))
        {
            return Array.Empty<LogEntry>();
        }

        try
        {
            // Open with ReadWrite share so we can read while Serilog is writing
            await using var stream = new FileStream(logFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var reader = new StreamReader(stream);
            var rawLines = new List<string>();
            string? line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                rawLines.Add(line);
            }

            var entries = rawLines
                .Select(ParseLine)
                .Where(e => e != null)
                .Select(e => e!)
                .ToList();

            // Apply level filter
            if (!string.IsNullOrWhiteSpace(levelFilter) && levelFilter != "all")
            {
                var upperFilter = levelFilter.ToUpperInvariant();
                entries = entries.Where(e => e.Level == upperFilter).ToList();
            }

            // Return last N entries
            return entries.Count > lines
                ? entries.GetRange(entries.Count - lines, lines)
                : entries;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read log file {File}", logFile);
            return Array.Empty<LogEntry>();
        }
    }

    private static LogEntry? ParseLine(string line)
    {
        var match = LogLineRegex.Match(line);
        if (!match.Success) return null;

        return new LogEntry(
            Timestamp: match.Groups["timestamp"].Value,
            Level: match.Groups["level"].Value,
            Message: match.Groups["message"].Value);
    }
}

public record LogEntry(string Timestamp, string Level, string Message);
