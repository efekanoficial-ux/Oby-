import {
  collection, doc, getDocs, setDoc, updateDoc,
  onSnapshot, increment, arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import { ObyoUser } from "@/context/AuthContext";

export interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  entryFeeUSD: number;
  entryFeeTL: number;
  startingBalance: number;
  currencySymbol: string;
  prizePool: string;
  duration: string;
  endsAt: number; // timestamp in ms
  participantsCount: number;
  status: "active" | "completed" | "upcoming";
  minVipLevel: string;
}

export interface TournamentLeader {
  userId: string;
  name: string;
  countryFlag: string;
  tournamentBalance: number;
  tradeCount: number;
  rank: number;
  isCurrentUser?: boolean;
}

// 5 Curated stock market / trading tournaments with verified high-res trading stock images
export const DEFAULT_TOURNAMENTS: Tournament[] = [
  {
    id: "tournament-wall-street",
    title: "Wall Street Boğası Şampiyonası",
    subtitle: "New York Borsası dinamiklerinde 1 haftalık en yüksek bakiye yarışı. 100¥ başlangıç ile zirveye oyna!",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    entryFeeUSD: 50,
    entryFeeTL: 2500,
    startingBalance: 100,
    currencySymbol: "¥",
    prizePool: "$25,000 Ödül Havuzu",
    duration: "1 Hafta (7 Gün)",
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    participantsCount: 142,
    status: "active",
    minVipLevel: "VIP",
  },
  {
    id: "tournament-crypto-rally",
    title: "Kripto & Forex Mega Ralli",
    subtitle: "Yüksek volatilite ve hızlı trendleri yakalayan ustalar için 1 haftalık kâr şöleni.",
    imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80",
    entryFeeUSD: 50,
    entryFeeTL: 2500,
    startingBalance: 100,
    currencySymbol: "¥",
    prizePool: "$20,000 Ödül Havuzu",
    duration: "1 Hafta (7 Gün)",
    endsAt: Date.now() + 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    participantsCount: 98,
    status: "active",
    minVipLevel: "VIP",
  },
  {
    id: "tournament-gold-commodities",
    title: "Altın & Emtia Ligi",
    subtitle: "Ons altın, petrol ve gümüş piyasalarında en isabetli pozisyonları açan VIP liderler kapışıyor.",
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
    entryFeeUSD: 50,
    entryFeeTL: 2500,
    startingBalance: 100,
    currencySymbol: "¥",
    prizePool: "$15,000 Ödül Havuzu",
    duration: "1 Hafta (7 Gün)",
    endsAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
    participantsCount: 84,
    status: "active",
    minVipLevel: "VIP",
  },
  {
    id: "tournament-nasdaq-vip",
    title: "Nasdaq VIP Elit Turnuvası",
    subtitle: "Teknoloji devlerinin hisse opsiyonlarında 100¥ bakiyeyi en çok katlayan 3 tüccar büyük ödülü alır.",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    entryFeeUSD: 50,
    entryFeeTL: 2500,
    startingBalance: 100,
    currencySymbol: "¥",
    prizePool: "$30,000 Ödül Havuzu",
    duration: "1 Hafta (7 Gün)",
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    participantsCount: 176,
    status: "active",
    minVipLevel: "VIP",
  },
  {
    id: "tournament-alpha-grand-prix",
    title: "Global Alpha Trader Kupası",
    subtitle: "Dünya çapındaki elit yatırımcıların 1 haftalık prestij mücadelesi. Şampiyonun adı tarihe geçer.",
    imageUrl: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=800&q=80",
    entryFeeUSD: 50,
    entryFeeTL: 2500,
    startingBalance: 100,
    currencySymbol: "¥",
    prizePool: "$50,000 Ödül Havuzu",
    duration: "1 Hafta (7 Gün)",
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    participantsCount: 210,
    status: "active",
    minVipLevel: "VIP",
  },
];

/* ── Firestore synchronization ── */
export function listenTournaments(callback: (tournaments: Tournament[]) => void) {
  try {
    const colRef = collection(db, "tournaments");
    return onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        // Seed default tournaments if none exist in Firestore
        seedDefaultTournaments().then(() => {
          callback(DEFAULT_TOURNAMENTS);
        });
      } else {
        const list: Tournament[] = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Tournament[];
        // Sort stably by ID
        list.sort((a, b) => a.id.localeCompare(b.id));
        callback(list);
      }
    }, (err) => {
      console.warn("Tournaments onSnapshot error:", err);
      callback(DEFAULT_TOURNAMENTS);
    });
  } catch (err) {
    console.warn("Could not setup tournament listener:", err);
    callback(DEFAULT_TOURNAMENTS);
    return () => {};
  }
}

export async function seedDefaultTournaments() {
  try {
    for (const t of DEFAULT_TOURNAMENTS) {
      await setDoc(doc(db, "tournaments", t.id), t, { merge: true });
    }
  } catch (e) {
    console.warn("Tournaments seed failed:", e);
  }
}

