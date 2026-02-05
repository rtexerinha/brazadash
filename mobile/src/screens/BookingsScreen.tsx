import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "../constants/categories";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

export default function BookingsScreen() {
  const navigation = useNavigation<any>();

  const { data: bookings, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => api.getBookings(),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No bookings yet"
            message="Your service bookings will appear here."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => navigation.navigate("BookingDetail", { id: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.bookingHeader}>
              <StatusBadge
                label={BOOKING_STATUS_LABELS[item.status] || item.status}
                color={BOOKING_STATUS_COLORS[item.status] || colors.textSecondary}
              />
              <Text style={styles.bookingDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {item.requestedDate && (
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.dateTimeText}>
                  {new Date(item.requestedDate).toLocaleDateString()}
                  {item.requestedTime ? ` at ${item.requestedTime}` : ""}
                </Text>
              </View>
            )}
            {item.address && (
              <View style={styles.dateTimeRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.dateTimeText} numberOfLines={1}>{item.address}</Text>
              </View>
            )}
            <View style={styles.bookingFooter}>
              {item.price && (
                <Text style={styles.bookingPrice}>${parseFloat(item.price).toFixed(2)}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateTimeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
