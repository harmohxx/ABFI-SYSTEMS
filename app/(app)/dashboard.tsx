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
import { COLORS, ROLE_LABELS } from "@/constants/colors";

export default function DashboardScreen() {
  const { currentUser, logout } = useAuth();
  const { farmers, farms, workers, payments, sales, products, auditLogs, expenses } = useData();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const totalPayroll = useMemo(
    () => payments.filter((p) => p.status === "completed").reduce((a, b) => a + b.amount, 0),
    [payments]
  );
  const totalExpenses = useMemo(() => expenses.reduce((a, b) => a + b.amount, 0), [expenses]);
  const totalRevenue = useMemo(() => sales.reduce((a, b) => a + b.totalRevenue, 0), [sales]);
  const netProfit = totalRevenue - totalPayroll - totalExpenses;

  const pendingPayments = useMemo(() => payments.filter((p) => p.status === "pending").length, [payments]);
  const activeWorkers = useMemo(() => workers.filter((w) => w.active).length, [workers]);

  const recentLogs = auditLogs.slice(0, 5);

  const formatKES = (n: number) => {
    const absN = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (absN >= 1_000_000) return `${sign}KES ${(absN / 1_000_000).toFixed(1)}M`;
    if (absN >= 1_000) return `${sign}KES ${(absN / 1_000).toFixed(1)}K`;
    return `${sign}KES ${absN.toLocaleString()}`;
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const isDirector = currentUser?.role === "director";
  const isCEO = currentUser?.role === "ceo";

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 80 }}
      >
        <LinearGradient
          colors={["#0F2318", COLORS.bg]}
          style={[styles.headerGradient, { paddingTop: top + 12 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>
                {new Date().getHours() < 12
                  ? "Good morning"
                  : new Date().getHours() < 17
                  ? "Good afternoon"
                  : "Good evening"}
              </Text>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <RoleBadge role={currentUser?.role || "field_officer"} />
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>NET PROFIT</Text>
            <Text style={[styles.profitValue, { color: netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
              {formatKES(netProfit)}
            </Text>
            <View style={styles.profitMeta}>
              <Text style={styles.profitMetaText}>Revenue: {formatKES(totalRevenue)}</Text>
              <View style={styles.profitMetaDivider} />
              <Text style={styles.profitMetaText}>Costs: {formatKES(totalPayroll + totalExpenses)}</Text>
            </View>
          </View>

          {(isDirector || isCEO) && pendingPayments > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => router.push("/(app)/payroll")}
            >
              <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
              <Text style={styles.alertText}>{pendingPayments} payment{pendingPayments > 1 ? "s" : ""} awaiting approval</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.warning} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>FINANCIAL OVERVIEW</Text>
          <View style={styles.statsRow}>
            <StatCard
              label="Revenue"
              value={formatKES(totalRevenue)}
              icon={<Ionicons name="trending-up" size={20} color={COLORS.success} />}
              accent={COLORS.success}
              subLabel="total sales"
            />
            <StatCard
              label="Expenses"
              value={formatKES(totalExpenses)}
              icon={<Ionicons name="receipt" size={20} color={COLORS.danger} />}
              accent={COLORS.danger}
              subLabel="non-payroll"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Payroll"
              value={formatKES(totalPayroll)}
              icon={<Ionicons name="cash" size={20} color={COLORS.gold} />}
              accent={COLORS.gold}
              subLabel="completed"
            />
            <StatCard
              label="Workers"
              value={activeWorkers}
              icon={<FontAwesome5 name="hard-hat" size={18} color={COLORS.info} />}
              accent={COLORS.info}
              subLabel="active staff"
            />
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon={<MaterialCommunityIcons name="robot-outline" size={24} color={COLORS.info} />}
              label="Crop Doctor"
              onPress={() => router.push("/(app)/more")}
              accent={COLORS.info}
            />
            <QuickAction
              icon={<Ionicons name="calendar" size={24} color={COLORS.primary} />}
              label="Activities"
              onPress={() => router.push("/(app)/more")}
              accent={COLORS.primary}
            />
            <QuickAction
              icon={<Ionicons name="cash-outline" size={24} color={COLORS.gold} />}
              label="Payments"
              onPress={() => router.push("/(app)/payroll")}
              accent={COLORS.gold}
            />
            <QuickAction
              icon={<Ionicons name="stats-chart" size={22} color={COLORS.success} />}
              label="Sales"
              onPress={() => router.push("/(app)/more")}
              accent={COLORS.success}
            />
          </View>
        </View>

        {(isDirector || isCEO) && (
          <View style={styles.logsSection}>
            <View style={styles.logsSectionHeader}>
              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/more")}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentLogs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No activity yet</Text>
              </View>
            ) : (
              recentLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logAction}>{log.action.replace(/_/g, " ")}</Text>
                    <Text style={styles.logDetails} numberOfLines={1}>{log.details}</Text>
                    <Text style={styles.logTime}>
                      {log.userName} · {new Date(log.timestamp).toLocaleString("en-KE", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress, accent }: { icon: React.ReactNode; label: string; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity
      style={[styles.quickActionCard, { borderColor: `${accent}20` }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.qaIconBg, { backgroundColor: `${accent}15` }]}>{icon}</View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  userName: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, marginBottom: 8 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    alignItems: "center",
  },
  profitLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  profitValue: { fontFamily: "Inter_700Bold", fontSize: 32, marginBottom: 12 },
  profitMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  profitMetaText: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.textSecondary },
  profitMetaDivider: { width: 1, height: 12, backgroundColor: COLORS.border },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,166,35,0.06)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    marginTop: 16,
  },
  alertText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.warning },
  statsSection: { paddingHorizontal: 20, marginTop: 24 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  quickActions: { paddingHorizontal: 20, marginTop: 8 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    width: "45%",
    flexGrow: 1,
    borderWidth: 1,
  },
  qaIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  qaLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  logsSection: { paddingHorizontal: 20, marginTop: 24 },
  logsSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  viewAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.primary },
  logItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  logAction: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.text },
  logDetails: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  logTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  emptyLogs: { alignItems: "center", padding: 32, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", color: COLORS.textMuted, fontSize: 14 },
});