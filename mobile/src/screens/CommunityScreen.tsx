import React, { useState } from "react";
import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, Linking, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { EVENT_CATEGORIES } from "../constants/categories";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";
import type { CommunityEvent, Business, Announcement } from "../types";

type Tab = "events" | "businesses" | "announcements";

const EVENT_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  festival: "musical-notes",
  concert: "mic",
  meetup: "people",
  sports: "football",
  cultural: "color-palette",
  food: "restaurant",
  workshop: "school",
  other: "ellipsis-horizontal",
};

const BUSINESS_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: "restaurant",
  retail: "bag-handle",
  beauty: "cut",
  automotive: "car",
  legal: "briefcase",
  health: "medkit",
  education: "school",
  construction: "hammer",
  technology: "laptop",
  finance: "cash",
  other: "storefront",
};

function EventCard({ item, onPress }: { item: CommunityEvent; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);
  const date = new Date(item.eventDate);
  const month = date.toLocaleString("en", { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleString("en", { weekday: "short" });
  const timeStr = item.startTime || "";

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.8}>
      {item.imageUrl && !imageError ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.eventImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Ionicons
            name={EVENT_CATEGORY_ICONS[item.category] || "calendar"}
            size={32}
            color={colors.primary}
          />
        </View>
      )}
      <View style={styles.eventDateOverlay}>
        <Text style={styles.eventMonth}>{month}</Text>
        <Text style={styles.eventDay}>{day}</Text>
      </View>
      {item.isFeatured && (
        <View style={styles.featuredOverlay}>
          <Ionicons name="star" size={10} color={colors.secondary} />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.eventDetailRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.eventDetailText}>
            {weekday}{timeStr ? ` at ${timeStr}` : ""}
          </Text>
        </View>
        {item.venue && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.eventDetailText} numberOfLines={1}>{item.venue}</Text>
          </View>
        )}
        <View style={styles.eventFooter}>
          <View style={styles.eventTags}>
            {item.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            )}
            {item.isFree ? (
              <View style={[styles.categoryTag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.categoryTagText, { color: colors.primary }]}>Free</Text>
              </View>
            ) : item.ticketPrice ? (
              <Text style={styles.priceText}>{item.ticketPrice}</Text>
            ) : null}
          </View>
          <View style={styles.attendeeRow}>
            <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.attendeeCount}>{item.attendeeCount || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BusinessCard({ item }: { item: Business }) {
  const initials = (item.name || "B").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const catIcon = BUSINESS_CATEGORY_ICONS[item.category] || "storefront";

  return (
    <View style={styles.businessCard}>
      <View style={styles.businessTop}>
        <View style={styles.businessAvatarWrap}>
          <View style={styles.businessAvatar}>
            <Text style={styles.businessInitials}>{initials}</Text>
          </View>
          {item.isVerified && (
            <View style={styles.businessVerified}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.businessInfoCol}>
          <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.businessCategoryRow}>
            <Ionicons name={catIcon} size={12} color={colors.textSecondary} />
            <Text style={styles.businessCategory}>{item.category}</Text>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.businessDesc} numberOfLines={2}>{item.description}</Text>
      )}

      <View style={styles.businessActions}>
        {item.city && (
          <View style={styles.businessMetaChip}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.businessMetaText}>{item.city}{item.state ? `, ${item.state}` : ""}</Text>
          </View>
        )}
        {item.phone && (
          <TouchableOpacity
            style={[styles.businessMetaChip, { backgroundColor: colors.primaryLight }]}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={12} color={colors.primary} />
            <Text style={[styles.businessMetaText, { color: colors.primary }]}>Call</Text>
          </TouchableOpacity>
        )}
        {item.website && (
          <TouchableOpacity
            style={[styles.businessMetaChip, { backgroundColor: "#EEF2FF" }]}
            onPress={() => Linking.openURL(item.website!)}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={12} color="#4F46E5" />
            <Text style={[styles.businessMetaText, { color: "#4F46E5" }]}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const config: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    news: { color: colors.primary, icon: "newspaper-outline" },
    promo: { color: "#F59E0B", icon: "pricetag-outline" },
    update: { color: "#3B82F6", icon: "refresh-outline" },
    alert: { color: colors.error, icon: "warning-outline" },
  };
  const { color, icon } = config[item.type] || config.news;

  return (
    <View style={styles.announcementCard}>
      <View style={[styles.announcementStripe, { backgroundColor: color }]} />
      <View style={styles.announcementBody}>
        <View style={styles.announcementHeader}>
          <View style={[styles.announcementIcon, { backgroundColor: color + "18" }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <View style={styles.announcementMeta}>
            <Text style={[styles.announcementType, { color }]}>{item.type.toUpperCase()}</Text>
            <Text style={styles.announcementDate}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementContent} numberOfLines={3}>{item.content}</Text>
        {item.linkUrl && (
          <TouchableOpacity
            style={styles.announcementLinkBtn}
            onPress={() => Linking.openURL(item.linkUrl!)}
            activeOpacity={0.7}
          >
            <Text style={styles.announcementLink}>{item.linkText || "Learn More"}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [eventCategory, setEventCategory] = useState<string | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");

  const { data: events, isLoading: loadingEvents, refetch: refetchEvents, isRefetching: refetchingEvents } = useQuery({
    queryKey: ["events", eventCategory],
    queryFn: () => api.getEvents(eventCategory || undefined),
    enabled: activeTab === "events",
  });

  const { data: businesses, isLoading: loadingBusinesses, refetch: refetchBusinesses, isRefetching: refetchingBiz } = useQuery({
    queryKey: ["businesses", businessSearch],
    queryFn: () => api.getBusinesses({ search: businessSearch || undefined }),
    enabled: activeTab === "businesses",
  });

  const { data: announcements, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.getAnnouncements(),
    enabled: activeTab === "announcements",
  });

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }[] = [
    { key: "events", label: "Events", icon: "calendar-outline", count: events?.length },
    { key: "businesses", label: "Directory", icon: "business-outline", count: businesses?.length },
    { key: "announcements", label: "News", icon: "megaphone-outline", count: announcements?.length },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : tab.icon}
                size={18}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "events" && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilter}
          >
            <TouchableOpacity
              style={[styles.filterChip, !eventCategory && styles.filterChipActive]}
              onPress={() => setEventCategory(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="apps" size={13} color={!eventCategory ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipText, !eventCategory && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {EVENT_CATEGORIES.map((cat) => {
              const isActive = eventCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setEventCategory(eventCategory === cat.id ? null : cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={EVENT_CATEGORY_ICONS[cat.id] || "calendar"}
                    size={13}
                    color={isActive ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {loadingEvents ? (
            <LoadingScreen />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl refreshing={refetchingEvents} onRefresh={refetchEvents} colors={[colors.primary]} tintColor={colors.primary} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
                  icon="calendar-outline"
                  title="No events yet"
                  message="Community events will show up here. Check back soon!"
                />
              }
              renderItem={({ item }) => (
                <EventCard item={item} onPress={() => {}} />
              )}
            />
          )}
        </>
      )}

      {activeTab === "businesses" && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search businesses..."
              placeholderTextColor={colors.textTertiary}
              value={businessSearch}
              onChangeText={setBusinessSearch}
            />
            {businessSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBusinessSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          {loadingBusinesses ? (
            <LoadingScreen />
          ) : (
            <FlatList
              data={businesses}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl refreshing={refetchingBiz} onRefresh={refetchBusinesses} colors={[colors.primary]} tintColor={colors.primary} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
                  icon="business-outline"
                  title="No businesses found"
                  message="The directory is growing! Brazilian-owned businesses will appear here."
                />
              }
              renderItem={({ item }) => <BusinessCard item={item} />}
            />
          )}
        </>
      )}

      {activeTab === "announcements" && (
        loadingAnnouncements ? (
          <LoadingScreen />
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="megaphone-outline"
                title="No announcements"
                message="Stay tuned for platform updates and news!"
              />
            }
            renderItem={({ item }) => <AnnouncementCard item={item} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md + 2,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  categoryFilter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },

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

  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },

  eventCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.surface,
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  eventDateOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  eventDay: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 24,
  },
  featuredOverlay: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  featuredText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: fontWeight.bold,
  },
  eventBody: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  eventTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 22,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  eventDetailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  eventTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  categoryTagText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: "capitalize",
  },
  priceText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  attendeeCount: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },

  businessCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    gap: spacing.sm,
  },
  businessTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  businessAvatarWrap: {
    position: "relative",
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  businessInitials: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  businessVerified: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  businessInfoCol: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  businessCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  businessCategory: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  businessDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  businessActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  businessMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
  businessMetaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  announcementCard: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  announcementStripe: {
    width: 4,
  },
  announcementBody: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  announcementMeta: {
    flex: 1,
  },
  announcementType: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  announcementDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  announcementTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  announcementContent: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  announcementLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  announcementLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
