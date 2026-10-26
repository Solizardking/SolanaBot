import { router } from "expo-router";
import { Button, Text } from "react-native";
import { serverUrl, signOut, useSession } from "../src/auth";
import { BrandMark, colors, muted, Screen, Section, useAction } from "../src/ui";
import { SolanaWallet } from "../src/wallet";

export default function Home() {
  const { session, pending, refresh } = useSession();
  const { busy, error, run } = useAction();
  return (
    <Screen refreshing={pending} onRefresh={() => void refresh()}>
      <BrandMark />
      <Text style={muted}>Connected to {new URL(serverUrl).host}</Text>
      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
      {session ? (
        <Section title="Your Dots">
          <Text style={{ color: colors.foreground }}>
            Signed in
            {session.user.solanaWallet
              ? ` as ${session.user.solanaWallet.slice(0, 4)}…${session.user.solanaWallet.slice(-4)}`
              : ""}
          </Text>
          <Button color={colors.link} title="Dot chat" onPress={() => router.push("/chat")} />
          <Button color={colors.link} title="Memories" onPress={() => router.push("/memory")} />
          <Button color={colors.link} title="Wallet and assets" onPress={() => router.push("/wallet")} />
          <Button
            color={colors.link}
            disabled={Boolean(busy)}
            title="Sign out"
            onPress={() => void run("signout", async () => { await signOut(); await refresh(); })}
          />
        </Section>
      ) : (
        <Text style={muted}>
          {pending
            ? "Checking your session…"
            : "Connect your wallet, then tap Sign in with Solana. Your wallet signs a one-time ChatGPTEE message; it can't move funds."}
        </Text>
      )}
      {session ? null : <SolanaWallet onSignedIn={() => void refresh()} />}
    </Screen>
  );
}
