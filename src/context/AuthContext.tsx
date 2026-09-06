import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, updateDoc, addDoc, collection,
  onSnapshot, query, orderBy, where, increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ADMIN_EMAIL    = "admin@gmail.com";
const ADMIN_PASSWORD = "adminobyo";
const LS_IS_ADMIN    = "obyo_is_admin";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface ObyoUser {
  id:             string;
  email:          string;
  name:           string;
  surname:        string;
  birthDate:      string;
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

  const userUnsubRef  = useRef<(() => void) | null>(null);
  const adminUnsubs   = useRef<(() => void)[]>([]);

  /* ── Firebase Auth listener (regular users) ─────────────────────────── */
  useEffect(() => {
    if (localStorage.getItem(LS_IS_ADMIN) === "1") {
      setIsAdmin(true);
      setReady(true);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (localStorage.getItem(LS_IS_ADMIN) === "1") {
        setReady(true);
        return;
      }
      if (userUnsubRef.current) { userUnsubRef.current(); userUnsubRef.current = null; }

      if (firebaseUser) {
        userUnsubRef.current = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            setCurrentUser({ id: snap.id, ...snap.data() } as ObyoUser);
          } else {
            setCurrentUser(null);
          }
        });
      } else {
        setCurrentUser(null);
      }
      setReady(true);
    });

    return () => {
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
    });

    const unsubReqs = onSnapshot(
      query(collection(db, "requests"), orderBy("createdAt", "desc")),
      (snap) => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ObyoRequest));
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
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
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

    try {
      const cred = await createUserWithEmailAndPassword(auth, e, data.password);
      const uid  = cred.user.uid;
      const currency    = data.currency ?? "USD";
      const demoBalance = currency === "TL" ? 120000 : 10000;

      await setDoc(doc(db, "users", uid), {
        email:          e,
        name:           data.name.trim(),
        surname:        data.surname.trim(),
        birthDate:      data.birthDate,
        currency,
        demoBalance,
        realBalance:    0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        createdAt:      Date.now(),
      });

      localStorage.removeItem(LS_IS_ADMIN);
      localStorage.setItem("obyo_tutorial_done", "1");
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use")
        return { success: false, error: "Bu e-posta adresi zaten kayıtlı." };
      if (code === "auth/weak-password")
        return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
      return { success: false, error: "Kayıt yapılamadı. Lütfen tekrar deneyin." };
    }
  };

  const logout = async () => {
    localStorage.removeItem(LS_IS_ADMIN);
    if (auth.currentUser) await signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  /* ── Request actions ─────────────────────────────────────────────────── */
  const addRequest = async (data: Omit<ObyoRequest, "id" | "status" | "createdAt">): Promise<string> => {
    const ref = await addDoc(collection(db, "requests"), {
      ...data,
      status:    "pending",
      createdAt: Date.now(),
    });
    return ref.id;
  };

  const processRequest = async (id: string, accept: boolean) => {
    const req = requests.find(r => r.id === id);
    if (!req || req.status !== "pending") return;

    await updateDoc(doc(db, "requests", id), {
      status: accept ? "accepted" : "rejected",
    });

    if (!accept) return;

    const userRef = doc(db, "users", req.userId);
    if (req.type === "deposit") {
      await updateDoc(userRef, {
        realBalance:    increment(req.amount),
        totalDeposited: increment(req.amount),
      });
    } else {
      await updateDoc(userRef, {
        realBalance:    increment(-req.amount),
        totalWithdrawn: increment(req.amount),
      });
    }
  };

  const addBalanceDirect = async (userId: string, amount: number, userName: string, userEmail: string) => {
    await updateDoc(doc(db, "users", userId), {
      realBalance:    increment(amount),
      totalDeposited: increment(amount),
    });
    await addDoc(collection(db, "requests"), {
      userId,
      userEmail,
      userName,
      type:      "deposit",
      amount,
      currency:  "USD",
      method:    "Admin Transferi",
      status:    "accepted",
      createdAt: Date.now(),
    });
  };

  /* ── Real trade actions ──────────────────────────────────────────────── */
  const placeRealTrade = async (amount: number): Promise<boolean> => {
    if (!currentUser || currentUser.realBalance < amount) return false;
    await updateDoc(doc(db, "users", currentUser.id), {
      realBalance: increment(-amount),
    });
    return true;
  };

  const settleRealTrade = async (amount: number, won: boolean, payout: number) => {
    if (!currentUser) return;
    const gain = won ? amount + payout : 0;
    if (gain === 0) return;
    await updateDoc(doc(db, "users", currentUser.id), {
      realBalance: increment(gain),
    });
  };

  const refreshUser  = () => {};
  const refreshAdmin = () => {};

  return (
    <AuthContext.Provider value={{
      ready, currentUser, isAdmin,
      login, register, logout,
      users, requests,
      addRequest, processRequest, addBalanceDirect,
      placeRealTrade, settleRealTrade,
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
