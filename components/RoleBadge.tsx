import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, ROLE_COLORS, ROLE_LABELS } from "@/constants/colors";

interface Props {
  role: string;
  small?: boolean;
}

export function RoleBadge({ role, small }: Props) {
  const color = ROLE_COLORS[role] || COLORS.textMuted;
  const label = ROLE_LABELS[role] || role;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}40` }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  smallText: { fontSize: 10 },
});
