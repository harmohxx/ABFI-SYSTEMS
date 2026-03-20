"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { COLORS } from "@/constants/colors";
import { RoleBadge } from "@/components/RoleBadge";
import { SalesSection } from "@/components/more/SalesSection";
import { StockSection } from "@/components/more/StockSection";
import { UsersSection } from "@/components/more/UsersSection";
import { AuditSection } from "@/components/more/AuditSection";
import { ExpensesSection } from "@/components/more/ExpensesSection";
import { TasksSection } from "@/components/more/TasksSection";
import { FarmActivitiesSection } from "@/components/more/FarmActivitiesSection";
import { CropDoctorSection } from "@/components/more/CropDoctorSection";

type Section = "main" | "sales" | "stock" | "users" | "audit" | "expenses" | "tasks" | "activities" | "doctor";

export default function MoreScreen() {
  const { currentUser, users, logout } = useAuth();
  const { sales, products, auditLogs, refreshAuditLogs, expenses, tasks, farmActivities, cropAnalyses } = useData();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [section, setSection] = useState<Section>("main");

  const isDirector = currentUser?.role === "director";
  const isDirectorOrCEO = currentUser?.role === "director" || currentUser?.role === "ceo";

  if (section === "sales") return <SalesSection onBack={() => setSection("main")} />;
  if (section === "stock") return <StockSection onBack={() => setSection("main")} />;
  if (section === "users") return <UsersSection onBack={() => setSection("main")} />;
  if (section === "audit") return <AuditSection onBack={() => setSection("main")} />;
  if (section === "expenses") return <ExpensesSection onBack={() => setSection("main")} />;
  if (section === "tasks") return <TasksSection onBack={() => setSection("main")} />;
  if (section === "activities") return <FarmActivitiesSection onBack={() => setSection("main")} />;
  if (section === "doctor") return <CropDoctorSection onBack={() => setSection("main")} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: top + 8 }]}>
          <View>
            <Text style={styles.title}>More</Text>
            <Text style={styles.subtitle}>Additional features & settings</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); }}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FARM OPERATIONS</Text>
          <MenuItem icon={<Ionicons name="calendar" size={22} color={COLORS.primary} />} label="Farm Activities" sub={`${farmActivities.length} records logged`} accent={COLORS.primary} onPress={() => setSection("activities")} />
          <MenuItem icon={<MaterialCommunityIcons name="robot-outline" size={22} color={COLORS.info} />} label="Crop Doctor (AI)" sub={`${cropAnalyses.length} diagnoses`} accent={COLORS.info} onPress={() => setSection("doctor")} />
          <MenuItem icon={<Ionicons name="checkbox" size={22} color={COLORS.success} />} label="Task Management" sub={`${tasks.filter(t=>t.status!=="completed").length} pending tasks`} accent={COLORS.success} onPress={() => setSection("tasks")} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FINANCE & SALES</Text>
          <MenuItem icon={<Ionicons name="stats-chart" size={22} color={COLORS.success} />} label="Sales Monitoring" sub={`${sales.length} records`} accent={COLORS.success} onPress={() => setSection("sales")} />
          <MenuItem icon={<Ionicons name="receipt" size={22} color={COLORS.danger} />} label="Expense Tracking" sub={`KES ${expenses.reduce((a,b)=>a+b.amount,0).toLocaleString()}`} accent={COLORS.danger} onPress={() => setSection("expenses")} />
          <MenuItem icon={<MaterialCommunityIcons name="package-variant-closed" size={22} color={COLORS.warning} />} label="Stock & Inventory" sub={`${products.filter(p => p.currentStock <= p.minStock).length} low stock alerts`} accent={COLORS.warning} onPress={() => setSection("stock")} />
        </View>

        {isDirectorOrCEO && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADMINISTRATION</Text>
            {isDirector && <MenuItem icon={<Ionicons name="people" size={22} color={COLORS.gold} />} label="User Management" sub={`${users.length} system users`} accent={COLORS.gold} onPress={() => setSection("users")} />}
            <MenuItem icon={<Ionicons name="shield-checkmark" size={22} color={COLORS.info} />} label="Audit Logs" sub={`${auditLogs.length} entries`} accent={COLORS.info} onPress={() => { refreshAuditLogs(); setSection("audit"); }} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{currentUser?.name?.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{currentUser?.name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              <RoleBadge role={currentUser?.role || "field_officer"} small />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, sub, accent, onPress }: { icon: React.ReactNode; label: string; sub?: string; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} activeOpacity={0.8}>
      <View style={[styles.menuIcon, { backgroundColor: `${accent}15` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, flex: 1 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.danger}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.danger}20` },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  menuSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  profileAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${COLORS.gold}20`, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.gold },
  profileName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.text, marginBottom: 2 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
});