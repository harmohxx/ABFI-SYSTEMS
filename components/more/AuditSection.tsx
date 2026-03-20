import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "@/context/DataContext";
import { COLORS, ROLE_LABELS } from "@/constants/colors";

export function AuditSection({ onBack }: { onBack: () => void }) {
  const { auditLogs } = useData();
  const [search, setSearch] = useState("");
  const filtered = search
    ? auditLogs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.userName.toLowerCase().includes(search.toLowerCase()))
    : auditLogs;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Audit Logs</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search logs..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.auditItem}>
            <View style={styles.auditDot} />
            <View style={{ flex: 1 }}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{item.action.replace(/_/g, " ")}</Text>
                <Text style={styles.auditTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.auditDetails}>{item.details}</Text>
              <Text style={styles.auditUser}>{item.userName} · {ROLE_LABELS[item.userRole] || item.userRole}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  auditItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  auditDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 5 },
  auditHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  auditAction: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.text },
  auditTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  auditDetails: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  auditUser: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});