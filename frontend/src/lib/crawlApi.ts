const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

export async function crawlUrlForAddresses(url: string): Promise<string[]> {
  if (!WORKER_URL) {
    throw new Error(
      "VITE_WORKER_URL is not configured. Set it in frontend/.env.local to your deployed worker URL."
    );
  }

  const response = await fetch(`${WORKER_URL}/api/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with ${response.status}`);
  }

  return data.addresses as string[];
}
