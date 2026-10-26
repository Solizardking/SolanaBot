import { MobileWalletProvider } from "@wallet-ui/react-native-kit";
import { Stack } from "expo-router";
import { Appearance, StatusBar } from "react-native";
import { chatgpteeSolanaCluster } from "../src/solana-cluster";
import { chatgpteeIdentity } from "../src/solana-mobile";
import { colors } from "../src/ui";

Appearance.setColorScheme("dark");

export default function Layout() {
  return (
    <MobileWalletProvider
      cluster={chatgpteeSolanaCluster()}
      identity={chatgpteeIdentity()}
    >
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.foreground },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "ChatGPTEE" }} />
        <Stack.Screen name="chat" options={{ title: "Dot chat" }} />
        <Stack.Screen name="memory" options={{ title: "Memories" }} />
        <Stack.Screen name="wallet" options={{ title: "Wallet" }} />
      </Stack>
    </MobileWalletProvider>
  );
}
