import {
  SeekerConnect,
  SeekerConnectButton,
  SeekerConnectError,
} from "@solana-mobile/seeker-connect-react-native";
import { useMobileWallet } from "@wallet-ui/react-native-kit";
import { useEffect, useState } from "react";
import { Button, Platform, Text, View } from "react-native";
import {
  messageBytes,
  openBotIdentity,
  SEND_MEMO_TEXT,
  SIGN_MESSAGE_TEXT,
  sendMemoInstruction,
  sessionAfterConnect,
  sessionAfterDisconnect,
  sessionAfterRestore,
  sessionAfterSeekerError,
  signInPayload,
  type WalletSession,
} from "./solana-mobile";
import { colors, Problem, Section } from "./ui";

const identity = openBotIdentity();

function seekerCode(error: unknown): string {
  if (error instanceof SeekerConnectError) return error.code;
  return "wallet-error";
}

/** Mobile Wallet Adapter on Android, plus a direct Seeker connect. */
export function SolanaWallet() {
  const {
    account,
    chain,
    connect,
    disconnect,
    sendTransactions,
    signIn,
    signMessages,
  } = useMobileWallet();
  const mobile = account
    ? sessionAfterConnect(account.address)
    : sessionAfterDisconnect();
  const [seeker, setSeeker] = useState<WalletSession>({
    status: "disconnected",
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let live = true;
    void (async () => {
      await SeekerConnect.configure({
        identity,
        chain,
      });
      const cached = await SeekerConnect.restore();
      if (!live) return;
      setSeeker(sessionAfterRestore(cached));
    })().catch((failure: unknown) => {
      if (!live) return;
      setSeeker(sessionAfterSeekerError(seekerCode(failure)));
    });
    return () => {
      live = false;
    };
  }, [chain]);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await work();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not complete this action.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function connectSeeker() {
    setError("");
    setNote("");
    try {
      const authorization = await SeekerConnect.connect();
      const address = authorization.accounts[0]?.address ?? "";
      setSeeker(
        address
          ? sessionAfterConnect(address)
          : sessionAfterSeekerError("authorization-declined"),
      );
    } catch (failure) {
      setSeeker(sessionAfterSeekerError(seekerCode(failure)));
      setError("The wallet didn't connect. Try again.");
    }
  }

  const seekerAddress =
    seeker.status === "disconnected" ? undefined : seeker.address;

  return (
    <Section title="Wallet">
      <Text style={{ color: colors.muted }}>
        Connect a wallet on this phone. OpenBot never asks for a recovery
        phrase.
      </Text>
      <Text style={{ color: colors.foreground }}>Network {chain}</Text>
      <Problem message={error} />
      {note ? <Text style={{ color: colors.foreground }}>{note}</Text> : null}
      {mobile.status === "connected" ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.foreground }}>
            Connected as {mobile.address}
          </Text>
          <Button
            color={colors.link}
            disabled={busy}
            title="Disconnect"
            onPress={() => {
              void run(async () => {
                await disconnect();
              });
            }}
          />
          <Button
            color={colors.link}
            disabled={busy}
            title="Sign in with Solana"
            onPress={() => {
              void run(async () => {
                const result = await signIn(
                  signInPayload({
                    uri: identity.uri,
                    chainId: chain,
                    address: account?.address,
                  }),
                );
                setNote(`Signed in as ${result.account.address}`);
              });
            }}
          />
          <Button
            color={colors.link}
            disabled={busy}
            title="Sign a message"
            onPress={() => {
              void run(async () => {
                await signMessages(messageBytes(SIGN_MESSAGE_TEXT));
                setNote("Message signed.");
              });
            }}
          />
          <Button
            color={colors.link}
            disabled={busy}
            title="Send a memo"
            onPress={() => {
              void run(async () => {
                const signature = await sendTransactions([
                  sendMemoInstruction(SEND_MEMO_TEXT),
                ]);
                setNote(`Memo sent. ${signature}`);
              });
            }}
          />
        </View>
      ) : (
        <Button
          color={colors.link}
          disabled={busy}
          title="Connect wallet"
          onPress={() => {
            void run(async () => {
              await connect();
            });
          }}
        />
      )}
      {Platform.OS === "android" ? (
        <View style={{ gap: 12 }}>
          {seekerAddress ? (
            <>
              <Text style={{ color: colors.foreground }}>
                Seeker connected as {seekerAddress}
              </Text>
              <Button
                color={colors.link}
                disabled={busy}
                title="Disconnect Seeker"
                onPress={() => {
                  void run(async () => {
                    await SeekerConnect.disconnect();
                    setSeeker(sessionAfterDisconnect());
                  });
                }}
              />
            </>
          ) : (
            <SeekerConnectButton
              onPress={() => {
                void connectSeeker();
              }}
              style={{ height: 56 }}
            />
          )}
        </View>
      ) : (
        <Text style={{ color: colors.muted }}>
          Seeker Connect runs on Android.
        </Text>
      )}
    </Section>
  );
}
