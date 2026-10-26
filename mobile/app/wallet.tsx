import { useMobileWallet } from "@wallet-ui/react-native-kit";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { loadAssets } from "../src/assets";
import { card, colors, muted, Problem, Screen, Section } from "../src/ui";
import { useLoad } from "../src/use-load";
import { SolanaWallet } from "../src/wallet";

export default function Wallet() {
  const { account } = useMobileWallet();
  const address = account?.address;
  const load = useCallback(async () => (address ? loadAssets(address) : null), [address]);
  const assets = useLoad(load, Boolean(address));
  return (
    <Screen refreshing={assets.pending} onRefresh={() => void assets.refresh()}>
      <SolanaWallet />
      <Section title="Assets">
        <Problem message={assets.error} />
        {!address ? <Text style={muted}>Connect a wallet to see balances.</Text> : null}
        {assets.data ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 18 }}>
              {assets.data.sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL
            </Text>
            {assets.data.holdings.map((token) => (
              <View key={token.mint} style={card}>
                <Text style={{ color: colors.foreground }}>{token.amount}</Text>
                <Text style={muted} selectable>{token.mint}</Text>
              </View>
            ))}
            {!assets.data.holdings.length ? <Text style={muted}>No SPL tokens.</Text> : null}
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}
