import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "./AuthContext";

export interface Farmer { id: string; farmerId: string; name: string; phone: string; email: string; nationalId: string; location: string; createdAt: string; }
export interface Farm { id: string; farmerId: string; farmerName: string; name: string; size: string; type: "crop" | "livestock" | "mixed"; cropType: string; latitude: number | null; longitude: number | null; address: string; status: "active" | "inactive"; createdAt: string; }
export interface Worker { id: string; farmId: string; farmName: string; name: string; phone: string; role: string; wageType: "daily" | "weekly" | "monthly"; wageAmount: number; active: boolean; createdAt: string; }
export interface Payment { id: string; workerId: string; workerName: string; farmId: string; farmName: string; amount: number; method: "mpesa" | "bank"; status: "pending" | "approved" | "rejected" | "completed"; initiatedBy: string; approvedBy: string | null; reference: string; notes: string; createdAt: string; updatedAt: string; }
export interface Shop { id: string; name: string; location: string; managerId: string; active: boolean; createdAt: string; }
export interface Sale { id: string; shopId: string; shopName: string; products: Array<{ name: string; quantity: number; unitPrice: number }>; totalRevenue: number; recordedBy: string; date: string; createdAt: string; }
export interface Product { id: string; name: string; unit: string; currentStock: number; minStock: number; location: "warehouse" | string; createdAt: string; }
export interface StockTransaction { id: string; productId: string; productName: string; type: "in" | "out"; quantity: number; shopId: string | null; notes: string; recordedBy: string; createdAt: string; }
export interface AuditLog { id: string; userId: string; userName: string; userRole: string; action: string; details: string; timestamp: string; }

interface DataContextValue {
  farmers: Farmer[]; farms: Farm[]; workers: Worker[]; payments: Payment[]; shops: Shop[]; sales: Sale[]; products: Product[]; stockTransactions: StockTransaction[]; auditLogs: AuditLog[];
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

export function DataProvider({ children }: { children: ReactNode }) {
  const { logAuditAction } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadAll = async () => {
    const [f, fa, w, p, sh, sa, pr, st, al] = await Promise.all([
      supabase.from("farmers").select("*"),
      supabase.from("farms").select("*"),
      supabase.from("workers").select("*"),
      supabase.from("payments").select("*").order("createdAt", { ascending: false }),
      supabase.from("shops").select("*"),
      supabase.from("sales").select("*").order("createdAt", { ascending: false }),
      supabase.from("products").select("*"),
      supabase.from("stock_transactions").select("*").order("createdAt", { ascending: false }),
      supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(500),
    ]);
    if (f.data) setFarmers(f.data);
    if (fa.data) setFarms(fa.data);
    if (w.data) setWorkers(w.data);
    if (p.data) setPayments(p.data);
    if (sh.data) setShops(sh.data);
    if (sa.data) setSales(sa.data);
    if (pr.data) setProducts(pr.data);
    if (st.data) setStockTransactions(st.data);
    if (al.data) setAuditLogs(al.data.map(l => ({ ...l, timestamp: l.timestamp || l.created_at })));
  };

  useEffect(() => { loadAll(); }, []);

  const addFarmer = async (data: Omit<Farmer, "id" | "createdAt">) => {
    await supabase.from("farmers").insert([data]);
    await logAuditAction("FARMER_ADDED", `Added farmer ${data.name}`);
    await loadAll();
  };
  const updateFarmer = async (id: string, data: Partial<Farmer>) => {
    await supabase.from("farmers").update(data).eq("id", id);
    await loadAll();
  };
  const deleteFarmer = async (id: string) => {
    await supabase.from("farmers").delete().eq("id", id);
    await loadAll();
  };

  const addFarm = async (data: Omit<Farm, "id" | "createdAt">) => {
    await supabase.from("farms").insert([data]);
    await logAuditAction("FARM_ADDED", `Added farm ${data.name}`);
    await loadAll();
  };
  const updateFarm = async (id: string, data: Partial<Farm>) => {
    await supabase.from("farms").update(data).eq("id", id);
    await loadAll();
  };
  const deleteFarm = async (id: string) => {
    await supabase.from("farms").delete().eq("id", id);
    await loadAll();
  };

  const addWorker = async (data: Omit<Worker, "id" | "createdAt">) => {
    await supabase.from("workers").insert([data]);
    await logAuditAction("WORKER_ADDED", `Added worker ${data.name}`);
    await loadAll();
  };
  const updateWorker = async (id: string, data: Partial<Worker>) => {
    await supabase.from("workers").update(data).eq("id", id);
    await loadAll();
  };
  const deleteWorker = async (id: string) => {
    await supabase.from("workers").delete().eq("id", id);
    await loadAll();
  };

  const addPayment = async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => {
    await supabase.from("payments").insert([data]);
    await logAuditAction("PAYMENT_INITIATED", `Payment of KES ${data.amount} for ${data.workerName} initiated`);
    await loadAll();
  };
  const updatePayment = async (id: string, data: Partial<Payment>) => {
    await supabase.from("payments").update(data).eq("id", id);
    await loadAll();
  };

  const addShop = async (data: Omit<Shop, "id" | "createdAt">) => {
    await supabase.from("shops").insert([data]);
    await loadAll();
  };

  const addSale = async (data: Omit<Sale, "id" | "createdAt">) => {
    await supabase.from("sales").insert([data]);
    await logAuditAction("SALE_RECORDED", `Sale of KES ${data.totalRevenue} recorded`);
    await loadAll();
  };

  const addProduct = async (data: Omit<Product, "id" | "createdAt">) => {
    await supabase.from("products").insert([data]);
    await loadAll();
  };
  const updateProduct = async (id: string, data: Partial<Product>) => {
    await supabase.from("products").update(data).eq("id", id);
    await loadAll();
  };

  const addStockTransaction = async (data: Omit<StockTransaction, "id" | "createdAt">) => {
    await supabase.from("stock_transactions").insert([data]);
    const product = products.find((p) => p.id === data.productId);
    if (product) {
      const newStock = data.type === "in" ? product.currentStock + data.quantity : Math.max(0, product.currentStock - data.quantity);
      await updateProduct(data.productId, { currentStock: newStock });
    }
    await loadAll();
  };

  const refreshAuditLogs = async () => {
    const { data } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(500);
    if (data) setAuditLogs(data);
  };

  const value = useMemo(() => ({
    farmers, farms, workers, payments, shops, sales, products, stockTransactions, auditLogs, addFarmer, updateFarmer, deleteFarmer, addFarm, updateFarm, deleteFarm, addWorker, updateWorker, deleteWorker, addPayment, updatePayment, addShop, addSale, addProduct, updateProduct, addStockTransaction, refreshAuditLogs,
  }), [farmers, farms, workers, payments, shops, sales, products, stockTransactions, auditLogs]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}