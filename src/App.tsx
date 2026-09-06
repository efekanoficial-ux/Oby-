import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoAccountProvider } from "@/context/DemoAccountContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AccountModeProvider } from "@/context/AccountModeContext";
import { Layout } from "@/components/layout";

import Home    from "@/pages/home";
import Chart   from "@/pages/chart";
import Balance from "@/pages/balance";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import Privacy from "@/pages/privacy";
import AuthPage from "@/pages/auth";
import Admin   from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function MainRoutes() {
  const [location] = useLocation();
  const atHome = location === "/";

  return (
    <Layout>
      {/* Home is always mounted — keeps chart + WS alive across navigation */}
      <div className={atHome ? "flex flex-col flex-1 min-h-0 overflow-hidden" : "hidden"}>
        <Home />
      </div>
      {!atHome && (
        <Switch>
          <Route path="/balance" component={Balance} />
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
  const { currentUser } = useAuth();
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
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
