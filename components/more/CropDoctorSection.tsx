"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useData, CropAnalysis } from "@/context/DataContext";
import { COLORS } from "@/constants/colors";

export function CropDoctorSection({ onBack }: { onBack: () => void }) {
  const { cropAnalyses, farms, addCropAnalysis } = useData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [result, setResult] = useState<CropAnalysis | null>(null);

  const handleScan = async () => {
    if (!selectedFarmId) return Alert.alert("Required", "Please select a farm first");
    
    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulated AI Analysis Logic
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const farm = farms.find(f => f.id === selectedFarmId);
    const mockDiagnoses = [
      { issue: "Maize Lethal Necrosis", diagnosis: "Viral infection causing yellowing and drying of leaves.", recommendation: "Remove infected plants immediately. Use certified seeds for next season. Control aphids and thrips.", confidence: 0.94 },
      { issue: "Fall Armyworm", diagnosis: "Pest infestation causing ragged holes in leaves and damaged cobs.", recommendation: "Apply recommended insecticides (e.g., Belt or Radiant). Handpick larvae if infestation is low.", confidence: 0.88 },
      { issue: "Late Blight", diagnosis: "Fungal disease causing dark, water-soaked spots on leaves.", recommendation: "Apply fungicides containing Mancozeb or Metalaxyl. Improve drainage and spacing.", confidence: 0.91 }
    ];
    
    const randomDiagnosis = mockDiagnoses[Math.floor(Math.random() * mockDiagnoses.length)];
    
    const newAnalysis = {
      farmId: selectedFarmId,
      farmName: farm?.name || "Unknown Farm",
      cropType: farm?.cropType || "Mixed",
      issue: randomDiagnosis.issue,
      diagnosis: randomDiagnosis.diagnosis,
      recommendation: randomDiagnosis.recommendation,
      confidence: randomDiagnosis.confidence,
    };
    
    await addCropAnalysis(newAnalysis);
    setResult({ ...newAnalysis, id: Date.now().toString(), createdAt: new Date().toISOString() });
    setIsAnalyzing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.subTitle}>Crop Doctor (AI)</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={styles.aiCard}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.aiGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <MaterialCommunityIcons name="robot-outline" size={40} color="#fff" />
            <Text style={styles.aiTitle}>AI Crop Diagnosis</Text>
            <Text style={styles.aiDesc}>Identify pests, diseases, and nutrient deficiencies instantly using our trained AI model.</Text>
          </LinearGradient>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Select Farm to Scan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {farms.map(f => (
              <TouchableOpacity key={f.id} style={[styles.catBtn, selectedFarmId === f.id && styles.catBtnActive]} onPress={() => setSelectedFarmId(f.id)}>
                <Text style={[styles.catBtnText, selectedFarmId === f.id && { color: COLORS.primary }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={[styles.scanBtn, isAnalyzing && { opacity: 0.7 }]} onPress={handleScan} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="scan" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Start AI Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <View>
                <Text style={styles.resultTitle}>{result.issue}</Text>
                <Text style={styles.resultConfidence}>AI Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
              </View>
            </View>
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>DIAGNOSIS</Text>
              <Text style={styles.resultText}>{result.diagnosis}</Text>
            </View>
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>RECOMMENDATION</Text>
              <Text style={[styles.resultText, { color: COLORS.primary, fontWeight: "600" }]}>{result.recommendation}</Text>
            </View>
          </View>
        )}

        <Text style={styles.historyLabel}>RECENT ANALYSES</Text>
        {cropAnalyses.map((ana) => (
          <View key={ana.id} style={styles.historyItem}>
            <View style={styles.historyIcon}><Ionicons name="leaf" size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{ana.issue}</Text>
              <Text style={styles.historyMeta}>{ana.farmName} · {new Date(ana.createdAt).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
  subHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 80 : 56, paddingBottom: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  backBtn: { padding: 4 },
  subTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text, flex: 1 },
  aiCard: { borderRadius: 20, overflow: "hidden", marginBottom: 24 },
  aiGradient: { padding: 24, alignItems: "center" },
  aiTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff", marginTop: 12, marginBottom: 8 },
  aiDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20 },
  formField: { marginBottom: 20 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  catBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textSecondary },
  scanBtn: { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 24 },
  scanBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  resultCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.primary, marginBottom: 24 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.text },
  resultConfidence: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.success },
  resultSection: { marginBottom: 12 },
  resultLabel: { fontFamily: "Inter_700Bold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
  resultText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  historyLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  historyItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  historyIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.primary}15`, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  historyMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});