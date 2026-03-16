import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

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
  USERS: "abfi_users",
  CURRENT_USER: "abfi_current_user",
  AUDIT_LOGS: "abfi_audit_logs",
  SAVED_EMAIL: "abfi_saved_email",
};

const DEFAULT_DIRECTOR: AppUser = {
  id: "director_001",
  name: "Harmony Nyaga",
  email: "harmony@abfi.com",
  password: "teclaharm",
  role: "director",
  active: true,
  createdBy: "system",
  createdAt: new Date("2024-01-01").toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([DEFAULT_DIRECTOR]);
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

  const initializeAuth = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsedUsers: AppUser[] = JSON.parse(storedUsers);
        const idx = parsedUsers.findIndex((u) => u.role === "director");
        if (idx === -1) {
          parsedUsers.unshift(DEFAULT_DIRECTOR);
        } else {
          parsedUsers[idx] = DEFAULT_DIRECTOR;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsedUsers));
        setUsers(parsedUsers);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_DIRECTOR]));
      }

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
    const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];

    const user = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) return { success: false, error: "Invalid email or password" };
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
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (!result.success) return { success: false, error: "Biometric authentication failed" };

      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
      if (!savedEmail) return { success: false, error: "No saved credentials. Please login with password first." };

      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];
      const user = allUsers.find((u) => u.email.toLowerCase() === savedEmail.toLowerCase());

      if (!user || !user.active) return { success: false, error: "Account not found or deactivated" };

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      setCurrentUser(user);
      await logAuditAction("BIOMETRIC_LOGIN", `${user.name} (${user.role}) logged in via biometric`);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Biometric authentication error" };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logAuditAction("LOGOUT", `${currentUser.name} logged out`);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentUser(null);
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];
      const exists = allUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
      if (exists) return { success: false, error: "An account with this email already exists" };
      if (data.password.length < 6) return { success: false, error: "Password must be at least 6 characters" };
      const newUser: AppUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
        active: true,
        createdBy: "self",
        createdAt: new Date().toISOString(),
      };
      const updated = [...allUsers, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      setUsers(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, newUser.email);
      setCurrentUser(newUser);
      setHasSavedCredentials(true);
      await logAuditAction("REGISTER", `${newUser.name} self-registered as ${newUser.role}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  const addUser = async (data: Omit<AppUser, "id" | "createdAt">) => {
    const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];
    const newUser: AppUser = {
      ...data,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...allUsers, newUser];
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    setUsers(updated);
    await logAuditAction("USER_ADDED", `Added user ${newUser.name} (${newUser.role})`);
  };

  const removeUser = async (id: string) => {
    const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];
    const user = allUsers.find((u) => u.id === id);
    const updated = allUsers.filter((u) => u.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    setUsers(updated);
    if (user) await logAuditAction("USER_REMOVED", `Removed user ${user.name} (${user.role})`);
  };

  const updateUser = async (id: string, data: Partial<AppUser>) => {
    const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [DEFAULT_DIRECTOR];
    const updated = allUsers.map((u) => (u.id === id ? { ...u, ...data } : u));
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    setUsers(updated);
    await logAuditAction("USER_UPDATED", `Updated user ${id}`);
  };

  const logAuditAction = async (action: string, details: string) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const logs = existing ? JSON.parse(existing) : [];
      logs.unshift({
        id: `log_${Date.now()}`,
        userId: currentUser?.id || "system",
        userName: currentUser?.name || "System",
        userRole: currentUser?.role || "system",
        action,
        details,
        timestamp: new Date().toISOString(),
      });
      const trimmed = logs.slice(0, 500);
      await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
    } catch {}
  };

  const value = useMemo(
    () => ({
      currentUser,
      users,
      isLoading,
      login,
      register,
      loginWithBiometric,
      logout,
      addUser,
      removeUser,
      updateUser,
      biometricAvailable,
      hasSavedCredentials,
      logAuditAction,
    }),
    [currentUser, users, isLoading, biometricAvailable, hasSavedCredentials]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
