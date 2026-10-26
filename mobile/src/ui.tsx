import { type ReactNode, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

export const colors = {
  background: "#07060b",
  foreground: "#f4f1ff",
  link: "#9945FF",
  accent: "#14F195",
  error: "#b42318",
  muted: "#b7b0c9",
  border: "#2a2638",
  success: "#14F195",
  warning: "#b54708",
};

export const card: ViewStyle = {
  gap: 10,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: 14,
};
export const heading: TextStyle = {
  fontSize: 22,
  fontWeight: "600",
  color: colors.foreground,
};
export const subheading: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: colors.foreground,
};
export const muted: TextStyle = { color: colors.muted };
export const input: TextStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: 10,
  color: colors.foreground,
};

/** Lobster claw and the Solana bar, shown on the home chrome. */
export function BrandMark() {
  return (
    <View style={{ gap: 12 }}>
      <Image
        accessibilityLabel="ChatGPTEE"
        source={require("../assets/brand/clawd-mascot-dark.png")}
        style={{ width: 72, height: 72 }}
      />
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        source={require("../assets/brand/solanaGradientDark.png")}
        style={{ width: "100%", height: 8, borderRadius: 4 }}
      />
    </View>
  );
}

/** A pull-to-refresh page. */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Problem({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={{ color: colors.error }}>
      {message}
    </Text>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="header" style={subheading}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * One write at a time, with its failure said out loud. `busy` names the action in flight so a
 * screen can disable every control while it runs.
 */
export function useAction() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function run(name: string, work: () => Promise<unknown>) {
    setBusy(name);
    setError("");
    try {
      await work();
      return true;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not complete this action.",
      );
      return false;
    } finally {
      setBusy("");
    }
  }
  return { busy, error, run, setError };
}
