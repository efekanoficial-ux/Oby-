import React from "react";
import { useAuth } from "@/context/AuthContext";
import { CreditCard } from "lucide-react";

interface CreditCardIconProps {
  size?: number;
  className?: string;
}

export function CreditCardIcon({ size = 28, className = "" }: CreditCardIconProps) {
  const { paymentSettings } = useAuth();
  const iconSrc = paymentSettings.creditCardLogoURL;

  if (iconSrc) {
    return (
      <span
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={iconSrc}
          alt="Kredi Kartı"
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 select-none rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 ${className}`}
      style={{ width: size, height: size }}
    >
      <CreditCard size={size * 0.55} />
    </span>
  );
}
