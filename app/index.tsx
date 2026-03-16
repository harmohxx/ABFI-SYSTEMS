import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { COLORS, ROLE_COLORS, ROLE_LABELS } from "@/constants/colors";

const ROLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  director: "shield-checkmark",
  ceo: "briefcase",
  manager: "people",
  accountant: "calculator",
  field_officer: "leaf",
};

export default function LoginScreen() {
  const { login, loginWithBiometric, biometricAvailable, hasSavedCredentials, users } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const detectedUser = useMemo(() => {
    if (!email.trim()) return null;
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }, [email, users]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError("");
    const result = await loginWithBiometric();
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Biometric failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const roleColor = detectedUser ? ROLE_COLORS[detectedUser.role] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0A1A0F", "#0F2318", "#0A1A0F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.primary]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="leaf" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>ABFI SYSTEM</Text>
            <Text style={styles.appTagline}>Enterprise Farm Management</Text>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Contact the Director if you need access</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, detectedUser ? { borderColor: `${roleColor}60` } : {}]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={detectedUser ? (roleColor || COLORS.textMuted) : COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {detectedUser && (
                  <View style={[styles.roleIndicator, { backgroundColor: `${roleColor}25` }]}>
                    <Ionicons name={ROLE_ICONS[detectedUser.role]} size={13} color={roleColor || COLORS.primary} />
                  </View>
                )}
              </View>

              {detectedUser && (
                <View style={[styles.userBanner, { borderColor: `${roleColor}30`, backgroundColor: `${roleColor}08` }]}>
                  <View style={[styles.userBannerDot, { backgroundColor: roleColor || COLORS.primary }]} />
                  <Text style={[styles.userBannerName, { color: roleColor || COLORS.primary }]}>
                    {detectedUser.name}
                  </Text>
                  <View style={[styles.rolePill, { backgroundColor: `${roleColor}18` }]}>
                    <Text style={[styles.rolePillText, { color: roleColor || COLORS.primary }]}>
                      {ROLE_LABELS[detectedUser.role]}
                    </Text>
                  </View>
                  {!detectedUser.active && (
                    <View style={[styles.rolePill, { backgroundColor: `${COLORS.danger}15`, marginLeft: 2 }]}>
                      <Text style={[styles.rolePillText, { color: COLORS.danger }]}>Disabled</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.loginBtnText}>Access System</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {biometricAvailable && hasSavedCredentials && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometric}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="finger-print-outline" size={22} color={COLORS.gold} />
                <Text style={styles.biometricText}>Use Biometric Login</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.footerText}>Access is managed by the Director</Text>
          </View>

          {__DEV__ && (
            <View style={styles.devHint}>
              <Ionicons name="code-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.devText}>created and managed by ABFI / ABFI SYSTEMS </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1A0F" },
  bgDecor1: {
    position: "absolute", top: -100, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: `${COLORS.primary}10`,
  },
  bgDecor2: {
    position: "absolute", bottom: 40, left: -70,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: `${COLORS.gold}07`,
  },
  scroll: { paddingHorizontal: 28, paddingTop: 40 },

  logoSection: { alignItems: "center", marginBottom: 40 },
  logoContainer: { marginBottom: 14 },
  logoGradient: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  appName: { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: 3 },
  appTagline: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, letterSpacing: 0.8 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 22,
    padding: 24, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 24 },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: `${COLORS.danger}12`, borderRadius: 10,
    padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: `${COLORS.danger}28`,
  },
  errorText: { fontSize: 13, color: COLORS.danger, flex: 1 },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: "700", color: COLORS.textSecondary,
    marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bg, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  roleIndicator: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginLeft: 6,
  },

  userBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 8, borderRadius: 10, padding: 10, borderWidth: 1,
  },
  userBannerDot: { width: 6, height: 6, borderRadius: 3 },
  userBannerName: { fontSize: 13, fontWeight: "700", flex: 1 },
  rolePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rolePillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  loginBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  loginGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  loginBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },

  biometricBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 14, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.gold}40`,
    backgroundColor: `${COLORS.gold}08`,
  },
  biometricText: { fontSize: 14, color: COLORS.gold, fontWeight: "600" },

  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 8,
  },
  footerText: { fontSize: 12, color: COLORS.textMuted },
  devHint: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, marginTop: 4,
  },
  devText: { fontSize: 11, color: `${COLORS.textMuted}80` },
});
