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

interface TournamentI18n {
  title: string;
  subtitle: string;
  prizePool: string;
  duration: string;
}

const TOURNAMENT_LOCALIZATIONS: Record<string, Record<string, TournamentI18n>> = {
  "tournament-wall-street": {
    en: {
      title: "Wall Street Bull Championship",
      subtitle: "1-week highest balance race with NYSE dynamics. Aim for the top with 100¥ starting balance!",
      prizePool: "$25,000 Prize Pool",
      duration: "1 Week (7 Days)",
    },
    de: {
      title: "Wall Street Bullen-Meisterschaft",
      subtitle: "1-wöchiges Rennen um das höchste Guthaben an der NYSE. Mit 100¥ Startguthaben an die Spitze!",
      prizePool: "$25.000 Preispool",
      duration: "1 Woche (7 Tage)",
    },
    es: {
      title: "Campeonato Toro de Wall Street",
      subtitle: "Carrera de 1 semana por el saldo más alto en la Bolsa de NY. ¡Compite por la cima con 100¥ iniciales!",
      prizePool: "$25,000 Fondo de Premios",
      duration: "1 Semana (7 Días)",
    },
    ru: {
      title: "Чемпионат Быка с Уолл-Стрит",
      subtitle: "Недельная битва за наивысший баланс на бирже NYSE. Начните со 100¥ и доберитесь до вершины!",
      prizePool: "Призовой фонд $25,000",
      duration: "1 Неделя (7 Дней)",
    },
    ar: {
      title: "بطولة ثور وول ستريت",
      subtitle: "سباق لمدة أسبوع لتحقيق أعلى رصيد وفق ديناميكيات بورصة نيويورك. ابدأ بـ 100¥ ونافس على القمة!",
      prizePool: "مجموع الجوائز $25,000",
      duration: "أسبوع واحد (7 أيام)",
    },
  },
  "tournament-crypto-rally": {
    en: {
      title: "Crypto & Forex Mega Rally",
      subtitle: "1-week profit feast for masters catching high volatility and rapid trends.",
      prizePool: "$20,000 Prize Pool",
      duration: "1 Week (7 Days)",
    },
    de: {
      title: "Krypto & Forex Mega Rallye",
      subtitle: "1-wöchiges Profit-Festival für Meister hoher Volatilität und schneller Trends.",
      prizePool: "$20.000 Preispool",
      duration: "1 Woche (7 Tage)",
    },
    es: {
      title: "Mega Rally Cripto & Forex",
      subtitle: "1 semana de ganancias para traders expertos en alta volatilidad y tendencias rápidas.",
      prizePool: "$20,000 Fondo de Premios",
      duration: "1 Semana (7 Días)",
    },
    ru: {
      title: "Мега Ралли Крипто & Форекс",
      subtitle: "Неделя прибыли для мастеров, ловящих высокую волатильность и быстрые тренды.",
      prizePool: "Призовой фонд $20,000",
      duration: "1 Неделя (7 Дней)",
    },
    ar: {
      title: "رالي العملات الرقمية والفوركس الكبير",
      subtitle: "أسبوع من الأرباح للمحترفين في استغلال التقلبات العالية والاتجاهات السريعة.",
      prizePool: "مجموع الجوائز $20,000",
      duration: "أسبوع واحد (7 أيام)",
    },
  },
  "tournament-gold-commodities": {
    en: {
      title: "Gold & Commodities League",
      subtitle: "VIP leaders clash by opening high-precision positions on Gold, Crude Oil, and Silver.",
      prizePool: "$15,000 Prize Pool",
      duration: "1 Week (7 Days)",
    },
    de: {
      title: "Gold & Rohstoffe Liga",
      subtitle: "VIP-Leader duellieren sich mit präzisen Positionen auf Gold, Öl und Silber.",
      prizePool: "$15.000 Preispool",
      duration: "1 Woche (7 Tage)",
    },
    es: {
      title: "Liga de Oro y Materias Primas",
      subtitle: "Líderes VIP compiten abriendo operaciones de precisión en Oro, Petróleo y Plata.",
      prizePool: "$15,000 Fondo de Premios",
      duration: "1 Semana (7 Días)",
    },
    ru: {
      title: "Лига Золота и Сырьевых Товаров",
      subtitle: "VIP-лидеры соревнуются, открывая точные сделки по золоту, нефти и серебру.",
      prizePool: "Призовой фонд $15,000",
      duration: "1 Неделя (7 Дней)",
    },
    ar: {
      title: "دوري الذهب والسلع",
      subtitle: "يتنافس قادة VIP بفتح صفقات دقيقة على الذهب والنفط والفضة.",
      prizePool: "مجموع الجوائز $15,000",
      duration: "أسبوع واحد (7 أيام)",
    },
  },
  "tournament-nasdaq-vip": {
    en: {
      title: "Nasdaq VIP Elite Tournament",
      subtitle: "Top 3 traders who multiply their 100¥ balance the most on tech stock options win the grand prize.",
      prizePool: "$30,000 Prize Pool",
      duration: "1 Week (7 Days)",
    },
    de: {
      title: "Nasdaq VIP Elite Turnier",
      subtitle: "Die 3 Trader, die ihr 100¥ Guthaben bei Tech-Optionen am meisten vervielfachen, gewinnen den Hauptpreis.",
      prizePool: "$30.000 Preispool",
      duration: "1 Woche (7 Tage)",
    },
    es: {
      title: "Torneo Élite Nasdaq VIP",
      subtitle: "Los 3 mejores operadores que multipliquen su saldo de 100¥ en acciones tecnológicas ganan el gran premio.",
      prizePool: "$30,000 Fondo de Premios",
      duration: "1 Semana (7 Días)",
    },
    ru: {
      title: "Элитный турнир Nasdaq VIP",
      subtitle: "Топ-3 трейдера, которые больше всего увеличат свой баланс 100¥ на акциях тех-гигантов, получат главный приз.",
      prizePool: "Призовой фонд $30,000",
      duration: "1 Неделя (7 Дней)",
    },
    ar: {
      title: "بطولة ناسداك VIP للنخبة",
      subtitle: "أفضل 3 متداولين يضاعفون رصيدهم البالغ 100¥ في خيارات أسهم التكنولوجيا يفوزون بالجائزة الكبرى.",
      prizePool: "مجموع الجوائز $30,000",
      duration: "أسبوع واحد (7 أيام)",
    },
  },
  "tournament-alpha-grand-prix": {
    en: {
      title: "Global Alpha Trader Cup",
      subtitle: "Prestigious 1-week battle among elite global traders. The champion's name goes down in history.",
      prizePool: "$50,000 Prize Pool",
      duration: "1 Week (7 Days)",
    },
    de: {
      title: "Global Alpha Trader Pokal",
      subtitle: "Prestigeträchtiger 1-Wochen-Wettkampf globaler Spitzen-Trader. Der Champion geht in die Geschichte ein.",
      prizePool: "$50.000 Preispool",
      duration: "1 Woche (7 Tage)",
    },
    es: {
      title: "Copa Global Alpha Trader",
      subtitle: "Prestigiosa batalla de 1 semana entre operadores de élite mundial. El nombre del campeón pasa a la historia.",
      prizePool: "$50,000 Fondo de Premios",
      duration: "1 Semana (7 Días)",
    },
    ru: {
      title: "Кубок Global Alpha Trader",
      subtitle: "Престижная 1-недельная битва среди элитных мировых трейдеров. Имя чемпиона войдет в историю.",
      prizePool: "Призовой фонд $50,000",
      duration: "1 Неделя (7 Дней)",
    },
    ar: {
      title: "كأس ألفا العالمي للتداول",
      subtitle: "معركة مرموقة لمدة أسبوع واحد بين نخبة المتداولين حول العالم. اسم البطل يدخل التاريخ.",
      prizePool: "مجموع الجوائز $50,000",
      duration: "أسبوع واحد (7 أيام)",
    },
  },
};

