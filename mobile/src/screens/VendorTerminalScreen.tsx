import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { Restaurant, TerminalReader } from "../types";

function SectionCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function ReaderItem({ reader }: { reader: TerminalReader }) {
  return (
    <View style={styles.readerRow}>
      <View style={styles.readerInfo}>
        <Ionicons name="card-outline" size={20} color={colors.primary} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.readerLabel}>{reader.label || reader.id}</Text>
          <Text style={styles.readerDetail}>{reader.deviceType} - {reader.status}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, reader.status === "online" ? styles.statusOnline : styles.statusOffline]}>
        <Text style={[styles.statusText, reader.status === "online" ? styles.statusTextOnline : styles.statusTextOffline]}>
          {reader.status}
        </Text>
      </View>
    </View>
  );
}

export default function VendorTerminalScreen() {
  const queryClient = useQueryClient();
  const [postalCode, setPostalCode] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");

  const { data: restaurants, isLoading, refetch } = useQuery({
    queryKey: ["vendor-restaurants"],
    queryFn: () => api.getVendorRestaurants(),
  });

  const restaurant = restaurants?.[0];

  const { data: readersData, refetch: refetchReaders } = useQuery({
    queryKey: ["terminal-readers", restaurant?.id],
    queryFn: () => api.getTerminalReaders(restaurant!.id),
    enabled: !!restaurant?.terminalEnabled && !!restaurant?.terminalLocationId,
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => api.toggleTerminal(restaurant!.id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-restaurants"] });
    },
    onError: () => Alert.alert("Error", "Failed to update terminal settings"),
  });

  const setupLocationMutation = useMutation({
    mutationFn: () => api.setupTerminalLocation(restaurant!.id, postalCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-restaurants"] });
      setPostalCode("");
      Alert.alert("Success", "Terminal location created successfully");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to create terminal location");
    },
  });

  const chargeMutation = useMutation({
    mutationFn: () => api.createTerminalPaymentIntent(restaurant!.id, chargeAmount, chargeDescription || undefined),
    onSuccess: (data) => {
      Alert.alert("Payment Intent Created", `ID: ${data.paymentIntentId}\nAmount: $${(data.amount / 100).toFixed(2)}\nPlatform Fee: $${(data.platformFee / 100).toFixed(2)}`);
      setChargeAmount("");
      setChargeDescription("");
    },
    onError: () => Alert.alert("Error", "Failed to create payment intent"),
  });

  if (isLoading) return <LoadingScreen />;

  if (!restaurant) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Restaurant Found</Text>
        <Text style={styles.emptySubtitle}>You need to register a restaurant first to use terminal payments.</Text>
      </View>
    );
  }

  const readers = readersData?.readers || [];
  const isTerminalEnabled = !!restaurant.terminalEnabled;
  const hasLocation = !!restaurant.terminalLocationId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); if (isTerminalEnabled && hasLocation) refetchReaders(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="card" size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{restaurant.name}</Text>
          <Text style={styles.headerSubtitle}>In-Person Payments</Text>
        </View>
      </View>

      <SectionCard title="Enable In-Person Payments" subtitle="Turn on Stripe Terminal to accept card payments in person.">
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Terminal {isTerminalEnabled ? "Enabled" : "Disabled"}</Text>
          <Switch
            value={isTerminalEnabled}
            onValueChange={(val) => toggleMutation.mutate(val)}
            disabled={toggleMutation.isPending}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isTerminalEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
      </SectionCard>

      {isTerminalEnabled && (
        <>
          <SectionCard
            title="Terminal Location"
            subtitle={hasLocation ? `Location ID: ${restaurant.terminalLocationId}` : "Set up a location to connect card readers."}
          >
            {!hasLocation && (
              <View style={styles.locationSetup}>
                <Text style={styles.inputLabel}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 90210"
                  value={postalCode}
                  onChangeText={(text) => setPostalCode(text.replace(/\D/g, "").slice(0, 5))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TouchableOpacity
                  style={[styles.button, (postalCode.length !== 5 || setupLocationMutation.isPending) && styles.buttonDisabled]}
                  onPress={() => setupLocationMutation.mutate()}
                  disabled={postalCode.length !== 5 || setupLocationMutation.isPending}
                >
                  {setupLocationMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="location" size={18} color={colors.white} />
                      <Text style={styles.buttonText}>Set Up Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {hasLocation && (
            <>
              <SectionCard title="Connected Card Readers" subtitle="Card readers registered at your terminal location.">
                {readers.length === 0 ? (
                  <View style={styles.emptyReaders}>
                    <Ionicons name="hardware-chip-outline" size={32} color={colors.textTertiary} />
                    <Text style={styles.emptyReadersText}>No card readers found</Text>
                    <Text style={styles.emptyReadersHint}>Register a reader through the Stripe Dashboard or use the Stripe Terminal SDK.</Text>
                  </View>
                ) : (
                  readers.map((reader) => <ReaderItem key={reader.id} reader={reader} />)
                )}
                <TouchableOpacity style={styles.refreshButton} onPress={() => refetchReaders()}>
                  <Ionicons name="refresh" size={16} color={colors.primary} />
                  <Text style={styles.refreshButtonText}>Refresh Readers</Text>
                </TouchableOpacity>
              </SectionCard>

              <SectionCard title="Create In-Person Charge" subtitle="Create a payment intent for an in-person card transaction.">
                <View style={styles.chargeForm}>
                  <Text style={styles.inputLabel}>Amount ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 25.50"
                    value={chargeAmount}
                    onChangeText={setChargeAmount}
                    keyboardType="decimal-pad"
                  />

                  <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Description (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Lunch order - Table 5"
                    value={chargeDescription}
                    onChangeText={setChargeDescription}
                  />

                  {chargeAmount && parseFloat(chargeAmount) >= 0.5 && (
                    <View style={styles.feeInfo}>
                      <Text style={styles.feeText}>Total: ${parseFloat(chargeAmount).toFixed(2)}</Text>
                      <Text style={styles.feeDetail}>Platform fee (8%): ${(parseFloat(chargeAmount) * 0.08).toFixed(2)}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.button, styles.chargeButton, (!chargeAmount || parseFloat(chargeAmount) < 0.5 || chargeMutation.isPending) && styles.buttonDisabled]}
                    onPress={() => chargeMutation.mutate()}
                    disabled={!chargeAmount || parseFloat(chargeAmount) < 0.5 || chargeMutation.isPending}
                  >
                    {chargeMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="cash" size={18} color={colors.white} />
                        <Text style={styles.buttonText}>Create Payment Intent</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </SectionCard>
            </>
          )}
        </>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  headerSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  switchLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  locationSetup: { marginTop: spacing.sm },
  inputLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.white },
  chargeButton: { marginTop: spacing.sm },
  chargeForm: { marginTop: spacing.sm },
  feeInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  feeText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  feeDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  readerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  readerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  readerLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  readerDetail: { fontSize: fontSize.sm, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusOnline: { backgroundColor: colors.primaryLight },
  statusOffline: { backgroundColor: colors.surface },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  statusTextOnline: { color: colors.primary },
  statusTextOffline: { color: colors.textTertiary },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  refreshButtonText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  emptyReaders: { alignItems: "center", paddingVertical: spacing.xl },
  emptyReadersText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
  emptyReadersHint: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.xs, textAlign: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.lg },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});
