import { Router, type IRouter } from "express";

const router: IRouter = Router();

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
