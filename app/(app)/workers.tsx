import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, Worker } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";
// example: src/screens/FarmScreen.js
import { supabase } from '../lib/supabase';

async function fetchFarms() {
  const { data, error } = await supabase
    .from('farms')
    .select('*');
  if (error) console.error(error);
  else return data;
}
const WAGE_TYPES = ["daily", "weekly", "monthly"] as const;

export default function WorkersScreen() {
  const { workers, farms, addWorker, updateWorker, deleteWorker } = useData();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", role: "", wageType: "monthly" as Worker["wageType"],
    wageAmount: "", farmId: "",
  });

  const filtered = useMemo(
    () => workers.filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.role.toLowerCase().includes(search.toLowerCase()) ||
        w.farmName.toLowerCase().includes(search.toLowerCase())
    ),
    [workers, search]
  );

  const canWrite = ["director", "manager", "field_officer"].includes(currentUser?.role || "");
  const isDirector = currentUser?.role === "director";

  const handleAdd = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.farmId) {
      Alert.alert("Required", "Name, role, and farm are required");
      return;
    }
    const farm = farms.find((f) => f.id === form.farmId);
    await addWorker({
      farmId: form.farmId,
      farmName: farm?.name || "",
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: form.role.trim(),
      wageType: form.wageType,
      wageAmount: parseFloat(form.wageAmount) || 0,
      active: true,
    });
    setForm({ name: "", phone: "", role: "", wageType: "monthly", wageAmount: "", farmId: "" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleActive = async (worker: Worker) => {
    await updateWorker(worker.id, { active: !worker.active });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (w: Worker) => {
    Alert.alert("Remove Worker", `Remove ${w.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteWorker(w.id) },
    ]);
  };

  const wageLabel = (type: string, amount: number) => {
    if (!amount) return "";
    return `KES ${amount.toLocaleString()}/${type === "daily" ? "day" : type === "weekly" ? "wk" : "mo"}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Workers</Text>
        <Text style={styles.subtitle}>{workers.filter((w) => w.active).length} active</Text>
        {canWrite && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search workers..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 100 }}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome5 name="hard-hat" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No workers registered</Text>
            {canWrite && <Text style={styles.emptySubText}>Tap + to add a worker</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, !item.active && { backgroundColor: `${COLORS.textMuted}20` }]}>
                <Text style={[styles.avatarText, !item.active && { color: COLORS.textMuted }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.workerRole}>{item.role}</Text>
                <View style={styles.farmTag}>
                  <Ionicons name="leaf-outline" size={11} color={COLORS.primary} />
                  <Text style={styles.farmTagText}>{item.farmName}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                {wageLabel(item.wageType, item.wageAmount) ? (
                  <Text style={styles.wage}>{wageLabel(item.wageType, item.wageAmount)}</Text>
                ) : null}
                {canWrite && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: item.active ? `${COLORS.success}15` : `${COLORS.danger}15` }]}
                    onPress={() => toggleActive(item)}
                  >
                    <Text style={[styles.statusBtnText, { color: item.active ? COLORS.success : COLORS.danger }]}>
                      {item.active ? "Active" : "Inactive"}
                    </Text>
                  </TouchableOpacity>
                )}
                {isDirector && (
                  <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {item.phone ? (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            ) : null}
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Register Worker</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: "name", label: "Full Name *", placeholder: "Peter Njoroge" },
                { key: "phone", label: "Phone Number", placeholder: "+254 7XX XXX XXX" },
                { key: "role", label: "Job Role *", placeholder: "Farm Hand, Supervisor, Driver..." },
                { key: "wageAmount", label: "Wage Amount (KES)", placeholder: "500" },
              ].map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[field.key]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                    keyboardType={field.key === "wageAmount" ? "numeric" : "default"}
                  />
                </View>
              ))}

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Wage Type</Text>
                <View style={styles.typeSelector}>
                  {WAGE_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeOption, form.wageType === t && styles.typeOptionActive]}
                      onPress={() => setForm((p) => ({ ...p, wageType: t }))}
                    >
                      <Text style={[styles.typeOptionText, form.wageType === t && { color: COLORS.primary }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Assigned Farm *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {farms.map((farm) => (
                      <TouchableOpacity
                        key={farm.id}
                        style={[styles.farmOption, form.farmId === farm.id && styles.farmOptionActive]}
                        onPress={() => setForm((p) => ({ ...p, farmId: farm.id }))}
                      >
                        <Text style={[styles.farmOptionText, form.farmId === farm.id && { color: COLORS.primary }]}>
                          {farm.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {farms.length === 0 && (
                      <Text style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                        No farms. Add a farm first.
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, flex: 1 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textSecondary, fontSize: 15 },
  emptySubText: { fontFamily: "Inter_400Regular", color: COLORS.textMuted, fontSize: 13 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${COLORS.info}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.info },
  workerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  workerRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  farmTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  farmTagText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.primary },
  actions: { alignItems: "flex-end", gap: 6 },
  wage: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.gold },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  detailText: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeSelector: { flexDirection: "row", gap: 10 },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  typeOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  farmOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  farmOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  farmOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.surface2, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
