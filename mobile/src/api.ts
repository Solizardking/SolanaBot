import { authFetch } from "./auth";

/** OpenDots JSON API, authenticated by the shared session cookie. */
export async function api<T>(
  path: string,
  input?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  if (!path.startsWith("/api/")) throw new Error("Use a ChatGPTEE API path.");
  const response = await authFetch(path, {
    method: input?.method,
    ...(input?.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    signal: input?.signal,
  });
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : `Request failed (${response.status}).`,
    );
  return body as T;
}

/** `GET /api/state` memory entry. */
export type Memory = { id: string; text: string; createdAt: number };
export type Dot = { id: string; name: string };
export type DotMemoryStatus = {
  dotId: string;
  configured: boolean;
  provider: string | null;
  enabled: boolean;
  memories: unknown[];
};
export type Workspace = {
  dots: Dot[];
  conversations: { id: string; dotId?: string; title?: string }[];
  dotMemory: DotMemoryStatus[];
};

/** Best-effort text for a provider memory record (Mem0 or Supermemory). */
export function memoryText(entry: unknown): string {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object")
    for (const key of ["text", "memory", "content", "summary"])
      if (typeof (entry as Record<string, unknown>)[key] === "string")
        return (entry as Record<string, string>)[key];
  return "";
}
