// Heuristic detection for "the demo API key's Cloud Console quota was hit"
// vs. an ordinary error (bad address, network blip, etc.). Google's exact
// error shape varies across the Geocoding/Routes SDKs, so this matches on
// message text rather than a single well-typed error class.

const QUOTA_ERROR_PATTERNS = [
  "over_query_limit",
  "resource_exhausted",
  "quota",
  "429",
];

export function isQuotaExceededError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return QUOTA_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}
