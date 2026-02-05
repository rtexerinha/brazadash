import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, Modal, Pressable,
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
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: providers, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["providers", selectedCategory, search],
    queryFn: () => api.getServiceProviders({
      category: selectedCategory || undefined,
      search: search || undefined,
    }),
  });

  const selectedLabel = selectedCategory
    ? SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.label || "All Categories"
    : "All Categories";

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

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowDropdown(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.dropdownText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              style={[styles.modalItem, !selectedCategory && styles.modalItemActive]}
              onPress={() => { setSelectedCategory(null); setShowDropdown(false); }}
            >
              <Text style={[styles.modalItemText, !selectedCategory && styles.modalItemTextActive]}>All Categories</Text>
              {!selectedCategory && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.modalItem, selectedCategory === cat.id && styles.modalItemActive]}
                onPress={() => { setSelectedCategory(cat.id); setShowDropdown(false); }}
              >
                <Text style={[styles.modalItemText, selectedCategory === cat.id && styles.modalItemTextActive]}>
                  {cat.label}
                </Text>
                {selectedCategory === cat.id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

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
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
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
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalItemActive: {
    backgroundColor: colors.primaryLight,
  },
  modalItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalItemTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
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
