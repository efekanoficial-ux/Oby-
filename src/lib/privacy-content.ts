import { Shield, Lock, Globe, CheckCircle2, Eye, Server, FileText, UserX, AlertTriangle, Mail } from "lucide-react";

export interface CertItem {
  icon: any;
  color: string;
  title: string;
  sub: string;
  body: string;
  badge: string;
}

export interface SectionItem {
  id: string;
  icon: any;
  title: string;
  badge?: string;
  body: string;
  bullets?: string[];
  callout?: {
    type: "info" | "warning" | "success";
    title: string;
    text: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

export interface PrivacyTranslation {
  pageTitle: string;
  pageSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  lastUpdated: string;
  effectiveDate: string;
  trustBannerTitle: string;
  trustBannerSub: string;
  trustBannerBody: string;
  storeComplianceBadge: string;
  certsTitle: string;
  sectionsTitle: string;
  quickSummaryTitle: string;
  quickSummaryPoints: string[];
  certs: CertItem[];
  sections: SectionItem[];
  deletionNoticeTitle: string;
  deletionNoticeBody: string;
  deletionEmailBtn: string;
  footerRights: string;
  footerDisclaimer: string;
  backBtn: string;
}

export const PRIVACY_TRANSLATIONS: Record<string, PrivacyTranslation> = {
  en: {
    pageTitle: "Privacy Policy",
    pageSubtitle: "User Data Protection & Security Policy",
    metaTitle: "Privacy Policy | Obyo Option",
    metaDescription: "Obyo Option Privacy Policy in full compliance with Google Play Developer Policies, Apple App Store Guidelines, GDPR, and international data protection standards.",
    lastUpdated: "Last Updated: January 15, 2025",
    effectiveDate: "Effective Date: January 15, 2025",
    trustBannerTitle: "Obyo Option Security & Privacy Commitment",
    trustBannerSub: "Certified Compliance with Google Play & Apple App Store Standards",
    trustBannerBody: "At Obyo Option, user privacy, security, and transparent data handling are foundational principles. This Privacy Policy discloses what personal and technical data we collect, how it is processed and protected, your statutory rights under GDPR/KVKK/CCPA, and our unambiguous account and data deletion procedures.",
    storeComplianceBadge: "Verified App Store & Google Play Policy Compliant",
    certsTitle: "Certifications, Standards & Regulatory Oversight",
    sectionsTitle: "Detailed Policy & Data Safety Disclosures",
    quickSummaryTitle: "Privacy at a Glance",
    quickSummaryPoints: [
      "Zero Sale of Data: We never sell, monetize, or rent your personal data to brokers or advertisers.",
      "End-to-End Encryption: TLS 1.3 in transit and military-grade AES-256 encryption at rest.",
      "Strict In-App Deletion: Delete your account and all associated data anytime in Profile or via privacy@obyo.io.",
      "Audited Third Parties: We only partner with verified, PCI-DSS Level 1 and ISO 27001 certified providers.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "ISO/IEC 27001:2022 Certified",
        sub: "Information Security Management System",
        body: "Obyo Option operates within an Information Security Management System compliant with the international ISO/IEC 27001:2022 standard. All core infrastructure is independently audited.",
        badge: "Certificate ID: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "SSL/TLS 256-bit Encryption",
        sub: "End-to-End Data Transport Security",
        body: "All transmissions between client applications and our cloud servers are encrypted using TLS 1.3 protocol with 256-bit cryptographic keys, neutralizing packet interception.",
        badge: "DigiCert® Certified TLS",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "International Financial Regulatory Oversight",
        sub: "IFMRRC Regulated Simulation Entity",
        body: "Obyo Option is licensed and overseen by the International Financial Market Relations Regulation Center (IFMRRC) for educational trading simulation and algorithmic models.",
        badge: "IFMRRC Member ID: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "PCI DSS Level 1 Standards",
        sub: "Secure Payment & Tokenization Architecture",
        body: "Payment card transactions are handled exclusively by Tier-1 regulated processors. Raw credit card numbers and CVV codes are never stored or logged on our infrastructure.",
        badge: "Visa, Mastercard & Amex Compliant",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. Information We Collect (Google Play Data Safety Disclosure)",
        badge: "Mandatory Disclosure",
        body: "In accordance with Google Play Developer Policy and Apple App Store Review Guideline 5.1.1, we provide transparent disclosure of all collected data categories:",
        bullets: [
          "Personal Identifiers: User full name, email address, and unique user identifier (UID). Account passwords are encrypted using salted one-way hashing and are never visible to platform staff.",
          "Financial Information: Deposit and withdrawal request records, simulated trade orders, and transaction timestamps. Credit card and bank payments are processed via tokenized endpoints without storing raw banking credentials.",
          "Device & Network Identifiers: Device brand, hardware model, operating system version, browser type, anonymous installation identifiers, and approximate location (country/city level via masked IP).",
          "App Activity & Performance Logs: Feature interaction events, crash reports, latency metrics, and session diagnostic logs utilized solely for stability optimization and fraud detection.",
        ],
      },
      {
        id: "data-usage",
        icon: Server,
        title: "2. How We Use Your Information & Legal Basis",
        body: "We process your data strictly under lawful bases specified by GDPR (Art. 6) and global privacy statutes:",
        bullets: [
          "Contractual Performance: Providing simulation trading engines, real-time market candlestick charts, leaderboard rankings, and account authentication.",
          "Platform Security & Fraud Prevention: Detecting unauthorized access, preventing automated bot attacks, ensuring fair participation in tournament leaderboards.",
          "Customer Support & Account Management: Resolving trade queries, handling deposit/withdrawal confirmations, and delivering system status updates.",
          "Legal & Regulatory Compliance: Complying with anti-fraud mandates, tax reporting records, and valid judicial requests.",
        ],
      },
      {
        id: "third-parties",
        icon: Globe,
        title: "3. Third-Party Disclosures & Service Providers",
        badge: "Zero-Sale Policy",
        body: "We do not sell, rent, or trade your personal information. We partner exclusively with certified infrastructure providers bound by rigorous Data Processing Agreements (DPAs):",
        bullets: [
          "Google Firebase & Google Cloud Platform: Secure user authentication, real-time Firestore database storage, and backend cloud functions (Google LLC, USA/EU).",
          "Cloudflare, Inc.: Enterprise-grade DDoS mitigation, Web Application Firewall (WAF), and global CDN edge routing.",
          "Market Data Feeds: Real-time financial price quote streams sourced from licensed financial data aggregators.",
          "Payment Processing Gateways: Regulated banking gateways and non-custodial blockchain networks for transaction verification.",
        ],
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "4. Data Retention & Account / Data Deletion Policy",
        badge: "Apple 5.1.1(v) & Google Play Compliant",
        body: "You maintain full autonomy over your data. We retain data only as long as necessary to maintain active platform accounts or fulfill regulatory audit trails.",
        bullets: [
          "In-App Account Deletion: You can permanently delete your account and all stored personal data directly from within the app at Profile > Account Settings > Delete Account.",
          "Web & Direct Request: You can also request complete data erasure without installing or logging into the app by emailing privacy@obyo.io with the subject 'Data Deletion Request'.",
          "Execution Timeline: Upon receiving a deletion request, all account credentials, personal identifiers, and trade logs are permanently expunged or irreversibly anonymized within 30 days.",
          "Audit Exceptions: Minimal financial transaction receipts are retained for 3 years strictly where required by applicable financial and anti-money laundering regulations.",
        ],
        callout: {
          type: "warning",
          title: "Account Deletion Instructions",
          text: "To delete your account immediately: Open Profile > Tap 'Delete Account' > Confirm. Alternatively, email privacy@obyo.io from your registered email address.",
          actionLabel: "Contact Privacy Officer",
          actionHref: "mailto:privacy@obyo.io?subject=Account%20and%20Data%20Deletion%20Request",
        },
      },
      {
        id: "security-measures",
        icon: Lock,
        title: "5. Security Safeguards & Encryption Protocols",
        body: "We implement defense-in-depth security measures to protect your information against unauthorized access, loss, or alteration:",
        bullets: [
          "Cryptography: Data in transit is secured via TLS 1.3 with forward secrecy. Data at rest is encrypted using AES-256 ciphers.",
          "Server Hardening: Infrastructure hosted in ISO 27001 and SOC 2 Type II certified European data centers (Netherlands primary, Germany failover).",
          "Access Controls: Strict role-based access control (RBAC), multi-factor administrative authentication, and automated audit logging.",
          "Incident Response: Continuous intrusion detection systems with 24/7 incident response monitoring and automated anomalous traffic blocking.",
        ],
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "6. Children's Privacy (COPPA & GDPR-K Compliance)",
        badge: "18+ Platform",
        body: "Obyo Option is strictly designed and intended for individuals aged 18 years or older (or the legal age of majority in your jurisdiction). We do not knowingly solicit, collect, or store personal information from children under 13 (or under 16/18 where applicable by local law). If we become aware that a minor has created an account or submitted personal information, we immediately terminate the account and permanently delete all related records. If you believe a minor has accessed our service, please notify us immediately at privacy@obyo.io.",
      },
      {
        id: "cookies-tracking",
        icon: FileText,
        title: "7. Cookies & Local Storage Technologies",
        body: "We utilize minimal, privacy-centric client storage strictly to provide platform functionality:",
        bullets: [
          "Essential Storage: Session identification, authentication state, and CSRF token protection.",
          "Preference Storage: Retaining your chosen language, chart timeframe (e.g. 1m, 5m), and visual appearance settings.",
          "Analytics Storage: Aggregated, anonymized performance metrics without cross-app tracking.",
          "You can manage or clear local storage and cookies anytime through your device browser settings.",
        ],
      },
      {
        id: "user-rights",
        icon: Shield,
        title: "8. Your Statutory Rights (GDPR, CCPA & KVKK)",
        body: "Depending on your residency, you possess comprehensive legal rights regarding your personal data:",
        bullets: [
          "Right of Access: Request verification and a portable digital copy of personal data held about you.",
          "Right to Rectification: Correct inaccurate, obsolete, or incomplete personal records.",
          "Right to Erasure ('Right to be Forgotten'): Request the permanent destruction of your personal data.",
          "Right to Restrict or Object: Restrict processing activities or object to legitimate interest processing.",
          "Right to Withdraw Consent: Revoke previously granted consent at any time with immediate effect.",
          "Non-Discrimination: We will never deny services, charge different prices, or degrade quality if you exercise your privacy rights.",
        ],
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "9. Contact Information & Data Protection Officer (DPO)",
        body: "For any inquiries, requests to exercise statutory rights, or data safety questions, our dedicated Data Protection team is at your disposal:",
        bullets: [
          "Data Controller: Obyo Financial Technologies Ltd.",
          "Company Address: 85 Great Portland Street, London, W1W 7LT, United Kingdom",
          "Data Protection Officer (DPO): dpo@obyo.io",
          "General Privacy Inquiries: privacy@obyo.io",
          "Response Window: All formal data requests are acknowledged and fulfilled within 30 days free of charge.",
        ],
      },
    ],
    deletionNoticeTitle: "Need to Delete Your Account or Data?",
    deletionNoticeBody: "In accordance with Google Play and Apple App Store mandates, you have the absolute right to permanently delete your account and all associated personal data at any time without penalty.",
    deletionEmailBtn: "Email Data Deletion Request",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. All rights reserved. Registered in the United Kingdom.",
    footerDisclaimer: "Obyo Option provides financial market simulations and educational binary options technology. Simulated trading results do not guarantee future live market results.",
    backBtn: "Return to Trading",
  },
  tr: {
    pageTitle: "Gizlilik Politikası",
    pageSubtitle: "Kullanıcı Verileri Koruma ve Güvenlik Bildirimi",
    metaTitle: "Gizlilik Politikası | Obyo Option",
    metaDescription: "Obyo Option Gizlilik Politikası. Google Play Geliştirici Politikaları, Apple App Store Yönergeleri, KVKK ve GDPR ile tam uyumludur.",
    lastUpdated: "Son Güncelleme: 15 Ocak 2025",
    effectiveDate: "Yürürlük Tarihi: 15 Ocak 2025",
    trustBannerTitle: "Obyo Option Güvenlik ve Gizlilik Taahhüdü",
    trustBannerSub: "Google Play ve Apple App Store Standartlarıyla Onaylı Uyumluluk",
    trustBannerBody: "Obyo Option olarak kullanıcı gizliliği, veri güvenliği ve şeffaflık temel ilkelerimizdir. Bu Gizlilik Politikası; toplanan kişisel ve teknik verileri, bunların nasıl işlendiğini ve korunduğunu, KVKK/GDPR kapsamındaki yasal haklarınızı ve şartsız hesap/veri silme süreçlerimizi açıklar.",
    storeComplianceBadge: "App Store & Google Play Politikalarıyla Doğrulanmış Uyumluluk",
    certsTitle: "Sertifikalar, Güvenlik Standartları & Denetim",
    sectionsTitle: "Ayrıntılı Politika ve Veri Güvenliği Açıklamaları",
    quickSummaryTitle: "Kısaca Gizlilik İlkelerimiz",
    quickSummaryPoints: [
      "Veri Satışı Kesinlikle Yoktur: Kişisel verileriniz hiçbir reklamcıya veya üçüncü tarafa satılmaz ya da kiralanmaz.",
      "Uçtan Uca Şifreleme: Aktarımda TLS 1.3, sunucularda askeri düzeyde AES-256 şifreleme uygulanır.",
      "Kolay Hesap Silme: Profil > Hesap Sil alanından veya privacy@obyo.io üzerinden verilerinizi anında sildirebilirsiniz.",
      "Denetlenen Altyapı: Yalnızca PCI-DSS Seviye 1 ve ISO 27001 sertifikalı global sağlayıcılar ile çalışılır.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "ISO/IEC 27001:2022 Sertifikalı",
        sub: "Bilgi Güvenliği Yönetim Sistemi",
        body: "Obyo Option, uluslararası ISO/IEC 27001:2022 standartlarına göre sertifikalandırılmış altyapıda çalışır. Tüm kullanıcı verileri şifreli ve güvenlik denetiminden geçen sunucularda saklanır.",
        badge: "Sertifika No: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "SSL/TLS 256-bit Şifreleme",
        sub: "Uçtan Uca Veri İletim Güvenliği",
        body: "Kullanıcı uygulaması ile sunucularımız arasındaki tüm veri akışı AES-256 bit şifreleme ve TLS 1.3 protokolü ile korunur, paket dinleme ve müdahaleler engellenir.",
        badge: "DigiCert® Onaylı TLS",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "Uluslararası Finansal Düzenleyici",
        sub: "IFMRRC Lisanslı Simülasyon Platformu",
        body: "Obyo Option, Uluslararası Finansal Piyasalar İlişkileri Düzenleme Merkezi (IFMRRC) tarafından lisanslanan ve denetlenen bir eğitim ve simülasyon ortamıdır.",
        badge: "IFMRRC Üye ID: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "PCI DSS Seviye 1 Standartları",
        sub: "Ödeme Kartı ve Finans Güvenliği",
        body: "Finansal bildirimler ve işlemler PCI DSS Seviye 1 uyumludur. Kredi kartı bilgileri ve şifreleri platformumuzda asla saklanmaz, tokenizasyon yöntemi kullanılır.",
        badge: "Visa, Mastercard & Troy Onaylı",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. Toplanan Veriler (Google Play Veri Güvenliği Beyanı)",
        badge: "Zorunlu Beyan",
        body: "Google Play Geliştirici Politikaları ve Apple App Store 5.1.1 Yönergesi gereğince toplanan tüm veri kategorileri şeffaf biçimde aşağıda listelenmiştir:",
        bullets: [
          "Kişisel Kimlik Bilgileri: Kullanıcı adı, e-posta adresi ve benzersiz kullanıcı ID'si (UID). Hesap parolaları tek yönlü hashlenerek (salted hash) saklanır, personelimiz dahil kimse tarafından görüntülenemez.",
          "Finansal Bilgiler: Bakiye bildirimleri, para çekme/yatırma talepleri, simüle edilen işlem emirleri ve işlem zaman damgaları. Ham kart numaraları saklanmaz.",
          "Cihaz ve Ağ Bilgileri: Cihaz modeli, işletim sistemi sürümü, tarayıcı türü, anonim kurulum kimliği ve yaklaşık konum (maskelenmiş IP üzerinden ülke/şehir düzeyi).",
          "Uygulama İçi Aktivite & Hata Logları: Özellik etkileşimleri, kilitlenme raporları (crash logs) ve sistem tanılama verileri (yalnızca platform kararlılığı için kullanılır).",
        ],
      },
      {
        id: "data-usage",
        icon: Server,
        title: "2. Verilerin İşlenme Amaçları ve Hukuki Sebepler",
        body: "Toplanan veriler KVKK 5. ve 6. maddeleri ile GDPR 6. maddesi kapsamında aşağıdaki meşru amaçlarla işlenir:",
        bullets: [
          "Sözleşmenin İfası: Ticaret simülasyon motorunun çalıştırılması, gerçek zamanlı grafik akışı, liderlik tablosu puanlaması ve hesap oturumunun yönetimi.",
          "Güvenlik ve Dolandırıcılık Önleme: Yetkisiz erişimlerin engellenmesi, bot saldırılarının önlenmesi ve turnuvalarda haksız rekabetin engellenmesi.",
          "Müşteri Desteği: Kullanıcı işlem sorgularının yanıtlanması, bildirimlerin iletilmesi ve platform teknik destek taleplerinin çözümlenmesi.",
          "Yasal Yükümlülükler: Mali mevzuat, bilgi güvenliği düzenlemeleri ve resmi makam taleplerine uyum sağlanması.",
        ],
      },
      {
        id: "third-parties",
        icon: Globe,
        title: "3. Üçüncü Taraf Entegrasyonlar ve Veri Aktarımı",
        badge: "Satılamaz Veri İlkesi",
        body: "Kişisel verileriniz hiçbir surette satılmaz veya pazarlama şirketleriyle paylaşılmaz. Yalnızca sözleşmeyle bağlı resmi hizmet sağlayıcılarla çalışılır:",
        bullets: [
          "Google Firebase & Google Cloud: Güvenli kullanıcı kimlik doğrulaması, Firestore veritabanı depolaması ve sunucusuz backend mimarisi (Google LLC).",
          "Cloudflare Inc.: Kurumsal düzeyde DDoS engelleme, Web Uygulama Güvenlik Duvarı (WAF) ve global içerik dağıtım ağı (CDN).",
          "Piyasa Fiyat Sağlayıcıları: Lisanslı finansal veri sağlayıcılarından alınan canlı kur akışları.",
          "Ödeme ve Transfer Doğrulama: Düzenlemelere tabi lisanslı ödeme aracı kurumları ve blokzincir ağ doğrulayıcıları.",
        ],
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "4. Veri Saklama ve Hesap/Veri Silme Politikası",
        badge: "Apple 5.1.1(v) & Google Play Uyumlu",
        body: "Kullanıcılarımız verileri üzerinde tam kontrol hakkına sahiptir. Verileriniz yalnızca hizmet sunumu ve yasal zorunluluklar süresince saklanır.",
        bullets: [
          "Uygulama İçinden Hesap Silme: Profil > Hesap Ayarları > 'Hesabımı Sil' butonuna tıklayarak hesabınızı ve tüm kişisel verilerinizi anında silebilirsiniz.",
          "Doğrudan E-posta ile Talep: Uygulamayı yüklemeden veya giriş yapmadan da privacy@obyo.io adresine 'Veri Silme Talebi' konulu bir e-posta göndererek silme işlemi başlatabilirsiniz.",
          "Silme Süresi: Talep alındığında tüm kimlik bilgileri, işlem geçmişi ve hesap kayıtları en geç 30 gün içinde geri döndürülemez biçimde silinir veya anonimleştirilir.",
          "Mevzuat İstisnası: Finansal kayıt belgeleri, mali mevzuat gereği zorunlu olan yasal süre (3 yıl) boyunca kilitli arşivde muhafaza edilir.",
        ],
        callout: {
          type: "warning",
          title: "Hesap Silme Talimatı",
          text: "Hesabınızı silmek için: Profil > 'Hesabımı Sil' adımlarını izleyin veya kayıtlı e-postanızdan privacy@obyo.io adresine talep gönderin.",
          actionLabel: "Veri Sorumlusuna Yazın",
          actionHref: "mailto:privacy@obyo.io?subject=Hesap%20ve%20Veri%20Silme%20Talebi",
        },
      },
      {
        id: "security-measures",
        icon: Lock,
        title: "5. Altyapı Güvenliği ve Şifreleme Önlemleri",
        body: "Verilerin yetkisiz erişim, sızıntı veya tahrifata karşı korunması amacıyla çok katmanlı güvenlik tedbirleri uygulanır:",
        bullets: [
          "Şifreleme: Tüm veri trafiğinde TLS 1.3 şifreleme; veritabanı düzeyinde AES-256 depolama şifrelemesi.",
          "Sunucu Konumları: Avrupa Birliği sınırları içinde yer alan ISO 27001 ve SOC 2 sertifikalı Tier-3 veri merkezleri (Hollanda birincil, Almanya yedek).",
          "Erişim Kısıtlamaları: Katı rol tabanlı yetkilendirme (RBAC), iki faktörlü yönetici erişimi ve kesintisiz denetim loglaması.",
          "7/24 Tehdit Takibi: Anlık izinsiz giriş tespit sistemleri ve şüpheli aktiviteleri otomatik engelleyen yapay zeka destekli güvenlik duvarı.",
        ],
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "6. Çocukların Gizliliği (COPPA ve KVKK Uyumluluğu)",
        badge: "18+ Platform",
        body: "Obyo Option platformu yalnızca 18 yaş ve üzerindeki reşit bireylerin kullanımı için tasarlanmıştır. 13 (veya yerel yasalara göre 18) yaşın altındaki bireylerden bilerek kişisel veri toplanmaz. Bir çocuğun platforma kayıt olduğu veya veri paylaştığı tespit edilirse, söz konusu hesap ve tüm verileri derhal kalıcı olarak silinir. Şüpheli durumları lütfen privacy@obyo.io adresine bildiriniz.",
      },
      {
        id: "cookies-tracking",
        icon: FileText,
        title: "7. Çerezler ve Yerel Depolama (Local Storage)",
        body: "Kullanıcı deneyimini sağlamak için yalnızca temel ve gizlilik odaklı istemci depolama teknolojileri kullanılır:",
        bullets: [
          "Zorunlu Çerezler: Kullanıcı oturumunun güvenli sürdürülmesi ve CSRF koruması.",
          "Tercih Depolaması: Seçilen dil, grafik periyodu (örn. 1dk, 5dk) ve arayüz teması tercihleri.",
          "Analitik Depolama: Anonimleştirilmiş ve cihazlar arası takip yapmayan genel platform performans ölçümleri.",
          "Tarayıcı veya cihaz ayarlarınızdan çerezleri ve yerel depolamayı dilediğiniz an temizleyebilirsiniz.",
        ],
      },
      {
        id: "user-rights",
        icon: Shield,
        title: "8. Yasal Haklarınız (KVKK 11. Madde ve GDPR)",
        body: "Kişisel verilerinizle ilgili olarak kanunlar çerçevesinde aşağıdaki haklara sahipsiniz:",
        bullets: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme.",
          "İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.",
          "Eksik veya yanlış işlenmişse düzeltilmesini isteme.",
          "KVKK 7. maddesi ve GDPR uyarınca verilerinizin silinmesini ('unutulma hakkı') talep etme.",
          "Verilerinizin otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme.",
          "Talepleriniz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.",
        ],
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "9. İletişim Bilgileri ve Veri Koruma Görevlisi (DPO)",
        body: "Gizlilik politikamız, kişisel verileriniz veya silme taleplerinizle ilgili tüm konularda Veri Koruma ekibimize ulaşabilirsiniz:",
        bullets: [
          "Veri Sorumlusu: Obyo Financial Technologies Ltd.",
          "Şirket Adresi: 85 Great Portland Street, London, W1W 7LT, United Kingdom",
          "Veri Koruma Görevlisi (DPO): dpo@obyo.io",
          "Genel Gizlilik İletişimi: privacy@obyo.io",
          "Yanıt Süresi: Tüm resmi veri başvuruları 30 gün içinde incelenir ve yanıtlanır.",
        ],
      },
    ],
    deletionNoticeTitle: "Hesabınızı veya Verilerinizi Silmek mi İstiyorsunuz?",
    deletionNoticeBody: "Google Play ve Apple App Store kuralları uyarınca, dilediğiniz an hiçbir ücret veya engel olmaksızın hesabınızı ve verilerinizi tamamen sildirme hakkına sahipsiniz.",
    deletionEmailBtn: "Veri Silme Talebi Gönder",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. Tüm hakları saklıdır. Birleşik Krallık tescilli kuruluş.",
    footerDisclaimer: "Obyo Option eğitim ve simülasyon amaçlı ikili opsiyon teknolojisi sunar. Platformdaki simülasyon sonuçları gerçek piyasa getirisi garantisi içermez.",
    backBtn: "İşlem Masasına Dön",
  },
  de: {
    pageTitle: "Datenschutzerklärung",
    pageSubtitle: "Benutzerdatenschutz- & Sicherheitsrichtlinie",
    metaTitle: "Datenschutzerklärung | Obyo Option",
    metaDescription: "Obyo Option Datenschutzerklärung in voller Übereinstimmung mit Google Play Developer Policies, Apple App Store Guidelines und DSGVO.",
    lastUpdated: "Zuletzt aktualisiert: 15. Januar 2025",
    effectiveDate: "Gültig ab: 15. Januar 2025",
    trustBannerTitle: "Obyo Option Sicherheits- und Datenschutzversprechen",
    trustBannerSub: "Zertifizierte Konformität mit Google Play- & App Store-Richtlinien",
    trustBannerBody: "Bei Obyo Option stehen der Schutz Ihrer Privatsphäre, Datenintegrität und Transparenz an erster Stelle. Diese Richtlinie beschreibt detailliert die Erhebung, Verarbeitung, Speicherung und Löschung von Daten gemäß DSGVO und internationalen Standards.",
    storeComplianceBadge: "App Store & Google Play Verifiziert Konform",
    certsTitle: "Zertifizierungen & Aufsichtsstandards",
    sectionsTitle: "Detaillierte Richtlinien & Datensicherheit",
    quickSummaryTitle: "Datenschutz auf einen Blick",
    quickSummaryPoints: [
      "Kein Datenverkauf: Ihre Daten werden niemals an Makler oder Werbetreibende verkauft.",
      "Vollständige Verschlüsselung: TLS 1.3 während der Übertragung und AES-256 im Ruhezustand.",
      "In-App Kontolöschung: Löschen Sie Ihr Konto jederzeit im Profil oder via privacy@obyo.io.",
      "Zertifizierte Partner: Ausschließlich ISO 27001- und PCI-DSS Level 1-zertifizierte Infrastruktur.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "ISO/IEC 27001:2022 Zertifiziert",
        sub: "Informationssicherheits-Managementsystem",
        body: "Obyo Option arbeitet nach internationalen ISO/IEC 27001:2022 Standards mit unabhängig geprüften Rechenzentren.",
        badge: "Zertifikat: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "SSL/TLS 256-Bit Verschlüsselung",
        sub: "Ende-zu-Ende Datensicherheit",
        body: "Jeder Datenaustausch wird über TLS 1.3 mit 256-Bit-Schlüsseln abgesichert.",
        badge: "DigiCert® Verifiziert",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "Internationale Finanzregulierung",
        sub: "IFMRRC Beaufsichtigte Handelsplattform",
        body: "Lizenzierte und beaufsichtigte Simulation durch das Financial Market Relations Regulation Center (IFMRRC).",
        badge: "IFMRRC ID: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "PCI DSS Level 1 Konformität",
        sub: "Höchste Zahlungskartensicherheit",
        body: "Kartendaten werden niemals auf unseren Servern gespeichert; alle Transaktionen erfolgen tokenisiert.",
        badge: "Visa & Mastercard Konform",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. Erfasste Daten (Google Play Datensicherheitserklärung)",
        badge: "Pflichtangabe",
        body: "Transparente Offenlegung aller erhobenen Datenkategorien:",
        bullets: [
          "Persönliche Identifikatoren: Name, E-Mail-Adresse und Benutzer-ID (Passwörter nur als Salted Hashes).",
          "Finanzdaten: Einzahlungs- und Auszahlungsanfragen, Simulationsaufträge. Keine Speicherung unverschlüsselter Bankdaten.",
          "Geräte- & Netzwerkdaten: Gerätemodell, Betriebssystem, Browsertyp und anonymisierte IP-Adressen.",
          "Nutzungs- & Diagnosedaten: Absturzberichte und Leistungsprotokolle zur Systemstabilität.",
        ],
      },
      {
        id: "data-usage",
        icon: Server,
        title: "2. Verwendungszwecke & Rechtsgrundlagen (DSGVO Art. 6)",
        body: "Wir verarbeiten Daten ausschließlich auf gesetzlich definierten Rechtsgrundlagen zur Vertragserfüllung und Sicherheit.",
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "3. Datenaufbewahrung & Kontolöschung (Apple 5.1.1(v) & Google Play)",
        badge: "Volle Benutzerkontrolle",
        body: "Sie können Ihr Konto und sämtliche Daten jederzeit im Profil ('Konto löschen') oder per E-Mail an privacy@obyo.io löschen. Die Löschung erfolgt binnen 30 Tagen.",
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "4. Schutz von Minderjährigen (18+ Richtlinie)",
        badge: "Ab 18 Jahren",
        body: "Obyo Option richtet sich ausschließlich an volljährige Personen ab 18 Jahren. Daten von Minderjährigen werden umgehend gelöscht.",
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "5. Kontakt & Datenschutzbeauftragter (DSB)",
        body: "Obyo Financial Technologies Ltd., 85 Great Portland Street, London, W1W 7LT, UK. E-Mail: dpo@obyo.io oder privacy@obyo.io.",
      },
    ],
    deletionNoticeTitle: "Möchten Sie Ihr Konto oder Ihre Daten löschen?",
    deletionNoticeBody: "Gemäß den Richtlinien von Apple und Google können Sie Ihr Konto und alle Daten jederzeit dauerhaft löschen.",
    deletionEmailBtn: "Löschungsantrag per E-Mail senden",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. Alle Rechte vorbehalten.",
    footerDisclaimer: "Obyo Option dient Bildungs- und Simulationszwecken. Keine Anlageberatung.",
    backBtn: "Zurück zum Trading",
  },
  es: {
    pageTitle: "Política de Privacidad",
    pageSubtitle: "Protección de Datos del Usuario y Política de Seguridad",
    metaTitle: "Política de Privacidad | Obyo Option",
    metaDescription: "Política de Privacidad de Obyo Option en cumplimiento total con Google Play Developer Policies, Apple App Store Guidelines y RGPD.",
    lastUpdated: "Última actualización: 15 de enero de 2025",
    effectiveDate: "Fecha de vigencia: 15 de enero de 2025",
    trustBannerTitle: "Compromiso de Privacidad y Seguridad de Obyo Option",
    trustBannerSub: "Cumplimiento verificado con los estándares de Google Play y App Store",
    trustBannerBody: "En Obyo Option, la privacidad de los usuarios, la seguridad y la transparencia son principios fundamentales. Esta política detalla la recopilación, uso, almacenamiento y procedimientos de eliminación de datos conforme al RGPD y normativas internacionales.",
    storeComplianceBadge: "Cumplimiento Verificado con Google Play y App Store",
    certsTitle: "Certificaciones y Normas de Seguridad",
    sectionsTitle: "Divulgación Detallada de Seguridad y Datos",
    quickSummaryTitle: "Privacidad en Resumen",
    quickSummaryPoints: [
      "Cero Venta de Datos: Nunca vendemos ni alquilamos su información personal a terceros.",
      "Cifrado Extremo a Extremo: TLS 1.3 en tránsito y AES-256 en reposo.",
      "Eliminación de Cuenta en la App: Elimine su cuenta en cualquier momento en Perfil o vía privacy@obyo.io.",
      "Proveedores Certificados: Infraestructura auditada ISO 27001 y PCI-DSS Nivel 1.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "Certificación ISO/IEC 27001:2022",
        sub: "Sistema de Gestión de Seguridad de la Información",
        body: "Nuestros sistemas operan bajo estándares auditados internacionalmente para garantizar la máxima seguridad.",
        badge: "ID Certificado: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "Cifrado SSL/TLS de 256 bits",
        sub: "Seguridad de Transporte de Datos",
        body: "Toda transmisión está protegida mediante TLS 1.3 con claves criptográficas robustas.",
        badge: "DigiCert® Verificado",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "Regulación Financiera Internacional",
        sub: "Entidad de Simulación Regulada por IFMRRC",
        body: "Supervisado por el International Financial Market Relations Regulation Center (IFMRRC).",
        badge: "Miembro ID: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "Normas PCI DSS Nivel 1",
        sub: "Seguridad de Tarjetas y Tokenización",
        body: "Los datos de pago son procesados exclusivamente por pasarelas certificadas y tokenizadas.",
        badge: "Cumplimiento Visa y Mastercard",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. Datos que Recopilamos (Divulgación Google Play)",
        badge: "Divulgación Obligatoria",
        body: "Detalle de los datos recopilados estrictamente para el funcionamiento:",
        bullets: [
          "Identificadores Personales: Nombre, correo electrónico y UID de usuario (contraseñas con hash unidireccional).",
          "Datos Financieros: Registros de solicitudes de depósito y retiro, órdenes simuladas.",
          "Información del Dispositivo: Modelo, sistema operativo y dirección IP anonimizada.",
          "Diagnósticos: Registros de fallos y rendimiento para estabilidad del sistema.",
        ],
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "2. Retención y Eliminación de Cuenta (Apple 5.1.1(v))",
        badge: "Control Total",
        body: "Puede eliminar su cuenta y datos en cualquier momento desde Perfil > Eliminar Cuenta o escribiendo a privacy@obyo.io. El borrado completo se efectúa en un plazo máximo de 30 días.",
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "3. Privacidad de Menores (Plataforma 18+)",
        badge: "Mayores de 18",
        body: "Obyo Option es estrictamente para mayores de 18 años. No recopilamos datos de menores deliberadamente.",
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "4. Contacto y Delegado de Protección de Datos (DPO)",
        body: "Obyo Financial Technologies Ltd., 85 Great Portland Street, Londres, W1W 7LT, Reino Unido. Email: dpo@obyo.io o privacy@obyo.io.",
      },
    ],
    deletionNoticeTitle: "¿Desea eliminar su cuenta o sus datos?",
    deletionNoticeBody: "Siguiendo los requisitos de Apple y Google Play, usted tiene el derecho absoluto de eliminar su cuenta y datos personales en cualquier momento.",
    deletionEmailBtn: "Solicitar eliminación por correo",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. Todos los derechos reservados.",
    footerDisclaimer: "Obyo Option es una plataforma de simulación financiera educativa.",
    backBtn: "Volver a Operar",
  },
  ru: {
    pageTitle: "Политика конфиденциальности",
    pageSubtitle: "Защита данных пользователей и стандарты безопасности",
    metaTitle: "Политика конфиденциальности | Obyo Option",
    metaDescription: "Политика конфиденциальности Obyo Option в полном соответствии с правилами Google Play Developer Policy, Apple App Store Guidelines и GDPR.",
    lastUpdated: "Последнее обновление: 15 января 2025 г.",
    effectiveDate: "Дата вступления в силу: 15 января 2025 г.",
    trustBannerTitle: "Обязательства Obyo Option по защите данных",
    trustBannerSub: "Подтвержденное соответствие стандартам Google Play и App Store",
    trustBannerBody: "В Obyo Option конфиденциальность пользователей и безопасность данных являются первоочередными приоритетами. Настоящая Политика раскрывает категории собираемых данных, методы их защиты и прозрачную процедуру удаления аккаунта.",
    storeComplianceBadge: "Соответствие стандартам App Store и Google Play",
    certsTitle: "Сертификация и стандарты безопасности",
    sectionsTitle: "Подробные положения и безопасность данных",
    quickSummaryTitle: "Главное о конфиденциальности",
    quickSummaryPoints: [
      "Никакой продажи данных: Мы никогда не передаем и не продаем личные данные третьим лицам.",
      "Сквозное шифрование: Протокол TLS 1.3 при передаче и шифрование AES-256 при хранении.",
      "Удаление аккаунта в приложении: Удаление в один клик в Профиле или по запросу на privacy@obyo.io.",
      "Сертифицированные провайдеры: Дата-центры уровня Tier-3, стандарты ISO 27001 и PCI-DSS.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "Сертификат ISO/IEC 27001:2022",
        sub: "Система управления информационной безопасностью",
        body: "Вся инфраструктура Obyo Option работает в соответствии с международным стандартом ISO/IEC 27001:2022.",
        badge: "Сертификат: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "Шифрование SSL/TLS 256-бит",
        sub: "Безопасность передачи данных",
        body: "Все данные между клиентом и облаком защищены протоколом TLS 1.3 с надежными ключами.",
        badge: "DigiCert® Verified",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "Международный финансовый регулятор",
        sub: "Платформа регулируется IFMRRC",
        body: "Торговый симулятор лицензирован Международным центром регулирования отношений на финансовых рынках.",
        badge: "IFMRRC ID: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "Соответствие PCI DSS Level 1",
        sub: "Безопасность платежных транзакций",
        body: "Платежные данные обрабатываются исключительно через сертифицированную токенизацию.",
        badge: "Visa & Mastercard Approved",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. Собираемые данные (Декларация Google Play Data Safety)",
        badge: "Обязательное раскрытие",
        body: "Полный перечень категорий обрабатываемой информации:",
        bullets: [
          "Идентификаторы: Имя, адрес электронной почты, UID (пароли хранятся исключительно в виде salted hash).",
          "Финансовая информация: Заявки на пополнение и вывод средств, история симулированных сделок.",
          "Технические данные: Модель устройства, версия ОС, тип браузера, маскированный IP-адрес.",
          "Диагностика: Журналы сбоев и метрики производительности для поддержания стабильности сервиса.",
        ],
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "2. Удаление учетной записи и данных (Требование Apple 5.1.1(v))",
        badge: "Полный контроль",
        body: "Вы можете удалить свой аккаунт и все данные в любое время через Профиль > Удалить аккаунт либо направив письмо на privacy@obyo.io. Полное удаление выполняется в течение 30 дней.",
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "3. Защита несовершеннолетних (18+)",
        badge: "Строго 18+",
        body: "Сервис Obyo Option предназначен исключительно для лиц старше 18 лет. Данные несовершеннолетних подлежат немедленному удалению.",
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "4. Контакты и сотрудник по защите данных (DPO)",
        body: "Obyo Financial Technologies Ltd., 85 Great Portland Street, London, W1W 7LT, UK. Email: dpo@obyo.io или privacy@obyo.io.",
      },
    ],
    deletionNoticeTitle: "Хотите удалить свой аккаунт или данные?",
    deletionNoticeBody: "В соответствии с правилами Google Play и App Store вы имеете гарантированное право на полное удаление аккаунта в любое время.",
    deletionEmailBtn: "Отправить запрос на удаление данных",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. Все права защищены.",
    footerDisclaimer: "Obyo Option предоставляет технологию обучения и симуляции финансовых рынков.",
    backBtn: "Вернуться к торговле",
  },
  ar: {
    pageTitle: "سياسة الخصوصية",
    pageSubtitle: "وثيقة أمان وحماية بيانات المستخدمين",
    metaTitle: "سياسة الخصوصية | Obyo Option",
    metaDescription: "سياسة الخصوصية لمنصة Obyo Option متوافقة تماماً مع معايير Google Play و Apple App Store و GDPR و KVKK.",
    lastUpdated: "آخر تحديث: 15 يناير 2025",
    effectiveDate: "تاريخ السريان: 15 يناير 2025",
    trustBannerTitle: "التزام Obyo Option بالأمان والخصوصية",
    trustBannerSub: "امتثال معتمد لسياسات Google Play و Apple App Store",
    trustBannerBody: "في Obyo Option، تعد خصوصية المستخدمين وحماية البيانات مبدأً أساسياً. توضح هذه الوثيقة البيانات التي يتم جمعها، وكيفية معالجتها وحمايتها، وحقوقكم القانونية، وإجراءات حذف الحساب والبيانات بدون أي قيود.",
    storeComplianceBadge: "معتمد ومتوافق مع سياسات App Store و Google Play",
    certsTitle: "الشهادات ومعايير الأمان والرقابة",
    sectionsTitle: "تفاصيل السياسة وسلامة البيانات",
    quickSummaryTitle: "لمحة عن الخصوصية",
    quickSummaryPoints: [
      "لا نبيع البيانات أبداً: لا يتم بيع أو تأجير بياناتكم الشخصية لأي طرف ثالث أو معلنين.",
      "تشفير شامل: تشفير TLS 1.3 أثناء النقل وتشفير عسكري AES-256 أثناء التخزين.",
      "حذف الحساب داخل التطبيق: يمكنكم حذف الحساب وجميع البيانات في أي وقت من الملف الشخصي أو عبر privacy@obyo.io.",
      "بنية تحتية معتمدة: العمل حصراً مع مزودي خدمات معتمدين وفق ISO 27001 و PCI-DSS.",
    ],
    certs: [
      {
        icon: Shield,
        color: "#0ecb81",
        title: "شهادة ISO/IEC 27001:2022",
        sub: "نظام إدارة أمن المعلومات",
        body: "تعمل Obyo Option وفق معايير الأمان الدولية ISO/IEC 27001:2022 لحماية خوادم البيانات.",
        badge: "رقم الشهادة: OBY-2024-ISO-8812",
      },
      {
        icon: Lock,
        color: "#FF6B00",
        title: "تشفير SSL/TLS 256 بت",
        sub: "حماية نقل البيانات بين التطبيق والخوادم",
        body: "تشفير كامل لجميع الاتصالات باستخدام بروتوكول TLS 1.3 ومفاتيح 256 بت قوية.",
        badge: "معتمد من DigiCert®",
      },
      {
        icon: Globe,
        color: "#627EEA",
        title: "الرقابة المالية الدولية",
        sub: "منصة محاكاة خاضعة لرقابة IFMRRC",
        body: "منصة مرخصة ومراقبة من قِبل مركز تنظيم علاقات الأسواق المالية الدولية (IFMRRC).",
        badge: "عضوية رقم: 0395-2024",
      },
      {
        icon: CheckCircle2,
        color: "#FFB800",
        title: "معايير PCI DSS المستوى 1",
        sub: "أمان البطاقات المصرفية والمعاملات",
        body: "لا يتم تخزين أرقام البطاقات المصرفية على خوادمنا بل تتم المعالجة عبر التشفير الرمزي (Tokenization).",
        badge: "معتمد من Visa و Mastercard",
      },
    ],
    sections: [
      {
        id: "data-collection",
        icon: Eye,
        title: "1. البيانات التي نجمعها (إفصاح أمان البيانات في Google Play)",
        badge: "إفصاح إلزامي",
        body: "إفصاح شفاف لجميع فئات البيانات المجمعة:",
        bullets: [
          "المعرفات الشخصية: الاسم والبريد الإلكتروني ومعرف المستخدم (تشفير آمن لكلمات المرور).",
          "البيانات المالية: طلبات الإيداع والسحب وسجلات صفقات المحاكاة دون حفظ بيانات البطاقات الأولية.",
          "معلومات الأجهزة والشبكة: طراز الجهاز، إصدار النظام، نوع المتصفح وعنوان IP مموه.",
          "سجلات الأداء والأعطال: تشخيص الأعطال لضمان استقرار وتوافر النظام.",
        ],
      },
      {
        id: "data-retention-deletion",
        icon: UserX,
        title: "2. الاحتفاظ بالبيانات وحذف الحساب (متطلب Apple 5.1.1(v))",
        badge: "تحكم كامل",
        body: "يمكنك حذف حسابك وبياناتك فوراً من داخل التطبيق عبر: الملف الشخصي > حذف الحساب، أو بإرسال رسالة إلى privacy@obyo.io. يتم الحذف النهائي خلال 30 يوماً.",
      },
      {
        id: "children-privacy",
        icon: AlertTriangle,
        title: "3. خصوصية القاصرين (منصة مخصصة للبالغين +18)",
        badge: "فوق 18 عاماً فقط",
        body: "منصة Obyo Option موجهة حصراً لمن بلغوا 18 عاماً فأكثر. لا نجمع بيانات القاصرين ويتم حذف أي حساب مخالف فوراً.",
      },
      {
        id: "contact-dpo",
        icon: Mail,
        title: "4. الاتصال ومسؤول حماية البيانات (DPO)",
        body: "Obyo Financial Technologies Ltd., 85 Great Portland Street, London, W1W 7LT, UK. البريد: dpo@obyo.io أو privacy@obyo.io.",
      },
    ],
    deletionNoticeTitle: "هل ترغب في حذف حسابك أو بياناتك؟",
    deletionNoticeBody: "وفقاً لسياسات Google Play و App Store، لديك الحق التام في حذف حسابك وبياناتك نهائياً في أي وقت دون أي قيود.",
    deletionEmailBtn: "طلب حذف البيانات عبر البريد",
    footerRights: "© 2025 Obyo Financial Technologies Ltd. جميع الحقوق محفوظة.",
    footerDisclaimer: "تقدم Obyo Option تقنية تعليمية ومحاكاة للأسواق المالية.",
    backBtn: "العودة إلى التداول",
  },
};

export function getPrivacyTranslation(langCode: string): PrivacyTranslation {
  const code = (langCode || "en").toLowerCase();
  if (code.startsWith("tr")) return PRIVACY_TRANSLATIONS.tr;
  if (code.startsWith("de")) return PRIVACY_TRANSLATIONS.de;
  if (code.startsWith("es")) return PRIVACY_TRANSLATIONS.es;
  if (code.startsWith("ru")) return PRIVACY_TRANSLATIONS.ru;
  if (code.startsWith("ar")) return PRIVACY_TRANSLATIONS.ar;
  return PRIVACY_TRANSLATIONS.en;
}
