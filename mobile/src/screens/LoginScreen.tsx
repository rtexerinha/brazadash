import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { setSessionCookie } from "../api/client";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, fontSize, fontWeight } from "../constants/theme";

const AUTH_URL = "https://brazadash.replit.app/api/login";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setAuthenticated } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  const extractCookiesJS = `
    (function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'cookies',
        value: document.cookie
      }));
    })();
    true;
  `;

  const handleNavigationChange = async (navState: any) => {
    const { url } = navState;
    if (authenticating) return;

    const isPostLogin =
      url.includes("brazadash.replit.app") &&
      !url.includes("/api/login") &&
      !url.includes("replit.com") &&
      !url.includes("accounts.google.com") &&
      !url.includes("github.com/login");

    if (isPostLogin) {
      setAuthenticating(true);
      webViewRef.current?.injectJavaScript(extractCookiesJS);

      setTimeout(async () => {
        try {
          const profile = await api.getMobileProfile();
          setAuthenticated(profile);
          navigation.goBack();
        } catch {
          setAuthenticating(false);
        }
      }, 500);
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "cookies" && data.value) {
        await setSessionCookie(data.value);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="button-cancel-login">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 60 }} />
      </View>

      {(loading || authenticating) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {authenticating ? "Signing you in..." : "Loading sign-in page..."}
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: AUTH_URL }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationChange}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    width: 60,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  webView: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
