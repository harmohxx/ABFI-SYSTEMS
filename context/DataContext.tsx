import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "./AuthContext";

export interface Farmer { id: string; farmerId: string; name: string; phone: string; email: string; nationalId: string; location: string; createdBy: string; createdAt: string; }
export interface Farm { id: string; farmerId: string; farmerName: string; name: string; size: string; type: "crop" | "livestock" | "mixed"; cropType: string; latitude: number | null; longitude: number | null; address: string; status: "active" | "inactive"; createdBy: string; createdAt: string; }
export interface Worker { id: string; farmId: string; farmName: string; name: string; phone: string; role: string; wageType: "daily" | "weekly" | "monthly"; wageAmount: number; active: boolean; createdBy: string; createdAt: string; }
export interface Payment { id: string; workerId: string; workerName: string; farmId: string; farmName: string; amount: number; method: "mpesa" | "bank"; status: "pending" | "approved" | "rejected" | "completed"; initiatedBy: string; approvedBy: string | null; reference: string; notes: string; createdAt: string; updatedAt: string; }
export interface Shop { id: string; name: string; location: string; managerId: string; active: boolean; createdBy: string; createdAt: string; }
export interface Sale { id: string; shopId: string; shopName: string; products: Array<{ name: string; quantity: number; unitPrice: number }>; totalRevenue: number; recordedBy: string; date: string; createdBy: string; createdAt: string; }
export interface Product { id: string; name: string; unit: string; currentStock: number; minStock: number; location: "warehouse" | string; createdBy: string; createdAt: string; }
export interface StockTransaction { id: string; productId: string; productName: string; type: "in" | "out"; quantity: number; shopId: string | null; notes: string; recordedBy: string; createdBy: string; createdAt: string; }
export interface AuditLog { id: string; userId: string; userName: string; userRole: string; action: string; details: string; timestamp: string; }
export interface Message { id: string; senderId: string; receiverId: string; content: string; isRead: boolean; createdAt: string; }

export interface Expense { id: string; category: string; amount: number; farmId: string | null; farmName: string | null; description: string; date: string; recordedBy: string; createdBy: string; createdAt: string; }
export interface Task { id: string; title: string; description: string; farmId: string; farmName: string; assignedToId: string | null; assignedToName: string | null; dueDate: string; status: "pending" | "in_progress" | "completed"; priority: "low" | "medium" | "high"; createdBy: string; createdAt: string; }

