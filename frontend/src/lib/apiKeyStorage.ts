// Visitors to the deployed demo bring their own Google Maps API key rather
// than sharing a key baked into the build — otherwise every visitor's
// usage would count against the site owner's Cloud billing. The key never
// leaves the browser: it's kept in localStorage only, never sent to the
// worker or any other server.

const STORAGE_KEY = "quickmap.googleMapsApiKey";

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage unavailable (private browsing, etc.) — the key will
    // just need to be re-entered next visit.
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