export function getLocalizedTournament(tournament: Tournament, lang?: string): Tournament {
  const code = (lang || "en").toLowerCase().slice(0, 2);
  if (code === "tr") return tournament;

  const loc = TOURNAMENT_LOCALIZATIONS[tournament.id]?.[code] || TOURNAMENT_LOCALIZATIONS[tournament.id]?.["en"];
  let prizePool = tournament.prizePool;
  let duration = tournament.duration;

  if (loc) {
    return {
      ...tournament,
      title: loc.title,
      subtitle: loc.subtitle,
      prizePool: loc.prizePool,
      duration: loc.duration,
    };
  }

  // Fallback for custom or unknown tournaments
  if (code !== "tr") {
    prizePool = prizePool.replace(/Ödül Havuzu/gi, "Prize Pool");
    duration = duration.replace(/1 Hafta \(7 Gün\)/gi, "1 Week (7 Days)").replace(/Hafta/gi, "Weeks").replace(/Gün/gi, "Days");
  }

  return {
    ...tournament,
    prizePool,
    duration,
  };
}

/**
 * Generate simulated / benchmark tournament leaders for the 1-week race with realistic 100¥ starting balances.
 */
export function getDeterministicTournamentLeaders(
  tournamentId: string,
  currentUser?: ObyoUser | null,
  youLabel?: string
): TournamentLeader[] {
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
    const tag = youLabel ? ` (${youLabel})` : "";
    const userLeader: TournamentLeader = {
      userId: currentUser.id,
      name: `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}.${tag}`.trim(),
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
