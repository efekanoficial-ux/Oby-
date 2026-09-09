import { useEffect, useState, useRef } from "react";

interface AnimatedBalanceProps {
  value: number;
  currency?: string;
  className?: string;
  showSymbol?: boolean;
  symbol?: string;
  prefix?: string;
  style?: React.CSSProperties;
}

export function AnimatedBalance({
  value,
  currency,
  className = "",
  showSymbol = true,
  symbol,
  prefix = "",
  style,
}: AnimatedBalanceProps) {
  // Determine effective currency & symbol
  const effectiveCurrency = currency ?? (typeof window !== "undefined" && localStorage.getItem("obyo_guest_currency") === "USD" ? "USD" : "TL");
  const sym = symbol ?? (effectiveCurrency === "TL" || effectiveCurrency === "TRY" ? "₺" : "$");
  const [displayValue, setDisplayValue] = useState(value);

  const prevValRef = useRef(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValRef.current;
    const endVal = value;
    const diff = endVal - startVal;

    if (Math.abs(diff) < 0.001) {
      setDisplayValue(value);
      return;
    }

    // Animation duration in ms - smooth & rapid counting
    const duration = 600;
    const startTime = performance.now();

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for realistic fast deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        prevValRef.current = endVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value]);

  const locale = sym === "₺" || effectiveCurrency === "TL" || effectiveCurrency === "TRY" ? "tr-TR" : "en-US";
  const formattedNum = displayValue.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={`tabular-nums inline-block select-none ${className}`}
      style={style}
    >
      {prefix}
      {showSymbol ? sym : ""}
      {formattedNum}
    </span>
  );
}
