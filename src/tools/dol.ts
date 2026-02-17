const BASE_URL = "https://apiprod.dol.gov/v4";

// Simple rate limiting: track last request time and add delay if needed
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 300; // 300ms between requests

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function makeDOLRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | { error: string }> {
  try {
    // Rate limiting: ensure minimum time between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      await delay(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add DOL API key if present
    if (process.env.DOL_API_KEY) {
      url.searchParams.append("X-API-KEY", process.env.DOL_API_KEY);
    }

    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`DOL API error: ${response.status} ${response.statusText}`);

      // Return specific error messages based on status code
      if (response.status === 429) {
        return { error: "DOL API rate limit exceeded (429). Too many requests." };
      } else if (response.status >= 500) {
        return { error: `DOL API server error (${response.status}). The service may be down.` };
      } else if (response.status === 404) {
        return { error: `DOL API endpoint not found (404).` };
      } else {
        return { error: `DOL API error (${response.status}): ${response.statusText}` };
      }
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("DOL request failed:", error);
    return { error: `Network error connecting to DOL API: ${error}` };
  }
}
