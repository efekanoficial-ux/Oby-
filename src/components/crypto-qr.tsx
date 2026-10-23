import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check } from "lucide-react";

interface CryptoQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  showCopyButton?: boolean;
}

export function CryptoQrCode({
  value,
  size = 180,
  className = "",
  showCopyButton = false,
}: CryptoQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!value || !value.trim()) {
      setDataUrl("");
      setError(null);
      return;
    }

    QRCode.toDataURL(value.trim(), {
      width: size * 2, // 2x for retina crispness
      margin: 1.5,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "QR oluşturulamadı");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleCopy = () => {
    if (!value) return;
    try {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!value || !value.trim()) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/20 p-3 text-center text-white/40 ${className}`}
      >
        <QrCode size={Math.min(32, size * 0.25)} className="mb-1.5 opacity-50" />
        <span className="text-[11px] leading-tight">Cüzdan adresi girildiğinde QR otomatik üretilir</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-red-400 text-xs ${className}`}
      >
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex flex-col items-center group ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-white p-2.5 shadow-lg shadow-black/40 flex items-center justify-center overflow-hidden border border-white/20"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Cüzdan QR Kodu"
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        ) : (
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
        )}
      </div>

      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[#0ecb81]" />
              <span className="text-[#0ecb81]">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy size={12} className="text-white/60" />
              <span>Adresi Kopyala</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
