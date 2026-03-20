"use client";

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData } from "@/context/DataContext";
import { COLORS } from "@/constants/colors";

export function ReportsSection({ onBack }: { onBack: () => void }) {
  const { farmers, farms, workers, payments, sales, expenses } = useData();

  const handleExport = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Generating Report", `Your ${type} report is being compiled and will be sent to your email.`);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Reports & Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={styles.sectionLabel}>QUICK STATS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.miniStat}>
            <Text style={styles.statVal}>{farmers.length}</Text>
            <Text style={styles.statLab}>Farmers</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.statVal}>{farms.length}</Text>
            <Text style={styles.statLab}>Farms</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.statVal}>{workers.length}</Text>
            <Text style={styles.statLab}>Workers</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EXPORT DATA (PDF/CSV)</Text>
        
        <ReportItem 
          icon="cash" 
          label="Payroll Summary" 
          sub="Monthly disbursement breakdown" 
          onPress={() => handleExport("Payroll")} 
        />
        <ReportItem 
          icon="trending-up" 
          label="Sales Performance" 
          sub="Revenue by shop and product" 
          onPress={() => handleExport("Sales")} 
        />
        <ReportItem 
          icon="receipt" 
          label="Expense Audit" 
          sub="Detailed non-payroll spending" 
          onPress={() => handleExport("Expense")} 
        />
        <ReportItem 
          icon="people" 
          label="Worker Attendance" 
          sub="Clock-in/out history logs" 
          onPress={() => handleExport("Attendance")} 
        />
        <ReportItem 
          icon="leaf" 
          label="Farm Productivity" 
          sub="Activity and yield analysis" 
          onPress={() => handleExport("Farm")} 
        />

        <View style={styles.proCard}>
          <MaterialCommunityIcons name="crown" size={24} color={COLORS.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.proTitle}>Advanced Analytics</Text>
            <Text style={styles.proDesc}>Unlock predictive yield modeling and satellite farm monitoring.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ReportItem({ icon, label, sub, onPress }: { icon: any, label: string, sub: string, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.reportItem} onPress={onPress}>
      <View style={styles.reportIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reportLabel}>{label}</Text>
        <Text style={styles.reportSub}>{sub}</Text>
      </View>
      <Ionicons name="download-outline" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  statsGrid: { flexDirection: "row", gap: 12 },
  miniStat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  statVal: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text },
  statLab: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  reportItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 14 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.primary}15`, alignItems: "center", justifyContent: "center" },
  reportLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  reportSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  proCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: `${COLORS.gold}10`, padding: 20, borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: `${COLORS.gold}30` },
  proTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: COLORS.gold },
  proDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});