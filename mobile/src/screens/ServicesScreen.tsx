import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, ScrollView, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { SERVICE_CATEGORIES } from "../constants/categories";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { ServiceProvider } from "../types";

export default function ServicesScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: providers, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["providers", selectedCategory, search],
    queryFn: () => api.getServiceProviders({
      category: selectedCategory || undefined,
      search: search || undefined,
    }),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search service providers..."
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={providers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="No providers found"
            message="Try a different category or search term"
          />
        }
        renderItem={({ item }) => {
          const initials = (item.businessName || "SP").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ProviderDetail", { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.businessName}</Text>
                    {item.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={10} color={colors.white} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <View style={styles.cardMeta}>
                    <StarRating rating={parseFloat(item.rating || "0")} size={12} />
                    <Text style={styles.metaText}>({item.reviewCount || 0})</Text>
                    {item.priceRange && (
                      <>
                        <Text style={styles.metaDivider}>|</Text>
                        <Text style={styles.metaText}>{item.priceRange}</Text>
                      </>
                    )}
                    {item.yearsExperience > 0 && (
                      <>
                        <Text style={styles.metaDivider}>|</Text>
                        <Text style={styles.metaText}>{item.yearsExperience}yr exp</Text>
                      </>
                    )}
                  </View>
                  {item.city && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                      <Text style={styles.locationText}>{item.city}</Text>
                    </View>
                  )}
                </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.lg,
    marginBottom: spacing.sm,
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
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  cardCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 2,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
