import { getBase58Decoder } from "@solana/kit";
import { useCallback, useEffect, useState } from "react";

const configured = process.env.EXPO_PUBLIC_SERVER_URL ?? "https://chatgptee.ai";
const endpoint = new URL(configured);
if (
  endpoint.protocol !== "https:" &&
  !(__DEV__ && endpoint.protocol === "http:")
)
  throw new Error("ChatGPTEE sign-in requires HTTPS.");
if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
  throw new Error(
    "Use the public deployment URL without credentials or query parameters.",
  );
/** OpenDots origin. Cookies live in the native cookie jar, shared with the chat WebView. */
export const serverUrl = endpoint.origin;

export type Session = {
  user: { id: string; name?: string; solanaWallet?: string | null };
} | null;

/**
 * Native requests carry no browser Origin; send the deployment origin so
 * Better Auth's CSRF check matches its trusted origin. Cookies are the
 * platform's shared jar, never stored by this code.
 */
export async function authFetch(path: string, init: RequestInit = {}) {
  return fetch(`${serverUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Origin: serverUrl,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function json<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok)
    throw new Error(
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${response.status}).`,
    );
  return body as T;
}

export async function getSession(): Promise<Session> {
  return json<Session>(await authFetch("/api/auth/get-session"));
}

/**
 * Sign in with Solana against OpenDots' `/api/auth/solana/*` plugin.
 * The server writes the SIWS message; the wallet only signs bytes.
 * No private key ever reaches this app.
 */
export async function signInWithWallet(
  address: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
): Promise<void> {
  const challenge = await json<{ input: { nonce: string }; message: string }>(
    await authFetch("/api/auth/solana/nonce", {
      method: "POST",
      body: JSON.stringify({ address, purpose: "sign-in" }),
    }),
  );
  const signed = await signMessage(new TextEncoder().encode(challenge.message));
  // Wallets return either the 64-byte signature or message+signature.
  const signature = signed.slice(-64);
  await json(
    await authFetch("/api/auth/solana/verify", {
      method: "POST",
      body: JSON.stringify({
        nonce: challenge.input.nonce,
        signature: getBase58Decoder().decode(signature),
        message: challenge.message,
      }),
    }),
  );
}

export async function signOut() {
  await authFetch("/api/auth/sign-out", { method: "POST", body: "{}" });
}

export function useSession() {
  const [session, setSession] = useState<Session>(null);
  const [pending, setPending] = useState(true);
  const refresh = useCallback(async () => {
    setPending(true);
    try {
      setSession(await getSession());
    } catch {
      setSession(null);
    } finally {
      setPending(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { session, pending, refresh };
}
