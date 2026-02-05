import React, { useState } from "react";
import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, Linking,
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

function EventCard({ item, onPress }: { item: CommunityEvent; onPress: () => void }) {
  const date = new Date(item.eventDate);

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      )}
      <View style={styles.eventBody}>
        <View style={styles.eventDateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.eventDateText}>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {item.startTime ? ` at ${item.startTime}` : ""}
          </Text>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color={colors.secondary} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        {item.venue && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.venueText} numberOfLines={1}>{item.venue}</Text>
          </View>
        )}
        <View style={styles.eventFooter}>
          <Text style={styles.eventCategory}>{item.category}</Text>
          {item.isFree ? (
            <Text style={styles.freeLabel}>Free</Text>
          ) : item.ticketPrice ? (
            <Text style={styles.priceLabel}>{item.ticketPrice}</Text>
          ) : null}
          <Text style={styles.attendeeText}>
            <Ionicons name="people-outline" size={12} color={colors.textTertiary} /> {item.attendeeCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BusinessCard({ item }: { item: Business }) {
  return (
    <View style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <View style={styles.businessNameRow}>
          <Text style={styles.businessName}>{item.name}</Text>
          {item.isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
        </View>
        <Text style={styles.businessCategory}>{item.category}</Text>
      </View>
      {item.description && (
        <Text style={styles.businessDesc} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.businessMeta}>
        {item.city && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaItemText}>{item.city}, {item.state}</Text>
          </View>
        )}
        {item.phone && (
          <TouchableOpacity style={styles.metaItem} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Ionicons name="call-outline" size={12} color={colors.primary} />
            <Text style={[styles.metaItemText, { color: colors.primary }]}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    news: "newspaper-outline",
    promo: "pricetag-outline",
    update: "refresh-outline",
    alert: "warning-outline",
  };
  const typeColors: Record<string, string> = {
    news: colors.primary,
    promo: "#F59E0B",
    update: "#3B82F6",
    alert: colors.error,
  };

  return (
    <View style={styles.announcementCard}>
      <View style={[styles.announcementIcon, { backgroundColor: (typeColors[item.type] || colors.primary) + "18" }]}>
        <Ionicons
          name={typeIcons[item.type] || "megaphone-outline"}
          size={20}
          color={typeColors[item.type] || colors.primary}
        />
      </View>
      <View style={styles.announcementBody}>
        <View style={styles.announcementHeader}>
          <Text style={styles.announcementType}>{item.type.toUpperCase()}</Text>
          <Text style={styles.announcementDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementContent} numberOfLines={3}>{item.content}</Text>
        {item.linkUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(item.linkUrl!)}>
            <Text style={styles.announcementLink}>{item.linkText || "Learn More"}</Text>
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

  const { data: businesses, isLoading: loadingBusinesses, refetch: refetchBusinesses } = useQuery({
    queryKey: ["businesses", businessSearch],
    queryFn: () => api.getBusinesses({ search: businessSearch || undefined }),
    enabled: activeTab === "businesses",
  });

  const { data: announcements, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.getAnnouncements(),
    enabled: activeTab === "announcements",
  });

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "events", label: "Events", icon: "calendar" },
    { key: "businesses", label: "Directory", icon: "business" },
    { key: "announcements", label: "News", icon: "megaphone" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
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
            >
              <Text style={[styles.filterChipText, !eventCategory && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {EVENT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, eventCategory === cat.id && styles.filterChipActive]}
                onPress={() => setEventCategory(eventCategory === cat.id ? null : cat.id)}
              >
                <Text style={[styles.filterChipText, eventCategory === cat.id && styles.filterChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {loadingEvents ? (
            <LoadingScreen />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refetchingEvents} onRefresh={refetchEvents} colors={[colors.primary]} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState icon="calendar-outline" title="No events yet" message="Check back soon for community events!" />
              }
              renderItem={({ item }) => (
                <EventCard item={item} onPress={() => navigation.navigate("EventDetail", { id: item.id })} />
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
          </View>
          {loadingBusinesses ? (
            <LoadingScreen />
          ) : (
            <FlatList
              data={businesses}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState icon="business-outline" title="No businesses found" message="The directory is growing! Check back later." />
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState icon="megaphone-outline" title="No announcements" message="Stay tuned for updates!" />
            }
            renderItem={({ item }) => <AnnouncementCard item={item} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  categoryFilter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
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
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.surface,
  },
  eventBody: {
    padding: spacing.md,
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  eventDateText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    gap: 2,
    marginLeft: "auto",
  },
  featuredText: {
    fontSize: fontSize.xs,
    color: colors.secondaryDark,
    fontWeight: fontWeight.semibold,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: spacing.xs,
  },
  venueText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  eventCategory: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: "capitalize",
  },
  freeLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  attendeeText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: "auto",
  },
  businessCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  businessHeader: { marginBottom: spacing.xs },
  businessNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  businessName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  businessCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  businessDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  businessMeta: {
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaItemText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  announcementCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  announcementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  announcementBody: { flex: 1 },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  announcementType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  announcementDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  announcementTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  announcementContent: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  announcementLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
});
