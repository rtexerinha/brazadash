import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { MenuItem } from "../types";

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <View style={styles.menuItem}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.menuItemImage} />
      )}
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RestaurantDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const { addItem } = useCart();
  const { isAuthenticated, login } = useAuth();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api.getRestaurant(id),
  });

  const { data: menu, isLoading: loadingMenu } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => api.getMenu(id),
  });

  const { data: reviews } = useQuery({
    queryKey: ["restaurant-reviews", id],
    queryFn: () => api.getRestaurantReviews(id),
  });

  if (loadingRestaurant || loadingMenu) return <LoadingScreen />;
  if (!restaurant) return null;

  const categories = [...new Set(menu?.map((m) => m.category || "Other"))];

  const handleAdd = (item: MenuItem) => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to add items to your cart.", [
        { text: "Cancel" },
        { text: "Login", onPress: login },
      ]);
      return;
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    });
    Alert.alert("Added to Cart", `${item.name} added to your cart.`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: restaurant.imageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" }}
        style={styles.heroImage}
      />
      <View style={styles.infoSection}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine || "Brazilian"}</Text>
        {restaurant.description && (
          <Text style={styles.description}>{restaurant.description}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <StarRating rating={parseFloat(restaurant.rating || "0")} />
            <Text style={styles.metaLabel}>{restaurant.reviewCount} reviews</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.metaLabel}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={18} color={colors.primary} />
            <Text style={styles.metaLabel}>${restaurant.deliveryFee}</Text>
          </View>
        </View>

        {restaurant.address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.addressText}>{restaurant.address}</Text>
          </View>
        )}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu</Text>
        {categories.map((cat) => (
          <View key={cat}>
            <Text style={styles.categoryTitle}>{cat}</Text>
            {menu
              ?.filter((m) => (m.category || "Other") === cat)
              .filter((m) => m.isAvailable)
              .map((item) => (
                <MenuItemCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
              ))}
          </View>
        ))}
      </View>

      {reviews && reviews.length > 0 && (
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <StarRating rating={review.rating} size={14} />
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xxxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroImage: {
    width: "100%",
    height: 220,
    backgroundColor: colors.surface,
  },
  infoSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cuisine: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  metaItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  menuSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  menuItemImage: {
    width: 90,
    height: 90,
    backgroundColor: colors.surface,
  },
  menuItemInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  menuItemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  menuItemDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  menuItemPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewsSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  reviewComment: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
