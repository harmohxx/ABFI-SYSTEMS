import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useData, Product } from "@/context/DataContext";
import { COLORS, ROLE_COLORS, ROLE_LABELS } from "@/constants/colors";
import { RoleBadge } from "@/components/RoleBadge";
import type { AppUser, UserRole } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
// example: src/screens/FarmScreen.js
type Section = "main" | "sales" | "stock" | "users" | "audit";

const ROLES: UserRole[] = ["ceo", "manager", "accountant", "field_officer"];

export default function MoreScreen() {
  const { currentUser, users, addUser, removeUser, updateUser, logout } = useAuth();
  const { sales, products, addSale, addProduct, addStockTransaction, shops, addShop, refreshAuditLogs, auditLogs } = useData();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [section, setSection] = useState<Section>("main");

  const isDirector = currentUser?.role === "director";
  const isDirectorOrCEO = currentUser?.role === "director" || currentUser?.role === "ceo";

  const renderSection = () => {
    if (section === "sales") return <SalesSection onBack={() => setSection("main")} />;
    if (section === "stock") return <StockSection onBack={() => setSection("main")} />;
    if (section === "users") return <UsersSection onBack={() => setSection("main")} />;
    if (section === "audit") return <AuditSection onBack={() => setSection("main")} />;
    return <MainSection />;
  };

  function MainSection() {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: top + 8 }]}>
          <View>
            <Text style={styles.title}>More</Text>
            <Text style={styles.subtitle}>Additional features & settings</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              logout();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OPERATIONS</Text>
          {[
            {
              icon: <Ionicons name="stats-chart" size={22} color={COLORS.success} />,
              label: "Sales Monitoring",
              sub: `${sales.length} records`,
              accent: COLORS.success,
              onPress: () => setSection("sales"),
            },
            {
              icon: <MaterialCommunityIcons name="package-variant-closed" size={22} color={COLORS.warning} />,
              label: "Stock & Inventory",
              sub: `${products.filter((p) => p.currentStock <= p.minStock).length} low stock alerts`,
              accent: COLORS.warning,
              onPress: () => setSection("stock"),
            },
          ].map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </View>

        {isDirectorOrCEO && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADMINISTRATION</Text>
            {[
              ...(isDirector
                ? [
                    {
                      icon: <Ionicons name="people" size={22} color={COLORS.gold} />,
                      label: "User Management",
                      sub: `${users.length} system users`,
                      accent: COLORS.gold,
                      onPress: () => setSection("users"),
                    },
                  ]
                : []),
              {
                icon: <Ionicons name="shield-checkmark" size={22} color={COLORS.info} />,
                label: "Audit Logs",
                sub: `${auditLogs.length} entries`,
                accent: COLORS.info,
                onPress: () => {
                  refreshAuditLogs();
                  setSection("audit");
                },
              },
            ].map((item) => (
              <MenuItem key={item.label} {...item} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{currentUser?.name?.charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{currentUser?.name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              <RoleBadge role={currentUser?.role || "field_officer"} small />
            </View>
          </View>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ABFI System v1.0.0</Text>
          <Text style={styles.appInfoSub}>Enterprise Farm Management</Text>
          <Text style={styles.appInfoSub}>© 2024 ABFI. All rights reserved.</Text>
        </View>
      </ScrollView>
    );
  }

  return <View style={styles.container}>{renderSection()}</View>;
}

function MenuItem({
  icon,
  label,
  sub,
  accent,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${accent}15` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function SalesSection({ onBack }: { onBack: () => void }) {
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
        {shops.length === 0 && (
          <Text style={{ color: COLORS.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 }}>
            No shops added yet
          </Text>
        )}

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
        {sales.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No sales recorded yet</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showShopModal} animationType="slide" transparent onRequestClose={() => setShowShopModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Shop</Text>
            {[
              { key: "name", label: "Shop Name *", val: shopName, set: setShopName, placeholder: "ABFI Nakuru Outlet" },
              { key: "location", label: "Location", val: shopLocation, set: setShopLocation, placeholder: "Nakuru Town" },
            ].map((f) => (
              <View key={f.key} style={styles.formField}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={f.val}
                  onChangeText={f.set}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowShopModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddShop}>
                <Text style={styles.saveBtnText}>Add Shop</Text>
              </TouchableOpacity>
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
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.shopOption, saleShopId === s.id && styles.shopOptionActive]}
                    onPress={() => setSaleShopId(s.id)}
                  >
                    <Text style={[styles.shopOptionText, saleShopId === s.id && { color: COLORS.primary }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
                {shops.length === 0 && <Text style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "Inter_400Regular" }}>Add a shop first</Text>}
              </View>
              {[
                { label: "Product / Item *", val: saleProduct, set: setSaleProduct, placeholder: "Maize bags", key: "text" },
                { label: "Quantity *", val: saleQty, set: setSaleQty, placeholder: "50", key: "num" },
                { label: "Unit Price (KES) *", val: salePrice, set: setSalePrice, placeholder: "3500", key: "num" },
                { label: "Date", val: saleDate, set: setSaleDate, placeholder: "2024-01-01", key: "text" },
              ].map((f, i) => (
                <View key={i} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={f.val}
                    onChangeText={f.set}
                    keyboardType={f.key === "num" ? "numeric" : "default"}
                  />
                </View>
              ))}
              {saleQty && salePrice ? (
                <Text style={styles.totalCalc}>
                  Total: KES {(parseInt(saleQty || "0") * parseFloat(salePrice || "0")).toLocaleString()}
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSaleModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSale}>
                <Text style={styles.saveBtnText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StockSection({ onBack }: { onBack: () => void }) {
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
    await addProduct({
      name: pName.trim(),
      unit: pUnit.trim() || "units",
      currentStock: 0,
      minStock: parseFloat(pMinStock) || 10,
      location: "warehouse",
    });
    setPName("");
    setPUnit("");
    setPMinStock("");
    setShowProductModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddTx = async () => {
    if (!selectedProduct || !txQty) return Alert.alert("Required", "Quantity required");
    await addStockTransaction({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: txType,
      quantity: parseInt(txQty),
      shopId: null,
      notes: txNotes.trim(),
      recordedBy: currentUser?.name || "",
    });
    setTxQty("");
    setTxNotes("");
    setShowTxModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const stockPercent = (p: Product) => {
    if (p.minStock === 0) return 1;
    return Math.min(p.currentStock / (p.minStock * 2), 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Stock & Inventory</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowProductModal(true)}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {lowStockCount > 0 && (
          <View style={styles.stockAlert}>
            <Ionicons name="warning" size={16} color={COLORS.danger} />
            <Text style={styles.stockAlertText}>{lowStockCount} product{lowStockCount > 1 ? "s" : ""} below minimum stock level</Text>
          </View>
        )}

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No products registered</Text>
          </View>
        ) : (
          products.map((p) => {
            const pct = stockPercent(p);
            const isLow = p.currentStock <= p.minStock;
            return (
              <View key={p.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productStock}>
                      {p.currentStock} {p.unit} · min: {p.minStock}
                    </Text>
                  </View>
                  {isLow && (
                    <View style={styles.lowBadge}>
                      <Text style={styles.lowBadgeText}>LOW</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.smBtn}
                    onPress={() => {
                      setSelectedProduct(p);
                      setShowTxModal(true);
                    }}
                  >
                    <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stockBar}>
                  <View
                    style={[
                      styles.stockBarFill,
                      { width: `${pct * 100}%`, backgroundColor: isLow ? COLORS.danger : COLORS.primary },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showProductModal} animationType="slide" transparent onRequestClose={() => setShowProductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Product</Text>
            {[
              { label: "Product Name *", val: pName, set: setPName, placeholder: "Maize Seeds 100kg" },
              { label: "Unit", val: pUnit, set: setPUnit, placeholder: "bags, litres, kg" },
              { label: "Minimum Stock Alert", val: pMinStock, set: setPMinStock, placeholder: "10" },
            ].map((f, i) => (
              <View key={i} style={styles.formField}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType={i === 2 ? "numeric" : "default"}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowProductModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={styles.saveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTxModal} animationType="slide" transparent onRequestClose={() => setShowTxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>Current Stock: {selectedProduct?.currentStock} {selectedProduct?.unit}</Text>
            <View style={styles.txTypeSelector}>
              <TouchableOpacity
                style={[styles.txTypeBtn, txType === "in" && { borderColor: COLORS.success, backgroundColor: `${COLORS.success}12` }]}
                onPress={() => setTxType("in")}
              >
                <Ionicons name="arrow-down-circle" size={20} color={txType === "in" ? COLORS.success : COLORS.textMuted} />
                <Text style={[styles.txTypeBtnText, txType === "in" && { color: COLORS.success }]}>Stock In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.txTypeBtn, txType === "out" && { borderColor: COLORS.danger, backgroundColor: `${COLORS.danger}12` }]}
                onPress={() => setTxType("out")}
              >
                <Ionicons name="arrow-up-circle" size={20} color={txType === "out" ? COLORS.danger : COLORS.textMuted} />
                <Text style={[styles.txTypeBtnText, txType === "out" && { color: COLORS.danger }]}>Stock Out</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Quantity *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                value={txQty}
                onChangeText={setTxQty}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Optional note..."
                placeholderTextColor={COLORS.textMuted}
                value={txNotes}
                onChangeText={setTxNotes}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTxModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTx}>
                <Text style={styles.saveBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UsersSection({ onBack }: { onBack: () => void }) {
  const { users, addUser, removeUser, updateUser, currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" as UserRole });

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return Alert.alert("Required", "Name, email, and password are required");
    }
    await addUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      role: form.role,
      active: true,
      createdBy: currentUser?.id || "",
    });
    setForm({ name: "", email: "", password: "", role: "manager" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggle = async (user: AppUser) => {
    await updateUser(user.id, { active: !user.active });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemove = (user: AppUser) => {
    Alert.alert("Remove User", `Remove ${user.name}? They will lose all access.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeUser(user.id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>User Management</Text>
        <TouchableOpacity style={styles.smBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.directorInfo}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.gold} />
          <Text style={styles.directorInfoText}>Only the Director can add or remove users</Text>
        </View>

        {otherUsers.map((user) => (
          <View key={user.id} style={[styles.userCard, !user.active && { opacity: 0.6 }]}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <RoleBadge role={user.role} small />
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: user.active ? `${COLORS.success}15` : `${COLORS.danger}15` }]}
                onPress={() => handleToggle(user)}
              >
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: user.active ? COLORS.success : COLORS.danger }}>
                  {user.active ? "Active" : "Disabled"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(user)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {otherUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No other users in the system</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add System User</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: "name", label: "Full Name *", placeholder: "Jane Wanjiku" },
                { key: "email", label: "Email *", placeholder: "jane@abfi.com" },
                { key: "password", label: "Password *", placeholder: "Secure password" },
              ].map((f) => (
                <View key={f.key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[f.key]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                    secureTextEntry={f.key === "password"}
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Role *</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {ROLES.map((r) => {
                    const color = ROLE_COLORS[r] || COLORS.textMuted;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleChip,
                          { borderColor: `${color}40` },
                          form.role === r && { backgroundColor: `${color}18`, borderColor: `${color}80` },
                        ]}
                        onPress={() => setForm((p) => ({ ...p, role: r }))}
                      >
                        <Text style={[styles.roleChipText, { color: form.role === r ? color : COLORS.textMuted }]}>
                          {ROLE_LABELS[r]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AuditSection({ onBack }: { onBack: () => void }) {
  const { auditLogs } = useData();
  const [search, setSearch] = useState("");
  const filtered = search
    ? auditLogs.filter(
        (l) =>
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.details.toLowerCase().includes(search.toLowerCase()) ||
          l.userName.toLowerCase().includes(search.toLowerCase())
      )
    : auditLogs;

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: COLORS.success,
    BIOMETRIC_LOGIN: COLORS.primary,
    LOGOUT: COLORS.textSecondary,
    FARMER_ADDED: COLORS.info,
    FARM_ADDED: COLORS.primary,
    WORKER_ADDED: COLORS.info,
    PAYMENT_INITIATED: COLORS.warning,
    PAYMENT_UPDATED: COLORS.gold,
    SALE_RECORDED: COLORS.success,
    STOCK_IN: COLORS.primary,
    STOCK_OUT: COLORS.warning,
    USER_ADDED: COLORS.gold,
    USER_REMOVED: COLORS.danger,
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Audit Logs</Text>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
        </View>
      </View>

      <View style={[styles.searchBar, { margin: 16, marginBottom: 8 }]}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.auditNote}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
        <Text style={styles.auditNoteText}>Audit logs are immutable and cannot be deleted</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        scrollEnabled
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No audit entries found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = ACTION_COLORS[item.action] || COLORS.textSecondary;
          return (
            <View style={styles.auditItem}>
              <View style={[styles.auditDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.auditHeader}>
                  <Text style={[styles.auditAction, { color }]}>{item.action.replace(/_/g, " ")}</Text>
                  <Text style={styles.auditTime}>
                    {new Date(item.timestamp).toLocaleString("en-KE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.auditDetails}>{item.details}</Text>
                <Text style={styles.auditUser}>{item.userName} · {ROLE_LABELS[item.userRole] || item.userRole}</Text>
              </View>
            </View>
          );
        }}
      />
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
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: `${COLORS.danger}15`,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: `${COLORS.danger}20`,
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  menuSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: `${COLORS.gold}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.gold },
  profileName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.text, marginBottom: 2 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  appInfo: { alignItems: "center", paddingVertical: 32, gap: 4 },
  appInfoText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
  appInfoSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 80 : 56,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  headerBtns: { flexDirection: "row", gap: 8 },
  smBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: `${COLORS.primary}25`,
  },
  lockIcon: { padding: 6 },
  salesSummary: { flexDirection: "row", gap: 12, marginBottom: 20 },
  salesSummaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  salesSummaryValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.success, marginBottom: 4 },
  salesSummaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shopIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: `${COLORS.success}15`,
    alignItems: "center", justifyContent: "center",
  },
  shopName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  shopLocation: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  shopRevenue: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.gold },
  shopSalesCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  saleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  saleName: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.text },
  saleMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  saleRevenue: { fontFamily: "Inter_700Bold", fontSize: 14, color: COLORS.success },
  shopOption: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, marginBottom: 6,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  shopOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  shopOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  totalCalc: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.gold, textAlign: "center", marginBottom: 8 },
  stockAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${COLORS.danger}10`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.danger}25`,
  },
  stockAlertText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.danger, flex: 1 },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  productStock: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  lowBadge: { backgroundColor: `${COLORS.danger}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  lowBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: COLORS.danger },
  stockBar: { height: 4, backgroundColor: COLORS.surface3, borderRadius: 2, overflow: "hidden" },
  stockBarFill: { height: "100%", borderRadius: 2 },
  txTypeSelector: { flexDirection: "row", gap: 12, marginBottom: 14 },
  txTypeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, backgroundColor: COLORS.surface2,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  txTypeBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  directorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${COLORS.gold}10`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.gold}25`,
  },
  directorInfoText: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userAvatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.primary },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  userActions: { gap: 8, alignItems: "flex-end" },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  roleChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  auditNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  auditNoteText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textSecondary },
  auditItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  auditHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  auditAction: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  auditTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  auditDetails: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary },
  auditUser: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontFamily: "Inter_500Medium", color: COLORS.textSecondary, fontSize: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "90%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
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
