import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../constants/categories";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

export default function OrdersScreen() {
  const navigation = useNavigation<any>();

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.getOrders(),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No orders yet"
            message="Your order history will appear here once you place your first order."
          />
        }
        renderItem={({ item }) => {
          const itemNames = (item.items as any[])?.map((i: any) => i.name).join(", ") || "";
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <StatusBadge
                  label={ORDER_STATUS_LABELS[item.status] || item.status}
                  color={ORDER_STATUS_COLORS[item.status] || colors.textSecondary}
                />
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.orderItems} numberOfLines={1}>{itemNames}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>${parseFloat(item.total).toFixed(2)}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          );
        }}
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
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  orderItems: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
