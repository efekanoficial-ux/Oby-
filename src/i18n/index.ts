const lang =
  typeof navigator !== "undefined"
    ? navigator.language.split("-")[0].toLowerCase()
    : "tr";

export const locale: "tr" | "en" = lang === "tr" ? "tr" : "en";

const tr = {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Nav / Layout ──────────────────────────────────────────────────────────
  navHistory: "Geçmiş",
  navTrade: "İşlem",
  navBalance: "Bakiye",
  navVip: "VIP",
  selectAccount: "Hesap Seçin",
  demoAccount: "Demo Hesap",
  realAccount: "Gerçek Hesap",

  // ── Home ──────────────────────────────────────────────────────────────────
  upBtn: "YUKARI",
  downBtn: "AŞAĞI",
  amountLabel: "Tutar",
  expiryLabel: "Vade",
  liveBtn: "● CANLI",
  profitLabel: "Kazanç",
  insufficientBalance: "Yetersiz bakiye — tutarı azaltın",
  selectExpiry: "Vade süresini seçin",

  // ── Tutorial UI ────────────────────────────────────────────────────────────
  tutSkip: "Atla",
  tutNext: "İleri",
  tutBack: "← Geri",
  tutStart: "Başla!",

  // ── Tutorial steps ────────────────────────────────────────────────────────
  tut1Title: "Varlık Seçimi",
  tut1Sub: "13 forex ve OTC paritesi",
  tut1Body:
    "Ekranın üst kısmındaki varlık çubuğundan işlem yapmak istediğin parityi seçebilirsin. Her varlığın farklı bir kazanç oranı (payout %) vardır.",
  tut1Tip: "AUD/USD — %86 payout ile başla",

  tut2Title: "İşlem Miktarı",
  tut2Sub: "$5 ile $10,000 arasında",
  tut2Body:
    '"Tutar" alanından – ve + butonlarıyla riske girmek istediğin miktarı belirle. Bu tutar işlem başladığında bakiyenden düşer.',
  tut2Tip: "$50 ile başlamanı öneririz",

  tut3Title: "Vade Süresi",
  tut3Sub: "5 saniyeden 5 dakikaya kadar",
  tut3Body:
    "Araç çubuğundaki ⟳ butonuna tıkla ve vade süresini seç. İşlem, seçtiğin süre dolduğunda otomatik olarak kapanır.",
  tut3Tip: "Kısa vadeler daha hızlı sonuç verir!",

  tut4Title: "Yön Tahmini",
  tut4Sub: "Tek doğru tahminde kazan",
  tut4Body:
    "Fiyatın yükseleceğini düşünüyorsan YUKARI (yeşil), düşeceğini düşünüyorsan AŞAĞI (kırmızı) butonuna bas! Ekranın altında bulunur.",
  tut4Tip: "Doğru tahminde payout anında hesabına!",

  tut5Title: "Para Yatırma",
  tut5Sub: "Gerçek hesaba geç, daha fazla kazan",
  tut5Body:
    "Sağ üstteki turuncu cüzdan butonuna basarak para yatırabilirsin. IBAN, USDT TRC20 ve Kripto seçenekleri mevcuttur.",
  tut5Tip: "Minimum yatırım: 10 USDT",

  tut6Title: "Grafik Çizgileri",
  tut6Sub: "Giriş ve vade noktanı takip et",
  tut6Body:
    "İşlem açtığında grafik üzerinde iki çizgi belirir: yeşil çizgi Giriş fiyatını, kırmızı dikey çizgi Vade noktasını gösterir.",
  tut6Tip: "Taralı alan aktif işlem süresidir",

  // ── Tutorial illustration strings ─────────────────────────────────────────
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
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Nav / Layout ──────────────────────────────────────────────────────────
  navHistory: "History",
  navTrade: "Trade",
  navBalance: "Balance",
  navVip: "VIP",
  selectAccount: "Select Account",
  demoAccount: "Demo Account",
  realAccount: "Real Account",

  // ── Home ──────────────────────────────────────────────────────────────────
  upBtn: "UP",
  downBtn: "DOWN",
  amountLabel: "Amount",
  expiryLabel: "Expiry",
  liveBtn: "● LIVE",
  profitLabel: "Profit",
  insufficientBalance: "Insufficient balance — reduce amount",
  selectExpiry: "Select expiry time",

  // ── Tutorial UI ────────────────────────────────────────────────────────────
  tutSkip: "Skip",
  tutNext: "Next",
  tutBack: "← Back",
  tutStart: "Start!",

  // ── Tutorial steps ────────────────────────────────────────────────────────
  tut1Title: "Asset Selection",
  tut1Sub: "13 forex and OTC pairs",
  tut1Body:
    "Select the pair you want to trade from the asset bar at the top of the screen. Each asset has a different payout percentage.",
  tut1Tip: "Start with AUD/USD — 86% payout",

  tut2Title: "Trade Amount",
  tut2Sub: "Between $5 and $10,000",
  tut2Body:
    'Set the amount you want to risk using the – and + buttons in the "Amount" field. This amount is deducted from your balance when the trade starts.',
  tut2Tip: "We recommend starting with $50",

  tut3Title: "Expiry Time",
  tut3Sub: "From 5 seconds to 5 minutes",
  tut3Body:
    "Tap the ⟳ button in the toolbar and select the expiry time. The trade closes automatically when the time runs out.",
  tut3Tip: "Short expiries give faster results!",

  tut4Title: "Direction",
  tut4Sub: "Win with one correct prediction",
  tut4Body:
    "If you think the price will rise, press UP (green); if it will fall, press DOWN (red)! Found at the bottom of the screen.",
  tut4Tip: "Correct prediction pays out instantly!",

  tut5Title: "Deposit",
  tut5Sub: "Switch to real account, earn more",
  tut5Body:
    "Tap the orange wallet button in the top right to make a deposit. IBAN, USDT TRC20 and Crypto options are available.",
  tut5Tip: "Minimum deposit: 10 USDT",

  tut6Title: "Chart Lines",
  tut6Sub: "Track your entry and expiry points",
  tut6Body:
    "When you open a trade, two lines appear on the chart: the green line shows your Entry price, the red vertical line shows the Expiry point.",
  tut6Tip: "The shaded area is the active trade period",

  // ── Tutorial illustration strings ─────────────────────────────────────────
  tutAssetHint: "↑ Select from top bar",
  tutAmountHint: "– + Amount field",
  tutDirUp: "UP",
  tutDirDown: "DOWN",
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

export const t = locale === "tr" ? tr : en;
