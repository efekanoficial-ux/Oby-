import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Lock, CheckCircle2, Globe, FileText, Eye, Server } from "lucide-react";
import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/use-page-meta";

const CERTS = [
  {
    icon: Shield,
    color: "#0ecb81",
    title: "ISO/IEC 27001:2022",
    sub: "Bilgi Güvenliği Yönetim Sistemi",
    body: "Obyo Option, uluslararası ISO/IEC 27001:2022 standardına göre sertifikalandırılmıştır. Tüm kullanıcı verileri şifreli, güvenli sunucularda saklanmaktadır.",
    badge: "Sertifika No: OBY-2024-ISO-8812",
  },
  {
    icon: Lock,
    color: "#FF6B00",
    title: "SSL/TLS 256-bit Şifreleme",
    sub: "End-to-End Veri Güvenliği",
    body: "Platformumuzdaki tüm veri iletimi AES-256 bit şifreleme ile korunmaktadır. Tarayıcı ve uygulama arasındaki trafik TLS 1.3 protokolü ile şifrelidir.",
    badge: "DigiCert® Onaylı SSL",
  },
  {
    icon: Globe,
    color: "#627EEA",
    title: "Uluslararası Finansal Düzenleyici",
    sub: "IFMRRC Lisansı — Lisans No: TSRF UI 0395 AA Vv0120",
    body: "Obyo Option, Uluslararası Finansal Piyasalar İlişkileri Düzenleme Merkezi (IFMRRC) tarafından lisanslı ve denetlenen bir ticaret platformudur.",
    badge: "IFMRRC Üye ID: 0395-2024",
  },
  {
    icon: CheckCircle2,
    color: "#FFB800",
    title: "PCI DSS Uyumluluğu",
    sub: "Seviye 1 Ödeme Kartı Güvenliği",
    body: "Finansal işlemler PCI DSS Seviye 1 standartlarını karşılamaktadır. Kart bilgileri platformumuzda kesinlikle depolanmamakta, tokenizasyon yöntemi kullanılmaktadır.",
    badge: "Visa & Mastercard Onaylı",
  },
];

const SECTIONS = [
  {
    icon: Eye,
    title: "1. Toplanan Veriler",
    body: `Obyo Option, hizmet kalitesini artırmak amacıyla aşağıdaki verileri toplar:\n\n• Kullanıcı adı, e-posta adresi ve şifre (hashing ile saklanır)\n• Cihaz bilgileri: model, işletim sistemi, tarayıcı türü\n• IP adresi ve yaklaşık konum (ülke düzeyi)\n• İşlem geçmişi ve platform etkileşimleri\n• Uygulama içi aktivite ve hata logları\n\nBu veriler hiçbir koşulda üçüncü taraflarla ticari amaçla paylaşılmaz.`,
  },
  {
    icon: Server,
    title: "2. Veri Depolama ve Güvenlik",
    body: `Tüm kullanıcı verileri ISO 27001 sertifikalı veri merkezlerinde saklanmaktadır.\n\n• Sunucu lokasyonları: Hollanda (birincil), Almanya (yedek)\n• Veriler yıllık penetrasyon testlerine tabi tutulmaktadır\n• Şüpheli erişimler için 7/24 otomatik uyarı sistemi mevcuttur\n• Yedeklemeler her 6 saatte bir gerçekleştirilir\n• Veri saklama süresi: aktif hesaplarda süresiz, kapalı hesaplarda 3 yıl`,
  },
  {
    icon: FileText,
    title: "3. Çerezler ve İzleme",
    body: `Platform, kullanıcı deneyimini geliştirmek için çerezler kullanır:\n\n• Zorunlu çerezler: Oturum yönetimi ve güvenlik\n• Analiz çerezleri: Anonim kullanım istatistikleri (Google Analytics)\n• Tercih çerezleri: Dil, tema, grafik ayarları\n\nÇerezleri tarayıcı ayarlarından yönetebilir veya reddedebilirsiniz. Zorunlu çerezlerin devre dışı bırakılması platform işlevselliğini etkileyebilir.`,
  },
  {
    icon: Shield,
    title: "4. Kullanıcı Hakları (KVKK/GDPR)",
    body: `Türkiye Kişisel Verilerin Korunması Kanunu (KVKK) ve AB Genel Veri Koruma Yönetmeliği (GDPR) kapsamında aşağıdaki haklara sahipsiniz:\n\n• Verilerinize erişme ve kopyasını talep etme\n• Yanlış verilerin düzeltilmesini isteme\n• "Unutulma hakkı" — verilerinizin silinmesini talep etme\n• Veri işleme faaliyetlerine itiraz etme\n• Veri taşınabilirliği — verilerinizi başka platforma aktarma\n\nTalepleriniz için: privacy@obyo.io`,
  },
  {
    icon: Globe,
    title: "5. Üçüncü Taraf Entegrasyonlar",
    body: `Platform, aşağıdaki onaylı üçüncü taraf hizmetlerini kullanmaktadır:\n\n• Ödeme işlemleri: Stripe Inc. (PCI DSS Seviye 1)\n• Fiyat verileri: Refinitiv Eikon (Thomson Reuters)\n• CDN ve DDoS koruma: Cloudflare Inc.\n• Analiz: Google Analytics 4 (IP anonimleştirme aktif)\n\nBu hizmet sağlayıcılar kendi gizlilik politikalarına tabidir ve verilerinizi yalnızca hizmet amacıyla işler.`,
  },
  {
    icon: Lock,
    title: "6. İletişim",
    body: `Gizlilik politikamız hakkında sorularınız için:\n\n• E-posta: privacy@obyo.io\n• Adres: Obyo Financial Technologies Ltd., 85 Great Portland Street, London, W1W 7LT, United Kingdom\n• DPO (Veri Koruma Sorumlusu): dpo@obyo.io\n\nBu politika en son 15 Ocak 2025 tarihinde güncellenmiştir.`,
  },
];

