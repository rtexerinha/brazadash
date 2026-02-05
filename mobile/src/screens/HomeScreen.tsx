import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { Restaurant, ServiceProvider, CommunityEvent, Announcement } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function RestaurantCard({ item, onPress }: { item: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.restaurantCuisine} numberOfLines={1}>{item.cuisine || "Brazilian"}</Text>
        <View style={styles.restaurantMeta}>
          <StarRating rating={parseFloat(item.rating || "0")} size={12} />
          <Text style={styles.metaText}>({item.reviewCount})</Text>
          <Text style={styles.metaDot}>  </Text>
          <Text style={styles.metaText}>{item.deliveryTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ProviderCard({ item, onPress }: { item: ServiceProvider; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.providerCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200" }}
        style={styles.providerAvatar}
      />
      <Text style={styles.providerName} numberOfLines={1}>{item.businessName}</Text>
      <Text style={styles.providerCategory}>{item.category}</Text>
      <View style={styles.providerRating}>
        <Ionicons name="star" size={12} color={colors.star} />
        <Text style={styles.providerRatingText}>{parseFloat(item.rating || "0").toFixed(1)}</Text>
        {item.isVerified && (
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function EventCard({ item, onPress }: { item: CommunityEvent; onPress: () => void }) {
  const date = new Date(item.eventDate);
  const month = date.toLocaleString("en", { month: "short" }).toUpperCase();
  const day = date.getDate();

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.eventDateBox}>
        <Text style={styles.eventMonth}>{month}</Text>
        <Text style={styles.eventDay}>{day}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventVenue} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {item.venue || item.city || "TBA"}
        </Text>
        {item.isFree ? (
          <Text style={styles.eventFree}>Free</Text>
        ) : (
          <Text style={styles.eventPrice}>{item.ticketPrice || ""}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function AnnouncementBanner({ item }: { item: Announcement }) {
  const typeColors: Record<string, string> = {
    news: colors.primary,
    promo: colors.secondary,
    update: "#3B82F6",
    alert: colors.error,
  };
  const bg = typeColors[item.type] || colors.primary;

  return (
    <View style={[styles.announcementBanner, { backgroundColor: bg }]}>
      <Ionicons
        name={item.type === "alert" ? "warning" : item.type === "promo" ? "pricetag" : "megaphone"}
        size={18}
        color={colors.white}
      />
      <View style={styles.announcementContent}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementText} numberOfLines={2}>{item.content}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-home"],
    queryFn: () => api.getMobileHome(),
    enabled: isAuthenticated,
  });

  const publicQuery = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.getRestaurants(),
    enabled: !isAuthenticated,
  });

  if (isLoading && isAuthenticated) return <LoadingScreen />;

  const restaurants = isAuthenticated ? data?.restaurants : publicQuery.data?.slice(0, 6);
  const events = data?.upcomingEvents || [];
  const announcements = data?.announcements || [];
  const providers = data?.featuredProviders || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Bem-vindo ao BrazaDash</Text>
          <Text style={styles.heroSubtitle}>
            {isAuthenticated
              ? `Ola, ${profile?.firstName || ""}! What are you craving today?`
              : "Discover authentic Brazilian food & services in California"}
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate("FoodTab")}
            >
              <Ionicons name="restaurant" size={18} color={colors.white} />
              <Text style={styles.heroButtonText}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate("ServicesTab")}
            >
              <Ionicons name="construct" size={18} color={colors.text} />
              <Text style={[styles.heroButtonText, { color: colors.text }]}>Services</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate("CommunityTab")}
            >
              <Ionicons name="people" size={18} color={colors.white} />
              <Text style={styles.heroButtonText}>Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {announcements.length > 0 && (
        <View style={styles.announcementsSection}>
          {announcements.map((a) => (
            <AnnouncementBanner key={a.id} item={a} />
          ))}
        </View>
      )}

      {restaurants && restaurants.length > 0 && (
        <View>
          <SectionHeader
            title="Featured Restaurants"
            onSeeAll={() => navigation.navigate("FoodTab")}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {restaurants.map((r) => (
              <RestaurantCard
                key={r.id}
                item={r}
                onPress={() => navigation.navigate("FoodTab", { screen: "RestaurantDetail", params: { id: r.id } })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {providers.length > 0 && (
        <View>
          <SectionHeader
            title="Top Service Providers"
            onSeeAll={() => navigation.navigate("ServicesTab")}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {providers.slice(0, 6).map((p) => (
              <ProviderCard
                key={p.id}
                item={p}
                onPress={() => navigation.navigate("ServicesTab", { screen: "ProviderDetail", params: { id: p.id } })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {events.length > 0 && (
        <View>
          <SectionHeader
            title="Upcoming Events"
            onSeeAll={() => navigation.navigate("CommunityTab")}
          />
          <View style={styles.eventsList}>
            {events.slice(0, 3).map((e) => (
              <EventCard
                key={e.id}
                item={e}
                onPress={() => navigation.navigate("CommunityTab", { screen: "EventDetail", params: { id: e.id } })}
              />
            ))}
          </View>
        </View>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { paddingBottom: spacing.xxxl },
  hero: {
    height: 220,
    backgroundColor: colors.primary,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  heroButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  announcementsSection: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  announcementBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  announcementContent: { flex: 1 },
  announcementTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  announcementText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  restaurantCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  restaurantImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surface,
  },
  restaurantInfo: {
    padding: spacing.md,
  },
  restaurantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  restaurantCuisine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restaurantMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  providerCard: {
    width: 140,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  providerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  providerCategory: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  providerRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 2,
  },
  providerRatingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  eventsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventDateBox: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
  },
  eventMonth: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  eventDay: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  eventInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  eventVenue: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventFree: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  eventPrice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
