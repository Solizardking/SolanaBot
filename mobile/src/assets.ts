import { chatgpteeCluster } from "./solana-mobile";

const TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
];

export type Holding = { mint: string; amount: string; decimals: number };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(chatgpteeCluster().url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error || body.result === undefined)
    throw new Error(body.error?.message ?? "The Solana RPC did not answer.");
  return body.result;
}

/** Read-only balances for an address. Nothing here signs or sends. */
export async function loadAssets(owner: string) {
  const lamports = await rpc<{ value: number }>("getBalance", [owner]);
  const holdings: Holding[] = [];
  for (const programId of TOKEN_PROGRAMS) {
    const accounts = await rpc<{
      value: {
        account: {
          data: { parsed: { info: { mint: string; tokenAmount: { uiAmountString: string; decimals: number } } } };
        };
      }[];
    }>("getTokenAccountsByOwner", [owner, { programId }, { encoding: "jsonParsed" }]);
    for (const { account } of accounts.value) {
      const info = account.data.parsed.info;
      if (info.tokenAmount.uiAmountString !== "0")
        holdings.push({ mint: info.mint, amount: info.tokenAmount.uiAmountString, decimals: info.tokenAmount.decimals });
    }
  }
  return { sol: lamports.value / 1e9, holdings };
}
