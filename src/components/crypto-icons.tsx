import React from "react";

interface CryptoIconProps {
  coin?: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ coin = "USDT", size = 28, className = "" }: CryptoIconProps) {
  const sym = (coin || "").toUpperCase().trim();

  // 1. USDT (Tether)
  if (sym === "USDT") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#26A17B" />
        <path
          d="M17.9 12.5V9.4h5.2V6.6H8.9v2.8h5.2v3.1c-4.2.2-7.3 1.1-7.3 2.1 0 1 3.1 1.9 7.3 2.1v6.7h3.8v-6.7c4.2-.2 7.3-1.1 7.3-2.1 0-1-3.1-1.9-7.3-2.1zm0 3.7c-3.6 0-6.6-.7-6.9-1.6.3-.9 3.3-1.6 6.9-1.6 3.6 0 6.6.7 6.9 1.6-.3.9-3.3 1.6-6.9 1.6z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 2. BTC (Bitcoin)
  if (sym === "BTC") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M22.7 13.9c.3-2.1-1.3-3.2-3.5-3.9l.7-2.9-1.7-.4-.7 2.8c-.5-.1-.9-.2-1.4-.3l.7-2.8-1.8-.4-.7 2.9c-.4-.1-.7-.2-1.1-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.3c.1 0 .1 0 .2.1l-.2-.1-1.1 4.6c-.1.2-.3.6-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 3 1.8.4.7-2.9c.5.1.9.2 1.4.3l-.7 2.9 1.8.4.7-2.9c3 .6 5.2.3 6.1-2.4.8-2.1 0-3.4-1.6-4.2 1.1-.3 2-1 2.2-2.6zm-3.9 5.6c-.5 2.2-4.1 1-5.3.7l.9-3.8c1.2.3 4.9.9 4.4 3.1zm.5-5.7c-.5 2-3.5.9-4.5.7l.9-3.4c1 .3 4.1.8 3.6 2.7z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 3. ETH (Ethereum)
  if (sym === "ETH") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16 4.5l-.2.8v14.4l.2.2 6.7-4-6.7-11.4z" fill="#C0CBF6" />
        <path d="M16 4.5L9.3 15.9l6.7 4V4.5z" fill="#FFFFFF" />
        <path d="M16 21l-.1.2v6.3l.1.3 6.7-9.3-6.7 2.8z" fill="#C0CBF6" />
        <path d="M16 27.8V21l-6.7-2.8 6.7 9.6z" fill="#FFFFFF" />
        <path d="M16 19.9l6.7-4-6.7-3v7z" fill="#8197EE" />
        <path d="M9.3 15.9l6.7 4v-7l-6.7 3z" fill="#C0CBF6" />
      </svg>
    );
  }

  // 4. SOL (Solana)
  if (sym === "SOL") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#000000" />
        <defs>
          <linearGradient id="solGrad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
        <path
          d="M8.5 21.2a.7.7 0 01.5-.2h14a.7.7 0 01.5 1.2l-3.5 3.5a.7.7 0 01-.5.2H5.5a.7.7 0 01-.5-1.2l3.5-3.5zM23.5 14.2a.7.7 0 00-.5-.2H9a.7.7 0 00-.5 1.2l3.5 3.5a.7.7 0 00.5.2h14a.7.7 0 00.5-1.2l-3.5-3.5zM8.5 7.2a.7.7 0 01.5-.2h14a.7.7 0 01.5 1.2L20 11.7a.7.7 0 01-.5.2H5.5a.7.7 0 01-.5-1.2l3.5-3.5z"
          fill="url(#solGrad)"
        />
      </svg>
    );
  }

  // 5. TON (The Open Network)
  if (sym === "TON") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#0088CC" />
        <path
          d="M23.4 9.5L8.6 15.2c-1 .4-1 1-.2 1.3l3.8 1.2 8.8-5.6c.4-.3.8-.1.5.2l-7.1 6.4v.1l-.3 3.9c.4 0 .6-.2.8-.4l2-2 4.1 3c.8.4 1.3.2 1.5-.7l2.7-12.7c.3-1.1-.4-1.6-1.7-1z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 6. BNB (Binance)
  if (sym === "BNB") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
        <path
          d="M16 7.4l3.5 3.5-3.5 3.5-3.5-3.5L16 7.4zm5.7 5.7l3.5 3.5-3.5 3.5-3.5-3.5 3.5-3.5zm-11.4 0l3.5 3.5-3.5 3.5-3.5-3.5 3.5-3.5zM16 19l3.5 3.5-3.5 3.5-3.5-3.5L16 19zm0-4.6l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 7. XRP (Ripple)
  if (sym === "XRP") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#23292F" />
        <path
          d="M24.2 8.5h2.5L19 16.2c-1.7 1.7-4.4 1.7-6.1 0L5.3 8.5h2.5l5.9 5.9c.8.8 2.2.8 3.1 0l7.4-5.9zm-16.8 15H5L12.9 16c1.7-1.7 4.4-1.7 6.1 0l7.7 7.5h-2.5l-6-5.9c-.8-.8-2.2-.8-3.1 0l-7.3 5.9z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 8. DOGE (Dogecoin)
  if (sym === "DOGE") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#C2A633" />
        <path
          d="M13.2 9h4.8c3.8 0 6.6 2.9 6.6 7s-2.8 7-6.6 7h-4.8V9zm3 2.7v3.2H20v1.7h-3.8v4h2.1c2.2 0 3.8-1.7 3.8-4.4s-1.6-4.5-3.8-4.5h-2.1z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 9. SHIB (Shiba Inu)
  if (sym === "SHIB") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#E65E26" />
        <path
          d="M16 7l3.5 5.5h-7L16 7zm-5 6.5l-4-2.5 1.5 5.5 2.5-3zm10 0l2.5 3 1.5-5.5-4 2.5zm-5 2.5l-3.5 5h7l-3.5-5zm-5 2l-2 4 4.5 3-2.5-7zm10 0l-2.5 7 4.5-3-2-4z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 10. PEPE (Pepe)
  if (sym === "PEPE") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#4B8C3A" />
        <circle cx="12" cy="13" r="3.5" fill="#FFFFFF" />
        <circle cx="20" cy="13" r="3.5" fill="#FFFFFF" />
        <circle cx="12" cy="13" r="1.8" fill="#1A1A1A" />
        <circle cx="20" cy="13" r="1.8" fill="#1A1A1A" />
        <path
          d="M8.5 20c2 2.5 5.5 3 7.5 3s5.5-.5 7.5-3c-1.5 1-4 1.5-7.5 1.5S10 21 8.5 20z"
          fill="#E74C3C"
        />
      </svg>
    );
  }

  // 11. AVAX (Avalanche)
  if (sym === "AVAX") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#E84142" />
        <path
          d="M17.8 7.5a2 2 0 00-3.6 0L8.4 18.2a2 2 0 001.8 2.8h11.6a2 2 0 001.8-2.8L17.8 7.5zm-1.8 4l3.6 6.5H12.4l3.6-6.5z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 12. LTC (Litecoin)
  if (sym === "LTC") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <circle cx="16" cy="16" r="16" fill="#345D9D" />
        <path
          d="M12.5 8.5h3.4l-2.1 8h4.6l-.6 2.3h-4.6l-1 3.7h8.8l-.7 2.5H9.5l3-16.5z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Fallback / Generic Coin
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-[10px] shadow-sm select-none ${className}`}
    >
      {sym.slice(0, 3)}
    </div>
  );
}
