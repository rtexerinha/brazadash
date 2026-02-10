import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api, clearSessionCookie, setSessionCookie } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

const API_BASE = "https://brazadash.com";

function MenuRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.menuRowLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.menuRowLabel}>{label}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {value !== undefined && <Text style={styles.menuRowValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, profile, login, logout, setAuthenticated } = useAuth();

  const { data: mobileProfile, isLoading } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => api.getMobileProfile(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <Ionicons name="person-circle-outline" size={80} color={colors.textTertiary} />
        <Text style={styles.loginTitle}>Welcome to BrazaDash</Text>
        <Text style={styles.loginSubtitle}>Sign in to access your orders, bookings, and more.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) return <LoadingScreen />;

  const p = mobileProfile || profile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {p?.profileImageUrl ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(p?.firstName?.[0] || "").toUpperCase()}{(p?.lastName?.[0] || "").toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(p?.firstName?.[0] || "").toUpperCase()}{(p?.lastName?.[0] || "").toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>
          {p?.firstName} {p?.lastName}
        </Text>
        {p?.email && <Text style={styles.profileEmail}>{p.email}</Text>}
        {p?.roles && p.roles.length > 0 && (
          <View style={styles.rolesRow}>
            {p.roles.map((role) => (
              <View key={role} style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{p?.stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{p?.stats?.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{p?.stats?.activeDevices || 0}</Text>
          <Text style={styles.statLabel}>Devices</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Activity</Text>
        <MenuRow
          icon="receipt-outline"
          label="My Orders"
          value={p?.stats?.totalOrders}
          onPress={() => navigation.navigate("Orders")}
        />
        <MenuRow
          icon="calendar-outline"
          label="My Bookings"
          value={p?.stats?.totalBookings}
          onPress={() => navigation.navigate("Bookings")}
        />
        <MenuRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />
      </View>

      {(p as any)?.roles?.includes("vendor") && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Vendor</Text>
          <MenuRow icon="card-outline" label="In-Person Payments" onPress={() => navigation.navigate("VendorTerminal")} />
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Account</Text>
        <MenuRow
          icon="swap-horizontal"
          label="Switch Account"
          onPress={() => {
            Alert.alert("Switch Account", "Sign out and switch to a different account?", [
              { text: "Cancel" },
              {
                text: "Switch",
                onPress: async () => {
                  await clearSessionCookie();
                  await logout();
                  try {
                    const result = await WebBrowser.openAuthSessionAsync(
                      `${API_BASE}/api/mobile/switch-account`,
                      "brazadash://oauth-callback"
                    );
                    if (result.type === "success" && result.url) {
                      const url = new URL(result.url);
                      const error = url.searchParams.get("error");
                      if (error) {
                        navigation.navigate("Login");
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
                          navigation.navigate("Login");
                          return;
                        }
                      }
                      try {
                        const newProfile = await api.getMobileProfile();
                        if (!newProfile.roles || newProfile.roles.length === 0) {
                          navigation.navigate("Onboarding");
                        } else {
                          setAuthenticated(newProfile);
                        }
                      } catch {
                        navigation.navigate("Login");
                      }
                    } else {
                      navigation.navigate("Login");
                    }
                  } catch {
                    navigation.navigate("Login");
                  }
                },
              },
            ]);
          }}
        />
        <MenuRow
          icon="log-out-outline"
          label="Sign Out"
          onPress={() => {
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel" },
              { text: "Sign Out", style: "destructive", onPress: logout },
            ]);
          }}
        />
      </View>

      <Text style={styles.versionText}>BrazaDash v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxxl,
    backgroundColor: colors.background,
  },
  loginTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  loginSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl * 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  profileHeader: {
    alignItems: "center",
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarContainer: {},
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rolesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuRowLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  menuRowValue: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  versionText: {
    textAlign: "center",
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xxxl,
  },
});
