// ── i18n Translations System ──────────────────────────────────────────────

export type LanguageCode = "tr" | "en" | "de" | "es" | "ru" | "ar";

const tr = {
  // Auth
  signIn: "Giriş Yap",
  signUp: "Kayıt Ol",
  firstName: "Adı",
  lastName: "Soyadı",
  email: "E-posta",
  password: "Şifre",
  createAccount: "Hesap Oluştur",
  accountCurrency: "Hesap Para Birimi",
  dollar: "$ Dolar",
  turkishLira: "₺ Türk Lirası",
  noAccount: "Hesabınız yok mu? ",
  alreadyMember: "Zaten üye misiniz? ",
  loginFailed: "Giriş başarısız.",
  registerFailed: "Kayıt başarısız.",

  // Nav / Layout
  navHistory: "Geçmiş",
  navTrade: "İşlem",
  navBalance: "Bakiye",
  navVip: "Profil",
  selectAccount: "Hesap Seçin",
  demoAccount: "Demo Hesap",
  realAccount: "Gerçek Hesap",
  wallet: "Cüzdan",
  notifications: "Bildirimler",
  languageSettings: "Dil / Ayarlar",
  language: "Dil",
  marketsOpen: "Piyasalar Açık",
  liveDataStream: "Forex & OTC · Canlı veri akışı",
  loginRegister: "Giriş yapın / Kayıt olun",
  demoNote: "Demo hesapta $10.000 sanal bakiye ile işlem yapın.",
  privacyPolicy: "Gizlilik Politikası",
  about: "Hakkında",
  logout: "Çıkış Yap",
  leaderboard: "Lider Tablosu",
  activeTrades: "Aktif İşlemler",
  depositWithdraw: "Para Yatır / Çek",
  on: "Açık",
  off: "Kapalı",

  // History Page
  historyTitle: "İşlem Geçmişi",
  realHistory: "Gerçek",
  demoHistory: "Demo",
  win: "Kazanan",
  lose: "Kaybeden",
  netProfit: "Net Kâr",
  total: "Toplam",
  successRate: "Başarı",
  all: "Tümü",
  winners: "Kazananlar",
  losers: "Kaybedenler",
  tradesRecords: "İşlem Kaydı",
  won: "KAZANDI",
  lost: "KAYBETTİ",
  noHistoryTitle: "Henüz İşlem Geçmişi Bulunmuyor",
  noHistoryRealDesc: "Gerçek hesabınızda henüz tamamlanmış işlem yok.",
  noHistoryDemoDesc: "Demo hesabınızda henüz tamamlanmış işlem yok.",
  tradeNow: "Hemen İşlem Yap",
  activeRealTrades: "Açık Gerçek İşlemler",
  activeDemoTrades: "Açık Demo İşlemler",
  entryPrice: "Giriş Fiyatı",
  exitPrice: "Kapanış Fiyatı",
  tradeType: "İşlem Türü",
  closeTime: "Kapanış Zamanı",
  invested: "yatırıldı",

  // Home
  upBtn: "YUKARI",
  downBtn: "AŞAĞI",
  amountLabel: "Tutar",
  expiryLabel: "Vade",
  liveBtn: "● CANLI",
  profitLabel: "Kazanç",
  insufficientBalance: "Yetersiz bakiye — tutarı azaltın",
  selectExpiry: "Vade süresini seçin",

  // Tutorial UI
  tutSkip: "Atla",
  tutNext: "İleri",
  tutBack: "← Geri",
  tutStart: "Başla!",

  // Tutorial steps
  tut1Title: "Varlık Seçimi",
  tut1Sub: "13 forex ve OTC paritesi",
  tut1Body: "Ekranın üst kısmındaki varlık çubuğundan işlem yapmak istediğin pariteyi seçebilirsin. Her varlığın farklı bir kazanç oranı (payout %) vardır.",
  tut1Tip: "AUD/USD — %86 payout ile başla",

  tut2Title: "İşlem Miktarı",
  tut2Sub: "$5 ile $10,000 arasında",
  tut2Body: '"Tutar" alanından – ve + butonlarıyla riske girmek istediğin miktarı belirle. Bu tutar işlem başladığında bakiyenden düşer.',
  tut2Tip: "$50 ile başlamanı öneririz",

  tut3Title: "Vade Süresi",
  tut3Sub: "5 saniyeden 5 dakikaya kadar",
  tut3Body: "Araç çubuğundaki ⟳ butonuna tıkla ve vade süresini seç. İşlem, seçtiğin süre dolduğunda otomatik olarak kapanır.",
  tut3Tip: "Kısa vadeler daha hızlı sonuç verir!",

  tut4Title: "Yön Tahmini",
  tut4Sub: "Tek doğru tahminde kazan",
  tut4Body: "Fiyatın yükseleceğini düşünüyorsan YUKARI (yeşil), düşeceğini düşünüyorsan AŞAĞI (kırmızı) butonuna bas! Ekranın altında bulunur.",
  tut4Tip: "Doğru tahminde payout anında hesabına!",

  tut5Title: "Para Yatırma",
  tut5Sub: "Gerçek hesaba geç, daha fazla kazan",
  tut5Body: "Sağ üstteki turuncu cüzdan butonuna basarak para yatırabilirsin. IBAN, USDT TRC20 ve Kripto seçenekleri mevcuttur.",
  tut5Tip: "Minimum yatırım: 10 USDT",

  tut6Title: "Grafik Çizgileri",
  tut6Sub: "Giriş ve vade noktanı takip et",
  tut6Body: "İşlem açtığında grafik üzerinde iki çizgi belirir: yeşil çizgi Giriş fiyatını, kırmızı dikey çizgi Vade noktasını gösterir.",
  tut6Tip: "Taralı alan aktif işlem süresidir",

  tutAssetHint: "↑ Üst çubuktan seçin",
  tutAmountHint: "– + Tutar alanında",
  tutDirUp: "YUKARI",
  tutDirDown: "AŞAĞI",
  tutDirHint: "Bu butonlar ekranın alt kısmında bulunur",
  tutEntryLabel: "Giriş",
  tutExpiryLabel: "Vade",
  tutDepositLabel: "Cüzdan Butonu",
  tutDepositSub: "Para yatır / çek",
  tutLive: "CANLI",
  tutNavHistory: "Geçmiş",
  tutNavTrade: "İşlem",
  tutNavBalance: "Bakiye",
};

