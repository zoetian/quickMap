// Heuristic, regex-based US street address extraction from free text.
// This is intentionally simple (no ML/NLP) — good enough to surface
// candidates for a human to confirm/reject in the UI, not a guarantee
// of a fully-parsed, validated address.

const STREET_SUFFIXES = [
  "street", "st", "avenue", "ave", "boulevard", "blvd", "road", "rd",
  "drive", "dr", "lane", "ln", "court", "ct", "way", "place", "pl",
  "parkway", "pkwy", "circle", "cir", "terrace", "ter", "highway", "hwy",
  "square", "sq", "trail", "trl", "loop", "alley", "aly", "crescent",
  "cres", "close", "row", "walk", "path", "plaza", "plz",
];

const SUFFIX_PATTERN = STREET_SUFFIXES.join("|");

const ADDRESS_REGEX = new RegExp(
  "\\b\\d{1,6}[A-Za-z]?(?:[-/]\\d+)?\\s+" + // house number, e.g. "123" or "123-A"
    "(?:[NSEW]\\.?\\s+)?" + // optional directional prefix, e.g. "N "
    "(?:[A-Za-z0-9'.]+\\s+){0,5}?" + // street name words (non-greedy)
    "(?:" +
    SUFFIX_PATTERN +
    ")\\.?\\b" + // street suffix
    "(?:\\s+(?:Apt|Suite|Ste|Unit|#)\\.?\\s*[\\w-]+)?" + // optional unit
    "(?:,?\\s*[A-Za-z][A-Za-z\\s]{1,25},?\\s+[A-Z]{2})?" + // optional ", City, ST"
    "(?:\\s+\\d{5}(?:-\\d{4})?)?", // optional ZIP
  "gi"
);

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Strips <script>/<style> contents and all remaining tags, decoding a
 *  handful of common HTML entities so address text reads cleanly. */
export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Block-level tags become line breaks so unrelated text doesn't get
  // glued together into a single fake "address".
  const withBreaks = withoutScripts.replace(
    /<\/(p|div|li|tr|br|section|article|h[1-6])>/gi,
    "\n"
  );

  const textOnly = withBreaks.replace(/<[^>]+>/g, " ");

  return textOnly
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}

export function extractAddressCandidates(text: string): string[] {
  const matches = text.match(ADDRESS_REGEX) ?? [];

  const seen = new Set<string>();
  const results: string[] = [];

  for (const raw of matches) {
    const cleaned = normalizeWhitespace(raw);
    if (cleaned.length < 8) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(cleaned);
  }

  return results;
}

export function extractAddressesFromHtml(html: string): string[] {
  const text = htmlToText(html);
  return extractAddressCandidates(normalizeWhitespace(text));
}
