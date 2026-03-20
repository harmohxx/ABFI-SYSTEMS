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
import { useData, Product } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

export function StockSection({ onBack }: { onBack: () => void }) {
  const { products, addProduct, addStockTransaction } = useData();
  const { currentUser } = useAuth();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState("");
  const [pUnit, setPUnit] = useState("");
  const [pMinStock, setPMinStock] = useState("");
  const [txType, setTxType] = useState<"in" | "out">("in");
  const [txQty, setTxQty] = useState("");
  const [txNotes, setTxNotes] = useState("");

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  const handleAddProduct = async () => {
    if (!pName.trim()) return Alert.alert("Required", "Product name required");
    await addProduct({ name: pName.trim(), unit: pUnit.trim() || "units", currentStock: 0, minStock: parseFloat(pMinStock) || 10, location: "warehouse" });
    setPName(""); setPUnit(""); setPMinStock(""); setShowProductModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddTx = async () => {
    if (!selectedProduct || !txQty) return Alert.alert("Required", "Quantity required");
    await addStockTransaction({ productId: selectedProduct.id, productName: selectedProduct.name, type: txType, quantity: parseInt(txQty), shopId: null, notes: txNotes.trim(), recordedBy: currentUser?.name || "" });
    setTxQty(""); setTxNotes(""); setShowTxModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Stock & Inventory</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowProductModal(true)}><Ionicons name="add" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {lowStockCount > 0 && (
          <View style={styles.stockAlert}>
            <Ionicons name="warning" size={16} color={COLORS.danger} />
            <Text style={styles.stockAlertText}>{lowStockCount} product{lowStockCount > 1 ? "s" : ""} below minimum stock</Text>
          </View>
        )}
        {products.map((p) => {
          const isLow = p.currentStock <= p.minStock;
          return (
            <View key={p.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productStock}>{p.currentStock} {p.unit} · min: {p.minStock}</Text>
                </View>
                {isLow && <View style={styles.lowBadge}><Text style={styles.lowBadgeText}>LOW</Text></View>}
                <TouchableOpacity style={styles.smBtn} onPress={() => { setSelectedProduct(p); setShowTxModal(true); }}><Ionicons name="swap-vertical" size={18} color={COLORS.primary} /></TouchableOpacity>
              </View>
              <View style={styles.stockBar}><View style={[styles.stockBarFill, { width: `${Math.min(p.currentStock / (p.minStock * 2), 1) * 100}%`, backgroundColor: isLow ? COLORS.danger : COLORS.primary }]} /></View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showProductModal} animationType="slide" transparent onRequestClose={() => setShowProductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Product</Text>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Product Name *</Text><TextInput style={styles.fieldInput} placeholder="Maize Seeds" placeholderTextColor={COLORS.textMuted} value={pName} onChangeText={setPName} /></View>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Unit</Text><TextInput style={styles.fieldInput} placeholder="bags" placeholderTextColor={COLORS.textMuted} value={pUnit} onChangeText={setPUnit} /></View>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Min Stock Alert</Text><TextInput style={styles.fieldInput} placeholder="10" placeholderTextColor={COLORS.textMuted} value={pMinStock} onChangeText={setPMinStock} keyboardType="numeric" /></View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowProductModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}><Text style={styles.saveBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTxModal} animationType="slide" transparent onRequestClose={() => setShowTxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <View style={styles.txTypeSelector}>
              <TouchableOpacity style={[styles.txTypeBtn, txType === "in" && { borderColor: COLORS.success, backgroundColor: `${COLORS.success}12` }]} onPress={() => setTxType("in")}><Text style={[styles.txTypeBtnText, txType === "in" && { color: COLORS.success }]}>Stock In</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.txTypeBtn, txType === "out" && { borderColor: COLORS.danger, backgroundColor: `${COLORS.danger}12` }]} onPress={() => setTxType("out")}><Text style={[styles.txTypeBtnText, txType === "out" && { color: COLORS.danger }]}>Stock Out</Text></TouchableOpacity>
            </View>
            <View style={styles.formField}><Text style={styles.fieldLabel}>Quantity *</Text><TextInput style={styles.fieldInput} placeholder="0" placeholderTextColor={COLORS.textMuted} value={txQty} onChangeText={setTxQty} keyboardType="numeric" /></View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTxModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTx}><Text style={styles.saveBtnText}>Confirm</Text></TouchableOpacity>
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
  stockAlert: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${COLORS.danger}10`, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: `${COLORS.danger}25` },
  stockAlertText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.danger, flex: 1 },
  productCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  productHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  productStock: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  lowBadge: { backgroundColor: `${COLORS.danger}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  lowBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: COLORS.danger },
  stockBar: { height: 4, backgroundColor: COLORS.surface3, borderRadius: 2, overflow: "hidden" },
  stockBarFill: { height: "100%", borderRadius: 2 },
  txTypeSelector: { flexDirection: "row", gap: 12, marginBottom: 14 },
  txTypeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, backgroundColor: COLORS.surface2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  txTypeBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
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