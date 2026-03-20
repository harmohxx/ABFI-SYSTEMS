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
import { useData, Task } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

export function TasksSection({ onBack }: { onBack: () => void }) {
  const { tasks, farms, workers, addTask, updateTask, deleteTask } = useData();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", farmId: "", assignedToId: "", dueDate: new Date().toISOString().slice(0, 10), priority: "medium" as Task["priority"] });

  const handleAdd = async () => {
    if (!form.title.trim() || !form.farmId) return Alert.alert("Required", "Title and farm required");
    const farm = farms.find(f => f.id === form.farmId);
    const worker = workers.find(w => w.id === form.assignedToId);
    await addTask({
      title: form.title.trim(),
      description: form.description.trim(),
      farmId: form.farmId,
      farmName: farm?.name || "",
      assignedToId: form.assignedToId || null,
      assignedToName: worker?.name || null,
      dueDate: form.dueDate,
      status: "pending",
      priority: form.priority,
    });
    setForm({ title: "", description: "", farmId: "", assignedToId: "", dueDate: new Date().toISOString().slice(0, 10), priority: "medium" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus: Task["status"] = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "completed" : "pending";
    await updateTask(task.id, { status: nextStatus });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Task Management</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowModal(true)}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {tasks.map((task) => (
          <View key={task.id} style={[styles.taskCard, task.status === "completed" && { opacity: 0.6 }]}>
            <TouchableOpacity style={styles.statusCheck} onPress={() => toggleStatus(task)}>
              <Ionicons name={task.status === "completed" ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.status === "completed" ? COLORS.success : COLORS.textMuted} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, task.status === "completed" && { textDecorationLine: "line-through" }]}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.farmName} · Due: {task.dueDate}</Text>
              {task.assignedToName && <Text style={styles.taskAssignee}>Assigned to: {task.assignedToName}</Text>}
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: task.priority === "high" ? `${COLORS.danger}15` : task.priority === "medium" ? `${COLORS.warning}15` : `${COLORS.info}15` }]}>
              <Text style={[styles.priorityText, { color: task.priority === "high" ? COLORS.danger : task.priority === "medium" ? COLORS.warning : COLORS.info }]}>{task.priority.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Task</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}><Text style={styles.fieldLabel}>Task Title *</Text><TextInput style={styles.fieldInput} placeholder="Spray Maize" placeholderTextColor={COLORS.textMuted} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} /></View>
              <View style={styles.formField}><Text style={styles.fieldLabel}>Description</Text><TextInput style={styles.fieldInput} placeholder="Use the new pesticide" placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} /></View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Farm *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {farms.map(f => (
                    <TouchableOpacity key={f.id} style={[styles.catBtn, form.farmId === f.id && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, farmId: f.id }))}>
                      <Text style={[styles.catBtnText, form.farmId === f.id && { color: COLORS.primary }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Assign To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {workers.map(w => (
                    <TouchableOpacity key={w.id} style={[styles.catBtn, form.assignedToId === w.id && styles.catBtnActive]} onPress={() => setForm(p => ({ ...p, assignedToId: w.id }))}>
                      <Text style={[styles.catBtnText, form.assignedToId === w.id && { color: COLORS.primary }]}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Create</Text></TouchableOpacity>
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
  taskCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  statusCheck: { padding: 4 },
  taskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  taskMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  taskAssignee: { fontFamily: "Inter_500Medium", fontSize: 11, color: COLORS.primary, marginTop: 4 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontFamily: "Inter_700Bold", fontSize: 10 },
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