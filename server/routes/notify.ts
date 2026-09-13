import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";

const router: IRouter = Router();

router.post("/notify/send-verification-code", async (req, res) => {
  const { email, code, name } = req.body as { email: string; code: string; name?: string };

  if (!email || !code) {
    res.status(400).json({ ok: false, error: "E-posta ve doğrulama kodu zorunludur." });
    return;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"Obyo Option" <no-reply@obyo.io>`;

  let sentStatus = false;
  let emailError = "";

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: `Obyo Option - E-posta Doğrulama Kodunuz: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #FF6B00; margin: 0;">Obyo <span style="color: #ffffff;">Option</span></h2>
              <p style="color: #888888; font-size: 13px;">Profesyonel Opsiyon Trading</p>
            </div>
            <div style="background-color: #141414; padding: 20px; border-radius: 12px; border: 1px solid #282828; text-align: center;">
              <p style="font-size: 14px; color: #cccccc; margin-top: 0;">Merhaba ${name ? name : ""}, Obyo Option platformuna kayıt talebiniz için doğrulama kodunuz aşağıdadır:</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FF6B00; margin: 20px 0; padding: 12px; background-color: #000000; border-radius: 8px; border: 1px dashed #FF6B00;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #777777;">Bu kodu kimseyle paylaşmayınız. Güvenliğiniz için bu doğrulama kodu 10 dakika geçerlidir.</p>
            </div>
            <p style="font-size: 11px; color: #555555; text-align: center; margin-top: 20px;">Obyo Option Güvenlik Ekibi</p>
          </div>
        `,
      });
      sentStatus = true;
    } catch (err: any) {
      console.error("Nodemailer send failed:", err);
      emailError = err?.message || "E-posta gönderimi başarısız";
    }
  } else {
    console.log(`[Email Transporter] SMTP credentials not configured in process.env. Code for ${email}: ${code}`);
  }

  // Also notify Telegram if configured so admin receives verification code notification
  const telegramToken = (req.body.botToken || process.env["TELEGRAM_BOT_TOKEN"])?.trim();
  const telegramChatId = (req.body.chatId || process.env["TELEGRAM_CHAT_ID"])?.trim();
  if (telegramToken && telegramChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔑 <b>YENİ KAYIT DOĞRULAMA KODU</b>\n\n📧 <b>E-posta:</b> <code>${escHtml(email)}</code>\n👤 <b>İsim:</b> ${escHtml(name || "Belirtilmedi")}\n🔐 <b>Doğrulama Kodu:</b> <code>${escHtml(code)}</code>`,
          parse_mode: "HTML",
        }),
      });
    } catch {
      /* ignore */
    }
  }

  res.json({
    ok: true,
    sentViaSmtp: sentStatus,
    smtpConfigured: Boolean(smtpUser && smtpPass),
    message: sentStatus ? "Doğrulama kodu e-posta adresinize gönderildi." : "Doğrulama kodu oluşturuldu.",
    error: emailError || undefined
  });
});

