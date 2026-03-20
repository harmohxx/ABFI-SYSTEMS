"use client";

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

const COMMODITIES = [
  { id: "1", name: "Maize (90kg Bag)", price: 3600, trend: "up", change: "+150" },
  { id: "2", name: "Beans (Rosecoco)", price: 12500, trend: "down", change: "-200" },
  { id: "3", name: "Potatoes (Medium)", price: 2800, trend: "stable", change: "0" },
  { id: "4", name: "Tomatoes (Crate)", price: 4200, trend: "up", change: "+400" },
  { id: "5", name: "Milk (Per Litre)", price: 55, trend: "stable", change: "0" },
  { id: "6", name: "Onions (Net)", price: 1100, trend: "down", change: "-50" },
];

export function MarketPricesSection({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => 
    COMMODITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Market Prices</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search commodities..." 
          placeholderTextColor={COLORS.textMuted} 
          value={search} 
          onChangeText={setSearch} 
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>Prices are based on average market rates in Nakuru and Nairobi hubs.</Text>
        </View>

        {filtered.map((item) => (
          <View key={item.id} style={styles.priceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.trendRow}>
                <Ionicons 
                  name={item.trend === "up" ? "trending-up" : item.trend === "down" ? "trending-down" : "remove"} 
                  size={14} 
                  color={item.trend === "up" ? COLORS.success : item.trend === "down" ? COLORS.danger : COLORS.textMuted} 
                />
                <Text style={[styles.trendText, { color: item.trend === "up" ? COLORS.success : item.trend === "down" ? COLORS.danger : COLORS.textMuted }]}>
                  {item.change === "0" ? "Stable" : item.change}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.priceValue}>KES {item.price.toLocaleString()}</Text>
              <Text style={styles.unitText}>Current Rate</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.analysisBtn}>
          <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#fff" />
          <Text style={styles.analysisBtnText}>View Price Forecasts</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${COLORS.danger}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, color: COLORS.danger },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  infoCard: { flexDirection: "row", gap: 10, backgroundColor: `${COLORS.info}10`, padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: `${COLORS.info}20` },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  priceCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  itemName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  trendText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  priceValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.gold },
  unitText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  analysisBtn: { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 20 },
  analysisBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});