const en: typeof tr = {
  signIn: "Sign In",
  signUp: "Sign Up",
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  password: "Password",
  createAccount: "Create Account",
  accountCurrency: "Account Currency",
  dollar: "$ Dollar",
  turkishLira: "₺ Turkish Lira",
  noAccount: "Don't have an account? ",
  alreadyMember: "Already a member? ",
  loginFailed: "Login failed.",
  registerFailed: "Registration failed.",

  navHistory: "History",
  navTrade: "Trade",
  navBalance: "Balance",
  navVip: "Profile",
  selectAccount: "Select Account",
  demoAccount: "Demo Account",
  realAccount: "Real Account",
  wallet: "Wallet",
  notifications: "Notifications",
  languageSettings: "Language / Settings",
  language: "Language",
  marketsOpen: "Markets Open",
  liveDataStream: "Forex & OTC · Live data stream",
  loginRegister: "Sign In / Register",
  demoNote: "Trade with $10,000 virtual balance on demo account.",
  privacyPolicy: "Privacy Policy",
  about: "About",
  logout: "Log Out",
  leaderboard: "Leaderboard",
  activeTrades: "Active Trades",
  depositWithdraw: "Deposit / Withdraw",
  on: "On",
  off: "Off",

  historyTitle: "Trade History",
  realHistory: "Real",
  demoHistory: "Demo",
  win: "Win",
  lose: "Loss",
  netProfit: "Net Profit",
  total: "Total",
  successRate: "Win Rate",
  all: "All",
  winners: "Winners",
  losers: "Losers",
  tradesRecords: "Trade Records",
  won: "WIN",
  lost: "LOSE",
  noHistoryTitle: "No Trade History Yet",
  noHistoryRealDesc: "No completed trades in your real account yet.",
  noHistoryDemoDesc: "No completed trades in your demo account yet.",
  tradeNow: "Trade Now",
  activeRealTrades: "Active Real Trades",
  activeDemoTrades: "Active Demo Trades",
  entryPrice: "Entry Price",
  exitPrice: "Exit Price",
  tradeType: "Account Type",
  closeTime: "Close Time",
  invested: "invested",

  upBtn: "HIGHER",
  downBtn: "LOWER",
  amountLabel: "Amount",
  expiryLabel: "Expiry",
  liveBtn: "● LIVE",
  profitLabel: "Profit",
  insufficientBalance: "Insufficient balance — reduce amount",
  selectExpiry: "Select expiry time",

  tutSkip: "Skip",
  tutNext: "Next",
  tutBack: "← Back",
  tutStart: "Start!",

  tut1Title: "Asset Selection",
  tut1Sub: "13 forex and OTC pairs",
  tut1Body: "Select the pair you want to trade from the asset bar at the top of the screen. Each asset has a different payout percentage.",
  tut1Tip: "Start with AUD/USD — 86% payout",

  tut2Title: "Trade Amount",
  tut2Sub: "Between $5 and $10,000",
  tut2Body: 'Set the amount you want to risk using the – and + buttons in the "Amount" field. This amount is deducted from your balance when the trade starts.',
  tut2Tip: "We recommend starting with $50",

  tut3Title: "Expiry Time",
  tut3Sub: "From 5 seconds to 5 minutes",
  tut3Body: "Tap the ⟳ button in the toolbar and select the expiry time. The trade closes automatically when the time runs out.",
  tut3Tip: "Short expiries give faster results!",

  tut4Title: "Direction",
  tut4Sub: "Win with one correct prediction",
  tut4Body: "If you think the price will rise, press HIGHER (green); if it will fall, press LOWER (red)! Found at the bottom of the screen.",
  tut4Tip: "Correct prediction pays out instantly!",

  tut5Title: "Deposit",
  tut5Sub: "Switch to real account, earn more",
  tut5Body: "Tap the orange wallet button in the top right to make a deposit. IBAN, USDT TRC20 and Crypto options are available.",
  tut5Tip: "Minimum deposit: 10 USDT",

  tut6Title: "Chart Lines",
  tut6Sub: "Track your entry and expiry points",
  tut6Body: "When you open a trade, two lines appear on the chart: the green line shows your Entry price, the red vertical line shows the Expiry point.",
  tut6Tip: "The shaded area is the active trade period",

  tutAssetHint: "↑ Select from top bar",
  tutAmountHint: "– + Amount field",
  tutDirUp: "HIGHER",
  tutDirDown: "LOWER",
  tutDirHint: "Buttons are at the bottom of the screen",
  tutEntryLabel: "Entry",
  tutExpiryLabel: "Expiry",
  tutDepositLabel: "Wallet Button",
  tutDepositSub: "Deposit / Withdraw",
  tutLive: "LIVE",
  tutNavHistory: "History",
  tutNavTrade: "Trade",
  tutNavBalance: "Balance",
};

