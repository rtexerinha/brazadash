import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { Restaurant, TerminalReader } from "../types";

// Bluetooth Discovery Interface (will be implemented with native module)
interface DiscoveredReader {
  id: string;
  label: string;
  deviceType: string;
  serialNumber: string;
  batteryLevel?: number;
}

function SectionCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function ReaderItem({ reader, onConnect }: { reader: TerminalReader | DiscoveredReader; onConnect?: () => void }) {
  const isDiscovered = 'batteryLevel' in reader;
  const status = 'status' in reader ? reader.status : 'discovered';
  const ipAddress = 'ipAddress' in reader ? (reader as any).ipAddress : null;
  
  return (
    <View style={styles.readerRow}>
      <View style={styles.readerInfo}>
        <Ionicons 
          name={isDiscovered ? "bluetooth" : "card-outline"} 
          size={20} 
          color={isDiscovered ? colors.secondary : colors.primary} 
        />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.readerLabel}>{reader.label || reader.deviceType || reader.id}</Text>
          <Text style={styles.readerDetail}>
            {reader.serialNumber || ''}
            {reader.deviceType ? ` \u00b7 ${reader.deviceType}` : ''}
            {ipAddress ? ` \u00b7 ${ipAddress}` : ''}
            {isDiscovered && reader.batteryLevel ? ` \u00b7 ${reader.batteryLevel}%` : ''}
          </Text>
        </View>
      </View>
      {isDiscovered && onConnect ? (
        <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.statusBadge, status === "online" ? styles.statusOnline : styles.statusOffline]}>
          <Text style={[styles.statusText, status === "online" ? styles.statusTextOnline : styles.statusTextOffline]}>
            {status}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function VendorTerminalScreen() {
  const queryClient = useQueryClient();
  const [postalCode, setPostalCode] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredReaders, setDiscoveredReaders] = useState<DiscoveredReader[]>([]);
  const [activeTab, setActiveTab] = useState<'registered' | 'discover'>('registered');
  const [selectedReaderId, setSelectedReaderId] = useState("");

  const { data: restaurants, isLoading, refetch } = useQuery({
    queryKey: ["vendor-restaurants"],
    queryFn: () => api.getVendorRestaurants(),
  });

  const restaurant = restaurants?.[0];

  const { data: readersData, refetch: refetchReaders } = useQuery({
    queryKey: ["terminal-readers", restaurant?.id],
    queryFn: () => api.getTerminalReaders(restaurant!.id),
    enabled: !!restaurant?.terminalEnabled,
  });

  // Bluetooth Discovery Function (Placeholder - needs native module)
  const discoverBluetoothReaders = async () => {
    setIsDiscovering(true);
    setDiscoveredReaders([]);

    try {
      // This is a placeholder. In a real implementation, you would:
      // 1. Check Bluetooth permissions
      // 2. Use @stripe/stripe-terminal-react-native to discover readers
      // 3. Show discovered readers in the UI
      
      // For now, show an alert with instructions
      Alert.alert(
        "Bluetooth Discovery",
        Platform.select({
          ios: "To discover Bluetooth readers:\n\n1. Make sure Bluetooth is enabled\n2. Turn on your Stripe reader\n3. The reader should appear in the list\n\nNote: This requires the Stripe Terminal SDK which is not yet fully integrated.",
          android: "To discover Bluetooth readers:\n\n1. Grant Bluetooth permissions\n2. Enable Location services\n3. Turn on your Stripe reader\n4. The reader will appear in the list\n\nNote: This requires the Stripe Terminal SDK which is not yet fully integrated.",
          default: "Bluetooth discovery is only available on iOS and Android native apps."
        }),
        [
          { text: "OK", onPress: () => setIsDiscovering(false) }
        ]
      );

      // Simulated discovery (remove this in production)
      setTimeout(() => {
        // This is fake data for demonstration
        // setDiscoveredReaders([
        //   {
        //     id: "tmr_FakeReader123",
        //     label: "WisePad 3 (Demo)",
        //     deviceType: "bbpos_wisepad3",
        //     serialNumber: "WP3-123-456",
        //     batteryLevel: 85,
        //   }
        // ]);
        setIsDiscovering(false);
      }, 2000);

    } catch (error) {
      Alert.alert("Discovery Failed", "Could not discover readers. Make sure Bluetooth is enabled.");
      setIsDiscovering(false);
    }
  };

  const connectToReader = async (reader: DiscoveredReader) => {
    Alert.alert(
      "Connect Reader",
      `Connect to ${reader.label}?\n\nThis feature requires the Stripe Terminal SDK to be fully integrated with native code.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Connect", 
          onPress: () => {
            // In a real implementation:
            // const terminal = useStripeTerminal();
            // await terminal.connectReader(reader.id);
            Alert.alert("Feature Coming Soon", "Reader connection will be available once the Stripe Terminal SDK is fully integrated.");
          }
        }
      ]
    );
  };

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
    mutationFn: () => api.createTerminalPaymentIntent(restaurant!.id, chargeAmount, chargeDescription || undefined, selectedReaderId || undefined),
    onSuccess: (data: any) => {
      if (data.readerAction && !data.readerAction.error) {
        const selectedReader = readers.find((r: any) => r.id === selectedReaderId);
        const readerName = selectedReader?.label || selectedReader?.deviceType || "reader";
        Alert.alert("Payment Sent", `Payment of $${(data.amount / 100).toFixed(2)} sent to "${readerName}".\n\nThe customer can now tap or insert their card.`);
      } else if (data.readerAction?.error) {
        Alert.alert("Partial Success", `Payment intent created (${data.paymentIntentId}), but failed to send to reader:\n${data.readerAction.error}`);
      } else {
        Alert.alert("Payment Intent Created", `ID: ${data.paymentIntentId}\nAmount: $${(data.amount / 100).toFixed(2)}\nPlatform Fee: $${(data.platformFee / 100).toFixed(2)}`);
      }
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
  const onlineReaders = readers.filter((r: any) => r.status === "online");
  const isTerminalEnabled = !!restaurant.terminalEnabled;
  const hasLocation = !!restaurant.terminalLocationId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); if (isTerminalEnabled) refetchReaders(); }} />}
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

          <SectionCard title="Card Readers" subtitle="Connect and manage your Stripe Terminal readers.">
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'registered' && styles.tabActive]}
                onPress={() => setActiveTab('registered')}
              >
                <Ionicons 
                  name="list" 
                  size={18} 
                  color={activeTab === 'registered' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[styles.tabText, activeTab === 'registered' && styles.tabTextActive]}>
                  Registered ({readers.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
                onPress={() => setActiveTab('discover')}
              >
                <Ionicons 
                  name="bluetooth" 
                  size={18} 
                  color={activeTab === 'discover' ? colors.secondary : colors.textSecondary} 
                />
                <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
                  Discover
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'registered' && (
              <>
                {readers.length === 0 ? (
                  <View style={styles.emptyReaders}>
                    <Ionicons name="hardware-chip-outline" size={32} color={colors.textTertiary} />
                    <Text style={styles.emptyReadersText}>No readers registered</Text>
                    <Text style={styles.emptyReadersHint}>
                      Register readers in the Stripe Dashboard or discover them via Bluetooth
                    </Text>
                  </View>
                ) : (
                  <View style={styles.readersList}>
                    {readers.map((reader) => (
                      <ReaderItem key={reader.id} reader={reader} />
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.refreshButton} onPress={() => refetchReaders()}>
                  <Ionicons name="refresh" size={16} color={colors.primary} />
                  <Text style={styles.refreshButtonText}>Refresh List</Text>
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'discover' && (
              <>
                <View style={styles.discoveryInfo}>
                  <Ionicons name="information-circle" size={20} color={colors.secondary} />
                  <Text style={styles.discoveryInfoText}>
                    Make sure your Stripe reader is powered on and in pairing mode
                  </Text>
                </View>

                {discoveredReaders.length > 0 && (
                  <View style={styles.readersList}>
                    {discoveredReaders.map((reader) => (
                      <ReaderItem 
                        key={reader.id} 
                        reader={reader} 
                        onConnect={() => connectToReader(reader)}
                      />
                    ))}
                  </View>
                )}

                {discoveredReaders.length === 0 && !isDiscovering && (
                  <View style={styles.emptyReaders}>
                    <Ionicons name="bluetooth-outline" size={32} color={colors.textTertiary} />
                    <Text style={styles.emptyReadersText}>No readers discovered</Text>
                    <Text style={styles.emptyReadersHint}>
                      Tap the button below to scan for nearby Stripe readers
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.button, styles.discoverButton, isDiscovering && styles.buttonDisabled]} 
                  onPress={discoverBluetoothReaders}
                  disabled={isDiscovering}
                >
                  {isDiscovering ? (
                    <>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.buttonText}>Scanning...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="bluetooth" size={18} color={colors.white} />
                      <Text style={styles.buttonText}>Discover Readers</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </SectionCard>

          <SectionCard title="Create In-Person Charge" subtitle="Create a payment and send it to a card reader.">
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

              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Send to Reader</Text>
              {onlineReaders.length === 0 ? (
                <View style={styles.noReaderWarning}>
                  <Ionicons name="warning" size={16} color={colors.secondary} />
                  <Text style={styles.noReaderWarningText}>No online readers available</Text>
                </View>
              ) : (
                <View style={styles.readerPickerList}>
                  {onlineReaders.map((reader: any) => (
                    <TouchableOpacity
                      key={reader.id}
                      style={[styles.readerPickerItem, selectedReaderId === reader.id && styles.readerPickerItemSelected]}
                      onPress={() => setSelectedReaderId(reader.id)}
                    >
                      <View style={styles.readerPickerRadio}>
                        {selectedReaderId === reader.id && <View style={styles.readerPickerRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.readerPickerLabel, selectedReaderId === reader.id && styles.readerPickerLabelSelected]}>
                          {reader.label || reader.deviceType}
                        </Text>
                        <Text style={styles.readerPickerDetail}>
                          {reader.ipAddress || reader.serialNumber || reader.id}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, styles.statusOnline]}>
                        <Text style={[styles.statusText, styles.statusTextOnline]}>online</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {chargeAmount && parseFloat(chargeAmount) >= 0.5 && (
                <View style={styles.feeInfo}>
                  <Text style={styles.feeText}>Total: ${parseFloat(chargeAmount).toFixed(2)}</Text>
                  <Text style={styles.feeDetail}>Platform fee (8%): ${(parseFloat(chargeAmount) * 0.08).toFixed(2)}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, styles.chargeButton, (!chargeAmount || parseFloat(chargeAmount) < 0.5 || !selectedReaderId || chargeMutation.isPending) && styles.buttonDisabled]}
                onPress={() => chargeMutation.mutate()}
                disabled={!chargeAmount || parseFloat(chargeAmount) < 0.5 || !selectedReaderId || chargeMutation.isPending}
              >
                {chargeMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={colors.white} />
                    <Text style={styles.buttonText}>Send Payment to Reader</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SectionCard>
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
  discoverButton: { marginTop: spacing.md, backgroundColor: colors.secondary },
  chargeForm: { marginTop: spacing.sm },
  feeInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  feeText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  feeDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  tabContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  readersList: {
    marginTop: spacing.sm,
  },
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
  readerDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  connectButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  connectButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
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
  discoveryInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  discoveryInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyReaders: { alignItems: "center", paddingVertical: spacing.xl },
  emptyReadersText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
  emptyReadersHint: { 
    fontSize: fontSize.sm, 
    color: colors.textTertiary, 
    marginTop: spacing.xs, 
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.lg },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  noReaderWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  noReaderWarningText: { fontSize: fontSize.sm, color: colors.textSecondary },
  readerPickerList: { marginBottom: spacing.md },
  readerPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  readerPickerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  readerPickerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  readerPickerRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  readerPickerLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  readerPickerLabelSelected: { color: colors.primary },
  readerPickerDetail: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
