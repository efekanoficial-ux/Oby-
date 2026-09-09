import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, updateDoc, addDoc, collection, getDocs,
  onSnapshot, query, orderBy, where, increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ADMIN_EMAIL    = "admin@obyo.com";
const ADMIN_PASSWORD = "ruhi123";
const LS_IS_ADMIN    = "obyo_is_admin";
const LS_CUSTOM_UID  = "obyo_custom_user_id";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface ObyoUser {
  id:             string;
  email:          string;
  name:           string;
  surname:        string;
  birthDate:      string;
  photoURL?:      string;
  currency:       "TL" | "USD";
  demoBalance:    number;
  realBalance:    number;
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt:      number;
}

export interface ObyoRequest {
  id:          string;
  userId:      string;
  userEmail:   string;
  userName:    string;
  type:        "deposit" | "withdraw";
  amount:      number;
  currency:    string;
  method:      string;
  destination?: string;
  status:      "pending" | "accepted" | "rejected";
  createdAt:   number;
}

export interface PaymentSettings {
  ibanBank:     string;
  ibanHolder:   string;
  ibanNumber:   string;
  ibanSwift:    string;
  trc20Address: string;
  erc20Address: string;
  updatedAt?:   number;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  ibanBank:     "Garanti BBVA",
  ibanHolder:   "Obyo Financial Technologies Ltd.",
  ibanNumber:   "TR88 0006 2000 8765 4321 0099 73",
  ibanSwift:    "TGBATRISXXX",
  trc20Address: "TKXVLatVmzivs3XAQ7WLcKLAGsyPtfxh6S",
  erc20Address: "0x742d35Cc6634C0532925a3b844D28f32be0A5b5f",
};

interface RegisterData {
  email:     string;
  password:  string;
  name:      string;
  surname:   string;
  birthDate: string;
  currency:  "TL" | "USD";
}

