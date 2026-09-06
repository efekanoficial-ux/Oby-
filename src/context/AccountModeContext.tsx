import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useDemoAccount } from "./DemoAccountContext";

export type AccMode = "demo" | "real";

interface AccountModeContextType {
  mode:           AccMode;
  setMode:        (m: AccMode) => void;
  displayBalance: number;
  isReal:         boolean;
}

const AccountModeContext = createContext<AccountModeContextType | null>(null);

export function AccountModeProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { balance: demoBalance } = useDemoAccount();
  const [mode, setModeState] = useState<AccMode>("demo");

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

  return (
    <AccountModeContext.Provider value={{ mode, setMode, displayBalance, isReal }}>
      {children}
    </AccountModeContext.Provider>
  );
}

export function useAccountMode() {
  const ctx = useContext(AccountModeContext);
  if (!ctx) throw new Error("useAccountMode must be used within AccountModeProvider");
  return ctx;
}
