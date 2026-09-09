import React from "react";

interface BankTransferIconProps {
  size?: number;
  className?: string;
}

export function BankTransferIcon({ size = 28, className = "" }: BankTransferIconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/bank-transfer.svg"
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