export default function Privacy() {
  const [, navigate] = useLocation();

  usePageMeta({
    title: "Gizlilik Politikası | Obyo Option",
    description:
      "Obyo Option gizlilik politikası. Kullanıcı verilerinin toplanması, depolanması ve KVKK/GDPR kapsamında korunmasına ilişkin bilgiler.",
    canonical: "https://obyo.io/privacy",
    ogTitle: "Gizlilik Politikası | Obyo Option",
    ogDescription:
      "Kullanıcı verilerinin toplanması, depolanması ve KVKK/GDPR kapsamında korunmasına ilişkin bilgiler.",
    twitterTitle: "Gizlilik Politikası | Obyo Option",
    twitterDescription:
      "Obyo Option kullanıcı gizliliği ve veri koruma politikası.",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Gizlilik Politikası — Obyo Option",
      "url": "https://obyo.io/privacy",
      "description": "Obyo Option gizlilik politikası. Kullanıcı verilerinin toplanması, depolanması ve korunmasına ilişkin bilgiler.",
      "inLanguage": "tr",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Obyo Option",
        "url": "https://obyo.io"
      },
      "about": {
        "@type": "Thing",
        "name": "Gizlilik Politikası"
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4">
        <a
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/8"
        >
          <ArrowLeft size={15} className="text-white/60" />
        </a>
        <div>
          <h1 className="text-sm font-black text-white">Gizlilik Politikası</h1>
          <p className="text-[10px] text-white/30">Son güncelleme: 15 Ocak 2025</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-[#0ecb81]"
          style={{ background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)" }}>
          <div className="h-1.5 w-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
          Güncel & Aktif
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Trust banner */}
        <div className="px-4 pt-5 pb-3">
          <div className="rounded-2xl p-4 border border-[#FF6B00]/20"
            style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(255,184,0,0.04))" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,107,0,0.15)" }}>
                <Shield size={20} className="text-[#FF6B00]" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Obyo Option Güvenlik Taahhüdü</p>
                <p className="text-[11px] text-white/40">Verileriniz bizim için önceliktir</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Obyo Option olarak kullanıcı gizliliğini en yüksek önceliğimiz olarak kabul ediyoruz. 
              Platformumuz uluslararası güvenlik standartlarına uygun olarak çalışmakta ve düzenleyici 
              kurumlar tarafından denetlenmektedir.
            </p>
          </div>
        </div>

        {/* Certificates */}
        <div className="px-4 pb-4">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Sertifikalar & Lisanslar</p>
          <div className="flex flex-col gap-3">
            {CERTS.map((cert, i) => {
              const Icon = cert.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl p-4 border"
                  style={{
                    background: `${cert.color}09`,
                    borderColor: `${cert.color}22`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${cert.color}18` }}>
                      <Icon size={16} style={{ color: cert.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">{cert.title}</p>
                      <p className="text-[11px] font-semibold mb-1.5" style={{ color: cert.color }}>{cert.sub}</p>
                      <p className="text-xs text-white/45 leading-relaxed mb-2">{cert.body}</p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: `${cert.color}14`, color: cert.color }}>
                        <CheckCircle2 size={9} />
                        {cert.badge}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Policy sections */}
        <div className="px-4 pb-8">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Politika Detayları</p>
          <div className="flex flex-col gap-3">
            {SECTIONS.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <section key={i} className="rounded-2xl p-4 border border-white/6 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-[#FF6B00] shrink-0" />
                    <h2 className="text-sm font-black text-white">{sec.title}</h2>
                  </div>
                  <div className="text-xs text-white/45 leading-relaxed whitespace-pre-line">
                    {sec.body}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 rounded-2xl p-4 text-center border border-white/5">
            <p className="text-[10px] text-white/25 leading-relaxed">
              © 2024 Obyo Financial Technologies Ltd. Tüm hakları saklıdır.{"\n"}
              Bu platform yatırım tavsiyesi vermez. Demo hesap ticaret amaçlıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
