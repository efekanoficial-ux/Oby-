import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff, RefreshCw } from "lucide-react";
import { DemoAccountProvider } from "@/context/DemoAccountContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AccountModeProvider } from "@/context/AccountModeContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { Layout } from "@/components/layout";
import { requestNotificationPermission } from "@/lib/notifications";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopAuthGate } from "@/components/desktop-auth-gate";
import Home    from "@/pages/home";
import Chart   from "@/pages/chart";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import LeaderboardPage from "@/pages/leaderboard";
import BonusesPage from "@/pages/bonuses";
import WalletPage from "@/pages/wallet";
import BalancePage from "@/pages/balance";
import Privacy from "@/pages/privacy";
import AuthPage from "@/pages/auth";
import Admin   from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { RejectionAlert } from "@/components/RejectionAlert";

const queryClient = new QueryClient();

function MainRoutes() {
  const [location] = useLocation();
  const atHome = location === "/";
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  const hasSeenTutorial = typeof window !== "undefined" && (
    localStorage.getItem("hasSeenInteractiveTutorialv12") === "true" ||
    localStorage.getItem("obyo_tutorial_done") === "1"
  );

  // PC'de tutorial tamamlandıktan sonra anasayfada kayıt/giriş kapısı zorunlu olsun
  const showDesktopAuth = !isMobile && !currentUser && atHome && hasSeenTutorial;
  if (showDesktopAuth) {
    return (
      <DesktopAuthGate initialMode="register" />
    );
  }

  return (
    <Layout>
      {/* Home is always mounted — keeps chart + WS alive across navigation */}
      <div className={atHome ? "flex flex-col flex-1 min-h-0 overflow-hidden" : "hidden"}>
        <Home />
      </div>
      {!atHome && (
        <Switch>
          <Route path="/balance" component={BalancePage} />
          <Route path="/wallet"  component={WalletPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/bonuses" component={BonusesPage} />
          <Route path="/history" component={History} />
          <Route path="/profile" component={Profile} />
          <Route path="/chart"   component={Chart}   />
          <Route component={NotFound} />
        </Switch>
      )}
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth"    component={AuthPage}  />
      <Route path="/admin"   component={Admin}     />
      <Route path="/privacy" component={Privacy}   />
      <Route component={MainRoutes} />
    </Switch>
  );
}

const probeConnection = async (): Promise<boolean> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/health?_t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    // Mobil ağlarda (iOS Safari vb.) navigator.onLine true ise gereksiz offline kilidine sokma
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return true;
    }
    return false;
  }
};

