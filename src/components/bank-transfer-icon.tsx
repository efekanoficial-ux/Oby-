import React from "react";
import { useAuth } from "@/context/AuthContext";

interface BankTransferIconProps {
  size?: number;
  className?: string;
}

export function BankTransferIcon({ size = 28, className = "" }: BankTransferIconProps) {
  const { paymentSettings } = useAuth();
  const iconSrc = paymentSettings.bankTransferIconURL || "/Picsart_26-10-14_15-00-33-409.png";

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iconSrc}
        alt="Banka Transferi / Havale"
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none scale-110 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
