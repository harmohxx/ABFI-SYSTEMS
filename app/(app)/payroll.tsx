import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, Payment } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  approved: COLORS.info,
  rejected: COLORS.danger,
  completed: COLORS.success,
};

function genRef() {
  return `PAY-${Date.now().toString().slice(-8)}`;
}

export default function PayrollScreen() {
  const { workers, payments, addPayment, updatePayment, executeMpesaPayment } = useData();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed">("all");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [form, setForm] = useState({
    workerId: "", amount: "", method: "mpesa" as Payment["method"], notes: "",
  });

  const isCEO = currentUser?.role === "ceo";
  const isDirector = currentUser?.role === "director";
  const canInitiate = ["director", "manager", "accountant"].includes(currentUser?.role || "");
  const canApprove = isDirector || isCEO;
  const canExecute = isDirector || isCEO;

  const filtered = useMemo(() => {
    if (filter === "all") return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const totalPending = useMemo(
    () => payments.filter((p) => p.status === "pending").reduce((a, b) => a + b.amount, 0),
    [payments]
  );
  const totalCompleted = useMemo(
    () => payments.filter((p) => p.status === "completed").reduce((a, b) => a + b.amount, 0),
    [payments]
  );

  const handleInitiate = async () => {
    if (!form.workerId || !form.amount) {
      Alert.alert("Required", "Worker and amount are required");
      return;
    }
    const worker = workers.find((w) => w.id === form.workerId);
    if (!worker) return;
    await addPayment({
      workerId: worker.id,
      workerName: worker.name,
      farmId: worker.farmId,
      farmName: worker.farmName,
      amount: parseFloat(form.amount),
      method: form.method,
      status: "pending",
      initiatedBy: currentUser?.name || "",
      approvedBy: null,
      reference: genRef(),
      notes: form.notes.trim(),
    });
    setForm({ workerId: "", amount: "", method: "mpesa", notes: "" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleApprove = (payment: Payment) => {
    Alert.alert("Approve Payment", `Approve KES ${payment.amount.toLocaleString()} for ${payment.workerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          await updatePayment(payment.id, {
            status: "approved",
            approvedBy: currentUser?.name || "",
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handlePayNow = (payment: Payment) => {
    if (!canExecute) {
      Alert.alert("Access Denied", "Only the Director or CEO can execute M-Pesa disbursements.");
      return;
    }

    Alert.alert(
      "Confirm M-Pesa Disbursement",
      `Disburse KES ${payment.amount.toLocaleString()} to ${payment.workerName} via M-Pesa?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            setIsProcessing(payment.id);
            const result = await executeMpesaPayment(payment.id);
            setIsProcessing(null);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "M-Pesa disbursement completed successfully.");
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", result.error || "M-Pesa transaction failed.");
            }
          },
        },
      ]
    );
  };

  const handleReject = (payment: Payment) => {
    Alert.alert("Reject Payment", `Reject payment for ${payment.workerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          await updatePayment(payment.id, { status: "rejected", approvedBy: currentUser?.name || "" });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Payroll</Text>
        {canInitiate && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>KES {totalPending.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: `${COLORS.success}25` }]}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>KES {totalCompleted.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(["all", "pending", "approved", "completed"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && { color: COLORS.primary }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No payment records</Text>
            {canInitiate && <Text style={styles.emptySubText}>Tap + to initiate a payment</Text>}
          </View>
        ) : (
          filtered.map((p) => (
            <View key={p.id} style={styles.cardWrapper}>
              <View style={styles.payCard}>
                <View style={styles.payCardHeader}>
                  <View>
                    <Text style={styles.payWorker}>{p.workerName}</Text>
                    <Text style={styles.payFarm}>{p.farmName}</Text>
                  </View>
                  <View style={styles.payRight}>
                    <Text style={styles.payAmount}>KES {p.amount.toLocaleString()}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[p.status]}15` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] }]}>
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.payMeta}>
                  <View style={styles.metaTag}>
                    <MaterialCommunityIcons
                      name={p.method === "mpesa" ? "cellphone-arrow-down" : "bank"}
                      size={12}
                      color={p.method === "mpesa" ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.metaText, p.method === "mpesa" && { color: COLORS.primary, fontWeight: "600" }]}>
                      {p.method === "mpesa" ? "M-Pesa B2C" : "Bank Transfer"}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{p.reference}</Text>
                  <Text style={styles.metaText}>
                    {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </Text>
                </View>

                {p.status === "pending" && canApprove && (
                  <View style={styles.approvalRow}>
                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: `${COLORS.info}15`, borderColor: `${COLORS.info}30` }]}
                      onPress={() => handleApprove(p)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.info} />
                      <Text style={[styles.approvalBtnText, { color: COLORS.info }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approvalBtn, { backgroundColor: `${COLORS.danger}15`, borderColor: `${COLORS.danger}30` }]}
                      onPress={() => handleReject(p)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                      <Text style={[styles.approvalBtnText, { color: COLORS.danger }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {p.status === "approved" && (
                  <View style={styles.executionRow}>
                    {canExecute ? (
                      <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => handlePayNow(p)}
                        disabled={isProcessing === p.id}
                      >
                        {isProcessing === p.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="cellphone-arrow-down" size={18} color="#fff" />
                            <Text style={styles.payNowBtnText}>Pay via M-Pesa Now</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.ceoNotice}>
                        <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />
                        <Text style={styles.ceoNoticeText}>Awaiting CEO/Director Disbursement</Text>
                      </View>
                    )}
                  </View>
                )}

                {p.approvedBy && (
                  <Text style={styles.approvedBy}>
                    {p.status === "completed" ? "Disbursed" : "Approved"} by {p.approvedBy}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Initiate Payment</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Select Worker *</Text>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {workers.filter((w) => w.active).map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.workerOption, form.workerId === w.id && styles.workerOptionActive]}
                      onPress={() => setForm((p) => ({ ...p, workerId: w.id }))}
                    >
                      <Text style={[styles.workerOptionText, form.workerId === w.id && { color: COLORS.primary }]}>
                        {w.name} — {w.farmName}
                      </Text>
                      {w.wageAmount > 0 && (
                        <Text style={styles.workerWage}>KES {w.wageAmount.toLocaleString()}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Amount (KES) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="5000"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.amount}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Payment Method</Text>
                <View style={styles.methodSelector}>
                  <TouchableOpacity
                    style={[styles.methodOption, form.method === "mpesa" && styles.methodOptionActive]}
                    onPress={() => setForm((p) => ({ ...p, method: "mpesa" }))}
                  >
                    <Ionicons name="phone-portrait" size={18} color={form.method === "mpesa" ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.methodText, form.method === "mpesa" && { color: COLORS.primary }]}>M-Pesa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodOption, form.method === "bank" && styles.methodOptionActive]}
                    onPress={() => setForm((p) => ({ ...p, method: "bank" }))}
                  >
                    <Ionicons name="business" size={18} color={form.method === "bank" ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.methodText, form.method === "bank" && { color: COLORS.primary }]}>Bank</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleInitiate}>
                <Text style={styles.saveBtnText}>Submit</Text>
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
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, flex: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  summaryRow: { flexDirection: "row", gap: 12, margin: 20, marginBottom: 0 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.warning}25`,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: COLORS.warning,
    marginBottom: 4,
  },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  filterRow: { paddingHorizontal: 20, marginVertical: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  empty: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 20 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textMuted, fontSize: 15 },
  emptySubText: { fontFamily: "Inter_400Regular", color: COLORS.textMuted, fontSize: 13 },
  cardWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  payCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  payWorker: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  payFarm: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  payRight: { alignItems: "flex-end", gap: 6 },
  payAmount: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.gold },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
  payMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  metaTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  approvalRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  approvalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  approvalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  executionRow: { marginTop: 4 },
  payNowBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  payNowBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  ceoNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ceoNoticeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.textMuted },
  approvedBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
    fontStyle: "italic",
  },
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
  workerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workerOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  workerOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  workerWage: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.gold },
  methodSelector: { flexDirection: "row", gap: 12 },
  methodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  methodText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
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