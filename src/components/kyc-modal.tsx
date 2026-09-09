import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, X, Upload, CheckCircle2, AlertCircle, FileText, UserCheck, Calendar, IdCard, Sparkles } from "lucide-react";

interface KycModalProps {
  show: boolean;
  onClose: () => void;
}

export function KycModal({ show, onClose }: KycModalProps) {
  const { currentUser, submitKYC } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [frontDoc, setFrontDoc] = useState<string | null>(null);
  const [backDoc, setBackDoc] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (currentUser && show) {
      setFullName(`${currentUser.name} ${currentUser.surname}`);
      setBirthDate(currentUser.birthDate || "");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [currentUser, show]);

  if (!show) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("Dosya boyutu 8MB'tan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isFront) setFrontDoc(result);
      else setBackDoc(result);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim() || !birthDate.trim() || !idNumber.trim()) {
      setErrorMsg("Lütfen ad-soyad, doğum tarihi ve kimlik numarasını eksiksiz doldurun.");
      return;
    }

    if (!frontDoc) {
      setErrorMsg("Lütfen kimliğinizin ön yüzünün fotoğrafını yükleyin.");
      return;
    }

    setLoading(true);

    const res = await submitKYC({
      fullName: fullName.trim(),
      birthDate: birthDate.trim(),
      idNumber: idNumber.trim(),
      documentFrontUrl: frontDoc,
      documentBackUrl: backDoc || undefined,
    });

    setLoading(false);

    if (res.isVerified) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const isVerified = currentUser?.kycStatus === "verified";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-[#0c0c0c] border border-white/10 shadow-2xl text-white scrollbar-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/20">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{t.kycTitle}</h3>
                <p className="text-[11px] text-white/40">
                  {isVerified ? t.kycVerified : t.kycNotVerified}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {isVerified ? (
            /* Already Verified View */
            <div className="flex flex-col items-center text-center py-6">
              <div className="relative mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0ecb81]/15 text-[#0ecb81] border-2 border-[#0ecb81]/40 shadow-[0_0_30px_rgba(14,203,129,0.3)]"
                >
                  <CheckCircle2 size={42} />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 bg-[#0ecb81] text-black p-1 rounded-full shadow-lg">
                  <Sparkles size={14} />
                </div>
              </div>

              <h4 className="text-lg font-black text-white mb-2">
                Hesabınız Tam Doğrulanmış (KYC)
              </h4>
              <p className="text-xs text-white/50 leading-relaxed mb-6 max-w-xs">
                Kimlik bilgileriniz sistem tarafından otomatik doğrulandı. Tüm para çekme ve yatırma işlemlerinizi sınırsız şekilde gerçekleştirebilirsiniz.
              </p>

              <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Ad Soyad</span>
                  <span className="font-bold text-white">{currentUser?.kycDetails?.fullName || `${currentUser?.name} ${currentUser?.surname}`}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-white/40">Doğum Tarihi</span>
                  <span className="font-bold text-white">{currentUser?.kycDetails?.birthDate || currentUser?.birthDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-white/40">Doğrulama Durumu</span>
                  <span className="font-black text-[#0ecb81] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Otomatik Onaylı
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-black text-xs text-black bg-[#0ecb81] hover:bg-[#0ecb81]/90 transition-colors shadow-lg shadow-[#0ecb81]/20 cursor-pointer"
              >
                Tamam
              </button>
            </div>
          ) : (
            /* KYC Form View */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="p-3 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-xs text-[#FFB800] leading-relaxed">
                <p className="font-bold mb-0.5">ℹ Otomatik Doğrulama Sistem</p>
                Gireceğiniz isim ve doğum tarihi, hesabınızda kayıtlı bilgilerle eşleşirse kimlik doğrulamanız <strong>anında otomatik onaylanacaktır</strong>.
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={12} className="text-[#FF6B00]" />
                  {t.fullNameLabel}
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full rounded-xl bg-[#141414] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FF6B00]" />
                  Doğum Tarihi
                </label>
                <input
                  required
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl bg-[#141414] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              {/* ID / TC Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <IdCard size={12} className="text-[#FF6B00]" />
                  {t.idNumberLabel}
                </label>
                <input
                  required
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="12345678901"
                  className="w-full rounded-xl bg-[#141414] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              {/* Document Front Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} className="text-[#FF6B00]" />
                  {t.uploadFrontDoc} *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#FF6B00] bg-[#141414] hover:bg-[#181818] transition-all cursor-pointer overflow-hidden relative">
                  {frontDoc ? (
                    <div className="relative w-full h-full">
                      <img src={frontDoc} alt="Kimlik Ön Yüz" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Upload size={14} /> Değiştir
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <Upload size={22} className="text-[#FF6B00] mb-1.5" />
                      <span className="text-xs font-bold text-white/80">Kimlik Ön Yüzünü Seçin</span>
                      <span className="text-[10px] text-white/30 mt-0.5">JPG, PNG veya PDF (Max 8MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Document Back Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} className="text-white/30" />
                  {t.uploadBackDoc}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-20 rounded-2xl border border-dashed border-white/10 hover:border-white/25 bg-[#141414] hover:bg-[#181818] transition-all cursor-pointer overflow-hidden relative">
                  {backDoc ? (
                    <div className="relative w-full h-full">
                      <img src={backDoc} alt="Kimlik Arka Yüz" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Upload size={14} /> Değiştir
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                      <Upload size={16} />
                      <span>Kimlik Arka Yüz Yükle (İsteğe Bağlı)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f6465d]/10 border border-[#f6465d]/20 text-xs font-semibold text-[#f6465d]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0ecb81]/10 border border-[#0ecb81]/20 text-xs font-semibold text-[#0ecb81]">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-black text-black cursor-pointer shadow-lg transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
              >
                {loading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {t.submitKYCBtn}
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
