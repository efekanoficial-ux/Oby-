# Kapsamlı Kripto Para Yatırma & Otomatik QR Kod Yönetim Sistemi

Kullanıcıların geniş kripto yelpazesi (USDT, BTC, ETH, SOL, TON, BNB, XRP, DOGE, SHIB, PEPE vb.) ile görsel logolu kartlar üzerinden para yatırabilmesini sağlayan, Admin panelinde her kripto yöntemi için açma/kapama, cüzdan adresi ve ağ bilgilerini düzenleme imkanı sunan ve yazılan cüzdan adresinden anında dinamik QR kod üreten entegre finans mimarisi.

> [!IMPORTANT] Kullanıcı Tarafından Onaylanan Kritik Kararlar
> - **Kripto Kapsamı**: Geniş liste — Major coinler (BTC, ETH, SOL, BNB, TON, XRP, LTC, AVAX) ve popüler meme coinler (DOGE, SHIB, PEPE) ile çoklu ağ USDT (TRC-20, ERC-20, BEP-20, Polygon, Solana).
> - **QR Kod Mekanizması**: Admin panelinde veya kullanıcı tarafında cüzdan adresi yazıldığı / güncellendiği anda anlık reaktif SVG QR kod üretimi + opsiyonel özel görsel yükleme desteği.
> - **Arayüz Tasarımı**: Resmi renkli logolarla donatılmış modern kripto kartları, ağ seçici, tek tıkla kopyalama ve anında yatırma bildirim modalı.

---

### 1. Genel Bakış ve Temel Konsept

- **Ne Sağlar**: Kullanıcılar Para Yatır ekranında Havale/EFT seçeneğinin yanında, zengin bir kripto para listesini resmi marka renkleri ve logolarıyla görerek diledikleri kriptoyu ve ağı seçebilir; sistem yönetici tarafından tanımlanan cüzdan adresini ve otomatik üretilen yüksek çözünürlüklü QR kodunu anında gösterir.
- **Yönetici Kontrolü**: Admin paneli "Kripto Yatırma Yöntemleri" sekmesinde her kripto para birimi için tek tıkla Aktif/Pasif (açık/kapalı) yapma, ağ tipini ve cüzdan adresini güncelleme imkanı sunar. Yönetici adresi yazdığı anda ekranda QR kod anında otomatik belirir.
- **Kullanıcı Kitlesi**: Hem Türk Lirası hem döviz/kripto ile işlem yapan borsa kullanıcıları, hızlı ve hatasız kripto transferi gerçekleştirebilir.

---

### 2. Kullanıcı Deneyimi ve Görsel Tasarım

- **Kullanıcı Akışı (Para Yatırma)**:
  1. Kullanıcı Cüzdan sayfasında **Para Yatır** sekmesine gelir.
  2. Havale/EFT'nin yanında **Kripto Para Birimleri** kategorisinde canlı logolu kartlar listelenir (Yalnızca Admin'in açık bıraktığı para birimleri listelenir).
  3. Kullanıcı dilediği coine tıklar (örn. USDT, BTC veya SOL).
  4. Eğer birden fazla ağ varsa (örn. USDT için TRC-20, ERC-20, BEP-20) temiz bir ağ seçici sekmesi sunulur.
  5. Seçilen ağa ait cüzdan adresi, otomatik SVG QR kod, minimum yatırım tutarı ve tek tıkla "Adresi Kopyala" butonu gösterilir.
  6. Kullanıcı yatırdığı tutarı ve işlem kimliğini (TxID / Gönderen Adres) girip "Yatırma Bildirimi Gönder"e tıklar. Talep Admin paneline anında onay bekleyen işlem olarak düşer.

- **Admin Akışı (Finansal Ayarlar)**:
  1. Yönetici `/admin` panelinde **Ödeme & Kripto Cüzdan Ayarları** bölümüne geçer.
  2. Kripto yöntemleri organize kartlar halinde listelenir; her yöntemin yanında durum anahtarı (Açık/Yeşil - Kapalı/Gri) yer alır.
  3. Cüzdan adresi alanına yeni bir adres girildiğinde veya değiştirildiğinde altındaki QR kod canlı olarak yeniden çizilir (reaktif önizleme).
  4. İsteğe bağlı olarak yöneticinin özel bir QR afişi yükleme seçeneği korunur.
  5. "Ayarları Kaydet" ile tüm değişiklikler anında genel platform durumuna ve veritabanına yansıtılır.

