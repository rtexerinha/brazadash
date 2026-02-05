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

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cleaning: "sparkles",
  beauty: "cut",
  auto: "car",
  legal: "briefcase",
  immigration: "document-text",
  fitness: "fitness",
  education: "school",
  construction: "hammer",
  photography: "camera",
  translation: "language",
  other: "ellipsis-horizontal",
};

const CATEGORY_COLORS: Record<string, string> = {
  cleaning: "#06B6D4",
  beauty: "#EC4899",
  auto: "#F59E0B",
  legal: "#6366F1",
  immigration: "#8B5CF6",
  fitness: "#EF4444",
  education: "#3B82F6",
  construction: "#F97316",
  photography: "#14B8A6",
  translation: "#84CC16",
  other: "#6B7280",
};

function ProviderListCard({ item, onPress }: { item: ServiceProvider; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);
  const initials = (item.businessName || "SP").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const catColor = CATEGORY_COLORS[item.category] || colors.primary;

  return (
    <TouchableOpacity style={styles.providerCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.providerCardInner}>
        {item.imageUrl && !imageError ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.providerAvatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.providerAvatar, styles.providerAvatarFallback, { backgroundColor: catColor + "18" }]}>
            <Text style={[styles.providerInitials, { color: catColor }]}>{initials}</Text>
          </View>
        )}

        <View style={styles.providerInfo}>
          <View style={styles.providerHeader}>
            <Text style={styles.providerName} numberOfLines={1}>{item.businessName}</Text>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={11} color={colors.white} />
              </View>
            )}
          </View>

          <View style={styles.categoryRow}>
            <Ionicons name={CATEGORY_ICONS[item.category] || "ellipsis-horizontal"} size={12} color={catColor} />
            <Text style={[styles.providerCategory, { color: catColor }]}>{item.category}</Text>
            {item.priceRange && <Text style={styles.priceRange}>{item.priceRange}</Text>}
          </View>

          <View style={styles.providerMeta}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color={colors.star} />
              <Text style={styles.ratingValue}>{parseFloat(item.rating || "0").toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewCount}>({item.reviewCount || 0})</Text>
            {item.yearsExperience > 0 && (
              <>
                <View style={styles.metaDot} />
                <Ionicons name="ribbon-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.yearsExperience} yrs</Text>
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

        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ alignSelf: "center" }} />
      </View>
    </TouchableOpacity>
  );
}

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
          data-testid="input-search-services"
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
          <View style={[styles.categoryIconWrap, { backgroundColor: !selectedCategory ? "rgba(255,255,255,0.25)" : colors.primary + "18" }]}>
            <Ionicons name="grid" size={14} color={!selectedCategory ? colors.white : colors.primary} />
          </View>
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {SERVICE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const catColor = CATEGORY_COLORS[cat.id] || colors.primary;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, isActive && { backgroundColor: catColor }]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: isActive ? "rgba(255,255,255,0.25)" : catColor + "18" }]}>
                <Ionicons
                  name={CATEGORY_ICONS[cat.id] || "ellipsis-horizontal"}
                  size={14}
                  color={isActive ? colors.white : catColor}
                />
              </View>
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            providers && providers.length > 0 ? (
              <Text style={styles.resultCount}>
                {providers.length} provider{providers.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title="No providers found"
              message={selectedCategory
                ? `No ${selectedCategory} providers yet. Try another category or clear your search.`
                : "Try a different search term or browse by category above."
              }
            />
          }
          renderItem={({ item }) => (
            <ProviderListCard
              item={item}
              onPress={() => navigation.navigate("ProviderDetail", { id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  providerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  providerCardInner: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.md,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  providerAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  providerInitials: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  providerInfo: {
    flex: 1,
    gap: 3,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  providerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  providerCategory: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
  },
  priceRange: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  providerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  ratingValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: "#92400E",
  },
  reviewCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
