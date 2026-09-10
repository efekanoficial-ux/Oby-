import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, addDoc, collection, getDocs,
  onSnapshot, query, orderBy, where, increment, deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ADMIN_EMAIL    = "admin@obyo.com";
const ADMIN_PASSWORD = "ruhi123";
const LS_IS_ADMIN    = "obyo_is_admin";
const LS_CUSTOM_UID  = "obyo_custom_user_id";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface KYCDetails {
  fullName: string;
  birthDate: string;
  idNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  submittedAt: number;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface ObyoUser {
  id:             string;
  email:          string;
  name:           string;
  surname:        string;
  birthDate:      string;
  photoURL?:      string;
  photoUrl?:      string;
  password?:      string;
  currency:       "TL" | "USD";
  demoBalance:    number;
  realBalance:    number;
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt:      number;
  kycStatus?:     "none" | "pending" | "verified" | "rejected";
  kycDetails?:    KYCDetails;
  emailVerified?: boolean;
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
  email:          string;
  password:       string;
  name:           string;
  surname:        string;
  birthDate:      string;
  currency:       "TL" | "USD";
  emailVerified?: boolean;
}

interface AuthContextType {
  ready:            boolean;
  currentUser:      ObyoUser | null;
  isAdmin:          boolean;
  paymentSettings:  PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<{ success: boolean; error?: string }>;
  login:            (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle:  () => Promise<{ success: boolean; error?: string; googleUser?: { email: string; name: string; surname: string; photoURL: string } }>;
  register:         (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  sendFirebaseVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  checkFirebaseEmailVerified: () => Promise<{ isVerified: boolean; error?: string }>;
  confirmEmailVerified: (userId?: string) => Promise<{ success: boolean; error?: string }>;
  logout:           () => Promise<void>;
  users:            ObyoUser[];
  requests:         ObyoRequest[];
  addRequest:       (data: Omit<ObyoRequest, "id" | "status" | "createdAt">) => Promise<string>;
  processRequest:   (id: string, accept: boolean) => Promise<void>;
  addBalanceDirect: (userId: string, amount: number, userName: string, userEmail: string) => Promise<void>;
  placeRealTrade:   (amount: number) => Promise<boolean>;
  settleRealTrade:  (amount: number, won: boolean, payout: number) => Promise<void>;
  updateProfilePhoto: (photoUrl: string) => Promise<{ success: boolean; error?: string }>;
  submitKYC:        (data: { fullName: string; birthDate: string; idNumber: string; documentFrontUrl?: string; documentBackUrl?: string }) => Promise<{ success: boolean; isVerified: boolean; message: string }>;
  adminUpdateKYC:   (userId: string, status: "verified" | "rejected", reason?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser:      () => void;
  refreshAdmin:     () => void;
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextType | null>(null);

function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as any;
  }
  if (typeof obj === "object") {
    if (obj instanceof Date) {
      return obj as any;
    }
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanForFirestore(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

function isProfileComplete(data: any): boolean {
  if (!data) return false;
  const hasName = data.name && data.name.trim() !== "" && data.name.trim().toLowerCase() !== "kullanıcı";
  const hasSurname = data.surname && data.surname.trim() !== "";
  const hasBirthDate = data.birthDate && data.birthDate !== "2000-01-01";
  const hasPassword = data.password && data.password.trim() !== "";
  const hasCurrency = data.currency && (data.currency === "USD" || data.currency === "TL");
  return !!(hasName && hasSurname && hasBirthDate && hasPassword && hasCurrency);
}

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

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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

      // Determine unified email identifier
      let email = firebaseUser?.email?.trim().toLowerCase() ||
                  localStorage.getItem("obyo_active_email")?.trim().toLowerCase();

      if (!email) {
        const activeUid = localStorage.getItem("obyo_active_uid") || localStorage.getItem(LS_CUSTOM_UID);
        if (activeUid && activeUid.includes("@")) {
          email = activeUid.trim().toLowerCase();
        }
      }

      if (email && email.includes("@")) {
        localStorage.setItem("obyo_active_email", email);
        localStorage.setItem("obyo_active_uid", email);
        if (firebaseUser) {
          localStorage.removeItem(LS_CUSTOM_UID);
        }

        // Auto-migration check: Make sure user document exists under unified email path
        try {
          const emailDocRef = doc(db, "users", email);
          const emailSnap = await getDoc(emailDocRef);
          let finalUserDoc: any = null;

          if (!emailSnap.exists()) {
            let foundData: any = null;
            let foundOldId: string | null = null;

            // Search by email field in query
            const q = query(collection(db, "users"), where("email", "==", email));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              foundOldId = qSnap.docs[0].id;
              foundData = qSnap.docs[0].data();
            }

            // Also check under firebaseUser.uid
            if (!foundData && firebaseUser?.uid) {
              const uidSnap = await getDoc(doc(db, "users", firebaseUser.uid));
              if (uidSnap.exists()) {
                foundOldId = firebaseUser.uid;
                foundData = uidSnap.data();
              }
            }

            if (foundData) {
              console.log(`Auto-migrating user doc from old ID ${foundOldId} to unified email: ${email}`);
              const migratedData = {
                ...foundData,
                id: email,
              };
              await setDoc(emailDocRef, cleanForFirestore(migratedData), { merge: true });

              if (foundOldId && foundOldId !== email) {
                await deleteDoc(doc(db, "users", foundOldId)).catch(() => {});
              }
              finalUserDoc = migratedData;
            } else {
              console.log("No user document found for this Firebase user. Signing out.");
              await signOut(auth).catch(() => {});
              localStorage.removeItem("obyo_active_email");
              localStorage.removeItem("obyo_active_uid");
              localStorage.removeItem(LS_CUSTOM_UID);
              localStorage.removeItem(LS_IS_ADMIN);
              setCurrentUser(null);
              setReady(true);
              clearTimeout(fallbackTimer);
              return;
            }
          } else {
            finalUserDoc = emailSnap.data();
            if (finalUserDoc.id !== email) {
              await setDoc(emailDocRef, cleanForFirestore({ id: email }), { merge: true });
            }
          }

          // Enforce email verification check
          if (finalUserDoc && finalUserDoc.emailVerified !== true) {
            console.log("Email not verified. Signing out.");
            await signOut(auth).catch(() => {});
            localStorage.removeItem("obyo_active_email");
            localStorage.removeItem("obyo_active_uid");
            localStorage.removeItem(LS_CUSTOM_UID);
            localStorage.removeItem(LS_IS_ADMIN);
            setCurrentUser(null);
            setReady(true);
            clearTimeout(fallbackTimer);
            return;
          }

          // Enforce profile completeness check
          if (finalUserDoc && !isProfileComplete(finalUserDoc)) {
            console.log("User profile is incomplete. Signing out to complete registration.");
            await signOut(auth).catch(() => {});
            localStorage.removeItem("obyo_active_email");
            localStorage.removeItem("obyo_active_uid");
            localStorage.removeItem(LS_CUSTOM_UID);
            localStorage.removeItem(LS_IS_ADMIN);
            setCurrentUser(null);
            setReady(true);
            clearTimeout(fallbackTimer);
            return;
          }
        } catch (migErr) {
          console.error("User document migration/setup error:", migErr);
        }

        userUnsubRef.current = onSnapshot(
          doc(db, "users", email),
          (snap) => {
            if (snap.exists()) {
              const userData = { id: snap.id, ...snap.data() } as ObyoUser;
              if (userData.emailVerified !== true) {
                console.log("Email not verified yet.");
                // User is in DB but not verified.
                // Depending on requirements, we might want to sign them out or set a 'pending' state.
                // For now, let's keep it null in currentUser
                setCurrentUser(null);
              } else {
                setCurrentUser(userData);
              }
            } else {
              setCurrentUser(null);
            }
            setReady(true);
            clearTimeout(fallbackTimer);
          },
          (err) => {
            if (err.code !== "permission-denied") console.error("Firestore user snapshot error:", err);
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
      where("userEmail", "==", currentUser.email)
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
  }, [currentUser?.email]);

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
      localStorage.setItem("obyo_active_email", e);
      localStorage.setItem("obyo_active_uid", e);
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
            localStorage.setItem(LS_CUSTOM_UID, e);
            localStorage.setItem("obyo_active_email", e);
            localStorage.setItem("obyo_active_uid", e);
            setCurrentUser({ id: e, ...uData } as ObyoUser);
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

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; googleUser?: { email: string; name: string; surname: string; photoURL: string } }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = (user.email || "").trim().toLowerCase();

      if (!email) {
        await signOut(auth).catch(() => {});
        return { success: false, error: "Google hesabınızdan e-posta adresi alınamadı." };
      }

      // Check if user exists under unified email path
      const emailDocRef = doc(db, "users", email);
      const emailSnap = await getDoc(emailDocRef);

      let userDocData: any = null;

      if (emailSnap.exists()) {
        userDocData = emailSnap.data();
      } else {
        // Look up by email field query
        const q = query(collection(db, "users"), where("email", "==", email));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          userDocData = qSnap.docs[0].data();
          const oldId = qSnap.docs[0].id;
          if (oldId !== email) {
            await deleteDoc(doc(db, "users", oldId)).catch(() => {});
          }
        }
      }

      if (!userDocData || !isProfileComplete(userDocData)) {
        await signOut(auth).catch(() => {});
        localStorage.removeItem("obyo_active_email");
        localStorage.removeItem("obyo_active_uid");
        localStorage.removeItem(LS_CUSTOM_UID);
        localStorage.removeItem(LS_IS_ADMIN);
        setCurrentUser(null);
        return {
          success: false,
          error: "registration_required",
          googleUser: {
            email,
            name: (userDocData?.name && userDocData.name !== "Kullanıcı" ? userDocData.name : (user.displayName || "").split(" ")[0]) || "Kullanıcı",
            surname: (userDocData?.surname ? userDocData.surname : (user.displayName || "").split(" ").slice(1).join(" ")) || "",
            photoURL: userDocData?.photoURL || userDocData?.photoUrl || user.photoURL || ""
          }
        };
      }

      const matchedUserObj: ObyoUser = {
        ...userDocData,
        id: email,
        email,
        emailVerified: true,
        photoUrl: userDocData.photoUrl || userDocData.photoURL || user.photoURL || undefined,
        photoURL: userDocData.photoURL || userDocData.photoUrl || user.photoURL || undefined,
      };

      await setDoc(emailDocRef, cleanForFirestore(matchedUserObj), { merge: true });

      try {
        localStorage.setItem("obyo_user_reg_" + email, JSON.stringify(matchedUserObj));
        const regList = JSON.parse(localStorage.getItem("obyo_registered_emails") || "[]");
        if (!regList.includes(email)) {
          regList.push(email);
          localStorage.setItem("obyo_registered_emails", JSON.stringify(regList));
        }
      } catch (e) {}

      localStorage.removeItem(LS_IS_ADMIN);
      localStorage.removeItem(LS_CUSTOM_UID);
      localStorage.setItem("obyo_active_email", email);
      localStorage.setItem("obyo_active_uid", email);
      localStorage.setItem("obyo_tutorial_done", "1");
      setCurrentUser(matchedUserObj);
      return { success: true };
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        return { success: false, error: "Giriş penceresi kapatıldı." };
      }
      if (err.code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "";
        return {
          success: false,
          error: `Google Giriş İzni Eksik: Firebase Console > Authentication > Settings > Authorized Domains bölümüne "${domain}" alan adını eklemeniz gerekmektedir.`
        };
      }
      return { success: false, error: err.message || "Google ile giriş yapılırken bir hata oluştu." };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const e = data.email.trim().toLowerCase();
    if (!e || !data.password || !data.name || !data.surname || !data.birthDate)
      return { success: false, error: "Lütfen tüm alanları doldurun." };

    const currency    = data.currency ?? "USD";
    const demoBalance = currency === "TL" ? 120000 : 10000;

    // We will save the document under `users/e`
    const userDocRef = doc(db, "users", e);

    try {
      await createUserWithEmailAndPassword(auth, e, data.password);
    } catch (authErr: any) {
      const code = authErr.code ?? "";
      if (code === "auth/email-already-in-use") {
        // User might exist, but we proceed to check/update profile in Firestore
      } else if (code === "auth/weak-password") {
        return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
      } else {
        console.error("Auth error:", authErr);
        // If it's a different error, we should probably fail
        return { success: false, error: "Kayıt yapılamadı: " + authErr.message };
      }
    }

    // Check if there is an existing document under another UID first
    let existingData: any = {};
    try {
      const emailSnap = await getDoc(userDocRef);
      if (emailSnap.exists()) {
        existingData = emailSnap.data();
      } else {
        const q = query(collection(db, "users"), where("email", "==", e));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          existingData = qSnap.docs[0].data();
          const oldId = qSnap.docs[0].id;
          if (oldId !== e) {
            await deleteDoc(doc(db, "users", oldId)).catch(() => {});
          }
        }
      }
    } catch (err) {}

    const userData: ObyoUser = {
      id:             e,
      email:          e,
      password:       data.password,
      name:           data.name.trim() || existingData.name || "Kullanıcı",
      surname:        data.surname.trim() || existingData.surname || "",
      birthDate:      data.birthDate || existingData.birthDate || "2000-01-01",
      currency:       data.currency || existingData.currency || currency,
      demoBalance:    existingData.demoBalance !== undefined ? existingData.demoBalance : demoBalance,
      realBalance:    existingData.realBalance !== undefined ? existingData.realBalance : 0,
      totalDeposited: existingData.totalDeposited !== undefined ? existingData.totalDeposited : 0,
      totalWithdrawn: existingData.totalWithdrawn !== undefined ? existingData.totalWithdrawn : 0,
      createdAt:      existingData.createdAt || Date.now(),
      kycStatus:      existingData.kycStatus || ("none" as const),
      kycDetails:     existingData.kycDetails || undefined,
      photoUrl:       existingData.photoUrl || undefined,
      photoURL:       existingData.photoURL || existingData.photoUrl || undefined,
      emailVerified:  data.emailVerified ?? true,
    };

    try {
      await setDoc(userDocRef, cleanForFirestore(userData), { merge: true });
    } catch (dbErr: any) {
      console.error("Firebase db setDoc error:", dbErr);
      return { success: false, error: `Kayıt yapılamadı (DB): ${dbErr.message || "Bilinmeyen veritabanı hatası"}` };
    }

    try {
      localStorage.setItem("obyo_user_reg_" + e, JSON.stringify(userData));
      const regList = JSON.parse(localStorage.getItem("obyo_registered_emails") || "[]");
      if (!regList.includes(e)) {
        regList.push(e);
        localStorage.setItem("obyo_registered_emails", JSON.stringify(regList));
      }
    } catch (err) {}

    localStorage.removeItem(LS_IS_ADMIN);
    localStorage.setItem("obyo_tutorial_done", "1");
    localStorage.setItem(LS_CUSTOM_UID, e);
    localStorage.setItem("obyo_active_email", e);
    localStorage.setItem("obyo_active_uid", e);
    setCurrentUser(userData);

    return { success: true };
  };

  const sendFirebaseVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false, error: "Firebase kullanıcı oturumu bulunamadı." };
    } catch (err: any) {
      console.error("sendFirebaseVerificationEmail error:", err);
      return { success: false, error: err?.message || "Doğrulama e-postası gönderilemedi." };
    }
  };

  const checkFirebaseEmailVerified = async (): Promise<{ isVerified: boolean; error?: string }> => {
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            emailVerified: true,
          }).catch(() => {});
          if (currentUser) {
            setCurrentUser({ ...currentUser, emailVerified: true });
          }
          return { isVerified: true };
        } else {
          return { isVerified: false, error: "E-posta henüz doğrulanmadı. Lütfen gelen kutunuzdaki/spam klasörünüzdeki doğrulama bağlantısına tıklayıp tekrar kontrol edin." };
        }
      }
      return { isVerified: true };
    } catch (err: any) {
      console.error("checkFirebaseEmailVerified error:", err);
      return { isVerified: false, error: err?.message || "Doğrulama durumu kontrol edilemedi." };
    }
  };

  const confirmEmailVerified = async (userId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetUid = userId || currentUser?.id || auth.currentUser?.uid;
      if (!targetUid) return { success: false, error: "Kullanıcı ID bulunamadı." };

      await updateDoc(doc(db, "users", targetUid), {
        emailVerified: true,
      });

      if (currentUser) {
        setCurrentUser({ ...currentUser, emailVerified: true });
      }
      return { success: true };
    } catch (err: any) {
      console.error("confirmEmailVerified error:", err);
      return { success: false, error: err?.message || "Doğrulama durumu güncellenemedi." };
    }
  };

  const logout = async () => {
    localStorage.removeItem(LS_IS_ADMIN);
    localStorage.removeItem(LS_CUSTOM_UID);
    localStorage.removeItem("obyo_active_uid");
    localStorage.removeItem("obyo_active_email");
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

      const targetUserId = req.userEmail?.trim().toLowerCase() || req.userId;
      if (targetUserId) {
        const userRef = doc(db, "users", targetUserId);
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
      const targetUserId = userEmail?.trim().toLowerCase() || userId;
      await setDoc(doc(db, "users", targetUserId), {
        realBalance:    increment(amt),
        totalDeposited: increment(amt),
      }, { merge: true });

      await addDoc(collection(db, "requests"), {
        userId: targetUserId,
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

  const submitKYC = async (data: {
    fullName: string;
    birthDate: string;
    idNumber: string;
    documentFrontUrl?: string;
    documentBackUrl?: string;
  }): Promise<{ success: boolean; isVerified: boolean; message: string }> => {
    if (!currentUser) return { success: false, isVerified: false, message: "Oturum açılmamış." };

    const normalize = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/i̇/g, "i")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/\s+/g, " ");

    const enteredNameNorm = normalize(data.fullName);
    const firstNameNorm   = normalize(currentUser.name);
    const surnameNorm     = normalize(currentUser.surname);
    const registeredNameNorm = `${firstNameNorm} ${surnameNorm}`;

    const enteredDate = data.birthDate.trim();
    const registeredDate = (currentUser.birthDate || "").trim();

    // Check if name contains both registered first name and surname or matches registered full name
    const nameMatches =
      enteredNameNorm === registeredNameNorm ||
      (enteredNameNorm.includes(firstNameNorm) && enteredNameNorm.includes(surnameNorm));

    if (nameMatches || !registeredNameNorm) {
      const kycDetails = {
        fullName: data.fullName,
        birthDate: data.birthDate,
        idNumber: data.idNumber,
        documentFrontUrl: data.documentFrontUrl || "",
        documentBackUrl: data.documentBackUrl || "",
        submittedAt: Date.now(),
        verifiedAt: Date.now(),
      };

      try {
        const userRef = doc(db, "users", currentUser.id);
        await setDoc(userRef, cleanForFirestore({
          kycStatus: "verified",
          kycDetails,
        }), { merge: true });

        setCurrentUser(prev => prev ? {
          ...prev,
          kycStatus: "verified",
          kycDetails,
        } : null);

        return {
          success: true,
          isVerified: true,
          message: "Kimlik bilgileriniz başarıyla doğrulandı ve hesabınız onaylandı!",
        };
      } catch (err: any) {
        console.error("KYC update error:", err);
        return {
          success: false,
          isVerified: false,
          message: "Veritabanı güncellenirken hata oluştu: " + (err?.message || "Bilinmeyen hata"),
        };
      }
    } else {
      // If name does not match, don't fail outright; submit as 'pending' for manual admin review
      const kycDetails = {
        fullName: data.fullName,
        birthDate: data.birthDate,
        idNumber: data.idNumber,
        documentFrontUrl: data.documentFrontUrl || "",
        documentBackUrl: data.documentBackUrl || "",
        submittedAt: Date.now(),
      };

      try {
        const userRef = doc(db, "users", currentUser.id);
        await setDoc(userRef, cleanForFirestore({
          kycStatus: "pending",
          kycDetails,
        }), { merge: true });

        setCurrentUser(prev => prev ? {
          ...prev,
          kycStatus: "pending",
          kycDetails,
        } : null);

        return {
          success: true,
          isVerified: false,
          message: "Kimlik bilgileriniz sistemdeki kayıtlarınızla tam uyuşmadı. Ancak belgeleriniz yöneticilerimiz tarafından incelenmek üzere 'Beklemede' (Pending) olarak başarıyla kaydedildi!",
        };
      } catch (err: any) {
        console.error("KYC pending submit error:", err);
        return {
          success: false,
          isVerified: false,
          message: "Veritabanı güncellenirken hata oluştu: " + (err?.message || "Bilinmeyen hata"),
        };
      }
    }
  };

  const updateProfilePhoto = async (photoUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Oturum açılmamış." };
    try {
      const userRef = doc(db, "users", currentUser.id);
      await setDoc(userRef, { photoURL: photoUrl, photoUrl: photoUrl }, { merge: true });
      setCurrentUser(prev => prev ? { ...prev, photoURL: photoUrl, photoUrl: photoUrl } : null);
      return { success: true };
    } catch (err: any) {
      console.error("updateProfilePhoto error:", err);
      return { success: false, error: err?.message || "Profil fotoğrafı kaydedilemedi." };
    }
  };

  const adminUpdateKYC = async (userId: string, status: "verified" | "rejected", reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userRef = doc(db, "users", userId);
      const updates: any = {
        kycStatus: status,
      };
      if (status === "rejected") {
        updates["kycDetails.rejectionReason"] = reason || "";
      } else if (status === "verified") {
        updates["kycDetails.verifiedAt"] = Date.now();
      }
      await setDoc(userRef, updates, { merge: true });
      return { success: true };
    } catch (err: any) {
      console.error("adminUpdateKYC error:", err);
      return { success: false, error: err?.message || "KYC durumu güncellenemedi." };
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
      login, loginWithGoogle, register, logout,
      sendFirebaseVerificationEmail, checkFirebaseEmailVerified, confirmEmailVerified,
      users, requests,
      addRequest, processRequest, addBalanceDirect,
      placeRealTrade, settleRealTrade, updateProfilePhoto, submitKYC, adminUpdateKYC,
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
