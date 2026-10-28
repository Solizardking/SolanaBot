import { useRef } from "react";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import { serverUrl } from "../src/auth";

const host = new URL(serverUrl).host;
/** chatgptee.ai and its subdomains (privy.chatgptee.ai) stay in the app; anything else opens in the browser. */
function inApp(url: string) {
  try {
    const target = new URL(url);
    if (target.protocol === "about:" || target.protocol === "blob:") return true;
    return (
      target.protocol === "https:" &&
      (target.host === host || target.host.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

/**
 * The full chatgptee.ai chat, including generative-UI answers, which already
 * render in the web app's own locked-down sandbox iframe. The session cookie
 * comes from the native jar set at wallet sign-in.
 */
export default function Chat() {
  const ref = useRef<WebView>(null);
  return (
    <WebView
      ref={ref}
      source={{ uri: serverUrl }}
      style={{ flex: 1, backgroundColor: "#07060b" }}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled={false}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess={false}
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      mixedContentMode="never"
      setSupportMultipleWindows={false}
      originWhitelist={["https://*", "about:*", "blob:*"]}
      onShouldStartLoadWithRequest={(request) => {
        if (inApp(request.url)) return true;
        void Linking.openURL(request.url);
        return false;
      }}
      pullToRefreshEnabled
    />
  );
}
