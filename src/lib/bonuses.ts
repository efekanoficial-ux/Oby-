import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, increment, getDoc, query, where, addDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { ObyoUser } from "@/context/AuthContext";

export type BonusType = "nodeposit" | "deposit_match";
export type BonusTarget = "all" | "user";

export interface Bonus {
  id: string;
  title: string;
  description: string;
  type: BonusType;
  amount: number; // e.g., 10 (for $10 or 10%), 500 (for 500TL), 50 (for 50%)
  currency: "USD" | "TL" | "PERCENT";
  target: BonusTarget;
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserName?: string;
  createdAt: number;
  expiresAt: number; // timestamp in ms (1 day = createdAt + 24 * 60 * 60 * 1000)
  status: "active" | "inactive";
  badge?: string;
}

export interface UserBonusClaim {
  id: string; // `${bonusId}_${userId}`
  bonusId: string;
  userId: string;
  userEmail: string;
  bonusTitle: string;
  type: BonusType;
  amount: number;
  currency: string;
  status: "activated" | "used";
  activatedAt: number;
  usedAt?: number;
  expiresAt: number;
}

export const DEFAULT_BONUSES: Bonus[] = [];

export const LEGACY_DEFAULT_IDS = new Set([
  "bonus-welcome-10usd",
  "bonus-deposit-50percent",
  "bonus-try-500tl",
]);

const LS_BONUSES_KEY = "obyo_bonuses_data_v1";
const LS_CLAIMS_KEY = "obyo_user_bonus_claims_v1";

/* ─── Helper Queries & Deduplication ─────────────────────────────────────── */
export function isBonusForUser(bonus: Bonus, user: ObyoUser | null): boolean {
  if (!bonus || bonus.status === "inactive") return false;
  if (bonus.expiresAt <= Date.now()) return false;
  if (bonus.target === "all") return true;
  if (!user) return false;

  const currentUserId = (user.id || "").trim().toLowerCase();
  const currentUserEmail = (user.email || "").trim().toLowerCase();

  const targetUserId = (bonus.targetUserId || "").trim().toLowerCase();
  const targetUserEmail = (bonus.targetUserEmail || "").trim().toLowerCase();

  const matchesId = Boolean(
    targetUserId && (targetUserId === currentUserId || targetUserId === currentUserEmail)
  );
  const matchesEmail = Boolean(
    targetUserEmail && (targetUserEmail === currentUserEmail || targetUserEmail === currentUserId)
  );

  return matchesId || matchesEmail;
}

export function getActiveUserBonuses(
  bonuses: Bonus[],
  claims: UserBonusClaim[],
  user: ObyoUser | null
): Bonus[] {
  const map = new Map<string, Bonus>();
  const now = Date.now();

  for (const b of bonuses) {
    if (!b || !b.id || b.status === "inactive" || b.expiresAt <= now) continue;
    if (!isBonusForUser(b, user)) continue;

    // Check if the user has already used this bonus
    const isUsed = claims.some(
      (c) => c.bonusId === b.id && c.status === "used"
    );
    if (!isUsed) {
      map.set(b.id, b);
    }
  }

  return Array.from(map.values());
}

export function getUnclaimedBonusCount(
  bonuses: Bonus[],
  claims: UserBonusClaim[],
  user: ObyoUser | null
): number {
  return getActiveUserBonuses(bonuses, claims, user).length;
}

