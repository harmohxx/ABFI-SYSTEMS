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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth, AppUser, UserRole } from "@/context/AuthContext";
import { COLORS, ROLE_COLORS, ROLE_LABELS } from "@/constants/colors";
import { RoleBadge } from "@/components/RoleBadge";

const ROLES: UserRole[] = ["ceo", "manager", "accountant", "field_officer"];

export function UsersSection({ onBack }: { onBack: () => void }) {
  const { users, addUser, removeUser, updateUser, currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" as UserRole });

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return Alert.alert("Required", "All fields required");
    await addUser({ name: form.name.trim(), email: form.email.trim(), password: form.password.trim(), role: form.role, active: true, createdBy: currentUser?.id || "" });
    setForm({ name: "", email: "", password: "", role: "manager" }); setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>User Management</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowModal(true)}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {otherUsers.map((user) => (
          <View key={user.id} style={[styles.userCard, !user.active && { opacity: 0.6 }]}>
            <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <RoleBadge role={user.role} small />
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Remove User", `Remove ${user.name}?`, [{ text: "Cancel" }, { text: "Remove", style: "destructive", onPress: () => removeUser(user.id) }])}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add System User</Text>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Full Name *</Text><TextInput style={styles.fieldInput} placeholder="Jane Wanjiku" placeholderTextColor={COLORS.textMuted} value={form.name} onChangeText={(v) => setForm(p => ({ ...p, name: v }))} /></View>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Email *</Text><TextInput style={styles.fieldInput} placeholder="jane@abfi.com" placeholderTextColor={COLORS.textMuted} value={form.email} onChangeText={(v) => setForm(p => ({ ...p, email: v }))} autoCapitalize="none" /></View>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Password *</Text><TextInput style={styles.fieldInput} placeholder="Secure password" placeholderTextColor={COLORS.textMuted} value={form.password} onChangeText={(v) => setForm(p => ({ ...p, password: v }))} secureTextEntry /></View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Add User</Text></TouchableOpacity>
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
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  userAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: `${COLORS.primary}15`, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.primary },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});