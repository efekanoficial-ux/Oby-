import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "motion/react";
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

function AppContent() {
  const { ready, currentUser } = useAuth();
  const { t } = useLanguage();
  const [showApp, setShowApp] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const handleReady = () => {
      console.log("App ready event received");
      setIsAppReady(true);
    };
    window.addEventListener('app-ready', handleReady);
    
    // Safety timeout: Eğer 10 saniye içinde hazır olmazsa (yavaş bağlantı vs), yine de göster.
    const safetyTimer = setTimeout(() => {
      if (!isAppReady) {
        console.log("Safety timeout reached, forcing app ready");
        setIsAppReady(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('app-ready', handleReady);
      clearTimeout(safetyTimer);
    };
  }, [isAppReady]);

  useEffect(() => {
    if (currentUser && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }
  }, [currentUser]);

  useEffect(() => {
    if (ready && isAppReady) {
      const timer = setTimeout(() => {
        setShowApp(true);
        (window as any).__APP_UI_READY__ = true;
        window.dispatchEvent(new CustomEvent('app-ui-ready'));
      }, 500); // Küçük bir geçiş payı
      return () => clearTimeout(timer);
    } else if (!ready) {
      setShowApp(false);
      setIsAppReady(false);
      (window as any).__APP_UI_READY__ = false;
    }
  }, [ready, isAppReady]);

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
              {(!ready || !showApp) && (
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

                    {/* Clean normal loading spinner (non-neon) */}
                    <div className="my-8 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full border-[2.5px] border-white/15 border-t-[#FF6B00] animate-spin" />
                    </div>

                    {/* Status text */}
                    <p className="text-sm sm:text-base text-white/60 font-normal tracking-wide">
                      {t.loadingStatus}
                    </p>
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