/* ─── Local Storage Helpers ──────────────────────────────────────────────── */
function getLocalBonuses(): Bonus[] {
  try {
    const raw = localStorage.getItem(LS_BONUSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, Bonus>();
    for (const b of parsed) {
      if (b && b.id && !LEGACY_DEFAULT_IDS.has(b.id)) {
        map.set(b.id, b);
      }
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

function saveLocalBonuses(bonuses: Bonus[]) {
  try {
    const map = new Map<string, Bonus>();
    for (const b of bonuses) {
      if (b && b.id && !LEGACY_DEFAULT_IDS.has(b.id)) {
        map.set(b.id, b);
      }
    }
    const cleanList = Array.from(map.values());
    localStorage.setItem(LS_BONUSES_KEY, JSON.stringify(cleanList));
  } catch {}
}

function getLocalClaims(): UserBonusClaim[] {
  try {
    const raw = localStorage.getItem(LS_CLAIMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalClaims(claims: UserBonusClaim[]) {
  try {
    localStorage.setItem(LS_CLAIMS_KEY, JSON.stringify(claims));
  } catch {}
}

/* ─── Firestore Listeners ────────────────────────────────────────────────── */
export function listenBonuses(callback: (bonuses: Bonus[]) => void): () => void {
  callback(getLocalBonuses());

  try {
    const bonusesCol = collection(db, "bonuses");
    const unsub = onSnapshot(
      bonusesCol,
      (snap) => {
        if (snap.empty) {
          saveLocalBonuses([]);
          callback([]);
        } else {
          const map = new Map<string, Bonus>();
          snap.docs.forEach((d) => {
            const data = { id: d.id, ...d.data() } as Bonus;
            if (LEGACY_DEFAULT_IDS.has(data.id)) {
              // Delete legacy doc from Firestore to clean up database
              deleteDoc(doc(db, "bonuses", data.id)).catch(() => {});
            } else {
              map.set(data.id, data);
            }
          });
          const list = Array.from(map.values());
          saveLocalBonuses(list);
          callback(list);
        }
      },
      (err) => {
        console.warn("Firestore listenBonuses fallback to local:", err);
        callback(getLocalBonuses());
      }
    );
    return unsub;
  } catch (err) {
    console.warn("listenBonuses setup error:", err);
    return () => {};
  }
}

export function listenAllClaims(
  callback: (claims: UserBonusClaim[]) => void
): () => void {
  callback(getLocalClaims());

  try {
    const claimsCol = collection(db, "bonus_claims");
    const unsub = onSnapshot(
      claimsCol,
      (snap) => {
        const allClaims = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as UserBonusClaim)
        );
        saveLocalClaims(allClaims);
        callback(allClaims);
      },
      (err) => {
        console.warn("listenAllClaims error, using local:", err);
        callback(getLocalClaims());
      }
    );
    return unsub;
  } catch (err) {
    console.warn("listenAllClaims setup error:", err);
    return () => {};
  }
}

export function listenUserClaims(
  userId: string,
  userEmail: string,
  callback: (claims: UserBonusClaim[]) => void
): () => void {
  const filterKeys = [
    userId,
    userEmail,
    userId?.toLowerCase(),
    userEmail?.toLowerCase(),
  ].filter(Boolean);

  const localFiltered = getLocalClaims().filter((c) =>
    filterKeys.includes(c.userId) || filterKeys.includes(c.userEmail)
  );
  callback(localFiltered);

  try {
    const claimsCol = collection(db, "bonus_claims");
    const unsub = onSnapshot(
      claimsCol,
      (snap) => {
        const allClaims = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as UserBonusClaim)
        );
        saveLocalClaims(allClaims);
        const userClaims = allClaims.filter((c) =>
          filterKeys.includes(c.userId) || filterKeys.includes(c.userEmail)
        );
        callback(userClaims);
      },
      (err) => {
        console.warn("listenUserClaims error, using local:", err);
        const lClaims = getLocalClaims().filter((c) =>
          filterKeys.includes(c.userId) || filterKeys.includes(c.userEmail)
        );
        callback(lClaims);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("listenUserClaims setup error:", err);
    return () => {};
  }
}

export async function saveBonus(bonus: Bonus): Promise<void> {
  const current = getLocalBonuses();
  const index = current.findIndex((b) => b.id === bonus.id);
  const updated = index >= 0 ? current.map((b) => (b.id === bonus.id ? bonus : b)) : [bonus, ...current];
  saveLocalBonuses(updated);

  try {
    await setDoc(doc(db, "bonuses", bonus.id), bonus);
  } catch (err) {
    console.error("Firestore saveBonus error:", err);
  }
}

/* ─── Admin Bonus Actions ────────────────────────────────────────────────── */
export async function createBonus(
  data: Omit<Bonus, "id" | "createdAt" | "expiresAt"> & {
    durationHours?: number;
  }
): Promise<string> {
  const id = `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = Date.now();
  const durationMs = (data.durationHours || 24) * 60 * 60 * 1000;
  const newBonus: Bonus = {
    ...data,
    id,
    createdAt: now,
    expiresAt: now + durationMs,
    status: data.status || "active",
  };

  // Local save
  const current = getLocalBonuses();
  const updated = [newBonus, ...current];
  saveLocalBonuses(updated);

  // Firestore save
  try {
    await setDoc(doc(db, "bonuses", id), newBonus);
  } catch (err) {
    console.error("Firestore createBonus error:", err);
  }

  return id;
}

export async function deleteBonus(bonusId: string): Promise<void> {
  // Local
  const current = getLocalBonuses().filter((b) => b.id !== bonusId);
  saveLocalBonuses(current);

  // Firestore
  try {
    await deleteDoc(doc(db, "bonuses", bonusId));
  } catch (err) {
    console.error("Firestore deleteBonus error:", err);
  }
}

/* ─── User Activation Actions ────────────────────────────────────────────── */
export async function claimNoDepositBonus(
  bonus: Bonus,
  user: ObyoUser
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!user) {
    return { success: false, error: "Giriş yapmanız gerekiyor." };
  }

  // 1. Süre kontrolü
  if (Date.now() > bonus.expiresAt) {
    return { success: false, error: "Bu bonusun 1 günlük süresi dolmuştur." };
  }

  // 2. Kişiye özel hedef kontrolü
  if (bonus.target === "user") {
    const userMatches =
      (bonus.targetUserId && (bonus.targetUserId === user.id || bonus.targetUserId === user.email)) ||
      (bonus.targetUserEmail && bonus.targetUserEmail.toLowerCase() === user.email.toLowerCase());
    if (!userMatches) {
      return { success: false, error: "Bu bonus yalnızca belirlenen kullanıcıya özeldir." };
    }
  }

  const claimId = `${bonus.id}_${user.id || user.email}`;

  // 3. Daha önce alınmış mı kontrol et
  const localClaims = getLocalClaims();
  if (localClaims.some((c) => c.id === claimId && c.status === "used")) {
    return { success: false, error: "Bu bonusu zaten kullandınız." };
  }

  try {
    const claimDoc = await getDoc(doc(db, "bonus_claims", claimId));
    if (claimDoc.exists()) {
      return { success: false, error: "Bu bonusu zaten kullandınız." };
    }
  } catch {}

  let creditAmount = Number(bonus.amount) || 0;
  let creditedCurrency = bonus.currency;

  // 10$ bonus Eğer TL hesabına gönderiliyorsa otomatik 500₺ geçsin
  const isTLUser = user.currency === "TL";
  if (isTLUser && bonus.currency === "USD") {
    creditAmount = creditAmount === 10 ? 500 : creditAmount * 50;
    creditedCurrency = "TL";
  }

  const targetUserId = user.email?.trim().toLowerCase() || user.id;

  const claimRecord: UserBonusClaim = {
    id: claimId,
    bonusId: bonus.id,
    userId: targetUserId,
    userEmail: user.email,
    bonusTitle: bonus.title,
    type: "nodeposit",
    amount: creditAmount,
    currency: creditedCurrency,
    status: "used",
    activatedAt: Date.now(),
    usedAt: Date.now(),
    expiresAt: bonus.expiresAt,
  };

  // Local claim update
  saveLocalClaims([...localClaims.filter((c) => c.id !== claimId), claimRecord]);

  // Firestore update
  try {
    // 1. Claim kaydı oluştur
    await setDoc(doc(db, "bonus_claims", claimId), claimRecord);

    // 2. Kullanıcının gerçek bakiyesini artır
    const userRef = doc(db, "users", targetUserId);
    await setDoc(
      userRef,
      {
        realBalance: increment(creditAmount),
        totalDeposited: increment(creditAmount),
      },
      { merge: true }
    );

    // 3. İşlem geçmişine (requests) bonus yatırımı olarak ekle
    const currencyStr = creditedCurrency === "TL" ? "TL" : "USD";
    await addDoc(collection(db, "requests"), {
      userId: targetUserId,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`.trim(),
      type: "deposit",
      amount: creditAmount,
      currency: currencyStr,
      method: `Bonus (${bonus.title})`,
      status: "accepted",
      createdAt: Date.now(),
      processedAt: Date.now(),
    });

    return {
      success: true,
      message: `${creditAmount} ${creditedCurrency === "TL" ? "₺" : "$"} bonus hesabınıza anında aktarıldı!`,
    };
  } catch (err: any) {
    console.error("claimNoDepositBonus error:", err);
    return { success: false, error: "Bonus aktarılırken hata oluştu: " + err.message };
  }
}

export async function activateDepositMatchBonus(
  bonus: Bonus,
  user: ObyoUser
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!user) {
    return { success: false, error: "Giriş yapmanız gerekiyor." };
  }

  if (Date.now() > bonus.expiresAt) {
    return { success: false, error: "Bu bonusun 1 günlük süresi dolmuştur." };
  }

  if (bonus.target === "user") {
    const userMatches =
      (bonus.targetUserId && (bonus.targetUserId === user.id || bonus.targetUserId === user.email)) ||
      (bonus.targetUserEmail && bonus.targetUserEmail.toLowerCase() === user.email.toLowerCase());
    if (!userMatches) {
      return { success: false, error: "Bu bonus yalnızca belirlenen kullanıcıya özeldir." };
    }
  }

  const claimId = `${bonus.id}_${user.id || user.email}`;
  const targetUserId = user.email?.trim().toLowerCase() || user.id;

  const claimRecord: UserBonusClaim = {
    id: claimId,
    bonusId: bonus.id,
    userId: targetUserId,
    userEmail: user.email,
    bonusTitle: bonus.title,
    type: "deposit_match",
    amount: Number(bonus.amount) || 50,
    currency: "PERCENT",
    status: "activated", // Etkin - yapılacak yatırımı bekliyor
    activatedAt: Date.now(),
    expiresAt: bonus.expiresAt,
  };

  const localClaims = getLocalClaims();
  saveLocalClaims([...localClaims.filter((c) => c.id !== claimId), claimRecord]);

  try {
    await setDoc(doc(db, "bonus_claims", claimId), claimRecord);
    return {
      success: true,
      message: `%${bonus.amount} Yatırım Bonusu etkinleştirildi! Yapacağınız yatırımda %${bonus.amount} ekstra bakiye eklenecektir.`,
    };
  } catch (err: any) {
    console.error("activateDepositMatchBonus error:", err);
    return { success: false, error: "Bonus etkinleştirilemedi: " + err.message };
  }
}

export async function markDepositBonusUsed(
  claimId: string
): Promise<void> {
  const localClaims = getLocalClaims().map((c) =>
    c.id === claimId ? { ...c, status: "used" as const, usedAt: Date.now() } : c
  );
  saveLocalClaims(localClaims);

  try {
    await updateDoc(doc(db, "bonus_claims", claimId), {
      status: "used",
      usedAt: Date.now(),
    });
  } catch (err) {
    console.error("markDepositBonusUsed error:", err);
  }
}
