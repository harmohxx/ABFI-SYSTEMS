import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

export interface Farmer {
  id: string;
  farmerId: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  location: string;
  createdAt: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  size: string;
  type: "crop" | "livestock" | "mixed";
  cropType: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Worker {
  id: string;
  farmId: string;
  farmName: string;
  name: string;
  phone: string;
  role: string;
  wageType: "daily" | "weekly" | "monthly";
  wageAmount: number;
  active: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  workerId: string;
  workerName: string;
  farmId: string;
  farmName: string;
  amount: number;
  method: "mpesa" | "bank";
  status: "pending" | "approved" | "rejected" | "completed";
  initiatedBy: string;
  approvedBy: string | null;
  reference: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  managerId: string;
  active: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  shopId: string;
  shopName: string;
  products: Array<{ name: string; quantity: number; unitPrice: number }>;
  totalRevenue: number;
  recordedBy: string;
  date: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  location: "warehouse" | string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  shopId: string | null;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DataContextValue {
  farmers: Farmer[];
  farms: Farm[];
  workers: Worker[];
  payments: Payment[];
  shops: Shop[];
  sales: Sale[];
  products: Product[];
  stockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  addFarmer: (data: Omit<Farmer, "id" | "createdAt">) => Promise<void>;
  updateFarmer: (id: string, data: Partial<Farmer>) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;
  addFarm: (data: Omit<Farm, "id" | "createdAt">) => Promise<void>;
  updateFarm: (id: string, data: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  addWorker: (data: Omit<Worker, "id" | "createdAt">) => Promise<void>;
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addPayment: (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
  addShop: (data: Omit<Shop, "id" | "createdAt">) => Promise<void>;
  addSale: (data: Omit<Sale, "id" | "createdAt">) => Promise<void>;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  addStockTransaction: (data: Omit<StockTransaction, "id" | "createdAt">) => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const KEYS = {
  FARMERS: "abfi_farmers",
  FARMS: "abfi_farms",
  WORKERS: "abfi_workers",
  PAYMENTS: "abfi_payments",
  SHOPS: "abfi_shops",
  SALES: "abfi_sales",
  PRODUCTS: "abfi_products",
  STOCK_TX: "abfi_stock_tx",
  AUDIT_LOGS: "abfi_audit_logs",
};

function genId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser, logAuditAction } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [f, fa, w, p, sh, sa, pr, st, al] = await Promise.all([
        AsyncStorage.getItem(KEYS.FARMERS),
        AsyncStorage.getItem(KEYS.FARMS),
        AsyncStorage.getItem(KEYS.WORKERS),
        AsyncStorage.getItem(KEYS.PAYMENTS),
        AsyncStorage.getItem(KEYS.SHOPS),
        AsyncStorage.getItem(KEYS.SALES),
        AsyncStorage.getItem(KEYS.PRODUCTS),
        AsyncStorage.getItem(KEYS.STOCK_TX),
        AsyncStorage.getItem(KEYS.AUDIT_LOGS),
      ]);
      if (f) setFarmers(JSON.parse(f));
      if (fa) setFarms(JSON.parse(fa));
      if (w) setWorkers(JSON.parse(w));
      if (p) setPayments(JSON.parse(p));
      if (sh) setShops(JSON.parse(sh));
      if (sa) setSales(JSON.parse(sa));
      if (pr) setProducts(JSON.parse(pr));
      if (st) setStockTransactions(JSON.parse(st));
      if (al) setAuditLogs(JSON.parse(al));
    } catch {}
  };

  const save = async <T,>(key: string, data: T[], setter: (d: T[]) => void) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    setter(data);
  };

