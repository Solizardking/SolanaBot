import type { ExpoConfig } from "expo/config";

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
const versionCode = Number(process.env.ANDROID_VERSION_CODE ?? "1");

/** ChatGPTEE for Solana Mobile (Seeker, Saga, the Solana dApp Store). */
const config: ExpoConfig = {
  name: "ChatGPTEE",
  slug: "chatgptee",
  version: "0.1.0",
  scheme: "chatgptee",
  orientation: "portrait",
  icon: "./assets/app/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#07060b",
  ios: { bundleIdentifier: "ai.chatgptee.mobile", supportsTablet: true },
  android: {
    package: "ai.chatgptee.mobile",
    versionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/app/adaptive-icon.png",
      backgroundColor: "#07060b",
    },
    permissions: ["INTERNET"],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
    ],
    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "chatgptee" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: ["expo-router", "expo-secure-store"],
  extra: { ...(projectId ? { eas: { projectId } } : {}) },
};
export default config;