interface AuthContextType {
  ready:            boolean;
  currentUser:      ObyoUser | null;
  isAdmin:          boolean;
  paymentSettings:  PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<{ success: boolean; error?: string }>;
  login:            (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register:         (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout:           () => Promise<void>;
  users:            ObyoUser[];
  requests:         ObyoRequest[];
  addRequest:       (data: Omit<ObyoRequest, "id" | "status" | "createdAt">) => Promise<string>;
  processRequest:   (id: string, accept: boolean) => Promise<void>;
  addBalanceDirect: (userId: string, amount: number, userName: string, userEmail: string) => Promise<void>;
  placeRealTrade:   (amount: number) => Promise<boolean>;
  settleRealTrade:  (amount: number, won: boolean, payout: number) => Promise<void>;
  updateProfilePhoto: (photoUrl: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser:      () => void;
  refreshAdmin:     () => void;
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready,       setReady]       = useState(false);
  const [currentUser, setCurrentUser] = useState<ObyoUser | null>(null);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [users,       setUsers]       = useState<ObyoUser[]>([]);
  const [requests,    setRequests]    = useState<ObyoRequest[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);

  const userUnsubRef  = useRef<(() => void) | null>(null);
  const adminUnsubs   = useRef<(() => void)[]>([]);
  const realBalanceRef = useRef<number>(0);

  useEffect(() => {
    if (currentUser?.realBalance !== undefined) {
      realBalanceRef.current = currentUser.realBalance;
    }
  }, [currentUser?.realBalance]);

  /* ── Payment Settings real-time listener ─────────────────────────────── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "payment"), (snap) => {
      if (snap.exists()) {
        setPaymentSettings({ ...DEFAULT_PAYMENT_SETTINGS, ...snap.data() } as PaymentSettings);
      }
    }, (err) => {
      if (err.code !== "permission-denied") console.error("Payment settings listener error:", err);
    });
    return () => unsub();
  }, []);

  /* ── Firebase Auth listener (regular users) ─────────────────────────── */
  useEffect(() => {
    if (localStorage.getItem(LS_IS_ADMIN) === "1") {
      setIsAdmin(true);
      setReady(true);
      return;
    }

    // Safety fallback timer so loading screen never hangs if Firestore connection is delayed
    const fallbackTimer = setTimeout(() => {
      setReady(true);
    }, 4000);

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (localStorage.getItem(LS_IS_ADMIN) === "1") {
        setIsAdmin(true);
        setReady(true);
        clearTimeout(fallbackTimer);
        return;
      }

      if (userUnsubRef.current) {
        userUnsubRef.current();
        userUnsubRef.current = null;
      }

      const uidToFetch = firebaseUser?.uid || localStorage.getItem(LS_CUSTOM_UID);

      if (uidToFetch) {
        if (firebaseUser) {
          localStorage.removeItem(LS_CUSTOM_UID);
        }
        userUnsubRef.current = onSnapshot(
          doc(db, "users", uidToFetch),
          (snap) => {
            if (snap.exists()) {
              setCurrentUser({ id: snap.id, ...snap.data() } as ObyoUser);
            } else {
              setCurrentUser(null);
            }
            setReady(true);
            clearTimeout(fallbackTimer);
          },
          (err) => {
            if (err.code !== "permission-denied") console.error("Firestore user snapshot error:", err);
            setCurrentUser(null);
            setReady(true);
            clearTimeout(fallbackTimer);
          }
        );
      } else {
        setCurrentUser(null);
        setReady(true);
        clearTimeout(fallbackTimer);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubAuth();
      if (userUnsubRef.current) userUnsubRef.current();
    };
  }, []);

  /* ── User own requests real-time listener ────────────────────────────── */
  useEffect(() => {
    if (!currentUser) { setRequests([]); return; }
    const q = query(
      collection(db, "requests"),
      where("userId", "==", currentUser.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as ObyoRequest)
        .sort((a, b) => b.createdAt - a.createdAt);
      setRequests(sorted);
    }, (err) => {
      if (err.code !== "permission-denied") console.error(err);
    });
    return () => unsub();
  }, [currentUser?.id]);

  /* ── Admin Firestore real-time listeners ─────────────────────────────── */
  useEffect(() => {
    adminUnsubs.current.forEach(u => u());
    adminUnsubs.current = [];
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ObyoUser));
    }, (err) => {
      if (err.code !== "permission-denied") console.error(err);
    });

    const unsubReqs = onSnapshot(
      query(collection(db, "requests"), orderBy("createdAt", "desc")),
      (snap) => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ObyoRequest));
      },
      (err) => {
        if (err.code !== "permission-denied") console.error(err);
      }
    );

    adminUnsubs.current = [unsubUsers, unsubReqs];
    return () => { unsubUsers(); unsubReqs(); };
  }, [isAdmin]);

  /* ── Auth actions ────────────────────────────────────────────────────── */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const e = email.trim().toLowerCase();

    if (e === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(LS_IS_ADMIN, "1");
      setIsAdmin(true);
      setCurrentUser(null);
      return { success: true };
    }

    try {
      await signInWithEmailAndPassword(auth, e, password);
      localStorage.removeItem(LS_IS_ADMIN);
      localStorage.removeItem(LS_CUSTOM_UID);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";

      // Fallback check in Firestore if Firebase Auth is disabled or user created via fallback
      if (code === "auth/operation-not-allowed" || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        try {
          const q = query(collection(db, "users"), where("email", "==", e));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const userDoc = snap.docs[0];
            const uData = userDoc.data();
            if (uData.password && uData.password !== password) {
              return { success: false, error: "Şifre hatalı." };
            }
            localStorage.removeItem(LS_IS_ADMIN);
            localStorage.setItem(LS_CUSTOM_UID, userDoc.id);
            setCurrentUser({ id: userDoc.id, ...uData } as ObyoUser);
            return { success: true };
          }
        } catch (dbErr) {
          console.error("Firestore user lookup error:", dbErr);
        }
      }

      if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/invalid-email")
        return { success: false, error: "Bu e-posta ile kayıtlı hesap bulunamadı." };
      if (code === "auth/wrong-password")
        return { success: false, error: "Şifre hatalı." };
      if (code === "auth/too-many-requests")
        return { success: false, error: "Çok fazla deneme. Lütfen bekleyin." };
      return { success: false, error: "Giriş yapılamadı. Lütfen tekrar deneyin." };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const e = data.email.trim().toLowerCase();
    if (!e || !data.password || !data.name || !data.surname || !data.birthDate)
      return { success: false, error: "Lütfen tüm alanları doldurun." };

    const currency    = data.currency ?? "USD";
    const demoBalance = currency === "TL" ? 120000 : 10000;

    let uid = "";
    let isFirebaseAuth = false;

    try {
      const cred = await createUserWithEmailAndPassword(auth, e, data.password);
      uid = cred.user.uid;
      isFirebaseAuth = true;
    } catch (authErr: any) {
      const code = authErr.code ?? "";
      if (code === "auth/email-already-in-use")
        return { success: false, error: "Bu e-posta adresi zaten kayıtlı." };
      if (code === "auth/weak-password")
        return { success: false, error: "Şifre en az 6 karakter olmalıdır." };

      // Handle operation-not-allowed seamlessly by storing user directly in Firestore
      if (code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation" || code === "auth/unauthorized-domain") {
        try {
          const q = query(collection(db, "users"), where("email", "==", e));
          const existingSnap = await getDocs(q);
          if (!existingSnap.empty) {
            return { success: false, error: "Bu e-posta adresi zaten kayıtlı." };
          }
        } catch (qErr) {
          console.error("Error checking existing user:", qErr);
        }
        uid = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      } else {
        return { success: false, error: `Kayıt yapılamadı (Auth): ${authErr.message || code}` };
      }
    }

    const userData = {
      email:          e,
      password:       data.password,
      name:           data.name.trim(),
      surname:        data.surname.trim(),
      birthDate:      data.birthDate,
      currency,
      demoBalance,
      realBalance:    0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      createdAt:      Date.now(),
    };

    try {
      await setDoc(doc(db, "users", uid), userData, { merge: true });
    } catch (dbErr: any) {
      console.error("Firebase db setDoc error:", dbErr);
      return { success: false, error: `Kayıt yapılamadı (DB): ${dbErr.message || "Bilinmeyen veritabanı hatası"}` };
    }

    localStorage.removeItem(LS_IS_ADMIN);
    localStorage.setItem("obyo_tutorial_done", "1");

    if (!isFirebaseAuth) {
      localStorage.setItem(LS_CUSTOM_UID, uid);
      setCurrentUser({ id: uid, ...userData } as ObyoUser);
    }

    return { success: true };
  };

  const logout = async () => {
    localStorage.removeItem(LS_IS_ADMIN);
    localStorage.removeItem(LS_CUSTOM_UID);
    if (auth.currentUser) await signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  /* ── Request actions ─────────────────────────────────────────────────── */
  const addRequest = async (data: Omit<ObyoRequest, "id" | "status" | "createdAt">): Promise<string> => {
    const ref = await addDoc(collection(db, "requests"), {
      ...data,
      amount: Number(data.amount) || 0,
      status:    "pending",
      createdAt: Date.now(),
    });
    return ref.id;
  };

  const processRequest = async (id: string, accept: boolean) => {
    try {
      const req = requests.find(r => r.id === id);
      if (!req) {
        alert("İstek bulunamadı.");
        return;
      }
      if (req.status !== "pending") {
        alert("Bu istek zaten işlenmiş veya iptal edilmiş.");
        return;
      }

      const amt = Number(req.amount) || 0;

      // Update request status safely with merge
      await setDoc(doc(db, "requests", id), {
        status: accept ? "accepted" : "rejected",
        processedAt: Date.now(),
      }, { merge: true });

      if (!accept) return;

      if (req.userId) {
        const userRef = doc(db, "users", req.userId);
        if (req.type === "deposit") {
          await setDoc(userRef, {
            realBalance:    increment(amt),
            totalDeposited: increment(amt),
          }, { merge: true });
        } else {
          await setDoc(userRef, {
            realBalance:    increment(-amt),
            totalWithdrawn: increment(amt),
          }, { merge: true });
        }
      }
    } catch (err: any) {
      console.error("[processRequest Error]:", err);
      alert("İstek işlenirken bir hata oluştu: " + (err?.message || err));
    }
  };

  const addBalanceDirect = async (userId: string, amount: number, userName: string, userEmail: string) => {
    try {
      const amt = Number(amount) || 0;
      await setDoc(doc(db, "users", userId), {
        realBalance:    increment(amt),
        totalDeposited: increment(amt),
      }, { merge: true });

      await addDoc(collection(db, "requests"), {
        userId,
        userEmail,
        userName,
        type:      "deposit",
        amount:    amt,
        currency:  "USD",
        method:    "Admin Transferi",
        status:    "accepted",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      console.error("[addBalanceDirect Error]:", err);
      alert("Bakiye eklenirken hata oluştu: " + (err?.message || err));
    }
  };

  /* ── Real trade actions ──────────────────────────────────────────────── */
  const placeRealTrade = async (amount: number): Promise<boolean> => {
    if (!currentUser) return false;
    if (realBalanceRef.current < amount) return false;

    // Synchronously deduct from ref to prevent rapid click double-spending
    realBalanceRef.current -= amount;
    setCurrentUser(prev => prev ? { ...prev, realBalance: Math.max(0, prev.realBalance - amount) } : null);

    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        realBalance: increment(-amount),
      });
      return true;
    } catch (err) {
      realBalanceRef.current += amount;
      return false;
    }
  };

  const settleRealTrade = async (amount: number, won: boolean, payout: number) => {
    if (!currentUser) return;
    const gain = won ? amount + payout : 0;
    if (gain === 0) return;
    await updateDoc(doc(db, "users", currentUser.id), {
      realBalance: increment(gain),
    });
  };

  const updateProfilePhoto = async (photoUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Oturum açılmamış." };
    try {
      const userRef = doc(db, "users", currentUser.id);
      await setDoc(userRef, { photoURL: photoUrl }, { merge: true });
      setCurrentUser(prev => prev ? { ...prev, photoURL: photoUrl } : null);
      return { success: true };
    } catch (err: any) {
      console.error("updateProfilePhoto error:", err);
      return { success: false, error: err?.message || "Profil fotoğrafı kaydedilemedi." };
    }
  };

  const updatePaymentSettings = async (settings: Partial<PaymentSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      const settingsRef = doc(db, "settings", "payment");
      const updated = {
        ...settings,
        updatedAt: Date.now(),
      };
      await setDoc(settingsRef, updated, { merge: true });
      setPaymentSettings(prev => ({ ...prev, ...settings }));
      return { success: true };
    } catch (err: any) {
      console.error("updatePaymentSettings error:", err);
      return { success: false, error: err?.message || "Ödeme bilgileri kaydedilemedi." };
    }
  };

  const refreshUser  = () => {};
  const refreshAdmin = () => {};

  return (
    <AuthContext.Provider value={{
      ready, currentUser, isAdmin,
      paymentSettings, updatePaymentSettings,
      login, register, logout,
      users, requests,
      addRequest, processRequest, addBalanceDirect,
      placeRealTrade, settleRealTrade, updateProfilePhoto,
      refreshUser, refreshAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
