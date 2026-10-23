import AuthPage from "@/pages/auth";

type Mode = "login" | "register" | "complete-google";

interface DesktopAuthGateProps {
  onEnterDemo?: () => void;
  initialMode?: Mode;
}

export function DesktopAuthGate({ initialMode = "register" }: DesktopAuthGateProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-black overflow-y-auto" style={{ backgroundColor: "#000000" }}>
      <AuthPage initialMode={initialMode === "login" ? "login" : "register"} />
    </div>
  );
}
