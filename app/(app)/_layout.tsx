import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="farmers">
        <Icon sf={{ default: "person.crop.rectangle", selected: "person.crop.rectangle.fill" }} />
        <Label>Farmers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="workers">
        <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
        <Label>Workers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="payroll">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Payroll</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: COLORS.surface,
          }),
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="farmers"
        options={{
          title: "Farmers",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: "Workers",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="hard-hat" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: "Payroll",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function AppLayout() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}