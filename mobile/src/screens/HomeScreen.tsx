import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl, Dimensions, ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { Restaurant, ServiceProvider, CommunityEvent, Announcement } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const SMALL_CARD_WIDTH = 150;

const QUICK_ACTIONS = [
  { id: "food", icon: "restaurant" as const, label: "Food", color: colors.primary, tab: "FoodTab" },
  { id: "services", icon: "construct" as const, label: "Services", color: colors.secondary, tab: "ServicesTab" },
  { id: "events", icon: "calendar" as const, label: "Events", color: "#3B82F6", tab: "CommunityTab" },
  { id: "directory", icon: "business" as const, label: "Directory", color: colors.accent, tab: "CommunityTab" },
];

const FOOD_CATEGORIES = [
  { id: "churrasco", label: "Churrasco", emoji: "steak" },
  { id: "acai", label: "Acai", emoji: "berry" },
  { id: "salgados", label: "Salgados", emoji: "pastry" },
  { id: "pao", label: "Pao de Queijo", emoji: "cheese" },
];

function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function RestaurantCard({ item, onPress }: { item: Restaurant; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);
  const fallbackColors = ["#E8F5EF", "#FFF8E1", "#E3F2FD", "#FCE4EC", "#F3E5F5"];
  const bgColor = fallbackColors[Number(item.id) % fallbackColors.length];

  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.restaurantImageWrap, { backgroundColor: bgColor }]}>
        {item.imageUrl && !imageError ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.restaurantImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={36} color={colors.primary} />
            <Text style={styles.placeholderName} numberOfLines={1}>{item.name}</Text>
          </View>
        )}
        {item.deliveryFee === "0" || item.deliveryFee === "0.00" ? (
          <View style={styles.freeDeliveryBadge}>
            <Text style={styles.freeDeliveryText}>Free Delivery</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.restaurantCuisine} numberOfLines={1}>{item.cuisine || "Brazilian"}</Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={colors.star} />
            <Text style={styles.ratingText}>{parseFloat(item.rating || "0").toFixed(1)}</Text>
          </View>
          <Text style={styles.metaText}>({item.reviewCount || 0})</Text>
          {item.deliveryTime && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.deliveryTime}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ProviderCard({ item, onPress }: { item: ServiceProvider; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);
  const initials = (item.businessName || "SP").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.providerCard} onPress={onPress} activeOpacity={0.8}>
      {item.imageUrl && !imageError ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.providerAvatar}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.providerAvatar, styles.providerAvatarFallback]}>
          <Text style={styles.providerInitials}>{initials}</Text>
        </View>
      )}
      {item.isVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        </View>
      )}
      <Text style={styles.providerName} numberOfLines={1}>{item.businessName}</Text>
      <Text style={styles.providerCategory}>{item.category}</Text>
      <View style={styles.providerRating}>
        <Ionicons name="star" size={11} color={colors.star} />
        <Text style={styles.providerRatingText}>{parseFloat(item.rating || "0").toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EventCard({ item, onPress }: { item: CommunityEvent; onPress: () => void }) {
  const date = new Date(item.eventDate);
  const month = date.toLocaleString("en", { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleString("en", { weekday: "short" });

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.eventDateBox}>
        <Text style={styles.eventMonth}>{month}</Text>
        <Text style={styles.eventDay}>{day}</Text>
        <Text style={styles.eventWeekday}>{weekday}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.eventVenueRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.eventVenue} numberOfLines={1}>{item.venue || item.city || "TBA"}</Text>
        </View>
        <View style={styles.eventFooter}>
          {item.isFree ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          ) : item.ticketPrice ? (
            <Text style={styles.eventPrice}>{item.ticketPrice}</Text>
          ) : null}
          {item.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ alignSelf: "center" }} />
    </TouchableOpacity>
  );
}

