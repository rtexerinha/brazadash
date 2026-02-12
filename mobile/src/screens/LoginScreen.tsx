import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import { api, clearSessionCookie, setSessionCookie } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

const API_BASE = "https://brazadash.com";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, profile, setAuthenticated } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);

  const handleAuthResult = async (result: WebBrowser.WebBrowserAuthSessionResult) => {
    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const error = url.searchParams.get("error");
      if (error) {
        Alert.alert("Login Failed", `Authentication error: ${error}. Please try again.`);
        setAuthenticating(false);
        return;
      }

      const authCode = url.searchParams.get("code");
      if (authCode) {
        try {
          const sessionCookie = await api.exchangeAuthCode(authCode);
          if (sessionCookie) {
            await setSessionCookie(sessionCookie);
          }
        } catch {
          Alert.alert("Login Failed", "Could not complete authentication. Please try again.");
          setAuthenticating(false);
          return;
        }
      }

      try {
        const newProfile = await api.getMobileProfile();
        if (!newProfile.roles || newProfile.roles.length === 0) {
          navigation.replace("Onboarding");
        } else {
          setAuthenticated(newProfile);
          navigation.goBack();
        }
      } catch {
        Alert.alert("Login Failed", "Could not authenticate. Please try again.");
        setAuthenticating(false);
      }
    } else {
      setAuthenticating(false);
    }
  };

  const performLogin = async () => {
    setAuthenticating(true);
    try {
      await clearSessionCookie();
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/api/mobile/login`,
        "brazadash://oauth-callback"
      );
      await handleAuthResult(result);
    } catch {
      Alert.alert("Error", "An error occurred during login.");
      setAuthenticating(false);
    }
  };

  const handleContinueAsUser = () => {
    navigation.goBack();
  };

  const handleSwitchAccount = async () => {
    await clearSessionCookie();
    setAuthenticating(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/api/mobile/switch-account`,
        "brazadash://oauth-callback"
      );
      await handleAuthResult(result);
    } catch {
      Alert.alert("Error", "An error occurred. Please try again.");
      setAuthenticating(false);
    }
  };

  if (authenticating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setAuthenticating(false); navigation.goBack(); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Signing you in...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated && profile) {
    const initials = `${(profile.firstName?.[0] || "").toUpperCase()}${(profile.lastName?.[0] || "").toUpperCase()}`;
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.accountContainer}>
          <View style={styles.logoRow}>
            <View style={styles.logoBg}>
              <Text style={styles.logoText}>B</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>Choose how to continue</Text>

          <View style={styles.currentAccountCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials || "U"}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{displayName}</Text>
              {profile.email && (
                <Text style={styles.accountEmail}>{profile.email}</Text>
              )}
              {profile.roles && profile.roles.length > 0 && (
                <View style={styles.roleBadgesRow}>
                  {profile.roles.map((role) => (
                    <View key={role} style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {role === "vendor" ? "Restaurant Owner" : role === "service_provider" ? "Service Provider" : "Customer"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContinueAsUser} activeOpacity={0.8}>
            <Ionicons name="arrow-forward-circle" size={22} color={colors.white} />
            <Text style={styles.primaryButtonText}>Continue as {profile.firstName || "User"}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSwitchAccount} activeOpacity={0.8}>
            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Switch to a different account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSwitchAccount} activeOpacity={0.8}>
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Create a new account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.accountContainer}>
        <View style={styles.logoRow}>
          <View style={styles.logoBg}>
            <Text style={styles.logoText}>B</Text>
          </View>
        </View>
        <Text style={styles.welcomeTitle}>Welcome to BrazaDash</Text>
        <Text style={styles.welcomeSubtitle}>Sign in to access your orders, bookings, and more</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={performLogin} activeOpacity={0.8}>
          <Ionicons name="log-in-outline" size={22} color={colors.white} />
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={performLogin} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Create a new account</Text>
        </TouchableOpacity>

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={14} color={colors.textTertiary} />
          <Text style={styles.secureText}>Secure authentication</Text>
        </View>
      </View>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  accountContainer: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  welcomeTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxxl,
    lineHeight: 22,
  },
  currentAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  accountName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  accountEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  secureText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
