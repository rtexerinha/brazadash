import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
    icon: "bag-handle",
    color: "#2563EB",
    features: [
      "Order from Brazilian restaurants",
      "Book services from providers",
      "Join community events",
      "Access business directory",
    ],
  },
  {
    id: "vendor",
    title: "Restaurant Owner",
    description: "Sell food and manage orders",
    icon: "restaurant",
    color: colors.primary,
    features: [
      "List your restaurant",
      "Manage menu and prices",
      "Receive and process orders",
      "Accept in-person payments",
    ],
  },
  {
    id: "service_provider",
    title: "Service Provider",
    description: "Offer services to the community",
    icon: "construct",
    color: "#D97706",
    features: [
      "List your services",
      "Manage bookings",
      "Set your own rates",
      "Build your client base",
    ],
  },
];

const serviceCategories = [
  { value: "cleaning", label: "Cleaning / Limpeza" },
  { value: "beauty", label: "Beauty / Beleza" },
  { value: "legal", label: "Legal / Jurídico" },
  { value: "fitness", label: "Fitness / Academia" },
  { value: "auto", label: "Auto / Automotivo" },
  { value: "construction", label: "Construction / Construção" },
  { value: "other", label: "Other / Outro" },
];

interface VendorInfo {
  name: string;
  description: string;
  cuisine: string;
  city: string;
  address: string;
  phone: string;
  bankName: string;
  routingNumber: string;
  bankAccountNumber: string;
  zelleInfo: string;
  venmoInfo: string;
}

