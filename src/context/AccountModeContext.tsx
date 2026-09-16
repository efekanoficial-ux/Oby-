import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useDemoAccount } from "./DemoAccountContext";

export type AccMode = "demo" | "real" | "tournament";
export type CurrencyCode = "TL" | "USD";

interface AccountModeContextType {
  mode:           AccMode;
  setMode:        (m: AccMode) => void;
  displayBalance: number;
  isReal:         boolean;
  isTournament:   boolean;
  hasJoinedTournament: boolean;
  currency:       CurrencyCode;
  currencySymbol: string;
  tournamentBalance: number;
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
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

  // Balance visibility hide/show state (Closed eye icon functionality)
  // Sistem ilk açıldığında bakiye varsayılan olarak açık (görünür) gelir, kullanıcı isterse kapatır.
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  const toggleBalanceHidden = () => {
    setIsBalanceHidden(prev => !prev);
  };

  /* Active currency: prioritize user profile currency, fallback to guest selected currency */
  const currency: CurrencyCode = (currentUser?.currency as CurrencyCode) || guestCurrency;
  
  const hasJoinedTournament = Boolean(currentUser?.joinedTournaments && currentUser.joinedTournaments.length > 0);
  // In tournament mode, symbol is ¥ (or tournament specific)
  const isTournament = mode === "tournament" && !!currentUser && hasJoinedTournament;
  const isReal = mode === "real" && !!currentUser;
  const currencySymbol = isTournament ? "¥" : (currency === "TL" ? "₺" : "$");

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
      const userHasTournament = Boolean(currentUser.joinedTournaments && currentUser.joinedTournaments.length > 0);
      if (saved === "tournament" && userHasTournament) {
        setModeState("tournament");
      } else if (saved === "real") {
        setModeState("real");
      } else {
        setModeState("demo");
      }
    }
  }, [currentUser?.id, currentUser?.joinedTournaments]);

  const setMode = (m: AccMode) => {
    if ((m === "real" || m === "tournament") && !currentUser) return;
    if (m === "tournament" && !hasJoinedTournament) return;
    setModeState(m);
    if (currentUser) localStorage.setItem(`obyo_mode_${currentUser.id}`, m);
  };

  const realBalance       = currentUser?.realBalance ?? 0;
  // Herhangi bir turnuvaya katılmadan turnuva parası gelmez (0 ¥)
  const tournamentBalance = hasJoinedTournament ? (currentUser?.tournamentBalance ?? 100) : 0;
  
  const displayBalance = isTournament
    ? tournamentBalance
    : (isReal ? realBalance : demoBalance);

  const formatMoney = (amount: number, options?: { showSymbol?: boolean; decimals?: number }): string => {
    // If real balance is hidden and requested in real mode:
    if (isReal && isBalanceHidden) {
      return currency === "TL" ? "*****₺" : "*****$";
    }

    const showSymbol = options?.showSymbol ?? true;
    const decimals = options?.decimals ?? 2;
    const formatted = amount.toLocaleString(isTournament ? "en-US" : (currency === "TL" ? "tr-TR" : "en-US"), {
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
      isTournament,
      hasJoinedTournament,
      currency,
      currencySymbol,
      tournamentBalance,
      isBalanceHidden,
      toggleBalanceHidden,
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
