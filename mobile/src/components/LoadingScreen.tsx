import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { colors, fontSize } from "../constants/theme";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 12,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