interface DataContextValue {
  farmers: Farmer[]; farms: Farm[]; workers: Worker[]; payments: Payment[]; shops: Shop[]; sales: Sale[]; products: Product[]; stockTransactions: StockTransaction[]; auditLogs: AuditLog[]; messages: Message[]; expenses: Expense[]; tasks: Task[];
  addFarmer: (data: Omit<Farmer, "id" | "createdAt" | "createdBy">) => Promise<void>;
  updateFarmer: (id: string, data: Partial<Farmer>) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;
  addFarm: (data: Omit<Farm, "id" | "createdAt" | "createdBy">) => Promise<void>;
  updateFarm: (id: string, data: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  addWorker: (data: Omit<Worker, "id" | "createdAt" | "createdBy">) => Promise<void>;
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addPayment: (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
  executeMpesaPayment: (paymentId: string) => Promise<{ success: boolean; error?: string }>;
  addShop: (data: Omit<Shop, "id" | "createdAt" | "createdBy">) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
  addSale: (data: Omit<Sale, "id" | "createdAt" | "createdBy">) => Promise<void>;
  addProduct: (data: Omit<Product, "id" | "createdAt" | "createdBy">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStockTransaction: (data: Omit<StockTransaction, "id" | "createdAt" | "createdBy">) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  addExpense: (data: Omit<Expense, "id" | "createdAt" | "createdBy">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addTask: (data: Omit<Task, "id" | "createdAt" | "createdBy">) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  lastSync: Date | null;
}

const DataContext = createContext<DataContextValue | null>(null);

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadAll = async () => {
    const [f, fa, w, p, sh, sa, pr, st, al, m, ex, tk] = await Promise.all([
      supabase.from("farmers").select("*"),
      supabase.from("farms").select("*"),
      supabase.from("workers").select("*"),
      supabase.from("payments").select("*").order("createdAt", { ascending: false }),
      supabase.from("shops").select("*"),
      supabase.from("sales").select("*").order("createdAt", { ascending: false }),
      supabase.from("products").select("*"),
      supabase.from("stock_transactions").select("*").order("createdAt", { ascending: false }),
      supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(500),
      supabase.from("messages").select("*").or(`senderId.eq.${currentUser?.id},receiverId.eq.${currentUser?.id}`).order("createdAt", { ascending: true }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").order("dueDate", { ascending: true }),
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
    if (m.data) setMessages(m.data);
    if (ex.data) setExpenses(ex.data);
    if (tk.data) setTasks(tk.data);
    setLastSync(new Date());
  };

  useEffect(() => {
    if (currentUser) {
      loadAll();
      const tables = ["farmers", "farms", "workers", "payments", "shops", "sales", "products", "stock_transactions", "audit_logs", "messages", "expenses", "tasks"];
      const channels = tables.map(table => 
        supabase
          .channel(`public:${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
            loadAll();
          })
          .subscribe()
      );
      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    }
  }, [currentUser]);

  // Role-based filtering logic
  const isRestricted = currentUser?.role === "field_officer";
  
  const filteredFarmers = useMemo(() => isRestricted ? farmers.filter(f => f.createdBy === currentUser?.id) : farmers, [farmers, currentUser, isRestricted]);
  const filteredFarms = useMemo(() => isRestricted ? farms.filter(f => f.createdBy === currentUser?.id) : farms, [farms, currentUser, isRestricted]);
  const filteredWorkers = useMemo(() => isRestricted ? workers.filter(w => w.createdBy === currentUser?.id) : workers, [workers, currentUser, isRestricted]);

  const addFarmer = async (data: Omit<Farmer, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("farmers").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("FARMER_ADDED", `Added farmer ${data.name}`);
  };
  const updateFarmer = async (id: string, data: Partial<Farmer>) => {
    await supabase.from("farmers").update(data).eq("id", id);
  };
  const deleteFarmer = async (id: string) => {
    await supabase.from("farmers").delete().eq("id", id);
  };

  const addFarm = async (data: Omit<Farm, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("farms").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("FARM_ADDED", `Added farm ${data.name}`);
  };
  const updateFarm = async (id: string, data: Partial<Farm>) => {
    await supabase.from("farms").update(data).eq("id", id);
  };
  const deleteFarm = async (id: string) => {
    await supabase.from("farms").delete().eq("id", id);
  };

  const addWorker = async (data: Omit<Worker, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("workers").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("WORKER_ADDED", `Added worker ${data.name}`);
  };
  const updateWorker = async (id: string, data: Partial<Worker>) => {
    await supabase.from("workers").update(data).eq("id", id);
  };
  const deleteWorker = async (id: string) => {
    await supabase.from("workers").delete().eq("id", id);
  };

  const addPayment = async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => {
    await supabase.from("payments").insert([data]);
    await logAuditAction("PAYMENT_INITIATED", `Payment of KES ${data.amount} for ${data.workerName} initiated`);
  };
  const updatePayment = async (id: string, data: Partial<Payment>) => {
    await supabase.from("payments").update(data).eq("id", id);
  };

  const executeMpesaPayment = async (paymentId: string): Promise<{ success: boolean; error?: string }> => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return { success: false, error: "Payment not found" };
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { error } = await supabase.from("payments").update({ status: "completed", approvedBy: currentUser?.name }).eq("id", paymentId);
    if (error) return { success: false, error: "Failed to update payment status" };
    await logAuditAction("MPESA_DISBURSEMENT", `M-Pesa disbursement of KES ${payment.amount} to ${payment.workerName} completed by CEO`);
    return { success: true };
  };

  const addShop = async (data: Omit<Shop, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("shops").insert([{ ...data, createdBy: currentUser?.id }]);
  };
  const deleteShop = async (id: string) => {
    await supabase.from("shops").delete().eq("id", id);
  };

  const addSale = async (data: Omit<Sale, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("sales").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("SALE_RECORDED", `Sale of KES ${data.totalRevenue} recorded`);
  };

  const addProduct = async (data: Omit<Product, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("products").insert([{ ...data, createdBy: currentUser?.id }]);
  };
  const updateProduct = async (id: string, data: Partial<Product>) => {
    await supabase.from("products").update(data).eq("id", id);
  };
  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
  };

  const addStockTransaction = async (data: Omit<StockTransaction, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("stock_transactions").insert([{ ...data, createdBy: currentUser?.id }]);
    const product = products.find((p) => p.id === data.productId);
    if (product) {
      const newStock = data.type === "in" ? product.currentStock + data.quantity : Math.max(0, product.currentStock - data.quantity);
      await updateProduct(data.productId, { currentStock: newStock });
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from("messages").insert([{ senderId: currentUser.id, receiverId, content: content.trim(), isRead: false }]);
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase.from("messages").update({ isRead: true }).eq("id", messageId);
  };

  const addExpense = async (data: Omit<Expense, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("expenses").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("EXPENSE_RECORDED", `Expense of KES ${data.amount} for ${data.category} recorded`);
  };
  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
  };

  const addTask = async (data: Omit<Task, "id" | "createdAt" | "createdBy">) => {
    await supabase.from("tasks").insert([{ ...data, createdBy: currentUser?.id }]);
    await logAuditAction("TASK_CREATED", `Task "${data.title}" created for ${data.farmName}`);
  };
  const updateTask = async (id: string, data: Partial<Task>) => {
    await supabase.from("tasks").update(data).eq("id", id);
  };
  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  const refreshAuditLogs = async () => {
    const { data } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(500);
    if (data) setAuditLogs(data);
  };

  const value = useMemo(() => ({
    farmers: filteredFarmers, farms: filteredFarms, workers: filteredWorkers, payments, shops, sales, products, stockTransactions, auditLogs, messages, expenses, tasks, addFarmer, updateFarmer, deleteFarmer, addFarm, updateFarm, deleteFarm, addWorker, updateWorker, deleteWorker, addPayment, updatePayment, executeMpesaPayment, addShop, deleteShop, addSale, addProduct, updateProduct, deleteProduct, addStockTransaction, sendMessage, markMessageAsRead, addExpense, deleteExpense, addTask, updateTask, deleteTask, refreshAuditLogs, lastSync,
  }), [filteredFarmers, filteredFarms, filteredWorkers, payments, shops, sales, products, stockTransactions, auditLogs, messages, expenses, tasks, lastSync]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}