interface ProviderInfo {
  businessName: string;
  description: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  einNumber: string;
  imageUrl: string;
  bankName: string;
  routingNumber: string;
  bankAccountNumber: string;
  zelleInfo: string;
  venmoInfo: string;
}

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [vendorInfo, setVendorInfo] = useState<VendorInfo>({
    name: "",
    description: "",
    cuisine: "",
    city: "",
    address: "",
    phone: "",
    bankName: "",
    routingNumber: "",
    bankAccountNumber: "",
    zelleInfo: "",
    venmoInfo: "",
  });

  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    businessName: "",
    description: "",
    category: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    einNumber: "",
    imageUrl: "",
    bankName: "",
    routingNumber: "",
    bankAccountNumber: "",
    zelleInfo: "",
    venmoInfo: "",
  });

  const isVendorFormValid =
    vendorInfo.name.trim() !== "" &&
    vendorInfo.city.trim() !== "" &&
    vendorInfo.phone.trim() !== "";

  const isProviderFormValid =
    providerInfo.businessName.trim() !== "" &&
    providerInfo.category !== "" &&
    providerInfo.city.trim() !== "" &&
    providerInfo.phone.trim() !== "";

  const handleNext = () => {
    if (!selectedRole) {
      Alert.alert("Selection Required", "Please select an account type to continue.");
      return;
    }
    if (selectedRole === "customer") {
      submitRole("customer");
    } else {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const submitRole = async (role: UserRole, businessInfo?: VendorInfo | ProviderInfo) => {
    setIsSubmitting(true);
    try {
      await api.setUserRole(role, businessInfo);
      await refreshProfile();

      if (role === "customer") {
        navigation.replace("Main");
      } else {
        Alert.alert(
          "Application Submitted",
          `Your ${role === "vendor" ? "restaurant owner" : "service provider"} account is pending approval. You'll be notified once it's reviewed.`,
          [{ text: "OK", onPress: () => navigation.replace("Main") }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to set account type. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedRole) return;
    if (selectedRole === "vendor") {
      if (!isVendorFormValid) {
        Alert.alert("Required Fields", "Please fill in the restaurant name, city, and phone number.");
        return;
      }
      submitRole("vendor", vendorInfo);
    } else if (selectedRole === "service_provider") {
      if (!isProviderFormValid) {
        Alert.alert("Required Fields", "Please fill in the business name, category, city, and phone number.");
        return;
      }
      submitRole("service_provider", providerInfo);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step === 1 ? styles.stepCircleActive : styles.stepCircleDone]}>
          {step > 1 ? (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          ) : (
            <Text style={styles.stepNumber}>1</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Account Type</Text>
      </View>
      {selectedRole && selectedRole !== "customer" && (
        <>
          <View style={styles.stepConnector} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step === 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
              <Text style={[styles.stepNumber, step !== 2 && styles.stepNumberInactive]}>2</Text>
            </View>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Business Info</Text>
          </View>
        </>
      )}
    </View>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.optionsContainer}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedRole === option.id && styles.optionCardSelected,
              selectedRole === option.id && { borderColor: option.color },
            ]}
            onPress={() => setSelectedRole(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + "18" }]}>
                <Ionicons name={option.icon} size={28} color={option.color} />
              </View>
              <View style={styles.optionHeaderText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[styles.radioButton, selectedRole === option.id && { borderColor: option.color }]}>
                {selectedRole === option.id && (
                  <View style={[styles.radioButtonInner, { backgroundColor: option.color }]} />
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
                  <Text
                    style={[
                      styles.featureText,
                      selectedRole === option.id && styles.featureTextSelected,
                    ]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {option.id !== "customer" && (
              <View style={styles.approvalNotice}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.approvalNoticeText}>Requires admin approval</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, (!selectedRole || isSubmitting) && styles.continueButtonDisabled]}
        onPress={handleNext}
        disabled={!selectedRole || isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.continueButtonText}>
              {selectedRole === "customer" ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const renderVendorForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formSectionTitle}>Restaurant Information</Text>
      <Text style={styles.formSectionDesc}>
        Tell us about your restaurant so we can set up your vendor account.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>
          Restaurant Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={vendorInfo.name}
          onChangeText={(text) => setVendorInfo({ ...vendorInfo, name: text })}
          placeholder="e.g., Sabor do Brasil"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={vendorInfo.description}
          onChangeText={(text) => setVendorInfo({ ...vendorInfo, description: text })}
          placeholder="Describe your restaurant..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Cuisine Type</Text>
        <TextInput
          style={styles.input}
          value={vendorInfo.cuisine}
          onChangeText={(text) => setVendorInfo({ ...vendorInfo, cuisine: text })}
          placeholder="e.g., Brazilian, Churrasco"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>
            City <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.city}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, city: text })}
            placeholder="e.g., Los Angeles"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>
            Phone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.phone}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, phone: text })}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={styles.input}
          value={vendorInfo.address}
          onChangeText={(text) => setVendorInfo({ ...vendorInfo, address: text })}
          placeholder="Full street address"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formDivider} />

      <Text style={styles.formSectionTitle}>Payment Information</Text>
      <Text style={styles.formSectionDesc}>
        How would you like to receive your payments? Provide at least one option.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Bank Name</Text>
        <TextInput
          style={styles.input}
          value={vendorInfo.bankName}
          onChangeText={(text) => setVendorInfo({ ...vendorInfo, bankName: text })}
          placeholder="e.g., Chase, Bank of America"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Routing Number</Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.routingNumber}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, routingNumber: text })}
            placeholder="9 digits"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.bankAccountNumber}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, bankAccountNumber: text })}
            placeholder="Account number"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Zelle</Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.zelleInfo}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, zelleInfo: text })}
            placeholder="Email or phone"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Venmo</Text>
          <TextInput
            style={styles.input}
            value={vendorInfo.venmoInfo}
            onChangeText={(text) => setVendorInfo({ ...vendorInfo, venmoInfo: text })}
            placeholder="@username"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );

  const renderProviderForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formSectionTitle}>Business Information</Text>
      <Text style={styles.formSectionDesc}>
        Tell us about your services so we can set up your provider account.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>
          Business Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={providerInfo.businessName}
          onChangeText={(text) => setProviderInfo({ ...providerInfo, businessName: text })}
          placeholder="Your business name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={providerInfo.description}
          onChangeText={(text) => setProviderInfo({ ...providerInfo, description: text })}
          placeholder="Describe your services..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>
          Category <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectButtonText,
              !providerInfo.category && { color: colors.textTertiary },
            ]}
          >
            {providerInfo.category
              ? serviceCategories.find((c) => c.value === providerInfo.category)?.label || providerInfo.category
              : "Select a category"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {showCategoryPicker && (
          <View style={styles.categoryList}>
            {serviceCategories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryItem,
                  providerInfo.category === cat.value && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setProviderInfo({ ...providerInfo, category: cat.value });
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    providerInfo.category === cat.value && styles.categoryItemTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
                {providerInfo.category === cat.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>
            City <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={providerInfo.city}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, city: text })}
            placeholder="e.g., Los Angeles"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>
            Phone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={providerInfo.phone}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, phone: text })}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.address}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, address: text })}
            placeholder="Street address"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.email}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, email: text })}
            placeholder="business@email.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>EIN Number</Text>
        <TextInput
          style={styles.input}
          value={providerInfo.einNumber}
          onChangeText={(text) => setProviderInfo({ ...providerInfo, einNumber: text })}
          placeholder="XX-XXXXXXX"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.inputHint}>Optional - Employer Identification Number</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Business Image URL</Text>
        <TextInput
          style={styles.input}
          value={providerInfo.imageUrl}
          onChangeText={(text) => setProviderInfo({ ...providerInfo, imageUrl: text })}
          placeholder="https://example.com/your-image.jpg"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.inputHint}>Optional - Link to your business logo or photo</Text>
      </View>

      <View style={styles.formDivider} />

      <Text style={styles.formSectionTitle}>Payment Information</Text>
      <Text style={styles.formSectionDesc}>
        How would you like to receive your payments? Provide at least one option.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Bank Name</Text>
        <TextInput
          style={styles.input}
          value={providerInfo.bankName}
          onChangeText={(text) => setProviderInfo({ ...providerInfo, bankName: text })}
          placeholder="e.g., Chase, Bank of America"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Routing Number</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.routingNumber}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, routingNumber: text })}
            placeholder="9 digits"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.bankAccountNumber}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, bankAccountNumber: text })}
            placeholder="Account number"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Zelle</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.zelleInfo}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, zelleInfo: text })}
            placeholder="Email or phone"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRowItem}>
          <Text style={styles.inputLabel}>Venmo</Text>
          <TextInput
            style={styles.input}
            value={providerInfo.venmoInfo}
            onChangeText={(text) => setProviderInfo({ ...providerInfo, venmoInfo: text })}
            placeholder="@username"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <>
      {selectedRole === "vendor" ? renderVendorForm() : renderProviderForm()}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || (selectedRole === "vendor" ? !isVendorFormValid : !isProviderFormValid)) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            isSubmitting || (selectedRole === "vendor" ? !isVendorFormValid : !isProviderFormValid)
          }
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBg}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.title}>Welcome to BrazaDash!</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? "Choose how you'd like to use the platform"
              : selectedRole === "vendor"
              ? "Tell us about your restaurant"
              : "Tell us about your business"}
          </Text>
        </View>

        {renderStepIndicator()}

        {step === 1 ? renderStep1() : renderStep2()}

        <Text style={styles.footerText}>
          You can always contact support to change your account type later
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: colors.borderLight,
  },
  stepNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  stepNumberInactive: {
    color: colors.textTertiary,
  },
  stepLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  stepConnector: {
    width: 32,
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  optionsContainer: {
    gap: spacing.md,
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
    backgroundColor: colors.primaryLight,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
    marginTop: spacing.xl,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  formSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formSectionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formRowItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm + 2,
  },
  inputHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.background,
  },
  selectButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  categoryItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