- **Görsel Kimlik & Renk Hiyerarşisi**:
  - Koyu finansal tema: `#0b0e14` arka plan, `#121721` kartlar, `border-white/10`.
  - Her kripto paranın resmi marka renkleri ve vektörel SVG logoları (Bitcoin altın sarısı, Ethereum derin mavi/mor, Tether zümrüt yeşili, Solana fütüristik mor/turkuaz, TON gök mavisi, Doge/Shib özel renkleri).
  - Adresler ve hashler için okunabilirliği yüksek `font-mono tabular-nums` tipografisi.

---

### 3. Temel Ürün Kararları & Tercihler

- **Dinamik SVG QR Kod Motoru**:
  - *Seçilen Yaklaşım*: Harici ağır resim servislerine bağımlı olmadan istemci tarafında saf, kesintisiz ve anında vektörel QR kod oluşturan hafif QR algoritması.
  - *Neden*: Ağ kopukluklarında veya yavaş bağlantılarda dahi cüzdan adresi yazılır yazılmaz 0 ms gecikmeyle kusursuz QR kod çizer; pikselleşme yapmaz ve mobil kamera taramalarında %100 başarı sağlar.
- **Tek Noktadan Durum Yönetimi (Centralized Auth & Payment State)**:
  - *Seçilen Yaklaşım*: Kripto ayarları merkezi `PaymentSettings` yapısında yapılandırılmış genişletilebilir kripto listesi (`cryptoMethods: CryptoPaymentMethod[]`) olarak tutulur.
  - *Neden*: Hem standart USDT ve IBAN geriye dönük uyumlu çalışmaya devam eder hem de istenen tüm yeni coinler ve ağlar dinamik olarak admin kontrolüne girer.

---

### 4. Teknik Mimari & Veri Stratejisi

```
┌──────────────────────────────────────────────────────────────┐
│                       ADMİN PANELİ                           │
│  - Kripto Para Açma / Kapatma Toggle Switchleri              │
│  - Cüzdan Adresi Girdisi & Min Yatırım Tutarı Belirleme      │
│  - Canlı Reaktif Otomatik QR Kod Önizleme                    │
└──────────────────────────────┬───────────────────────────────┘
                               │ updatePaymentSettings()
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT STATE & AUTH                      │
│  - paymentSettings.cryptoMethods [...]                       │
│  - Aktif / Pasif bayrakları, cüzdan adresleri, ağ tipleri    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    KULLANICI CÜZDAN / YATIR                  │
│  - Renkli Logo Kartları Grid & Arama / Filtre                │
│  - Seçilen Coine Ait Ağ Seçici (TRC20, ERC20, BEP20 vb.)     │
│  - Otomatik Üretilen Yüksek Çözünürlüklü SVG QR Kod          │
│  - Cüzdan Adresi Kopyalama & Yatırma Talep Formu             │
└──────────────────────────────────────────────────────────────┘
```

- **Veri Modeli (`CryptoPaymentMethod`)**:
  - `id`: Benzersiz kimlik (örn. `usdt-trc20`, `btc-native`, `eth-erc20`, `sol-native`, `ton-native`, `bnb-bep20`, `doge`, `pepe` vb.)
  - `coin`: Sembol (USDT, BTC, ETH, SOL, TON, BNB, XRP, DOGE, SHIB, PEPE, AVAX, LTC)
  - `name`: Görüntülenen isim (örn. Bitcoin, Tether USD, Solana, Toncoin, Dogecoin)
  - `network`: Ağ protokolü (örn. Tron TRC-20, Ethereum ERC-20, BSC BEP-20, Solana SPL, TON, Bitcoin Native)
  - `enabled`: boolean (Admin açma/kapatma durumu)
  - `address`: string (Admin tarafından girilen cüzdan adresi)
  - `qrCode`: string (Otomatik oluşturulan SVG/DataURL veya adminin yüklediği özel QR)
  - `minAmount`: number (Minimum yatırma limiti)
  - `badge`: opsiyonel etiket (örn. "Düşük Komisyon", "Hızlı", "Popüler")
  - `color`: hex/css renk teması

- **Kapsanacak Kripto Paralar & Ağlar**:
  1. **USDT (Tether)**: TRC-20, ERC-20, BEP-20, Solana SPL, Polygon
  2. **Bitcoin (BTC)**: Bitcoin Mainnet
  3. **Ethereum (ETH)**: Ethereum Mainnet / ERC-20
  4. **Solana (SOL)**: Solana Network
  5. **BNB (Binance Coin)**: BNB Smart Chain (BEP-20)
  6. **TON (The Open Network)**: TON Blockchain
  7. **Ripple (XRP)**: Ripple Ledger
  8. **Dogecoin (DOGE)**: Dogecoin Network
  9. **Shiba Inu (SHIB)**: ERC-20
  10. **Pepe (PEPE)**: ERC-20
  11. **Avalanche (AVAX)**: C-Chain
  12. **Litecoin (LTC)**: Litecoin Network
