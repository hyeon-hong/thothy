export function getApiKey(): string | null {
  return process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY ?? null;

  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lg:chat:apiKey") ?? null;
  } catch {
    // no-op
  }

  return null;
}
