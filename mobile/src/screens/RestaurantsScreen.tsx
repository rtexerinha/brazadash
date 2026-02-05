import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { Restaurant } from "../types";

export default function RestaurantsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");

  const { data: restaurants, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.getRestaurants(),
  });

  const filtered = restaurants?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.cuisine || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="restaurant-outline" title="No restaurants found" message="Try a different search" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RestaurantDetail", { id: item.id })}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" }}
              style={styles.cardImage}
            />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                {item.isOpen ? (
                  <View style={styles.openBadge}>
                    <Text style={styles.openText}>Open</Text>
                  </View>
                ) : (
                  <View style={[styles.openBadge, { backgroundColor: colors.error + "18" }]}>
                    <Text style={[styles.openText, { color: colors.error }]}>Closed</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardCuisine}>{item.cuisine || "Brazilian"}</Text>
              <View style={styles.cardMeta}>
                <StarRating rating={parseFloat(item.rating || "0")} size={14} />
                <Text style={styles.metaText}>({item.reviewCount})</Text>
                <Text style={styles.metaDivider}>|</Text>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.deliveryTime}</Text>
                <Text style={styles.metaDivider}>|</Text>
                <Text style={styles.metaText}>${item.deliveryFee} delivery</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: colors.surface,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardName: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  openBadge: {
    backgroundColor: colors.primary + "18",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  openText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  cardCuisine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDivider: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginHorizontal: 2,
  },
});
