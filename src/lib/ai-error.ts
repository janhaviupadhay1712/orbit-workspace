// Turns a provider error into a safe, actionable message. Details go to the server terminal only (never the API key).
export function aiError(e: unknown, tag: string): { message: string; status: number } {
  const err = e as { status?: number; message?: string };
  console.error(`[ai:${tag}]`, err?.status ?? "no-status", err?.message ?? e);
  const msg = (m: string) => ({ message: m, status: 502 });
  switch (err?.status) {
    case 400: return msg("The provider rejected the request (400). The model name in OPENAI_MODEL may be wrong or unsupported.");
    case 401: case 403: return msg("The provider rejected your API key. Check OPENAI_API_KEY, and that it belongs to the provider in OPENAI_BASE_URL.");
    case 404: return msg("Model or URL not found (404). Check OPENAI_MODEL and OPENAI_BASE_URL.");
    case 429: return msg("Rate limit or free quota reached (429). Wait a minute and retry.");
    case undefined: return msg("Could not reach the AI provider (network error or timeout). Check OPENAI_BASE_URL and your internet connection.");
    default: return msg(`The AI provider returned an error (${err.status}). You can retry.`);
  }
}