function AppContent() {
  const { ready, currentUser } = useAuth();
  const { t } = useLanguage();
  const [showApp, setShowApp] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineConfirmed, setOfflineConfirmed] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  const handleRetry = useCallback(async () => {
    if (isCheckingConnection) return;
    setIsCheckingConnection(true);
    const start = Date.now();
    const online = await probeConnection();
    const elapsed = Date.now() - start;
    if (elapsed < 800) {
      await new Promise((r) => setTimeout(r, 800 - elapsed));
    }
    setIsCheckingConnection(false);

    if (online) {
      setIsOnline(true);
      setOfflineConfirmed(false);
      if (!isAppReady) {
        setIsAppReady(true);
      }
    } else {
      setIsOnline(false);
      setOfflineConfirmed(true);
    }
  }, [isCheckingConnection, isAppReady]);

  useEffect(() => {
    let isMounted = true;

    // İlk başta sadece cihaz gerçekten offline ise kontrol et
    const timer = setTimeout(async () => {
      if (!isMounted) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOnline(false);
        setOfflineConfirmed(true);
      }
    }, 1500);

    const handleOnline = async () => {
      setIsCheckingConnection(true);
      const online = await probeConnection();
      setIsCheckingConnection(false);
      if (online) {
        setIsOnline(true);
        setOfflineConfirmed(false);
        if (!isAppReady) {
          setIsAppReady(true);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineConfirmed(true);
      setShowApp(false);
      (window as any).__APP_UI_READY__ = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAppReady]);

  useEffect(() => {
    const handleReady = () => {
      if (isOnline && !offlineConfirmed) {
        setIsAppReady(true);
      }
    };
    window.addEventListener('app-ready', handleReady);
    
    // Güvenlik zamanlayıcısı: max 1.8 saniye sonra yükleme ekranını nazikçe sonlandır
    const safetyTimer = setTimeout(() => {
      if (!isAppReady && isOnline && !offlineConfirmed) {
        setIsAppReady(true);
      }
    }, 1800);

    return () => {
      window.removeEventListener('app-ready', handleReady);
      clearTimeout(safetyTimer);
    };
  }, [isAppReady, isOnline, offlineConfirmed]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      currentUser &&
      window.Notification.permission !== 'granted'
    ) {
      requestNotificationPermission();
    }
  }, [currentUser]);

  useEffect(() => {
    if (ready && isAppReady && isOnline && !offlineConfirmed) {
      setShowApp(true);
      (window as any).__APP_UI_READY__ = true;
      window.dispatchEvent(new CustomEvent('app-ui-ready'));
    } else if (!ready || !isOnline || offlineConfirmed) {
      setShowApp(false);
      (window as any).__APP_UI_READY__ = false;
    }
  }, [ready, isAppReady, isOnline, offlineConfirmed]);

  const shouldShowSplash = !ready || !showApp || !isOnline || offlineConfirmed;

  return (
    <DemoAccountProvider key={currentUser?.id ?? "guest"}>
      <AccountModeProvider>
        <TooltipProvider>
          <div className="relative h-full w-full overflow-hidden">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <RejectionAlert />
              <Router />
            </WouterRouter>

            <AnimatePresence>
              {shouldShowSplash && (
                <div
                  key="splash-screen"
                  className="fixed inset-0 text-white flex flex-col items-center justify-between py-12 px-6 z-50 select-none"
                  style={{
                    background: "radial-gradient(circle at 50% 42%, #261306 0%, #0c0b0d 60%, #050506 100%)",
                  }}
                >
                  <div className="w-full" />

                  <div className="flex flex-col items-center text-center max-w-xs sm:max-w-sm">
                    {/* Greeting text */}
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                      {(() => {
                        const cachedName = localStorage.getItem("obyo_cached_name");
                        const rawName = currentUser?.name || cachedName;
                        const displayName = rawName ? String(rawName).trim().toUpperCase() : null;
                        return displayName ? `${t.hello}, ${displayName}` : t.hello;
                      })()}
                    </h1>

                    {/* Loading spinner / Offline icon in exact same spot */}
                    <div className="my-8 flex items-center justify-center h-8">
                      {!offlineConfirmed || isCheckingConnection ? (
                        <div className="w-7 h-7 rounded-full border-[2.5px] border-white/15 border-t-[#FF6B00] animate-spin" />
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center"
                        >
                          <WifiOff className="w-7 h-7 text-[#FF6B00]" />
                        </motion.div>
                      )}
                    </div>

                    {/* Status text: changes to "Lütfen internet bağlantınızı kontrol edin." when offline */}
                    <p className="text-sm sm:text-base text-white/60 font-normal tracking-wide transition-colors">
                      {!offlineConfirmed
                        ? t.loadingStatus
                        : isCheckingConnection
                        ? t.checkingConnection
                        : t.noInternetDesc}
                    </p>

                    {/* Tekrar dene butonu */}
                    {offlineConfirmed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-6"
                      >
                        <button
                          type="button"
                          onClick={handleRetry}
                          disabled={isCheckingConnection}
                          className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8533] text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 text-black ${isCheckingConnection ? "animate-spin" : ""}`} />
                          <span>{isCheckingConnection ? t.checkingConnection : t.tryAgain}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* App version */}
                  <div className="text-xs text-white/20 tracking-widest font-mono">
                    Version 1.0.0
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
          <Toaster />
        </TooltipProvider>
      </AccountModeProvider>
    </DemoAccountProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
