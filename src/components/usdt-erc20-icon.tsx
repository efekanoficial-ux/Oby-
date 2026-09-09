import React from "react";

interface UsdtErc20IconProps {
  size?: number;
  className?: string;
}

export function UsdtErc20Icon({ size = 28, className = "" }: UsdtErc20IconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/usdt-erc20.svg"
        alt="USDT ERC-20"
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none scale-105 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
