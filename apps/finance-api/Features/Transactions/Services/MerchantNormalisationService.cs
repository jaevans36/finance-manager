using System.Text.RegularExpressions;

namespace FinanceApi.Features.Transactions.Services;

/// <summary>
/// Maps noisy bank CSV descriptions to clean merchant names using a curated
/// UK merchant pattern dictionary. Preserves unknown inputs unchanged.
/// </summary>
public class MerchantNormalisationService : IMerchantNormalisationService
{
    private static readonly (Regex Pattern, string CanonicalName)[] Rules = BuildRules();

    public string Normalise(string rawDescription)
    {
        if (string.IsNullOrWhiteSpace(rawDescription))
            return rawDescription;

        var trimmed = rawDescription.Trim();

        foreach (var (pattern, name) in Rules)
        {
            if (pattern.IsMatch(trimmed))
                return name;
        }

        return trimmed;
    }

    private static (Regex, string)[] BuildRules()
    {
        var opts = RegexOptions.IgnoreCase | RegexOptions.Compiled;

        return
        [
            // ── PayPal (must appear before any merchant it may wrap) ──────────
            (new Regex(@"PAYPAL",                opts),          "PayPal"),

            // ── Shopping ────────────────────────────────────────────────────
            (new Regex(@"AMZN\*|AMAZON", opts),                 "Amazon"),
            (new Regex(@"ETSY",          opts),                 "Etsy"),
            (new Regex(@"EBAY",          opts),                 "eBay"),
            (new Regex(@"MARKS AND SPENCER|M&S SIMPLY FOOD|M&S", opts), "Marks & Spencer"),
            (new Regex(@"NEXT RETAIL|NEXT\.CO\.UK", opts),      "Next"),
            (new Regex(@"ARGOS",         opts),                 "Argos"),
            (new Regex(@"IKEA",          opts),                 "IKEA"),

            // ── Groceries ───────────────────────────────────────────────────
            (new Regex(@"TESCO",        opts),                  "Tesco"),
            (new Regex(@"SAINSBURY",    opts),                  "Sainsbury's"),
            (new Regex(@"\bASDA\b",     opts),                  "ASDA"),
            (new Regex(@"\bLIDL\b",     opts),                  "Lidl"),
            (new Regex(@"\bALDI\b",     opts),                  "Aldi"),
            (new Regex(@"MORRISONS",    opts),                  "Morrisons"),
            (new Regex(@"WAITROSE",     opts),                  "Waitrose"),
            (new Regex(@"CO-?OP FOOD|CO-OPERATIVE FOOD", opts), "Co-op Food"),
            (new Regex(@"ICELAND FOODS",opts),                  "Iceland"),

            // ── Eating Out / Takeaway ────────────────────────────────────────
            (new Regex(@"DELIVEROO",    opts),                  "Deliveroo"),
            (new Regex(@"JUST[ -]?EAT", opts),                  "Just Eat"),
            (new Regex(@"UBER\s*EATS",  opts),                  "Uber Eats"),
            (new Regex(@"\bCOSTA\b",    opts),                  "Costa Coffee"),
            (new Regex(@"STARBUCKS",    opts),                  "Starbucks"),
            (new Regex(@"PRET A MANGER|PRET",   opts),          "Pret A Manger"),
            (new Regex(@"MCDONALD",     opts),                  "McDonald's"),
            (new Regex(@"GREGGS",       opts),                  "Greggs"),
            (new Regex(@"SUBWAY",       opts),                  "Subway"),
            (new Regex(@"NANDO",        opts),                  "Nando's"),

            // ── Transport ───────────────────────────────────────────────────
            (new Regex(@"TFL TRAVEL|TFL\.GOV",  opts),          "Transport for London"),
            (new Regex(@"UBER\s*\*",             opts),          "Uber"),
            (new Regex(@"NATIONAL RAIL|TRAINLINE|LNER|AVANTI|GWR|THAMESLINK|SOUTHEASTERN", opts), "National Rail"),
            (new Regex(@"\bDVLA\b",              opts),          "DVLA"),

            // ── Fuel ────────────────────────────────────────────────────────
            (new Regex(@"\bBP\b|\bBP\*",         opts),          "BP"),
            (new Regex(@"\bSHELL\b",             opts),          "Shell"),
            (new Regex(@"\bESSO\b",              opts),          "Esso"),
            (new Regex(@"TEXACO",                opts),          "Texaco"),

            // ── Utilities ───────────────────────────────────────────────────
            (new Regex(@"OCTOPUS ENERGY",        opts),          "Octopus Energy"),
            (new Regex(@"BRITISH GAS",           opts),          "British Gas"),
            (new Regex(@"\bEDF\b",               opts),          "EDF Energy"),
            (new Regex(@"EON\s*(NEXT)?",         opts),          "E.ON"),
            (new Regex(@"SCOTTISH POWER",        opts),          "ScottishPower"),
            (new Regex(@"VIRGIN MEDIA",          opts),          "Virgin Media"),
            (new Regex(@"\bSKY\b",               opts),          "Sky"),
            (new Regex(@"\bBT\s*(GROUP|PLC)?\b", opts),          "BT"),
            (new Regex(@"THAMES WATER|ANGLIAN WATER|SEVERN TRENT|UNITED UTILITIES|YORKSHIRE WATER|SOUTHERN WATER", opts), "Water Bill"),
            (new Regex(@"COUNCIL TAX",           opts),          "Council Tax"),

            // ── Subscriptions ────────────────────────────────────────────────
            (new Regex(@"NETFLIX",               opts),          "Netflix"),
            (new Regex(@"SPOTIFY",               opts),          "Spotify"),
            (new Regex(@"APPLE\.COM|APPLE STORE|ITUNES", opts),  "Apple"),
            (new Regex(@"GOOGLE\s+\*",           opts),          "Google"),
            (new Regex(@"DISNEY\+?|DISNEY PLUS", opts),          "Disney+"),
            (new Regex(@"AMAZON PRIME",          opts),          "Amazon Prime"),
            (new Regex(@"MICROSOFT|OFFICE 365",  opts),          "Microsoft"),
            (new Regex(@"ADOBE",                 opts),          "Adobe"),
            (new Regex(@"NOW TV|NOWTV",          opts),          "Now TV"),
            (new Regex(@"PARAMOUNT\+?",          opts),          "Paramount+"),

            // ── Finance & Tax ────────────────────────────────────────────────
            (new Regex(@"\bHMRC\b",              opts),          "HMRC"),
        ];
    }
}
