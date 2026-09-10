import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import WalletPage from "@/pages/wallet";
import BalancePage from "@/pages/balance";
import Privacy from "@/pages/privacy";
import AuthPage from "@/pages/auth";
import Admin   from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function MainRoutes() {
  const [location] = useLocation();
  const atHome = location === "/";
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [guestEntered, setGuestEntered] = useState(() => {
    try {
      return sessionStorage.getItem("obyo_guest_pc_entered") === "true";
    } catch {
      return false;
    }
  });

  // Only show on PC (!isMobile) when NOT logged in (!currentUser) and visitor hasn't entered demo yet
  const showDesktopAuth = !isMobile && !currentUser && atHome && !guestEntered;

  if (showDesktopAuth) {
    return (
      <DesktopAuthGate
        onEnterDemo={() => {
          try {
            sessionStorage.setItem("obyo_guest_pc_entered", "true");
          } catch {}
          setGuestEntered(true);
        }}
      />
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

  useEffect(() => {
    if (currentUser && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }
  }, [currentUser]);

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        setShowApp(true);
      }, 1000); // 1 saniye ekstra bekleme süresi
      return () => clearTimeout(timer);
    } else {
      setShowApp(false);
    }
  }, [ready]);

  if (!ready || !showApp) {
    const rawName = currentUser?.name;
    const displayName = rawName ? rawName.trim().toUpperCase() : null;
    const greetingText = displayName ? `${t.hello}, ${displayName}` : t.hello;

    return (
      <div
        className="fixed inset-0 text-white flex flex-col items-center justify-between py-12 px-6 z-50 select-none"
        style={{
          background: "radial-gradient(circle at 50% 42%, #261306 0%, #0c0b0d 60%, #050506 100%)",
        }}
      >
        <div className="w-full" />

        <div className="flex flex-col items-center text-center max-w-xs sm:max-w-sm">
          {/* Greeting text */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greetingText}
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
    );
  }

  return (
    <DemoAccountProvider key={currentUser?.id ?? "guest"}>
      <AccountModeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
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
