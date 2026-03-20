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
import { useData, Expense } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

const CATEGORIES = ["Fertilizer", "Seeds", "Fuel", "Equipment", "Transport", "Maintenance", "Other"];

export function ExpensesSection({ onBack }: { onBack: () => void }) {
  const { expenses, farms, addExpense, deleteExpense } = useData();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "Fertilizer", amount: "", farmId: "", description: "", date: new Date().toISOString().slice(0, 10) });

  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);

  const handleAdd = async () => {
    if (!form.amount || !form.description.trim()) return Alert.alert("Required", "Amount and description required");
    const farm = farms.find(f => f.id === form.farmId);
    await addExpense({
      category: form.category,
      amount: parseFloat(form.amount),
      farmId: form.farmId || null,
      farmName: farm?.name || null,
      description: form.description.trim(),
      date: form.date,
      recordedBy: currentUser?.name || "",
    });
    setForm({ category: "Fertilizer", amount: "", farmId: "", description: "", date: new Date().toISOString().slice(0, 10) });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Expense Tracking</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowModal(true)}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>KES {totalExpenses.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Non-Payroll Expenses</Text>
        </View>

        {expenses.map((ex) => (
          <View key={ex.id} style={styles.expenseCard}>
            <View style={styles.expenseIcon}><MaterialCommunityIcons name="receipt" size={20} color={COLORS.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseDesc}>{ex.description}</Text>
              <Text style={styles.expenseMeta}>{ex.category} · {ex.farmName || "General"} · {ex.date}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.expenseAmount}>KES {ex.amount.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => Alert.alert("Delete", "Delete this record?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteExpense(ex.id) }])}>
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} style={{ marginTop: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Expense</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[styles.catBtn, form.category === c && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, category: c }))}>
                      <Text style={[styles.catBtnText, form.category === c && { color: COLORS.primary }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formField}><Text style={styles.fieldLabel}>Amount (KES) *</Text><TextInput style={styles.fieldInput} placeholder="1500" placeholderTextColor={COLORS.textMuted} value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} keyboardType="numeric" /></View>
              <View style={styles.formField}><Text style={styles.fieldLabel}>Description *</Text><TextInput style={styles.fieldInput} placeholder="Bought 2 bags of fertilizer" placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} /></View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Farm (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity style={[styles.catBtn, !form.farmId && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, farmId: "" }))}><Text style={[styles.catBtnText, !form.farmId && { color: COLORS.primary }]}>General</Text></TouchableOpacity>
                  {farms.map(f => (
                    <TouchableOpacity key={f.id} style={[styles.catBtn, form.farmId === f.id && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, farmId: f.id }))}>
                      <Text style={[styles.catBtnText, form.farmId === f.id && { color: COLORS.primary }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: COLORS.danger, marginBottom: 4 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  expenseCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  expenseIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.gold}15`, alignItems: "center", justifyContent: "center" },
  expenseDesc: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  expenseMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  expenseAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.danger },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  fieldInput: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  catBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});