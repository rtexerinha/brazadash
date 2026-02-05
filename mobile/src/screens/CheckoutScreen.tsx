import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useCart } from "../contexts/CartContext";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../constants/theme";

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { items, getSubtotal, clearCart, getRestaurantId } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tip, setTip] = useState("0");

  const subtotal = getSubtotal();
  const deliveryFee = 3.99;
  const tipAmount = parseFloat(tip) || 0;
  const total = subtotal + deliveryFee + tipAmount;
  const restaurantId = getRestaurantId();

  const orderMutation = useMutation({
    mutationFn: () =>
      api.createOrder({
        restaurantId: restaurantId!,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        tip: tipAmount.toFixed(2),
        total: total.toFixed(2),
        deliveryAddress: address,
        notes: notes || undefined,
      }),
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Order Placed", "Your order has been submitted successfully!", [
        { text: "View Orders", onPress: () => navigation.navigate("ProfileTab", { screen: "Orders" }) },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to place order. Please try again.");
    },
  });

  const handlePlaceOrder = () => {
    if (!address.trim()) {
      Alert.alert("Missing Address", "Please enter a delivery address.");
      return;
    }
    orderMutation.mutate();
  };

  const tipOptions = ["0", "2", "5", "10"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your delivery address"
        placeholderTextColor={colors.textTertiary}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <Text style={styles.sectionTitle}>Order Notes</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Any special instructions? (optional)"
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Text style={styles.sectionTitle}>Tip</Text>
      <View style={styles.tipRow}>
        {tipOptions.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tipButton, tip === t && styles.tipButtonActive]}
            onPress={() => setTip(t)}
          >
            <Text style={[styles.tipButtonText, tip === t && styles.tipButtonTextActive]}>
              {t === "0" ? "No Tip" : `$${t}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.itemsList}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.menuItemId} style={styles.summaryItem}>
            <Text style={styles.summaryItemName}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.summaryItemPrice}>
              ${(parseFloat(item.price) * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery Fee</Text>
          <Text style={styles.totalValue}>${deliveryFee.toFixed(2)}</Text>
        </View>
        {tipAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tip</Text>
            <Text style={styles.totalValue}>${tipAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.placeOrderButton, orderMutation.isPending && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={orderMutation.isPending}
      >
        {orderMutation.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.placeOrderText}>Place Order - ${total.toFixed(2)}</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: "top",
  },
  tipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tipButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  tipButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tipButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tipButtonTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  itemsList: {
    marginTop: spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  summaryItemName: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totals: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
