import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/send-verification-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "E-posta ve kod gerekli." });

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP environment variables are missing.");
      return res.status(500).json({ error: "E-posta sunucusu yapılandırılmamış." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Obyo Trade" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "E-posta Doğrulama Kodunuz",
      text: `Doğrulama kodunuz: ${code}`,
      html: `<b>Doğrulama kodunuz: ${code}</b>`,
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "E-posta gönderilemedi." });
  }
});

export default router;