  const addFarmer = async (data: Omit<Farmer, "id" | "createdAt">) => {
    const item: Farmer = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...farmers, item];
    await save(KEYS.FARMERS, updated, setFarmers);
    await logAuditAction("FARMER_ADDED", `Added farmer ${item.name}`);
  };
  const updateFarmer = async (id: string, data: Partial<Farmer>) => {
    const updated = farmers.map((f) => (f.id === id ? { ...f, ...data } : f));
    await save(KEYS.FARMERS, updated, setFarmers);
    await logAuditAction("FARMER_UPDATED", `Updated farmer ${id}`);
  };
  const deleteFarmer = async (id: string) => {
    const updated = farmers.filter((f) => f.id !== id);
    await save(KEYS.FARMERS, updated, setFarmers);
    await logAuditAction("FARMER_DELETED", `Deleted farmer ${id}`);
  };

  const addFarm = async (data: Omit<Farm, "id" | "createdAt">) => {
    const item: Farm = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...farms, item];
    await save(KEYS.FARMS, updated, setFarms);
    await logAuditAction("FARM_ADDED", `Added farm ${item.name}`);
  };
  const updateFarm = async (id: string, data: Partial<Farm>) => {
    const updated = farms.map((f) => (f.id === id ? { ...f, ...data } : f));
    await save(KEYS.FARMS, updated, setFarms);
    await logAuditAction("FARM_UPDATED", `Updated farm ${id}`);
  };
  const deleteFarm = async (id: string) => {
    const updated = farms.filter((f) => f.id !== id);
    await save(KEYS.FARMS, updated, setFarms);
    await logAuditAction("FARM_DELETED", `Deleted farm ${id}`);
  };

  const addWorker = async (data: Omit<Worker, "id" | "createdAt">) => {
    const item: Worker = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...workers, item];
    await save(KEYS.WORKERS, updated, setWorkers);
    await logAuditAction("WORKER_ADDED", `Added worker ${item.name}`);
  };
  const updateWorker = async (id: string, data: Partial<Worker>) => {
    const updated = workers.map((w) => (w.id === id ? { ...w, ...data } : w));
    await save(KEYS.WORKERS, updated, setWorkers);
    await logAuditAction("WORKER_UPDATED", `Updated worker ${id}`);
  };
  const deleteWorker = async (id: string) => {
    const updated = workers.filter((w) => w.id !== id);
    await save(KEYS.WORKERS, updated, setWorkers);
    await logAuditAction("WORKER_DELETED", `Deleted worker ${id}`);
  };

  const addPayment = async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => {
    const item: Payment = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [item, ...payments];
    await save(KEYS.PAYMENTS, updated, setPayments);
    await logAuditAction("PAYMENT_INITIATED", `Payment of KES ${item.amount} for ${item.workerName} initiated`);
  };
  const updatePayment = async (id: string, data: Partial<Payment>) => {
    const updated = payments.map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
    );
    await save(KEYS.PAYMENTS, updated, setPayments);
    await logAuditAction("PAYMENT_UPDATED", `Payment ${id} status: ${data.status}`);
  };

  const addShop = async (data: Omit<Shop, "id" | "createdAt">) => {
    const item: Shop = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...shops, item];
    await save(KEYS.SHOPS, updated, setShops);
    await logAuditAction("SHOP_ADDED", `Added shop ${item.name}`);
  };

  const addSale = async (data: Omit<Sale, "id" | "createdAt">) => {
    const item: Sale = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [item, ...sales];
    await save(KEYS.SALES, updated, setSales);
    await logAuditAction("SALE_RECORDED", `Sale of KES ${item.totalRevenue} at ${item.shopName}`);
  };

  const addProduct = async (data: Omit<Product, "id" | "createdAt">) => {
    const item: Product = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...products, item];
    await save(KEYS.PRODUCTS, updated, setProducts);
    await logAuditAction("PRODUCT_ADDED", `Added product ${item.name}`);
  };
  const updateProduct = async (id: string, data: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...data } : p));
    await save(KEYS.PRODUCTS, updated, setProducts);
  };

  const addStockTransaction = async (data: Omit<StockTransaction, "id" | "createdAt">) => {
    const item: StockTransaction = { ...data, id: genId(), createdAt: new Date().toISOString() };
    const updated = [item, ...stockTransactions];
    await save(KEYS.STOCK_TX, updated, setStockTransactions);
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const newStock =
        item.type === "in"
          ? product.currentStock + item.quantity
          : Math.max(0, product.currentStock - item.quantity);
      await updateProduct(item.productId, { currentStock: newStock });
    }
    await logAuditAction(
      `STOCK_${item.type.toUpperCase()}`,
      `${item.type === "in" ? "Added" : "Removed"} ${item.quantity} of ${item.productName}`
    );
  };

  const refreshAuditLogs = async () => {
    const al = await AsyncStorage.getItem(KEYS.AUDIT_LOGS);
    if (al) setAuditLogs(JSON.parse(al));
  };

  const value = useMemo(
    () => ({
      farmers,
      farms,
      workers,
      payments,
      shops,
      sales,
      products,
      stockTransactions,
      auditLogs,
      addFarmer,
      updateFarmer,
      deleteFarmer,
      addFarm,
      updateFarm,
      deleteFarm,
      addWorker,
      updateWorker,
      deleteWorker,
      addPayment,
      updatePayment,
      addShop,
      addSale,
      addProduct,
      updateProduct,
      addStockTransaction,
      refreshAuditLogs,
    }),
    [farmers, farms, workers, payments, shops, sales, products, stockTransactions, auditLogs]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
