import {
  getAddMemoInstruction,
  MEMO_PROGRAM_ADDRESS,
} from "@solana-program/memo";
import {
  address,
  appendTransactionMessageInstruction,
  blockhash,
  compileTransaction,
  createTransactionMessage,
  getTransactionEncoder,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";

/** Public site for this app. A wallet checks the domain, not the openbotmobile scheme. */
export const DEFAULT_WALLET_IDENTITY_URI = "https://copilotkit.ai/openbot";

const CLUSTER_URLS = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://127.0.0.1:8899",
} as const;

export type SolanaClusterName = "devnet" | "testnet" | "localnet" | "mainnet";

export type SolanaClusterChoice = {
  id: `solana:${SolanaClusterName}`;
  url: string;
  helper:
    | "createSolanaDevnet"
    | "createSolanaTestnet"
    | "createSolanaLocalnet"
    | "createSolanaMainnet";
};

export type WalletIdentity = {
  name: string;
  uri: string;
  icon: string;
};

export type WalletSession =
  | { status: "disconnected" }
  | { status: "connected"; address: string }
  | { status: "restored"; address: string };

export const SIGN_MESSAGE_TEXT = "Verify this message";
export const SEND_MEMO_TEXT = "OpenBot on Solana Mobile";

export { MEMO_PROGRAM_ADDRESS };

function httpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.host || url.username || url.password)
      return null;
    return url;
  } catch {
    return null;
  }
}

function absoluteIcon(icon: string): boolean {
  if (icon.startsWith("//") || icon.startsWith("data:")) return true;
  return httpsUrl(icon) !== null || icon.startsWith("http:");
}

/**
 * Name plus an absolute https address. The icon is a path on that address,
 * which is the only form the wallet client accepts.
 */
export function walletIdentity(input: {
  name?: string;
  uri?: string;
  icon?: string;
}): WalletIdentity {
  const name = input.name?.trim() ?? "";
  const uri = input.uri?.trim() ?? "";
  const icon = input.icon?.trim() ?? "";
  if (!name) throw new Error("Wallet identity needs a name.");
  if (!httpsUrl(uri))
    throw new Error("Wallet identity needs an https address.");
  if (!icon || absoluteIcon(icon))
    throw new Error("Wallet icon is a path on that site.");
  return { name, uri, icon };
}

export function openBotIdentity(): WalletIdentity {
  return walletIdentity({
    name: process.env.EXPO_PUBLIC_WALLET_IDENTITY_NAME ?? "OpenBot",
    uri:
      process.env.EXPO_PUBLIC_WALLET_IDENTITY_URI ??
      DEFAULT_WALLET_IDENTITY_URI,
    icon: process.env.EXPO_PUBLIC_WALLET_IDENTITY_ICON ?? "favicon.ico",
  });
}

/** Explicit cluster. Mainnet is refused until an https RPC URL is set. */
export function selectCluster(
  input: { cluster?: string; url?: string } = {},
): SolanaClusterChoice {
  const cluster = input.cluster?.trim() || "devnet";
  const url = input.url?.trim();
  if (cluster === "mainnet") {
    if (!url || !httpsUrl(url))
      throw new Error("Mainnet needs an https RPC URL.");
    return { id: "solana:mainnet", url, helper: "createSolanaMainnet" };
  }
  if (cluster !== "devnet" && cluster !== "testnet" && cluster !== "localnet")
    throw new Error("Unknown Solana cluster.");
  const chosen = url || CLUSTER_URLS[cluster];
  if (cluster === "localnet") {
    let parsed: URL;
    try {
      parsed = new URL(chosen);
    } catch {
      throw new Error("Localnet needs an http RPC URL.");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      throw new Error("Localnet needs an http RPC URL.");
    return { id: "solana:localnet", url: chosen, helper: "createSolanaLocalnet" };
  }
  if (!httpsUrl(chosen)) throw new Error("That cluster needs an https RPC URL.");
  return cluster === "devnet"
    ? { id: "solana:devnet", url: chosen, helper: "createSolanaDevnet" }
    : { id: "solana:testnet", url: chosen, helper: "createSolanaTestnet" };
}

export function openBotCluster(): SolanaClusterChoice {
  return selectCluster({
    cluster: process.env.EXPO_PUBLIC_SOLANA_CLUSTER,
    url: process.env.EXPO_PUBLIC_SOLANA_RPC_URL,
  });
}

/** UTF-8 bytes. A base64 decode of the same text is a different payload. */
export function messageBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Memo instruction the Mobile Wallet Adapter send button hands to sendTransactions. */
export function sendMemoInstruction(memo: string = SEND_MEMO_TEXT) {
  return getAddMemoInstruction({ memo });
}

/**
 * UTF-8 of the existing sign-message text. Seeker signs these bytes for the
 * connected address; the address is not folded into the text.
 */
export function seekerMessageBytes(
  address: string,
  text: string = SIGN_MESSAGE_TEXT,
): Uint8Array {
  if (!address.trim()) throw new Error("Sign the message for a connected address.");
  return messageBytes(text);
}

/**
 * Unsigned memo transaction bytes. The fee payer is an address only.
 * This does not create or store a keypair.
 */
export function unsignedMemoTransactionBytes(input: {
  blockhash: string;
  feePayer: string;
  lastValidBlockHeight: bigint;
  memo?: string;
}): Uint8Array {
  const memo = input.memo ?? SEND_MEMO_TEXT;
  const message = appendTransactionMessageInstruction(
    getAddMemoInstruction({ memo }),
    setTransactionMessageLifetimeUsingBlockhash(
      {
        blockhash: blockhash(input.blockhash),
        lastValidBlockHeight: input.lastValidBlockHeight,
      },
      setTransactionMessageFeePayer(
        address(input.feePayer),
        createTransactionMessage({ version: 0 }),
      ),
    ),
  );
  return Uint8Array.from(
    getTransactionEncoder().encode(compileTransaction(message)),
  );
}

export function signInPayload(input: {
  uri: string;
  chainId: string;
  address?: string;
}): {
  address?: string;
  chainId: string;
  domain: string;
  statement: string;
  uri: string;
} {
  return {
    ...(input.address ? { address: input.address } : {}),
    chainId: input.chainId,
    domain: new URL(input.uri).host,
    statement: "Sign in to OpenBot",
    uri: input.uri,
  };
}

export function sessionAfterConnect(address: string): WalletSession {
  const trimmed = address.trim();
  if (!trimmed) return { status: "disconnected" };
  return { status: "connected", address: trimmed };
}

export function sessionAfterDisconnect(): WalletSession {
  return { status: "disconnected" };
}

/** Cached Seeker authorization, without opening the wallet. */
export function sessionAfterRestore(
  authorization: { accounts: readonly { address: string }[] } | null,
): WalletSession {
  const address = authorization?.accounts[0]?.address?.trim();
  if (!address) return { status: "disconnected" };
  return { status: "restored", address };
}

/** A cancel or a decline leaves the phone disconnected. */
export function sessionAfterSeekerError(code: string): WalletSession {
  void code;
  return { status: "disconnected" };
}
