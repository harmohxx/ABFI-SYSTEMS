"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, FarmActivity } from "@/context/DataContext";
import { COLORS } from "@/constants/colors";

const ACTIVITY_TYPES = ["Planting", "Spraying", "Fertilizing", "Irrigation", "Harvesting", "Pruning", "Other"];

export function FarmActivitiesSection({ onBack }: { onBack: () => void }) {
  const { farmActivities, farms, addFarmActivity } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ farmId: "", activityType: "Planting", description: "" });

  const handleAdd = async () => {
    if (!form.farmId || !form.description.trim()) return Alert.alert("Required", "Farm and description required");
    const farm = farms.find(f => f.id === form.farmId);
    await addFarmActivity({
      farmId: form.farmId,
      farmName: farm?.name || "",
      activityType: form.activityType,
      description: form.description.trim(),
    });
    setForm({ farmId: "", activityType: "Planting", description: "" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Farm Activities</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowModal(true)}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {farmActivities.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-clock" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No activities recorded yet</Text>
          </View>
        ) : (
          farmActivities.map((act) => (
            <View key={act.id} style={styles.activityCard}>
              <View style={styles.timeline}>
                <View style={styles.dot} />
                <View style={styles.line} />
              </View>
              <View style={styles.content}>
                <View style={styles.actHeader}>
                  <Text style={styles.actType}>{act.activityType}</Text>
                  <Text style={styles.actTime}>{new Date(act.timestamp).toLocaleDateString()} · {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.actFarm}>{act.farmName}</Text>
                <Text style={styles.actDesc}>{act.description}</Text>
                <Text style={styles.actUser}>Recorded by {act.userName}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Activity</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Select Farm *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {farms.map(f => (
                    <TouchableOpacity key={f.id} style={[styles.catBtn, form.farmId === f.id && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, farmId: f.id }))}>
                      <Text style={[styles.catBtnText, form.farmId === f.id && { color: COLORS.primary }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Activity Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {ACTIVITY_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.catBtn, form.activityType === t && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, activityType: t }))}>
                      <Text style={[styles.catBtnText, form.activityType === t && { color: COLORS.primary }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description *</Text>
                <TextInput style={styles.fieldInput} placeholder="What was done? (e.g. Applied 50kg NPK)" placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} multiline />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Record</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  smBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: `${COLORS.primary}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.primary}25` },
  empty: { alignItems: "center", marginTop: 100, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textMuted, fontSize: 15 },
  activityCard: { flexDirection: "row", gap: 16, marginBottom: 4 },
  timeline: { alignItems: "center", width: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, zIndex: 1 },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: -2 },
  content: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  actHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  actType: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.text },
  actTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  actFarm: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.primary, marginBottom: 6 },
  actDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  actUser: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.textMuted, marginTop: 8, fontStyle: "italic" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  fieldInput: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: COLORS.border, minHeight: 80 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  catBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});