function AnnouncementBanner({ item }: { item: Announcement }) {
  const config: Record<string, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    news: { bg: colors.primary, icon: "newspaper-outline" },
    promo: { bg: "#E67E00", icon: "pricetag-outline" },
    update: { bg: "#3B82F6", icon: "refresh-outline" },
    alert: { bg: colors.error, icon: "warning-outline" },
  };
  const { bg, icon } = config[item.type] || config.news;

  return (
    <View style={[styles.announcementBanner, { backgroundColor: bg }]}>
      <View style={styles.announcementIconWrap}>
        <Ionicons name={icon} size={18} color={colors.white} />
      </View>
      <View style={styles.announcementContent}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementText} numberOfLines={2}>{item.content}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, profile, login } = useAuth();

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

  const publicProviders = useQuery({
    queryKey: ["providers-home"],
    queryFn: () => api.getServiceProviders(),
    enabled: !isAuthenticated,
  });

  const publicEvents = useQuery({
    queryKey: ["events-home"],
    queryFn: () => api.getEvents(),
    enabled: !isAuthenticated,
  });

  if (isLoading && isAuthenticated) return <LoadingScreen />;

  const restaurants = isAuthenticated ? data?.restaurants : publicQuery.data?.slice(0, 6);
  const events = isAuthenticated ? (data?.upcomingEvents || []) : (publicEvents.data?.slice(0, 4) || []);
  const announcements = data?.announcements || [];
  const providers = isAuthenticated ? (data?.featuredProviders || []) : (publicProviders.data?.slice(0, 6) || []);
  const greeting = isAuthenticated
    ? `Ola, ${profile?.firstName || ""}!`
    : "Bem-vindo!";
  const subtitle = isAuthenticated
    ? "What are you craving today?"
    : "Discover authentic Brazilian food & services in California";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || publicQuery.isRefetching}
          onRefresh={() => {
            refetch();
            publicQuery.refetch();
            publicProviders.refetch();
            publicEvents.refetch();
          }}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroGradient}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroGreeting}>{greeting}</Text>
              <Text style={styles.heroTitle}>BrazaDash</Text>
            </View>
            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.notifButton}
                onPress={() => navigation.navigate("ProfileTab", { screen: "Notifications" })}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.white} />
                {(data?.unreadNotifications || 0) > 0 && (
                  <View style={styles.notifDot} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.signInHeroBtn} onPress={login} activeOpacity={0.7}>
                <Text style={styles.signInHeroBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
          <View style={styles.searchBarFake}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <Text style={styles.searchBarText}>Search restaurants, services...</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickAction}
            onPress={() => navigation.navigate(action.tab)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + "18" }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {announcements.length > 0 && (
        <View style={styles.announcementsSection}>
          {announcements.slice(0, 2).map((a) => (
            <AnnouncementBanner key={a.id} item={a} />
          ))}
        </View>
      )}

      {restaurants && restaurants.length > 0 && (
        <View>
          <SectionHeader
            title="Featured Restaurants"
            subtitle="Authentic Brazilian flavors"
            onSeeAll={() => navigation.navigate("FoodTab")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + spacing.md}
          >
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
            title="Top Providers"
            subtitle="Trusted professionals"
            onSeeAll={() => navigation.navigate("ServicesTab")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {providers.slice(0, 8).map((p) => (
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
            subtitle="What's happening near you"
            onSeeAll={() => navigation.navigate("CommunityTab")}
          />
          <View style={styles.eventsList}>
            {events.slice(0, 3).map((e) => (
              <EventCard
                key={e.id}
                item={e}
                onPress={() => navigation.navigate("CommunityTab")}
              />
            ))}
          </View>
        </View>
      )}

      {!isAuthenticated && (
        <View style={styles.joinBanner}>
          <Ionicons name="flag" size={28} color={colors.primary} />
          <Text style={styles.joinTitle}>Join the Community</Text>
          <Text style={styles.joinSubtitle}>
            Sign in to order food, book services, RSVP to events, and connect with the Brazilian community in California.
          </Text>
          <TouchableOpacity style={styles.joinButton} onPress={login} activeOpacity={0.7}>
            <Text style={styles.joinButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: spacing.xxxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  contentContainer: {},

  hero: {
    backgroundColor: colors.primary,
  },
  heroGradient: {
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroGreeting: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.8)",
    fontWeight: fontWeight.medium,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  signInHeroBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  signInHeroBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  searchBarFake: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchBarText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    flex: 1,
  },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    marginTop: -spacing.sm,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  quickAction: {
    alignItems: "center",
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },

  announcementsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  announcementBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  announcementIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  sectionHeaderLeft: { flex: 1 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  horizontalList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },

  restaurantCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantImageWrap: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  placeholderName: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  freeDeliveryBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  freeDeliveryText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  restaurantInfo: {
    padding: spacing.md,
  },
  restaurantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
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
    marginTop: spacing.sm,
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: "#92400E",
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },

  providerCard: {
    width: SMALL_CARD_WIDTH,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  providerAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  providerInitials: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  verifiedBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
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
    gap: 3,
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  providerRatingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: "#92400E",
  },

  eventsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
    paddingRight: spacing.md,
  },
  eventDateBox: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  eventDay: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 28,
  },
  eventWeekday: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  eventInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
    gap: 3,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  eventVenueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventVenue: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 2,
  },
  freeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  eventPrice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  categoryTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  categoryTagText: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },

  joinBanner: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  joinTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  joinSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
