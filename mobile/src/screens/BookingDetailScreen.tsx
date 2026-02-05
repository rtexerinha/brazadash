import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "@react-navigation/native";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { StatusBadge } from "../components/StatusBadge";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "../constants/categories";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

export default function BookingDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.getBooking(id),
  });

  if (isLoading) return <LoadingScreen />;
  if (!booking) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusSection}>
        <StatusBadge
          label={BOOKING_STATUS_LABELS[booking.status] || booking.status}
          color={BOOKING_STATUS_COLORS[booking.status] || colors.textSecondary}
        />
        <Text style={styles.dateText}>
          Requested {new Date(booking.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>

        {booking.requestedDate && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.detailLabel}>Requested Date</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.requestedDate).toLocaleDateString()}
                {booking.requestedTime ? ` at ${booking.requestedTime}` : ""}
              </Text>
            </View>
          </View>
        )}

        {booking.confirmedDate && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <View>
              <Text style={styles.detailLabel}>Confirmed Date</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.confirmedDate).toLocaleDateString()}
                {booking.confirmedTime ? ` at ${booking.confirmedTime}` : ""}
              </Text>
            </View>
          </View>
        )}

        {booking.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{booking.address}</Text>
            </View>
          </View>
        )}

        {booking.price && (
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${parseFloat(booking.price).toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>

      {booking.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{booking.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  statusSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: 2,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
