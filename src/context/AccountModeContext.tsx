import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useDemoAccount } from "./DemoAccountContext";

export type AccMode = "demo" | "real";
export type CurrencyCode = "TL" | "USD";

interface AccountModeContextType {
  mode:           AccMode;
  setMode:        (m: AccMode) => void;
  displayBalance: number;
  isReal:         boolean;
  currency:       CurrencyCode;
  currencySymbol: string;
  setGuestCurrency: (c: CurrencyCode) => void;
  formatMoney:    (amount: number, options?: { showSymbol?: boolean; decimals?: number }) => string;
}

const AccountModeContext = createContext<AccountModeContextType | null>(null);

export function AccountModeProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { balance: demoBalance } = useDemoAccount();
  const [mode, setModeState] = useState<AccMode>("demo");
  const [guestCurrency, setGuestCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem("obyo_guest_currency");
      if (saved === "USD" || saved === "TL") return saved;
    } catch {}
    return "TL";
  });

  /* Active currency: prioritize user profile currency, fallback to guest selected currency */
  const currency: CurrencyCode = (currentUser?.currency as CurrencyCode) || guestCurrency;
  const currencySymbol = currency === "TL" ? "₺" : "$";

  const setGuestCurrency = (c: CurrencyCode) => {
    setGuestCurrencyState(c);
    try {
      localStorage.setItem("obyo_guest_currency", c);
    } catch {}
  };

  /* Restore saved mode when user changes (login / logout / refresh) */
  useEffect(() => {
    if (!currentUser) {
      setModeState("demo");
    } else {
      const saved = localStorage.getItem(`obyo_mode_${currentUser.id}`);
      setModeState(saved === "real" ? "real" : "demo");
    }
  }, [currentUser?.id]);

  const setMode = (m: AccMode) => {
    if (m === "real" && !currentUser) return;
    setModeState(m);
    if (currentUser) localStorage.setItem(`obyo_mode_${currentUser.id}`, m);
  };

  const realBalance    = currentUser?.realBalance ?? 0;
  const isReal         = mode === "real" && !!currentUser;
  const displayBalance = isReal ? realBalance : demoBalance;

  const formatMoney = (amount: number, options?: { showSymbol?: boolean; decimals?: number }): string => {
    const showSymbol = options?.showSymbol ?? true;
    const decimals = options?.decimals ?? 2;
    const formatted = amount.toLocaleString(currency === "TL" ? "tr-TR" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return showSymbol ? `${currencySymbol}${formatted}` : formatted;
  };

  return (
    <AccountModeContext.Provider value={{
      mode,
      setMode,
      displayBalance,
      isReal,
      currency,
      currencySymbol,
      setGuestCurrency,
      formatMoney,
    }}>
      {children}
    </AccountModeContext.Provider>
  );
}

export function useAccountMode() {
  const ctx = useContext(AccountModeContext);
  if (!ctx) throw new Error("useAccountMode must be used within AccountModeProvider");
  return ctx;
}
