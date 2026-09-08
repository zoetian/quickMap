import { extractAddressesFromHtml } from "./addressParser";

export interface Env {
  ALLOWED_ORIGINS: string;
}

const MAX_RESPONSE_BYTES = 3 * 1024 * 1024; // 3MB cap on pages we'll crawl
const FETCH_TIMEOUT_MS = 10_000;

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const allowOrigin =
    origin && (allowed.includes(origin) || allowed.includes("*"))
      ? origin
      : allowed[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  init: { status?: number; origin: string | null; env: Env }
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(init.origin, init.env),
    },
  });
}

/** Blocks obviously-private/internal targets to reduce SSRF risk from a
 *  worker that fetches arbitrary user-supplied URLs. Not exhaustive
 *  (doesn't resolve DNS), but stops the easy cases. */
function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower === "169.254.169.254" // cloud metadata endpoint
  ) {
    return true;
  }

  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }

  return false;
}

async function handleCrawl(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");
  let targetUrl: string | null = null;

  if (request.method === "GET") {
    targetUrl = new URL(request.url).searchParams.get("url");
  } else if (request.method === "POST") {
    const body = await request.json<{ url?: string }>().catch(() => null);
    targetUrl = body?.url ?? null;
  }

  if (!targetUrl) {
    return jsonResponse(
      { error: "Missing required 'url' parameter." },
      { status: 400, origin, env }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return jsonResponse(
      { error: "That doesn't look like a valid URL." },
      { status: 400, origin, env }
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return jsonResponse(
      { error: "Only http:// and https:// URLs are supported." },
      { status: 400, origin, env }
    );
  }

  if (isBlockedHost(parsed.hostname)) {
    return jsonResponse(
      { error: "That host can't be crawled." },
      { status: 400, origin, env }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; QuickMapBot/1.0; +https://github.com/zoetian/quickMap)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    return jsonResponse(
      { error: `Couldn't fetch that URL: ${(err as Error).message}` },
      { status: 502, origin, env }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    return jsonResponse(
      { error: `Upstream site responded with ${upstream.status}.` },
      { status: 502, origin, env }
    );
  }

  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    return jsonResponse(
      { error: "That URL doesn't look like an HTML page." },
      { status: 415, origin, env }
    );
  }

  const reader = upstream.body?.getReader();
  if (!reader) {
    return jsonResponse(
      { error: "Couldn't read the response body." },
      { status: 502, origin, env }
    );
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      controller.abort();
      return jsonResponse(
        { error: "That page is too large to crawl." },
        { status: 413, origin, env }
      );
    }
    chunks.push(value);
  }

  const html = new TextDecoder().decode(
    chunks.reduce((acc, chunk) => {
      const merged = new Uint8Array(acc.length + chunk.length);
      merged.set(acc, 0);
      merged.set(chunk, acc.length);
      return merged;
    }, new Uint8Array())
  );

  const addresses = extractAddressesFromHtml(html);

  return jsonResponse({ url: parsed.toString(), addresses }, { origin, env });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    if (url.pathname === "/api/crawl") {
      return handleCrawl(request, env);
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true }, { origin, env });
    }

    return jsonResponse({ error: "Not found." }, { status: 404, origin, env });
  },
};
