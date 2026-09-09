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
  const telegramToken = process.env["TELEGRAM_BOT_TOKEN"];
  const telegramChatId = process.env["TELEGRAM_CHAT_ID"];
  if (telegramToken && telegramChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔑 *YENİ KAYIT DOĞRULAMA KODU*\n\n📧 *E-posta:* ${email}\n👤 *İsim:* ${name || "Belirtilmedi"}\n🔐 *Doğrulama Kodu:* \`${code}\``,
          parse_mode: "Markdown",
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
  const token  = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

  if (!token || !chatId) {
    res.status(503).json({ ok: false, error: "Telegram not configured" });
    return;
  }

  const { type, userName, amount, currency, method } = req.body as {
    type:     "deposit" | "withdraw";
    userName: string;
    amount:   number;
    currency: string;
    method:   string;
  };

  if (!type || !userName || !amount || !currency || !method) {
    res.status(400).json({ ok: false, error: "Missing fields" });
    return;
  }

  const isDeposit  = type === "deposit";
  const typeLabel  = isDeposit ? "Para Yatırma 📥" : "Para Çekme 📤";
  const currSymbol = currency === "TRY" ? "₺" : "$";

  const text =
    `🚨 *YENİ FİNANSAL TALEP* 🚨\n\n` +
    `👤 *Kullanıcı:* ${escMd(userName)}\n` +
    `💰 *Miktar:* ${currSymbol}${amount} ${currency}\n` +
    `📊 *İşlem Tipi:* ${typeLabel}\n` +
    `🏦 *Yöntem:* ${escMd(method)}\n\n` +
    `🌐 _Lütfen Admin panelinden kontrol edin\\._`;

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    const data = await r.json() as { ok: boolean };
    if (!data.ok) {
      (req as any).log?.warn?.({ data }, "Telegram API returned not-ok");
      res.status(502).json({ ok: false });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    (req as any).log?.error?.({ err }, "Telegram notify failed");
    res.status(500).json({ ok: false, error: "Network error" });
  }
});

/** Escape special chars for MarkdownV2 */
function escMd(s: string): string {
  return String(s).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

export default router;