const de: typeof tr = { ...en, navHistory: "Verlauf", navTrade: "Handel", navBalance: "Guthaben", navVip: "VIP / Profil", upBtn: "HÖHER", downBtn: "TIEFER", selectAccount: "Konto auswählen", demoAccount: "Demokonto", realAccount: "Echtgeldkonto" };
const es: typeof tr = { ...en, navHistory: "Historial", navTrade: "Operar", navBalance: "Saldo", navVip: "VIP / Perfil", upBtn: "SUBE", downBtn: "BAJA", selectAccount: "Seleccionar cuenta", demoAccount: "Cuenta Demo", realAccount: "Cuenta Real" };
const ru: typeof tr = { ...en, navHistory: "История", navTrade: "Торговля", navBalance: "Баланс", navVip: "VIP / Профиль", upBtn: "BЫШЕ", downBtn: "НИЖЕ", selectAccount: "Выбрать счет", demoAccount: "Демо счет", realAccount: "Реальный счет" };
const ar: typeof tr = { ...en, navHistory: "السجل", navTrade: "تداول", navBalance: "الرصيد", navVip: "VIP / الملف", upBtn: "أعلى", downBtn: "أسفل", selectAccount: "اختر الحساب", demoAccount: "حساب تجريبي", realAccount: "حساب حقيقي" };

export const translationsMap = { tr, en, de, es, ru, ar };

export function getLanguageCode(langStr?: string): LanguageCode {
  if (!langStr && typeof localStorage !== "undefined") {
    langStr = localStorage.getItem("obyo_lang") || "Türkçe";
  }
  const l = (langStr || "").toLowerCase();
  if (l.includes("tur") || l === "tr" || l === "") return "tr";
  if (l.includes("deu") || l.includes("ger") || l === "de") return "de";
  if (l.includes("esp") || l.includes("spa") || l === "es") return "es";
  if (l.includes("rus") || l === "ru") return "ru";
  if (l.includes("ara") || l === "ar") return "ar";
  if (l.includes("eng") || l === "en") return "en";
  return "tr";
}

export function getTranslations(code?: LanguageCode) {
  const c = code || getLanguageCode();
  return translationsMap[c] || tr;
}

// Proxy object for backward compatibility with static imports like import { t } from "@/i18n"
export const t = new Proxy({} as typeof tr, {
  get(_target, prop: keyof typeof tr) {
    const code = getLanguageCode();
    const dict = translationsMap[code] || tr;
    return dict[prop] || tr[prop] || "";
  },
});
