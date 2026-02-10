import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, fontSize, fontWeight } from "../constants/theme";

const AUTH_URL = "https://brazadash.com/api/login";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setAuthenticated } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);

  const handleLogin = async () => {
    setAuthenticating(true);
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        AUTH_URL,
        "brazadash://oauth-callback"
      );

      if (result.type === "success") {
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to get the user profile
        try {
          const profile = await api.getMobileProfile();
          
          // Check if user has a role assigned
          if (!profile.roles || profile.roles.length === 0) {
            // New user needs onboarding
            navigation.replace("Onboarding");
          } else {
            // Existing user with role, proceed to app
            setAuthenticated(profile);
            navigation.goBack();
          }
        } catch (error) {
          Alert.alert("Login Failed", "Could not authenticate. Please try again.");
          setAuthenticating(false);
        }
      } else {
        setAuthenticating(false);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during login.");
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    handleLogin();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          data-testid="button-cancel-login"
          disabled={authenticating}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {authenticating ? "Signing you in..." : "Opening browser..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    width: 60,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
