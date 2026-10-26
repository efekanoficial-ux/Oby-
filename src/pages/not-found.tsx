import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121216] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-7 w-7 text-rose-500 shrink-0" />
          <h1 className="text-xl font-bold text-white">404 - Sayfa Bulunamadı</h1>
        </div>
        <p className="text-xs text-white/50 leading-relaxed mb-6">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-all cursor-pointer"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
