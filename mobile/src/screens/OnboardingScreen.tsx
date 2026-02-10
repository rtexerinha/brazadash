import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

type UserRole = "customer" | "vendor" | "service_provider";

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    id: "customer",
    title: "Customer",
    description: "Order food and book services",
    icon: "person",
    color: colors.primary,
    features: [
      "Order from Brazilian restaurants",
      "Book services from providers",
      "Join community events",
      "Access business directory"
    ]
  },
  {
    id: "vendor",
    title: "Restaurant Owner",
    description: "Sell food and manage orders",
    icon: "restaurant",
    color: "#E67E00",
    features: [
      "List your restaurant",
      "Manage menu and prices",
      "Receive and process orders",
      "Track sales and revenue"
    ]
  },
  {
    id: "service_provider",
    title: "Service Provider",
    description: "Offer services to the community",
    icon: "construct",
    color: colors.secondary,
    features: [
      "List your services",
      "Manage bookings",
      "Set your own rates",
      "Build your client base"
    ]
  }
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Selection Required", "Please select an account type to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.setUserRole(selectedRole);
      await refreshProfile();
      
      if (selectedRole === "customer") {
        // Customer role is auto-approved, go to home
        navigation.replace("Main");
      } else {
        // Vendor/Provider needs approval, show pending screen
        Alert.alert(
          "Application Submitted",
          `Your ${selectedRole === "vendor" ? "restaurant owner" : "service provider"} account is pending approval. You'll be notified once it's reviewed.`,
          [
            {
              text: "OK",
              onPress: () => navigation.replace("Main")
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to set account type. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="flag" size={48} color={colors.primary} />
        <Text style={styles.title}>Welcome to BrazaDash!</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to use the platform
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedRole === option.id && styles.optionCardSelected
            ]}
            onPress={() => setSelectedRole(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + "18" }]}>
                <Ionicons name={option.icon} size={32} color={option.color} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={styles.radioButton}>
                {selectedRole === option.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>

            <View style={styles.featuresList}>
              {option.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={selectedRole === option.id ? option.color : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.featureText,
                    selectedRole === option.id && styles.featureTextSelected
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {option.id !== "customer" && (
              <View style={styles.approvalNotice}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.approvalNoticeText}>
                  Requires admin approval
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          (!selectedRole || isSubmitting) && styles.continueButtonDisabled
        ]}
        onPress={handleContinue}
        disabled={!selectedRole || isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        You can always contact support to change your account type later
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  featuresList: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  featureTextSelected: {
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  approvalNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  approvalNoticeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  continueButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
