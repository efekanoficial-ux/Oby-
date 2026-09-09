import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, X, Upload, CheckCircle2, AlertCircle, FileText, UserCheck, Calendar, IdCard } from "lucide-react";

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

  const isVerified = currentUser?.kycStatus === "verified" || currentUser?.kycStatus === "approved";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-[#0f0f0f] border border-white/10 shadow-2xl text-white scrollbar-none"
        >
          {/* Header (Clean & Minimal) */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div>
              <h3 className="text-sm font-bold text-white/90">{t.kycTitle}</h3>
              <p className="text-[11px] text-white/40">
                {isVerified ? t.kycVerified : t.kycNotVerified}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {isVerified ? (
            /* Already Verified View (Monochrome Design) */
            <div className="flex flex-col items-center text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white border border-white/20 shadow-inner mb-4"
              >
                <CheckCircle2 size={36} />
              </motion.div>

              <h4 className="text-base font-bold text-white mb-1.5">
                Hesabınız Doğrulanmıştır
              </h4>
              <p className="text-xs text-white/40 leading-relaxed mb-6 max-w-xs">
                Kimlik bilgileriniz sistem tarafından onaylandı. Tüm para çekme ve yatırma işlemlerinizi gerçekleştirebilirsiniz.
              </p>

              <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Ad Soyad</span>
                  <span className="font-bold text-white/90">{currentUser?.kycDetails?.fullName || `${currentUser?.name} ${currentUser?.surname}`}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-white/40">Doğrulama Durumu</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <CheckCircle2 size={12} /> Onaylandı
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-xs text-black bg-white hover:bg-white/90 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          ) : (
            /* KYC Form View (Monochrome Design) */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white/70 leading-relaxed">
                <p className="font-bold text-white mb-0.5">Otomatik kimlik doğrulama sistemi</p>
                Bilgilerinizle kimliğiniz eşleştiğinde onaylanır.
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={12} className="text-white/40" />
                  {t.fullNameLabel}
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full rounded-xl bg-[#161616] border border-white/10 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/40" />
                  Doğum Tarihi
                </label>
                <input
                  required
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl bg-[#161616] border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* ID / TC Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  <IdCard size={12} className="text-white/40" />
                  {t.idNumberLabel}
                </label>
                <input
                  required
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="12345678901"
                  className="w-full rounded-xl bg-[#161616] border border-white/10 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* Document Front Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} className="text-white/40" />
                  {t.uploadFrontDoc} *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 rounded-2xl border border-dashed border-white/15 hover:border-white/35 bg-[#161616] hover:bg-[#1a1a1a] transition-all cursor-pointer overflow-hidden relative">
                  {frontDoc ? (
                    <div className="relative w-full h-full">
                      <img src={frontDoc} alt="Kimlik Ön Yüz" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold text-white gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Upload size={14} /> Değiştir
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <Upload size={20} className="text-white/50 mb-1.5" />
                      <span className="text-xs font-semibold text-white/80">Kimlik Ön Yüz Görseli Yükleyin</span>
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
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} className="text-white/25" />
                  {t.uploadBackDoc}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-20 rounded-2xl border border-dashed border-white/10 hover:border-white/25 bg-[#161616] hover:bg-[#1a1a1a] transition-all cursor-pointer overflow-hidden relative">
                  {backDoc ? (
                    <div className="relative w-full h-full">
                      <img src={backDoc} alt="Kimlik Arka Yüz" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold text-white gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Upload size={14} /> Değiştir
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/35 text-xs font-medium">
                      <Upload size={15} />
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
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button (Renksiz / Monochrome High-Contrast) */}
              <motion.button
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-white/90 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
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
