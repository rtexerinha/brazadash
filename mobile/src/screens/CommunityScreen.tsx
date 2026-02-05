import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, Linking, Modal, Pressable,
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
          <Ionicons name="calendar" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={2}>{item.title}</Text>
          {item.isFeatured && (
            <View style={[styles.badge, { backgroundColor: colors.secondary + "20" }]}>
              <Text style={[styles.badgeText, { color: colors.secondaryDark }]}>Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {item.startTime ? ` at ${item.startTime}` : ""}
          </Text>
        </View>
        {item.venue && (
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.venue}</Text>
          </View>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          {item.isFree ? (
            <Text style={styles.freeLabel}>Free</Text>
          ) : item.ticketPrice ? (
            <Text style={styles.metaText}>{item.ticketPrice}</Text>
          ) : null}
          <Text style={styles.metaDivider}>|</Text>
          <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.metaText}>{item.attendeeCount || 0} going</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BusinessCard({ item }: { item: Business }) {
  const initials = (item.name || "B").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.businessRow}>
        <View style={styles.businessAvatar}>
          <Text style={styles.businessInitials}>{initials}</Text>
        </View>
        <View style={styles.businessInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            {item.isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
          </View>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          {item.description && (
            <Text style={styles.businessDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.city && (
              <>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.city}{item.state ? `, ${item.state}` : ""}</Text>
              </>
            )}
            {item.phone && (
              <>
                <Text style={styles.metaDivider}>|</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={styles.cardMeta}>
                  <Ionicons name="call-outline" size={12} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.primary }]}>{item.phone}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    <View style={styles.card}>
      <View style={styles.announcementRow}>
        <View style={[styles.announcementIcon, { backgroundColor: (typeColors[item.type] || colors.primary) + "18" }]}>
          <Ionicons
            name={typeIcons[item.type] || "megaphone-outline"}
            size={20}
            color={typeColors[item.type] || colors.primary}
          />
        </View>
        <View style={styles.announcementBody}>
          <View style={styles.announcementHeader}>
            <Text style={[styles.announcementType, { color: typeColors[item.type] || colors.primary }]}>
              {item.type.toUpperCase()}
            </Text>
            <Text style={styles.announcementDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.cardName}>{item.title}</Text>
          <Text style={styles.announcementContent} numberOfLines={3}>{item.content}</Text>
          {item.linkUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(item.linkUrl!)}>
              <Text style={styles.announcementLink}>{item.linkText || "Learn More"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [eventCategory, setEventCategory] = useState<string | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const [showEventDropdown, setShowEventDropdown] = useState(false);

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

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "events", label: "Events", icon: "calendar" },
    { key: "businesses", label: "Directory", icon: "business" },
    { key: "announcements", label: "News", icon: "megaphone" },
  ];

  const selectedEventLabel = eventCategory
    ? EVENT_CATEGORIES.find(c => c.id === eventCategory)?.label || "All Categories"
    : "All Categories";

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
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowEventDropdown(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dropdownText}>{selectedEventLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <Modal visible={showEventDropdown} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setShowEventDropdown(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  style={[styles.modalItem, !eventCategory && styles.modalItemActive]}
                  onPress={() => { setEventCategory(null); setShowEventDropdown(false); }}
                >
                  <Text style={[styles.modalItemText, !eventCategory && styles.modalItemTextActive]}>All Categories</Text>
                  {!eventCategory && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
                {EVENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.modalItem, eventCategory === cat.id && styles.modalItemActive]}
                    onPress={() => { setEventCategory(cat.id); setShowEventDropdown(false); }}
                  >
                    <Text style={[styles.modalItemText, eventCategory === cat.id && styles.modalItemTextActive]}>
                      {cat.label}
                    </Text>
                    {eventCategory === cat.id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>

          {loadingEvents ? (
            <LoadingScreen />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl refreshing={refetchingEvents} onRefresh={refetchEvents} colors={[colors.primary]} />
              }
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState icon="calendar-outline" title="No events yet" message="Check back soon for community events!" />
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
                <RefreshControl refreshing={refetchingBiz} onRefresh={refetchBusinesses} colors={[colors.primary]} />
              }
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
            keyExtractor={(item) => String(item.id)}
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

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
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
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  freeLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  eventImage: {
    width: "100%",
    height: 160,
    backgroundColor: colors.surface,
  },
  eventImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  businessRow: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  businessInitials: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  businessInfo: {
    flex: 1,
  },
  businessDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  announcementRow: {
    flexDirection: "row",
    padding: spacing.md,
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
    letterSpacing: 0.5,
  },
  announcementDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
