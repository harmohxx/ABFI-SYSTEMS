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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { useData, Farmer, Farm } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

function generateFarmerId() {
  return `ABFI-F${Date.now().toString().slice(-6)}`;
}

export default function FarmersScreen() {
  const { farmers, farms, addFarmer, updateFarmer, deleteFarmer, addFarm, updateFarm, deleteFarm } = useData();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 67 : insets.top;
  const bottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", nationalId: "", location: "" });
  const [farmForm, setFarmForm] = useState({
    name: "", size: "", type: "crop" as Farm["type"], cropType: "", address: "", latitude: "", longitude: "",
  });

  const filtered = useMemo(
    () => farmers.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.farmerId.toLowerCase().includes(search.toLowerCase())
    ),
    [farmers, search]
  );

  const canWrite = ["director", "manager", "field_officer"].includes(currentUser?.role || "");

  const openAddFarmer = () => {
    setEditingFarmer(null);
    setForm({ name: "", phone: "", email: "", nationalId: "", location: "" });
    setShowModal(true);
  };

  const openEditFarmer = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setForm({ name: farmer.name, phone: farmer.phone, email: farmer.email, nationalId: farmer.nationalId, location: farmer.location });
    setShowModal(true);
  };

  const openAddFarm = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setEditingFarm(null);
    setFarmForm({ name: "", size: "", type: "crop", cropType: "", address: "", latitude: "", longitude: "" });
    setShowFarmModal(true);
  };

  const openEditFarm = (farm: Farm) => {
    const farmer = farmers.find((f) => f.id === farm.farmerId) || null;
    setSelectedFarmer(farmer);
    setEditingFarm(farm);
    setFarmForm({
      name: farm.name,
      size: farm.size,
      type: farm.type,
      cropType: farm.cropType,
      address: farm.address,
      latitude: farm.latitude?.toString() || "",
      longitude: farm.longitude?.toString() || "",
    });
    setShowFarmModal(true);
  };

  const handleCaptureGPS = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to capture GPS coordinates.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setFarmForm(prev => ({
        ...prev,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Could not capture location. Please ensure GPS is enabled.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenMap = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSaveFarmer = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert("Required", "Name and phone are required");
      return;
    }
    if (editingFarmer) {
      await updateFarmer(editingFarmer.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        nationalId: form.nationalId.trim(),
        location: form.location.trim(),
      });
    } else {
      await addFarmer({
        farmerId: generateFarmerId(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        nationalId: form.nationalId.trim(),
        location: form.location.trim(),
      });
    }
    setForm({ name: "", phone: "", email: "", nationalId: "", location: "" });
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveFarm = async () => {
    if (!farmForm.name.trim()) {
      Alert.alert("Required", "Farm name is required");
      return;
    }
    const data = {
      name: farmForm.name.trim(),
      size: farmForm.size.trim(),
      type: farmForm.type,
      cropType: farmForm.cropType.trim(),
      address: farmForm.address.trim(),
      latitude: farmForm.latitude ? parseFloat(farmForm.latitude) : null,
      longitude: farmForm.longitude ? parseFloat(farmForm.longitude) : null,
    };
    if (editingFarm) {
      await updateFarm(editingFarm.id, data);
    } else {
      if (!selectedFarmer) return;
      await addFarm({ ...data, farmerId: selectedFarmer.id, farmerName: selectedFarmer.name, status: "active" });
    }
    setFarmForm({ name: "", size: "", type: "crop", cropType: "", address: "", latitude: "", longitude: "" });
    setShowFarmModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteFarmer = (farmer: Farmer) => {
    Alert.alert("Remove Farmer", `Remove ${farmer.name} and all their farms?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { deleteFarmer(farmer.id); } },
    ]);
  };

  const handleDeleteFarm = (farm: Farm) => {
    Alert.alert("Remove Farm", `Remove ${farm.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { deleteFarm(farm.id); } },
    ]);
  };

  const farmerFarms = (farmerId: string) => farms.filter((f) => f.farmerId === farmerId);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Farmers</Text>
        <Text style={styles.subtitle}>{farmers.length} registered</Text>
        {canWrite && (
          <TouchableOpacity style={styles.addBtn} onPress={openAddFarmer}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search farmers..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottom + 100 }}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No farmers registered yet</Text>
            {canWrite && <Text style={styles.emptySubText}>Tap + to add a farmer</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const ff = farmerFarms(item.id);
          const isExpanded = expandedFarmer === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedFarmer(isExpanded ? null : item.id)}
                activeOpacity={0.75}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.farmerName}>{item.name}</Text>
                  <Text style={styles.farmerId}>{item.farmerId}</Text>
                </View>
                <View style={styles.cardActions}>
                  {canWrite && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openAddFarm(item)}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEditFarmer(item)}
                      >
                        <Ionicons name="create-outline" size={19} color={COLORS.gold} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeleteFarmer(item)}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </>
                  )}
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={COLORS.textMuted}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.cardDetails}>
                {item.phone ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{item.phone}</Text>
                  </View>
                ) : null}
                {item.location ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{item.location}</Text>
                  </View>
                ) : null}
              </View>

              {isExpanded && ff.length > 0 && (
                <View style={styles.farmsSection}>
                  <Text style={styles.farmsSectionTitle}>Farms ({ff.length})</Text>
                  {ff.map((f) => (
                    <View key={f.id} style={styles.farmRow}>
                      <Ionicons name="leaf-outline" size={14} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmRowName}>{f.name}</Text>
                        <Text style={styles.farmRowSub}>{f.size ? `${f.size} ha` : "?"} • {f.cropType || f.type}</Text>
                        {f.latitude && f.longitude && (
                          <TouchableOpacity 
                            style={styles.gpsBadge}
                            onPress={() => handleOpenMap(f.latitude!, f.longitude!, f.name)}
                          >
                            <Ionicons name="map-outline" size={10} color={COLORS.info} />
                            <Text style={styles.gpsText}>View on Map</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {canWrite && (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity onPress={() => openEditFarm(f)}>
                            <Ionicons name="create-outline" size={17} color={COLORS.gold} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteFarm(f)}>
                            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
              {!isExpanded && ff.length > 0 && (
                <View style={styles.farmsChips}>
                  {ff.map((f) => (
                    <View key={f.id} style={styles.farmChip}>
                      <Ionicons name="leaf-outline" size={11} color={COLORS.primary} />
                      <Text style={styles.farmChipText}>{f.name} • {f.size || "?"} ha</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingFarmer ? "Edit Farmer" : "Register Farmer"}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: "name", label: "Full Name *", placeholder: "John Kamau" },
                { key: "phone", label: "Phone Number *", placeholder: "+254 7XX XXX XXX", keyboard: "phone-pad" },
                { key: "email", label: "Email", placeholder: "john@email.com", keyboard: "email-address" },
                { key: "nationalId", label: "National ID", placeholder: "12345678" },
                { key: "location", label: "Location", placeholder: "Nakuru, Kenya" },
              ].map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[field.key]}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [field.key]: v }))}
                    keyboardType={(field.keyboard as any) || "default"}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFarmer}>
                <Text style={styles.saveBtnText}>{editingFarmer ? "Save Changes" : "Register"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showFarmModal} animationType="slide" transparent onRequestClose={() => setShowFarmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingFarm ? "Edit Farm" : "Add Farm"}</Text>
            {!editingFarm && <Text style={styles.modalSubtitle}>{selectedFarmer?.name}</Text>}
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: "name", label: "Farm Name *", placeholder: "Green Valley Farm" },
                { key: "size", label: "Size (hectares)", placeholder: "5.2", keyboard: "decimal-pad" },
                { key: "cropType", label: "Crop / Livestock Type", placeholder: "Maize, Dairy" },
                { key: "address", label: "Address", placeholder: "Nakuru-Eldoret Rd, Rift Valley" },
              ].map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(farmForm as any)[field.key]}
                    onChangeText={(v) => setFarmForm((prev) => ({ ...prev, [field.key]: v }))}
                    keyboardType={(field.keyboard as any) || "default"}
                  />
                </View>
              ))}

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>GPS Coordinates</Text>
                <View style={styles.gpsRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.fieldInput, { marginBottom: 8 }]}
                      placeholder="Latitude"
                      placeholderTextColor={COLORS.textMuted}
                      value={farmForm.latitude}
                      onChangeText={(v) => setFarmForm(p => ({ ...p, latitude: v }))}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Longitude"
                      placeholderTextColor={COLORS.textMuted}
                      value={farmForm.longitude}
                      onChangeText={(v) => setFarmForm(p => ({ ...p, longitude: v }))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.gpsBtn} 
                    onPress={handleCaptureGPS}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                        <Text style={styles.gpsBtnText}>Capture</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Farm Type</Text>
                <View style={styles.typeSelector}>
                  {(["crop", "livestock", "mixed"] as Farm["type"][]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeOption, farmForm.type === t && styles.typeOptionActive]}
                      onPress={() => setFarmForm((prev) => ({ ...prev, type: t }))}
                    >
                      <Text style={[styles.typeOptionText, farmForm.type === t && { color: COLORS.primary }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFarmModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFarm}>
                <Text style={styles.saveBtnText}>{editingFarm ? "Save Changes" : "Add Farm"}</Text>
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
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text, flex: 1 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: "600" },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${COLORS.primary}20`, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  farmerName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  farmerId: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtn: { padding: 4 },
  cardDetails: {
    flexDirection: "row", gap: 16, flexWrap: "wrap",
    paddingHorizontal: 14, paddingBottom: 10,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailText: { fontSize: 12, color: COLORS.textSecondary },

  farmsSection: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  farmsSectionTitle: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  farmRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.bg, borderRadius: 10, padding: 10,
  },
  farmRowName: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  farmRowSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  gpsBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    marginTop: 4,
    backgroundColor: `${COLORS.info}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  gpsText: { fontSize: 10, color: COLORS.info, fontFamily: "Inter_600SemiBold" },

  farmsChips: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  farmChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: `${COLORS.primary}12`, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  farmChipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "90%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: COLORS.bg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: COLORS.text,
  },
  gpsRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  gpsBtn: {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1, borderColor: `${COLORS.primary}30`,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  gpsBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  typeSelector: { flexDirection: "row", gap: 8, marginTop: 4 },
  typeOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg, alignItems: "center",
  },
  typeOptionActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  typeOptionText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: "600" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontSize: 15, color: "#fff", fontWeight: "700" },
});