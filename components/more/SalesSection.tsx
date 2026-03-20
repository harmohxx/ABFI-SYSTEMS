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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

export function SalesSection({ onBack }: { onBack: () => void }) {
  const { sales, shops, addSale, addShop } = useData();
  const { currentUser } = useAuth();
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [saleShopId, setSaleShopId] = useState("");
  const [saleProduct, setSaleProduct] = useState("");
  const [saleQty, setSaleQty] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

  const totalRevenue = sales.reduce((a, b) => a + b.totalRevenue, 0);
  const todaySales = sales.filter((s) => s.date === new Date().toISOString().slice(0, 10));

  const handleAddShop = async () => {
    if (!shopName.trim()) return Alert.alert("Required", "Shop name required");
    await addShop({ name: shopName.trim(), location: shopLocation.trim(), managerId: currentUser?.id || "", active: true });
    setShopName("");
    setShopLocation("");
    setShowShopModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddSale = async () => {
    if (!saleShopId || !saleProduct.trim() || !saleQty || !salePrice) {
      return Alert.alert("Required", "All fields are required");
    }
    const shop = shops.find((s) => s.id === saleShopId);
    const qty = parseInt(saleQty);
    const price = parseFloat(salePrice);
    await addSale({
      shopId: saleShopId,
      shopName: shop?.name || "",
      products: [{ name: saleProduct.trim(), quantity: qty, unitPrice: price }],
      totalRevenue: qty * price,
      recordedBy: currentUser?.name || "",
      date: saleDate,
    });
    setSaleProduct("");
    setSaleQty("");
    setSalePrice("");
    setShowSaleModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Sales Monitoring</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.smBtn} onPress={() => setShowShopModal(true)}>
            <MaterialCommunityIcons name="store-plus" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smBtn} onPress={() => setShowSaleModal(true)}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.salesSummary}>
          <View style={styles.salesSummaryCard}>
            <Text style={styles.salesSummaryValue}>KES {totalRevenue.toLocaleString()}</Text>
            <Text style={styles.salesSummaryLabel}>Total Revenue</Text>
          </View>
          <View style={styles.salesSummaryCard}>
            <Text style={[styles.salesSummaryValue, { color: COLORS.info }]}>{todaySales.length}</Text>
            <Text style={styles.salesSummaryLabel}>Today's Sales</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SHOPS ({shops.length})</Text>
        {shops.map((shop) => {
          const shopSales = sales.filter((s) => s.shopId === shop.id);
          const shopRevenue = shopSales.reduce((a, b) => a + b.totalRevenue, 0);
          return (
            <View key={shop.id} style={styles.shopCard}>
              <View style={styles.shopIcon}>
                <MaterialCommunityIcons name="store" size={20} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{shop.name}</Text>
                {shop.location ? <Text style={styles.shopLocation}>{shop.location}</Text> : null}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.shopRevenue}>KES {shopRevenue.toLocaleString()}</Text>
                <Text style={styles.shopSalesCount}>{shopSales.length} sales</Text>
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>RECENT SALES</Text>
        {sales.slice(0, 20).map((sale) => (
          <View key={sale.id} style={styles.saleItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleName}>{sale.products.map((p) => p.name).join(", ")}</Text>
              <Text style={styles.saleMeta}>{sale.shopName} · {sale.date}</Text>
            </View>
            <Text style={styles.saleRevenue}>KES {sale.totalRevenue.toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showShopModal} animationType="slide" transparent onRequestClose={() => setShowShopModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Shop</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Shop Name *</Text>
              <TextInput style={styles.fieldInput} placeholder="ABFI Nakuru Outlet" placeholderTextColor={COLORS.textMuted} value={shopName} onChangeText={setShopName} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput style={styles.fieldInput} placeholder="Nakuru Town" placeholderTextColor={COLORS.textMuted} value={shopLocation} onChangeText={setShopLocation} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowShopModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddShop}><Text style={styles.saveBtnText}>Add Shop</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSaleModal} animationType="slide" transparent onRequestClose={() => setShowSaleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Sale</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Shop *</Text>
                {shops.map((s) => (
                  <TouchableOpacity key={s.id} style={[styles.shopOption, saleShopId === s.id && styles.shopOptionActive]} onPress={() => setSaleShopId(s.id)}>
                    <Text style={[styles.shopOptionText, saleShopId === s.id && { color: COLORS.primary }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product *</Text>
                <TextInput style={styles.fieldInput} placeholder="Maize bags" placeholderTextColor={COLORS.textMuted} value={saleProduct} onChangeText={setSaleProduct} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Quantity *</Text>
                <TextInput style={styles.fieldInput} placeholder="50" placeholderTextColor={COLORS.textMuted} value={saleQty} onChangeText={setSaleQty} keyboardType="numeric" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Unit Price *</Text>
                <TextInput style={styles.fieldInput} placeholder="3500" placeholderTextColor={COLORS.textMuted} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSaleModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSale}><Text style={styles.saveBtnText}>Record</Text></TouchableOpacity>
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
  headerBtns: { flexDirection: "row", gap: 8 },
  smBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: `${COLORS.primary}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${COLORS.primary}25` },
  salesSummary: { flexDirection: "row", gap: 12, marginBottom: 20 },
  salesSummaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  salesSummaryValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.success, marginBottom: 4 },
  salesSummaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  shopCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  shopIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.success}15`, alignItems: "center", justifyContent: "center" },
  shopName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  shopLocation: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  shopRevenue: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.gold },
  shopSalesCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  saleItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  saleName: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.text },
  saleMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  saleRevenue: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.success },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  shopOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 6, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border },
  shopOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  shopOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});