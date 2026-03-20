"use client";

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { StatCard } from "@/components/StatCard";
import { RoleBadge } from "@/components/RoleBadge";
import { COLORS } from "@/constants/colors";

export default function DashboardScreen() {
  const { currentUser, logout } = useAuth();
  const { payments, sales, workers, tasks, expenses, auditLogs } = useData();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const totalPayroll = useMemo(() => payments.filter(p => p.status === "completed").reduce((a, b) => a + b.amount, 0), [payments]);
  const totalExpenses = useMemo(() => expenses.reduce((a, b) => a + b.amount, 0), [expenses]);
  const totalRevenue = useMemo(() => sales.reduce((a, b) => a + b.totalRevenue, 0), [sales]);
  const netProfit = totalRevenue - totalPayroll - totalExpenses;

  const upcomingTasks = useMemo(() => tasks.filter(t => t.status !== "completed").slice(0, 3), [tasks]);
  const pendingPayments = useMemo(() => payments.filter(p => p.status === "pending").length, [payments]);

  const formatKES = (n: number) => {
    const absN = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (absN >= 1_000_000) return `${sign}KES ${(absN / 1_000_000).toFixed(1)}M`;
    if (absN >= 1_000) return `${sign}KES ${(absN / 1_000).toFixed(1)}K`;
    return `${sign}KES ${absN.toLocaleString()}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom + 80 }}>
        <LinearGradient colors={["#0F2318", COLORS.bg]} style={[styles.headerGradient, { paddingTop: top + 12 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <RoleBadge role={currentUser?.role || "field_officer"} />
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => logout()}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.weatherCard}>
            <View style={styles.weatherInfo}>
              <Ionicons name="sunny" size={32} color={COLORS.gold} />
              <View>
                <Text style={styles.tempText}>24°C · Sunny</Text>
                <Text style={styles.weatherLoc}>Nakuru, Kenya</Text>
              </View>
            </View>
            <View style={styles.sprayAdvisory}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.advisoryText}>Ideal conditions for spraying today</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatCard label="Net Profit" value={formatKES(netProfit)} icon={<Ionicons name="wallet" size={20} color={COLORS.success} />} accent={COLORS.success} />
            <StatCard label="Revenue" value={formatKES(totalRevenue)} icon={<Ionicons name="trending-up" size={20} color={COLORS.info} />} accent={COLORS.info} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>UPCOMING TASKS</Text>
            <TouchableOpacity onPress={() => router.push("/(app)/more")}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          {upcomingTasks.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No pending tasks</Text></View>
          ) : (
            upcomingTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={[styles.priorityDot, { backgroundColor: task.priority === "high" ? COLORS.danger : COLORS.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.farmName} · Due {task.dueDate}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            ))
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon={<MaterialCommunityIcons name="robot-outline" size={24} color={COLORS.info} />} label="Crop Doctor" onPress={() => router.push("/(app)/more")} accent={COLORS.info} />
            <QuickAction icon={<Ionicons name="calendar" size={24} color={COLORS.primary} />} label="Activities" onPress={() => router.push("/(app)/more")} accent={COLORS.primary} />
            <QuickAction icon={<Ionicons name="cash-outline" size={24} color={COLORS.gold} />} label="Payroll" onPress={() => router.push("/(app)/payroll")} accent={COLORS.gold} />
            <QuickAction icon={<Ionicons name="stats-chart" size={22} color={COLORS.success} />} label="Sales" onPress={() => router.push("/(app)/more")} accent={COLORS.success} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress, accent }: { icon: React.ReactNode; label: string; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: `${accent}20` }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.qaIconBg, { backgroundColor: `${accent}15` }]}>{icon}</View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary },
  userName: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, marginBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  weatherCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  weatherInfo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  tempText: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text },
  weatherLoc: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  sprayAdvisory: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${COLORS.success}10`, padding: 10, borderRadius: 12 },
  advisoryText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.success },
  statsSection: { paddingHorizontal: 20, marginTop: -10 },
  statsRow: { flexDirection: "row", gap: 12 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2 },
  viewAll: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.primary },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontFamily: "Inter_400Regular", color: COLORS.textMuted, fontSize: 14 },
  taskItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  taskMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  quickActions: { paddingHorizontal: 20, marginTop: 24 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, alignItems: "center", width: "45%", flexGrow: 1, borderWidth: 1 },
  qaIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  qaLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: COLORS.textSecondary },
});