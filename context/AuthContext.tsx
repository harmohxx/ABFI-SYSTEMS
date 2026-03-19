import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";
import { supabase } from "@/app/lib/supabase";

export type UserRole = "director" | "ceo" | "manager" | "accountant" | "field_officer";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

interface AuthContextValue {
  currentUser: AppUser | null;
  users: AppUser[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometric: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<AppUser>) => Promise<void>;
  biometricAvailable: boolean;
  hasSavedCredentials: boolean;
  logAuditAction: (action: string, details: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  CURRENT_USER: "abfi_current_user",
  SAVED_EMAIL: "abfi_saved_email",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  useEffect(() => {
    initializeAuth();
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      if (Platform.OS === "web") return;
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch {
      setBiometricAvailable(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (!error && data) setUsers(data);
  };

  const initializeAuth = async () => {
    try {
      await fetchUsers();
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
      if (savedEmail) setHasSavedCredentials(true);

      const currentUserJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (currentUserJson) {
        setCurrentUser(JSON.parse(currentUserJson));
      }
    } catch (e) {
      console.error("Auth init error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("password", password)
      .single();

    if (error || !user) return { success: false, error: "Invalid email or password" };
    if (!user.active) return { success: false, error: "Account has been deactivated" };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, email);
    setCurrentUser(user);
    setHasSavedCredentials(true);
    await logAuditAction("LOGIN", `${user.name} (${user.role}) logged in`);
    return { success: true };
  };

  const loginWithBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === "web") return { success: false, error: "Biometric not supported on web" };
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access ABFI System",
      });

      if (!result.success) return { success: false, error: "Biometric authentication failed" };

      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
      if (!savedEmail) return { success: false, error: "No saved credentials." };

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", savedEmail.toLowerCase())
        .single();

      if (error || !user || !user.active) return { success: false, error: "Account not found or deactivated" };

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      setCurrentUser(user);
      await logAuditAction("BIOMETRIC_LOGIN", `${user.name} logged in via biometric`);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Biometric authentication error" };
    }
  };

  const logout = async () => {
    if (currentUser) await logAuditAction("LOGOUT", `${currentUser.name} logged out`);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentUser(null);
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }): Promise<{ success: boolean; error?: string }> => {
    const newUser = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: data.role,
      active: true,
      createdBy: "self",
    };
    const { data: created, error } = await supabase.from("users").insert([newUser]).select().single();
    if (error) return { success: false, error: "Registration failed" };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(created));
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, created.email);
    setCurrentUser(created);
    setHasSavedCredentials(true);
    await fetchUsers();
    return { success: true };
  };

  const addUser = async (data: Omit<AppUser, "id" | "createdAt">) => {
    await supabase.from("users").insert([data]);
    await fetchUsers();
  };

  const removeUser = async (id: string) => {
    await supabase.from("users").delete().eq("id", id);
    await fetchUsers();
  };

  const updateUser = async (id: string, data: Partial<AppUser>) => {
    await supabase.from("users").update(data).eq("id", id);
    await fetchUsers();
  };

  const logAuditAction = async (action: string, details: string) => {
    await supabase.from("audit_logs").insert([{
      userId: currentUser?.id || "system",
      userName: currentUser?.name || "System",
      userRole: currentUser?.role || "system",
      action,
      details,
    }]);
  };

  const value = useMemo(() => ({
    currentUser, users, isLoading, login, register, loginWithBiometric, logout, addUser, removeUser, updateUser, biometricAvailable, hasSavedCredentials, logAuditAction,
  }), [currentUser, users, isLoading, biometricAvailable, hasSavedCredentials]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}