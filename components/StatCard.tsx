import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  subLabel?: string;
}

export function StatCard({ label, value, icon, accent = COLORS.primary, subLabel }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: `${accent}20` }]}>
      <View style={[styles.iconBg, { backgroundColor: `${accent}15` }]}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    minWidth: 140,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 2,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  subLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
