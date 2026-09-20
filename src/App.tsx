import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
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
  const [location, setLocation] = useLocation();
  const atHome = location === "/";
  const { currentUser, ready } = useAuth();
  const isMobile = useIsMobile();

  const hasSeenTutorial = typeof window !== "undefined" && (
    localStorage.getItem("hasSeenInteractiveTutorialv12") === "true" ||
    localStorage.getItem("obyo_tutorial_done") === "1"
  );

  // İlk tutorial'dan sonra hem PC'de hem mobilde kayıt/giriş zorunlu
  useEffect(() => {
    if (ready && !currentUser && hasSeenTutorial && location !== "/auth") {
      if (isMobile || !atHome) {
        setLocation("/auth?mode=register");
      }
    }
  }, [ready, isMobile, currentUser, hasSeenTutorial, location, setLocation, atHome]);

  // Mobilde tutorial bittiğinde auth'a yönlendirilirken boş render
  if (ready && isMobile && !currentUser && hasSeenTutorial && location !== "/auth") {
    return null;
  }

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
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`/api/health?_t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    try {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 2500);
      await fetch(`/?_ping=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller2.signal,
      });
      clearTimeout(timer2);
      return true;
    } catch {
      return false;
    }
  }
};

function AppContent() {
  const { ready, currentUser } = useAuth();
  const { t, langCode, setLanguage } = useLanguage();
  const [showApp, setShowApp] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [hasTriedOnce, setHasTriedOnce] = useState(false);

  const handleRetry = useCallback(async () => {
    if (isCheckingConnection) return;
    setIsCheckingConnection(true);
    const start = Date.now();
    const online = await probeConnection();
    const elapsed = Date.now() - start;
    if (elapsed < 600) {
      await new Promise((r) => setTimeout(r, 600 - elapsed));
    }
    setIsCheckingConnection(false);
    setHasTriedOnce(true);

    if (online) {
      setIsOnline(true);
      if (!isAppReady) {
        setIsAppReady(true);
      }
    } else {
      setIsOnline(false);
    }
  }, [isCheckingConnection, isAppReady]);

  useEffect(() => {
    const handleOnline = async () => {
      const online = await probeConnection();
      setIsOnline(online);
      if (online && !isAppReady) {
        setIsAppReady(true);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowApp(false);
      (window as any).__APP_UI_READY__ = false;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAppReady]);

  useEffect(() => {
    const handleReady = () => {
      console.log("App ready event received");
      if (isOnline) {
        setIsAppReady(true);
      }
    };
    window.addEventListener('app-ready', handleReady);
    
    // Safety timeout: Eğer 10 saniye içinde hazır olmazsa, yine de göster
    // Ancak İNTERNET YOKSA ASLA APP'İ GÖSTERME, LOADING EKRANINDA KALSIN
    const safetyTimer = setTimeout(() => {
      if (!isAppReady && isOnline) {
        console.log("Safety timeout reached, forcing app ready");
        setIsAppReady(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('app-ready', handleReady);
      clearTimeout(safetyTimer);
    };
  }, [isAppReady, isOnline]);

  useEffect(() => {
    if (currentUser && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }
  }, [currentUser]);

  useEffect(() => {
    if (ready && isAppReady && isOnline) {
      const timer = setTimeout(() => {
        setShowApp(true);
        (window as any).__APP_UI_READY__ = true;
        window.dispatchEvent(new CustomEvent('app-ui-ready'));
      }, 500); // Küçük bir geçiş payı
      return () => clearTimeout(timer);
    } else if (!ready || !isOnline) {
      setShowApp(false);
      (window as any).__APP_UI_READY__ = false;
    }
  }, [ready, isAppReady, isOnline]);

  const shouldShowSplash = !ready || !showApp || !isOnline;

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
                  className="fixed inset-0 text-white flex flex-col items-center justify-between py-10 px-6 z-50 select-none"
                  style={{
                    background: "radial-gradient(circle at 50% 42%, #261306 0%, #0c0b0d 60%, #050506 100%)",
                  }}
                >
                  {/* Top Bar with Brand */}
                  <div className="w-full flex items-center justify-center max-w-md px-1">
                    <span className="text-xs font-bold tracking-widest text-[#FF6B00]">OBYO TRADE</span>
                  </div>

                  {/* Center Content: Offline State vs Normal Loading */}
                  {!isOnline ? (
                    <motion.div
                      key="offline-content"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center text-center max-w-xs sm:max-w-sm px-2"
                    >
                      {/* Offline Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center mb-5 shadow-lg shadow-orange-950/40">
                        <WifiOff className="w-8 h-8 text-[#FF6B00]" />
                      </div>

                      {/* Title */}
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                        {t.noInternetTitle}
                      </h2>

                      {/* Description */}
                      <p className="text-sm sm:text-base text-white/70 font-normal tracking-wide mb-6 leading-relaxed">
                        {t.noInternetDesc}
                      </p>

                      {/* Reminder alert if retry failed */}
                      {hasTriedOnce && !isCheckingConnection && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-5 px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-center gap-2 text-left"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>{t.noInternetDesc}</span>
                        </motion.div>
                      )}

                      {/* Retry Button */}
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={isCheckingConnection}
                        className="w-full sm:w-auto min-w-[200px] px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#ff791a] hover:to-[#ffa05c] text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 text-black ${isCheckingConnection ? "animate-spin" : ""}`} />
                        <span>{isCheckingConnection ? t.checkingConnection : t.tryAgain}</span>
                      </button>
                    </motion.div>
                  ) : (
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

                      {/* Clean normal loading spinner */}
                      <div className="my-8 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full border-[2.5px] border-white/15 border-t-[#FF6B00] animate-spin" />
                      </div>

                      {/* Status text */}
                      <p className="text-sm sm:text-base text-white/60 font-normal tracking-wide">
                        {t.loadingStatus}
                      </p>
                    </div>
                  )}

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
