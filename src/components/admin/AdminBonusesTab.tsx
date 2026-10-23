import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Plus, Trash2, Clock, CheckCircle2, AlertCircle,
  Coins, Zap, Sparkles, UserCheck, Users, Search,
  ChevronDown, Check, X, Shield, RefreshCw, ArrowRight
} from "lucide-react";
import {
  Bonus,
  listenBonuses,
  saveBonus,
  createBonus,
  deleteBonus,
  listenAllClaims,
  UserBonusClaim,
} from "@/lib/bonuses";
import { ObyoUser } from "@/context/AuthContext";

interface AdminBonusesTabProps {
  users: ObyoUser[];
}

export function AdminBonusesTab({ users }: AdminBonusesTabProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [claims, setClaims] = useState<UserBonusClaim[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bonus Form State
  const [form, setForm] = useState<{
    id?: string;
    title: string;
    description: string;
    type: "nodeposit" | "deposit_match";
    amount: number;
    currency: "USD" | "TL";
    target: "all" | "user";
    targetUserId: string;
    targetUserEmail: string;
    durationHours: number;
    badge: string;
  }>({
    title: "",
    description: "",
    type: "nodeposit",
    amount: 10,
    currency: "USD",
    target: "all",
    targetUserId: "",
    targetUserEmail: "",
    durationHours: 24,
    badge: "Fırsat",
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Real-time listener for bonuses
  useEffect(() => {
    const unsub = listenBonuses(setBonuses);
    return () => unsub();
  }, []);

  // Real-time listener for all claims
  useEffect(() => {
    const unsub = listenAllClaims(setClaims);
    return () => unsub();
  }, []);

  // Live timer tick
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick Preset Handlers
  const applyPreset = (presetKey: string) => {
    if (presetKey === "10usd") {
      setForm({
        title: "10$ Hoş Geldin Nakit Bonusu",
        description: "Yatırım şartı olmadan anında hesabınıza 10$ bakiye tanımlayın ve hemen işlem yapmaya başlayın.",
        type: "nodeposit",
        amount: 10,
        currency: "USD",
        target: "all",
        targetUserId: "",
        targetUserEmail: "",
        durationHours: 24,
        badge: "10$ Hediye",
      });
      setIsCreating(true);
    } else if (presetKey === "500try") {
      setForm({
        title: "500₺ Deneme Nakit Bonusu",
        description: "Yatırım şartı olmadan anında hesabınıza 500₺ bakiye aktarın ve piyasayı test edin.",
        type: "nodeposit",
        amount: 500,
        currency: "TL",
        target: "all",
        targetUserId: "",
        targetUserEmail: "",
        durationHours: 24,
        badge: "500₺ Nakit",
      });
      setIsCreating(true);
    } else if (presetKey === "50match") {
      setForm({
        title: "%50 Yatırım Ekstra Bonusu",
        description: "Yapacağınız sonraki yatırıma özel %50 ekstra bakiye hesabınıza anında eklenir.",
        type: "deposit_match",
        amount: 50,
        currency: "USD",
        target: "all",
        targetUserId: "",
        targetUserEmail: "",
        durationHours: 24,
        badge: "%50 Ekstra",
      });
      setIsCreating(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFeedback({ type: "error", text: "Lütfen bir bonus başlığı girin." });
      return;
    }
    if (form.target === "user" && !form.targetUserEmail.trim()) {
      setFeedback({ type: "error", text: "Lütfen hedef kullanıcı seçin veya e-posta adresini girin." });
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setFeedback({ type: "error", text: "Geçerli bir tutar veya oran girin." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await createBonus({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        target: form.target,
        targetUserId: form.targetUserId?.trim() || undefined,
        targetUserEmail: form.targetUserEmail?.trim().toLowerCase() || undefined,
        durationHours: form.durationHours || 24,
        badge: form.badge?.trim() || undefined,
        status: "active",
      });

      setFeedback({ type: "success", text: "Bonus başarıyla oluşturuldu ve yayınlandı!" });
      setIsCreating(false);
      // Reset form
      setForm({
        title: "",
        description: "",
        type: "nodeposit",
        amount: 10,
        currency: "USD",
        target: "all",
        targetUserId: "",
        targetUserEmail: "",
        durationHours: 24,
        badge: "Fırsat",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Bonus kaydedilirken bir hata oluştu." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu bonusu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteBonus(id);
      setFeedback({ type: "success", text: "Bonus başarıyla silindi." });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Bonus silinirken hata oluştu." });
    }
  };

  // Filtered users for search in single-user target
  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.surname.toLowerCase().includes(q)
    );
  });

  const getRemainingTime = (expiresAt: number) => {
    const diff = expiresAt - now;
    if (diff <= 0) return "Süresi Doldu";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}sa ${mins}dk kaldı`;
  };

  return (
    <div className="p-4 flex flex-col gap-6 max-w-4xl mx-auto">
      {/* ── Top Overview & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e0e11] border border-white/10 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-[#FF6B00]" />
            <h2 className="text-base font-black text-white">Bonus & Fırsat Yönetimi</h2>
          </div>
          <p className="text-xs text-white/50">
            Kullanıcılara veya herkese açık 24 saatlik yatırımsız nakit veya % yatırım bonusları tanımlayın.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setFeedback(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#FF6B00]/20 shrink-0 self-start sm:self-auto"
        >
          {isCreating ? <X size={14} /> : <Plus size={14} />}
          <span>{isCreating ? "Formu Kapat" : "+ Yeni Bonus Ekle"}</span>
        </button>
      </div>

      {/* ── Feedback Message ── */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-[#0ecb81]/15 border-[#0ecb81]/30 text-[#0ecb81]"
              : "bg-[#f6465d]/15 border-[#f6465d]/30 text-[#f6465d]"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── Quick Preset Buttons ── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-white/40">
          ⚡ Hızlı Bonus Şablonları (1-Tıkla Doldur)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset("10usd")}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#0ecb81]/50 hover:bg-[#0ecb81]/5 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#0ecb81]/15 flex items-center justify-center text-[#0ecb81] shrink-0 border border-[#0ecb81]/20">
                <Coins size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-[#0ecb81]">10$ Yatırımsız</p>
                <p className="text-[10px] text-white/40">Nakit Bakiye Hediyesi</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white/30 group-hover:text-white">Seç →</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("500try")}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#FFB800]/50 hover:bg-[#FFB800]/5 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#FFB800]/15 flex items-center justify-center text-[#FFB800] shrink-0 border border-[#FFB800]/20">
                <Coins size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-[#FFB800]">500₺ Yatırımsız</p>
                <p className="text-[10px] text-white/40">TL Deneme Bonusu</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white/30 group-hover:text-white">Seç →</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("50match")}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00] shrink-0 border border-[#FF6B00]/20">
                <Zap size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-[#FF6B00]">%50 Yatırım Bonusu</p>
                <p className="text-[10px] text-white/40">Yatırıma +%50 Ek Bakiye</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white/30 group-hover:text-white">Seç →</span>
          </button>
        </div>
      </div>

      {/* ── Bonus Creation Form ── */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="overflow-hidden bg-[#121215] border border-white/15 rounded-2xl p-5 flex flex-col gap-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF6B00]" />
                Yeni Bonus Tanımla
              </h3>
              <span className="text-[11px] font-mono text-white/40">Varsayılan Süre: 24 Saat (1 Gün)</span>
            </div>

            {/* Target Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">
                  Hedef Kitle (Kime Gönderilecek?)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, target: "all", targetUserId: "", targetUserEmail: "" })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      form.target === "all"
                        ? "bg-white/15 border-white text-white shadow"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    <Users size={14} />
                    <span>Herkese Açık</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, target: "user" })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      form.target === "user"
                        ? "bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00] shadow"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    <UserCheck size={14} />
                    <span>Kişiye Özel</span>
                  </button>
                </div>
              </div>

              {/* Bonus Type */}
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">
                  Bonus Türü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "nodeposit" })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      form.type === "nodeposit"
                        ? "bg-[#0ecb81]/20 border-[#0ecb81] text-[#0ecb81] shadow"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    <Coins size={14} />
                    <span>Yatırımsız Nakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "deposit_match" })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      form.type === "deposit_match"
                        ? "bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00] shadow"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    <Zap size={14} />
                    <span>% Yatırım Bonusu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* If Single User: User Search & Selector */}
            {form.target === "user" && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#FF6B00]/30 flex flex-col gap-2.5">
                <label className="text-xs font-bold text-[#FF6B00] flex items-center gap-1.5">
                  <UserCheck size={14} />
                  Kişiye Özel Bonus Tanımlanacak Kullanıcı:
                </label>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-white/40" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara (isim veya e-posta)..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                {/* Selected User Indicator */}
                {form.targetUserEmail && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-xs">
                    <span className="font-bold text-white">
                      Seçili Kullanıcı: <span className="text-[#FF6B00]">{form.targetUserEmail}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, targetUserId: "", targetUserEmail: "" })}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Users List preview */}
                <div className="max-h-32 overflow-y-auto flex flex-col gap-1 pr-1">
                  {filteredUsers.slice(0, 10).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          targetUserId: u.id,
                          targetUserEmail: u.email,
                        });
                        setUserSearchQuery("");
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/10 text-left text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-white block">{u.name} {u.surname}</span>
                        <span className="text-[10px] text-white/40">{u.email}</span>
                      </div>
                      <span className="text-[10px] text-[#FF6B00] font-bold">Seç</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs: Title, Amount, Currency, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-white/60 mb-1 block">
                  Bonus Başlığı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 10$ Hoş Geldin Nakit Bonusu"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">
                  {form.type === "nodeposit" ? "Nakit Miktarı" : "Yatırım Oranı (%)"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]"
                  />
                  {form.type === "nodeposit" && (
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value as "USD" | "TL" })}
                      className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="USD" className="bg-[#1a1a1a]">USD ($)</option>
                      <option value="TL" className="bg-[#1a1a1a]">TRY (₺)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">
                Bonus Açıklaması (Kullanıcıya gösterilecek detay)
              </label>
              <textarea
                rows={2}
                placeholder="Örn: Bu bonusu etkinleştirerek hesabınıza doğrudan bakiye tanımlayabilirsiniz..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            {/* Badge & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">
                  Rozet / Etiket Metni (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Popüler, Hoş Geldin, %50 Fırsat"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/60 mb-1 block">
                  Geçerlilik Süresi (Saat)
                </label>
                <select
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: parseInt(e.target.value, 10) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                >
                  <option value={24} className="bg-[#1a1a1a]">24 Saat (1 Gün - Standart)</option>
                  <option value={48} className="bg-[#1a1a1a]">48 Saat (2 Gün)</option>
                  <option value={72} className="bg-[#1a1a1a]">72 Saat (3 Gün)</option>
                  <option value={168} className="bg-[#1a1a1a]">168 Saat (1 Hafta)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-white/5 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#FF6B00]/20 flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    <span>Bonusu Yayınla</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Active & Past Bonuses Table / Cards ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white/40">
            Mevcut Bonuslar ({bonuses.length})
          </h3>
          <span className="text-[11px] font-mono text-white/30">
            Toplam {claims.length} Kullanım / Etkinleştirme
          </span>
        </div>

        {bonuses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center">
            <Gift size={32} className="text-white/20 mb-2" />
            <p className="text-xs font-bold text-white/60">Henüz oluşturulmuş bonus yok</p>
            <p className="text-[11px] text-white/30 mt-1 max-w-sm">
              Yukarıdaki "Yeni Bonus Ekle" butonunu veya hazır şablonları kullanarak ilk bonusunuzu tanımlayın.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {bonuses.map((b) => {
              const bonusClaims = claims.filter((c) => c.bonusId === b.id);
              const activatedCount = bonusClaims.filter((c) => c.status === "activated").length;
              const usedCount = bonusClaims.filter((c) => c.status === "used").length;
              const isExpired = Date.now() > b.expiresAt;

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isExpired
                      ? "bg-white/[0.01] border-white/5 opacity-60"
                      : b.target === "user"
                      ? "bg-[#FF6B00]/[0.04] border-[#FF6B00]/25"
                      : "bg-[#111114] border-white/10"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          b.type === "nodeposit"
                            ? "bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30"
                            : "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30"
                        }`}
                      >
                        {b.type === "nodeposit" ? (
                          <>
                            <Coins size={11} />
                            {b.amount} {b.currency === "TL" ? "₺" : "$"} Nakit
                          </>
                        ) : (
                          <>
                            <Zap size={11} />
                            %{b.amount} Yatırım Bonusu
                          </>
                        )}
                      </span>

                      {b.target === "user" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <UserCheck size={11} />
                          Kişiye Özel ({b.targetUserEmail})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/60 border border-white/10">
                          <Users size={11} />
                          Herkese Açık
                        </span>
                      )}

                      {b.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/50 border border-white/5">
                          {b.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                        <Clock size={12} />
                        {getRemainingTime(b.expiresAt)}
                      </span>

                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg bg-[#f6465d]/10 hover:bg-[#f6465d]/20 text-[#f6465d] transition-colors cursor-pointer"
                        title="Bonusu Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{b.title}</h4>
                  <p className="text-xs text-white/60 leading-relaxed mb-3">{b.description}</p>

                  {/* Claims Stats Bar */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <div className="flex items-center gap-4">
                      <span>
                        Etkinleştiren: <b className="text-white">{activatedCount}</b>
                      </span>
                      <span>
                        Tamamlanan/Yatırılan: <b className="text-[#0ecb81]">{usedCount}</b>
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-white/30">
                      Oluşturulma: {new Date(b.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