export async function saveTournament(tournament: Tournament) {
  try {
    await setDoc(doc(db, "tournaments", tournament.id), tournament, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error("Save tournament error:", err);
    return { success: false, error: err?.message || "Kayıt başarısız" };
  }
}

export async function resetTournamentsToDefault() {
  try {
    for (const t of DEFAULT_TOURNAMENTS) {
      await setDoc(doc(db, "tournaments", t.id), t);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Check if user is VIP:
 * In the platform, users who deposited (totalDeposited >= 10 USD or 500 TL) qualify as VIP (Silver, Gold, VIP tiers).
 */
export function isUserVip(user: ObyoUser | null): boolean {
  if (!user) return false;
  const isTL = user.currency === "TL";
  const minDeposit = isTL ? 500 : 10;
  return (user.totalDeposited ?? 0) >= minDeposit;
}

/**
 * Join tournament logic:
 * 1. Checks VIP requirement (Must be VIP)
 * 2. Checks entry fee balance ($50 or 2500₺)
 * 3. Deducts entry fee from realBalance
 * 4. Adds starting tournament balance (e.g. 100¥)
 * 5. Updates user profile and active tournament
 */
export async function joinTournament(
  tournament: Tournament,
  user: ObyoUser
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: "Turnuvaya katılmak için lütfen önce giriş yapın." };
  }

  // 1. VIP Check
  if (!isUserVip(user)) {
    return {
      success: false,
      error: "Turnuvaya katılım için VIP üyelik gereklidir! En az Silver/VIP seviyesinde olmak için lütfen hesabınıza para yatırımı yapınız.",
    };
  }

  // 2. Check if already joined
  const joined = user.joinedTournaments || [];
  if (joined.includes(tournament.id)) {
    return {
      success: true,
      error: "Bu turnuvaya zaten katıldınız. Turnuva bakiyeniz ile işlem yapmaya devam edebilirsiniz.",
    };
  }

  // 3. Balance Check
  const isTL = user.currency === "TL";
  const fee = isTL ? tournament.entryFeeTL : tournament.entryFeeUSD;
  const currentRealBalance = user.realBalance ?? 0;

  if (currentRealBalance < fee) {
    const formattedFee = isTL ? `${fee.toLocaleString("tr-TR")} ₺` : `$${fee}`;
    const formattedBal = isTL ? `${currentRealBalance.toLocaleString("tr-TR")} ₺` : `$${currentRealBalance.toFixed(2)}`;
    return {
      success: false,
      error: `Yetersiz bakiye! Turnuvaya katılım ücreti ${formattedFee} gerçek bakiyenizden tahsil edilecektir. Mevcut bakiyeniz: ${formattedBal}. Lütfen cüzdanınıza bakiye yükleyin.`,
    };
  }

  // 4. Deduct fee & credit starting tournament balance
  try {
    const startingBal = tournament.startingBalance || 100;
    const userDocRef = doc(db, "users", user.id);

    await updateDoc(userDocRef, {
      realBalance: increment(-fee),
      tournamentBalance: startingBal,
      joinedTournaments: arrayUnion(tournament.id),
      activeTournamentId: tournament.id,
    });

    // Also update tournament participant count
    try {
      await updateDoc(doc(db, "tournaments", tournament.id), {
        participantsCount: increment(1),
      });
    } catch {}

    // Save local tournament active state
    try {
      localStorage.setItem(`obyo_mode_${user.id}`, "tournament");
      localStorage.setItem(`obyo_active_tournament_${user.id}`, tournament.id);
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("Join tournament error:", err);
    return { success: false, error: err?.message || "Turnuvaya katılırken bir hata oluştu." };
  }
}

/**
 * Generate simulated / benchmark tournament leaders for the 1-week race with realistic 100¥ starting balances.
 */
export function getDeterministicTournamentLeaders(tournamentId: string, currentUser?: ObyoUser | null): TournamentLeader[] {
  const baseLeaders = [
    { name: "Eren K.", countryFlag: "🇹🇷", tournamentBalance: 486.20, tradeCount: 64 },
    { name: "Alexei V.", countryFlag: "🇷🇺", tournamentBalance: 412.50, tradeCount: 58 },
    { name: "Burak Y.", countryFlag: "🇹🇷", tournamentBalance: 374.80, tradeCount: 47 },
    { name: "Marco S.", countryFlag: "🇮🇹", tournamentBalance: 320.10, tradeCount: 42 },
    { name: "Selim A.", countryFlag: "🇹🇷", tournamentBalance: 295.40, tradeCount: 39 },
    { name: "Kaito T.", countryFlag: "🇯🇵", tournamentBalance: 260.00, tradeCount: 35 },
    { name: "Oliver D.", countryFlag: "🇩🇪", tournamentBalance: 235.80, tradeCount: 31 },
    { name: "Caner M.", countryFlag: "🇹🇷", tournamentBalance: 210.50, tradeCount: 29 },
    { name: "David M.", countryFlag: "🇬🇧", tournamentBalance: 188.40, tradeCount: 25 },
    { name: "Zeynep T.", countryFlag: "🇹🇷", tournamentBalance: 165.20, tradeCount: 22 },
  ];

  const list: TournamentLeader[] = baseLeaders.map((b, i) => ({
    userId: `bot-${tournamentId}-${i}`,
    name: b.name,
    countryFlag: b.countryFlag,
    tournamentBalance: b.tournamentBalance,
    tradeCount: b.tradeCount,
    rank: i + 1,
  }));

  // If current user is in tournament, insert them in ranking
  if (currentUser && currentUser.joinedTournaments?.includes(tournamentId)) {
    const userBal = currentUser.tournamentBalance ?? 100;
    const userLeader: TournamentLeader = {
      userId: currentUser.id,
      name: `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}. (Siz)`.trim(),
      countryFlag: "🇹🇷",
      tournamentBalance: userBal,
      tradeCount: 15,
      rank: 0,
      isCurrentUser: true,
    };
    list.push(userLeader);
  }

  list.sort((a, b) => b.tournamentBalance - a.tournamentBalance);
  list.forEach((item, index) => {
    item.rank = index + 1;
  });

  return list;
}