router.post("/notify/telegram", async (req, res) => {
  const token  = (req.body.botToken  || process.env["TELEGRAM_BOT_TOKEN"])?.trim();
  const chatId = (req.body.chatId || process.env["TELEGRAM_CHAT_ID"])?.trim();

  if (!token || !chatId) {
    res.status(400).json({
      ok: false,
      error: "Telegram Bot Token veya Chat ID eksik! Lütfen Admin Paneli Ayarlar sekmesinden bot bilgilerinizi giriniz."
    });
    return;
  }

  const {
    type,
    userName,
    userEmail,
    amount,
    currency,
    method,
    destination,
    hasReceipt,
    referralCode,
    tcKimlik,
    idNumber,
    isAutoVerified,
    customMessage,
  } = req.body as {
    type:            "deposit" | "withdraw" | "register" | "kyc" | "test";
    userName?:       string;
    userEmail?:      string;
    amount?:         number;
    currency?:       string;
    method?:         string;
    destination?:    string;
    hasReceipt?:     boolean;
    referralCode?:   string;
    tcKimlik?:       string;
    idNumber?:       string;
    isAutoVerified?: boolean;
    customMessage?:  string;
  };

  const nowStr = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  let htmlMessage = "";

  if (type === "test") {
    htmlMessage =
      `🤖 <b>OBYO OPTION - TELEGRAM BİLDİRİM BOTU BAĞLANDI!</b>\n\n` +
      `✅ <b>Tebrikler!</b> Admin paneliniz ile Telegram botunuz arasındaki bağlantı başarıyla kuruldu.\n\n` +
      `📌 <b>Otomatik İletilecek Olaylar:</b>\n` +
      `• 📥 Para Yatırma Talepleri\n` +
      `• 📤 Para Çekme Talepleri\n` +
      `• 👤 Yeni Kullanıcı Kayıtları\n` +
      `• 📑 Kimlik Doğrulama (KYC) Başvuruları\n\n` +
      `⏰ <b>Test Saati:</b> <code>${nowStr}</code>\n` +
      `🚀 <i>Sisteminiz anlık bildirimler almaya hazır!</i>`;
  } else if (type === "deposit") {
    const currSymbol = (currency === "TL" || currency === "TRY") ? "₺" : "$";
    htmlMessage =
      `📥 <b>YENİ PARA YATIRMA TALEBİ!</b> 📥\n\n` +
      `👤 <b>Kullanıcı:</b> ${escHtml(userName || "Belirtilmedi")}\n` +
      (userEmail ? `📧 <b>E-posta:</b> <code>${escHtml(userEmail)}</code>\n` : "") +
      `💰 <b>Miktar:</b> <b>${currSymbol}${amount ?? 0} ${escHtml(currency || "USD")}</b>\n` +
      `🏦 <b>Yöntem:</b> ${escHtml(method || "Bilinmiyor")}\n` +
      (destination ? `📍 <b>Hesap/Referans:</b> <code>${escHtml(destination)}</code>\n` : "") +
      (hasReceipt ? `📎 <b>Dekont:</b> Yüklendi ✅ <i>(Admin panelinden görüntüleyin)</i>\n` : `📎 <b>Dekont:</b> Yüklenmedi\n`) +
      `⏰ <b>Tarih:</b> <code>${nowStr}</code>\n\n` +
      `👉 <i>Admin paneli "Talepler" sekmesinden onaylayabilir veya reddedebilirsiniz.</i>`;
  } else if (type === "withdraw") {
    const currSymbol = (currency === "TL" || currency === "TRY") ? "₺" : "$";
    htmlMessage =
      `📤 <b>YENİ PARA ÇEKME TALEBİ!</b> 📤\n\n` +
      `👤 <b>Kullanıcı:</b> ${escHtml(userName || "Belirtilmedi")}\n` +
      (userEmail ? `📧 <b>E-posta:</b> <code>${escHtml(userEmail)}</code>\n` : "") +
      `💰 <b>Miktar:</b> <b>${currSymbol}${amount ?? 0} ${escHtml(currency || "USD")}</b>\n` +
      `🏦 <b>Yöntem:</b> ${escHtml(method || "Bilinmiyor")}\n` +
      (destination ? `🎯 <b>Çekim Hedefi / IBAN:</b> <code>${escHtml(destination)}</code>\n` : "") +
      `⏰ <b>Tarih:</b> <code>${nowStr}</code>\n\n` +
      `👉 <i>Lütfen Admin panelinden kontrol ederek işlemi onaylayınız.</i>`;
  } else if (type === "register") {
    htmlMessage =
      `👤 <b>YENİ KULLANICI KAYDI</b> 👤\n\n` +
      `✨ <b>Yeni bir kullanıcı platforma katıldı!</b>\n\n` +
      `👤 <b>Ad Soyad:</b> ${escHtml(userName || "İsimsiz")}\n` +
      `📧 <b>E-posta:</b> <code>${escHtml(userEmail || "Yok")}</code>\n` +
      (currency ? `💵 <b>Para Birimi:</b> ${escHtml(currency)}\n` : "") +
      (referralCode ? `🎁 <b>Referans Kodu:</b> <code>${escHtml(referralCode)}</code>\n` : "") +
      (tcKimlik ? `🆔 <b>Kimlik No:</b> <code>${escHtml(tcKimlik)}</code>\n` : "") +
      `⏰ <b>Kayıt Zamanı:</b> <code>${nowStr}</code>\n\n` +
      `📊 <i>Kullanıcı detaylarını Admin Paneli > Kullanıcılar bölümünden görebilirsiniz.</i>`;
  } else if (type === "kyc") {
    htmlMessage =
      `📑 <b>KİMLİK DOĞRULAMA (KYC) BAŞVURUSU</b> 📑\n\n` +
      `👤 <b>Kullanıcı:</b> ${escHtml(userName || "Belirtilmedi")}\n` +
      (userEmail ? `📧 <b>E-posta:</b> <code>${escHtml(userEmail)}</code>\n` : "") +
      (idNumber ? `🆔 <b>T.C. / Pasaport No:</b> <code>${escHtml(idNumber)}</code>\n` : "") +
      `📋 <b>Durum:</b> ${isAutoVerified ? "✅ Otomatik Doğrulandı" : "⏳ Admin Onayı Bekliyor"}\n` +
      `⏰ <b>Tarih:</b> <code>${nowStr}</code>\n\n` +
      `👉 <i>Admin Paneli > Kullanıcılar sekmesinden kimlik belgelerini inceleyebilirsiniz.</i>`;
  } else if (customMessage) {
    htmlMessage = escHtml(customMessage);
  } else {
    res.status(400).json({ ok: false, error: "Geçersiz veya eksik bildirim tipi." });
    return;
  }

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    chatId,
          text:       htmlMessage,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await telegramRes.json() as { ok: boolean; description?: string; error_code?: number };
    if (!data.ok) {
      console.warn("[Telegram Bot API Hatası]:", data);
      let userFriendlyError = data.description || "Telegram API'si hata döndürdü.";
      if (data.error_code === 401) {
        userFriendlyError = "Bot Token geçersiz! Lütfen @BotFather'dan aldığınız API Token'ı kontrol edin.";
      } else if (data.description?.includes("chat not found") || data.error_code === 400) {
        userFriendlyError = "Chat ID bulunamadı! Lütfen Telegram'da botunuzu açıp 'BAŞLAT' (/start) butonuna bastığınızdan ve Chat ID'nizin doğru olduğundan emin olun.";
      }
      res.status(400).json({ ok: false, error: userFriendlyError, details: data });
      return;
    }

    res.json({ ok: true, message: "Bildirim Telegram'a başarıyla iletildi." });
  } catch (err: any) {
    console.error("[Telegram Network Hatası]:", err);
    res.status(500).json({ ok: false, error: "Telegram sunucularına erişilemedi: " + (err?.message || "Ağ hatası") });
  }
});

/** Escape HTML special characters for Telegram HTML parse mode */
function escHtml(s: any): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


export default router;
