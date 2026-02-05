import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, TextInput, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { LoadingScreen } from "../components/LoadingScreen";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

export default function ProviderDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  const [showBooking, setShowBooking] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => api.getServiceProvider(id),
  });

  const { data: providerServices } = useQuery({
    queryKey: ["provider-services", id],
    queryFn: () => api.getProviderServices(id),
  });

  const { data: reviews } = useQuery({
    queryKey: ["provider-reviews", id],
    queryFn: () => api.getProviderReviews(id),
  });

  const bookingMutation = useMutation({
    mutationFn: () =>
      api.createBooking({
        providerId: id,
        serviceId: selectedServiceId || undefined,
        requestedDate: bookingDate,
        requestedTime: bookingTime,
        address: bookingAddress || undefined,
        notes: bookingNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowBooking(false);
      Alert.alert("Booking Requested", "Your booking request has been sent. The provider will confirm shortly.");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to create booking.");
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (!provider) return null;

  const handleBookService = (serviceId?: string) => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to book a service.", [
        { text: "Cancel" },
        { text: "Login", onPress: login },
      ]);
      return;
    }
    setSelectedServiceId(serviceId || null);
    setShowBooking(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: provider.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300" }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{provider.businessName}</Text>
            {provider.isVerified && (
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            )}
          </View>
          <Text style={styles.category}>{provider.category}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={parseFloat(provider.rating || "0")} />
            <Text style={styles.ratingText}>
              {parseFloat(provider.rating || "0").toFixed(1)} ({provider.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      {provider.description && (
        <View style={styles.section}>
          <Text style={styles.descriptionText}>{provider.description}</Text>
        </View>
      )}

      <View style={styles.detailsGrid}>
        {provider.city && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{provider.city}</Text>
          </View>
        )}
        {provider.phone && (
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{provider.phone}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>{provider.priceRange}</Text>
        </View>
        {provider.yearsExperience > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{provider.yearsExperience} years experience</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="language-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>{provider.languages}</Text>
        </View>
      </View>

      {providerServices && providerServices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {providerServices.filter((s) => s.isActive).map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  {service.price && (
                    <Text style={styles.servicePrice}>
                      ${parseFloat(service.price).toFixed(2)}
                      {service.priceType === "hourly" ? "/hr" : service.priceType === "quote" ? " (est.)" : ""}
                    </Text>
                  )}
                  {service.duration && (
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookServiceButton}
                onPress={() => handleBookService(service.id)}
              >
                <Text style={styles.bookServiceText}>Book</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {showBooking && (
        <View style={styles.bookingForm}>
          <Text style={styles.sectionTitle}>Request Booking</Text>
          <TextInput
            style={styles.input}
            placeholder="Date (e.g., 2025-03-15)"
            placeholderTextColor={colors.textTertiary}
            value={bookingDate}
            onChangeText={setBookingDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Time (e.g., 10:00 AM)"
            placeholderTextColor={colors.textTertiary}
            value={bookingTime}
            onChangeText={setBookingTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (optional)"
            placeholderTextColor={colors.textTertiary}
            value={bookingAddress}
            onChangeText={setBookingAddress}
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textTertiary}
            value={bookingNotes}
            onChangeText={setBookingNotes}
            multiline
          />
          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowBooking(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, bookingMutation.isPending && { opacity: 0.7 }]}
              onPress={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showBooking && (
        <TouchableOpacity style={styles.mainBookButton} onPress={() => handleBookService()}>
          <Ionicons name="calendar-outline" size={20} color={colors.white} />
          <Text style={styles.mainBookText}>Book This Provider</Text>
        </TouchableOpacity>
      )}

      {reviews && reviews.length > 0 && (
        <View style={styles.section}>
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
  header: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  ratingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailsGrid: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  serviceInfo: { flex: 1 },
  serviceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  serviceDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  servicePrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  serviceDuration: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  bookServiceButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bookServiceText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  mainBookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  mainBookText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  bookingForm: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: "top",
  },
  bookingActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
