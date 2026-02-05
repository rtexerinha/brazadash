import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { colors, fontSize, fontWeight } from "../constants/theme";

import HomeScreen from "../screens/HomeScreen";
import RestaurantsScreen from "../screens/RestaurantsScreen";
import RestaurantDetailScreen from "../screens/RestaurantDetailScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import ServicesScreen from "../screens/ServicesScreen";
import ProviderDetailScreen from "../screens/ProviderDetailScreen";
import CommunityScreen from "../screens/CommunityScreen";
import ProfileScreen from "../screens/ProfileScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import BookingsScreen from "../screens/BookingsScreen";
import BookingDetailScreen from "../screens/BookingDetailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: fontWeight.semibold as any },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function FoodStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={{ title: "Restaurants" }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: "Restaurant" }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Cart" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}

function ServicesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Services" component={ServicesScreen} options={{ title: "Services" }} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ title: "Provider" }} />
    </Stack.Navigator>
  );
}

function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Community" component={CommunityScreen} options={{ title: "Community" }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "My Profile" }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "My Orders" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Details" }} />
      <Stack.Screen name="Bookings" component={BookingsScreen} options={{ title: "My Bookings" }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: "Booking Details" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          switch (route.name) {
            case "HomeTab":
              iconName = focused ? "home" : "home-outline";
              break;
            case "FoodTab":
              iconName = focused ? "restaurant" : "restaurant-outline";
              break;
            case "ServicesTab":
              iconName = focused ? "construct" : "construct-outline";
              break;
            case "CommunityTab":
              iconName = focused ? "people" : "people-outline";
              break;
            case "ProfileTab":
              iconName = focused ? "person" : "person-outline";
              break;
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen
        name="FoodTab"
        component={FoodStack}
        options={{
          title: "Food",
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
        }}
      />
      <Tab.Screen name="ServicesTab" component={ServicesStack} options={{ title: "Services" }} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} options={{ title: "Community" }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { navigationRef } = useAuth();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
