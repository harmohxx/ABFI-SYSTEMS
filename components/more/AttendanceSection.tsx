"use client";

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, Worker, Attendance } from "@/context/DataContext";
import { COLORS } from "@/constants/colors";

export function AttendanceSection({ onBack }: { onBack: () => void }) {
  const { workers, attendance, markAttendance, farms } = useData();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const farmWorkers = useMemo(() => {
    return workers.filter(w => w.active && (!selectedFarmId || w.farmId === selectedFarmId));
  }, [workers, selectedFarmId]);

  const todayAttendance = useMemo(() => {
    return attendance.filter(a => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const handleMark = async (worker: Worker, status: Attendance["status"]) => {
    const existing = todayAttendance.find(a => a.workerId === worker.id);
    if (existing) {
      Alert.alert("Already Marked", `${worker.name}'s attendance for today is already recorded.`);
      return;
    }

    await markAttendance({
      workerId: worker.id,
      workerName: worker.name,
      farmId: worker.farmId,
      farmName: worker.farmName,
      date: selectedDate,
      status,
      clockIn: status === "present" ? new Date().toLocaleTimeString() : null,
      clockOut: null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Worker Attendance</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Farm</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          <TouchableOpacity 
            style={[styles.farmChip, !selectedFarmId && styles.farmChipActive]} 
            onPress={() => setSelectedFarmId(null)}
          >
            <Text style={[styles.farmChipText, !selectedFarmId && { color: COLORS.primary }]}>All Farms</Text>
          </TouchableOpacity>
          {farms.map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[styles.farmChip, selectedFarmId === f.id && styles.farmChipActive]} 
              onPress={() => setSelectedFarmId(f.id)}
            >
              <Text style={[styles.farmChipText, selectedFarmId === f.id && { color: COLORS.primary }]}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={farmWorkers}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const record = todayAttendance.find(a => a.workerId === item.id);
          return (
            <View style={styles.workerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.workerRole}>{item.role} · {item.farmName}</Text>
              </View>
              {record ? (
                <View style={[styles.statusBadge, { backgroundColor: record.status === "present" ? `${COLORS.success}15` : record.status === "absent" ? `${COLORS.danger}15` : `${COLORS.warning}15` }]}>
                  <Text style={[styles.statusText, { color: record.status === "present" ? COLORS.success : record.status === "absent" ? COLORS.danger : COLORS.warning }]}>
                    {record.status.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.markActions}>
                  <TouchableOpacity style={[styles.markBtn, { backgroundColor: `${COLORS.success}15` }]} onPress={() => handleMark(item, "present")}>
                    <Ionicons name="checkmark" size={18} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.markBtn, { backgroundColor: `${COLORS.warning}15` }]} onPress={() => handleMark(item, "half_day")}>
                    <Ionicons name="remove" size={18} color={COLORS.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.markBtn, { backgroundColor: `${COLORS.danger}15` }]} onPress={() => handleMark(item, "absent")}>
                    <Ionicons name="close" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-off" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No active workers found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  filterContainer: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, marginBottom: 10, textTransform: "uppercase" },
  farmChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  farmChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  farmChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  workerCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  workerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  workerRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  markActions: { flexDirection: "row", gap: 8 },
  markBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", marginTop: 100, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textMuted, fontSize: 15 },
});