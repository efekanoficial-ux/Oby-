import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, Trash2, Camera, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfilePhotoModalProps {
  show: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
];

export function ProfilePhotoModal({ show, onClose }: ProfilePhotoModalProps) {
  const { currentUser, updateProfilePhoto } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentUser?.photoURL ?? "");
  const [urlInput, setUrlInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tab, setTab] = useState<"upload" | "presets" | "url">("upload");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  // Process uploaded image file into compressed Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Dosya boyutu çok yüksek (Maksimum 10MB).");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 250x250 canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedPhoto(dataUrl);
        }
        setLoading(false);
      };
      img.onerror = () => {
        setErrorMsg("Resim yüklenirken hata oluştu.");
        setLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");

    const photoToSave = tab === "url" && urlInput.trim() ? urlInput.trim() : selectedPhoto;

    const res = await updateProfilePhoto(photoToSave);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || "Kaydedilemedi.");
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setSelectedPhoto("");
    setUrlInput("");
    const res = await updateProfilePhoto("");
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || "Silinemedi.");
    }
  };

  const initials = currentUser
    ? `${currentUser.name.charAt(0)}${currentUser.surname.charAt(0)}`.toUpperCase()
    : "OB";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: "#111115" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-[#FF6B00]" />
              <h3 className="text-base font-black text-white">Profil Fotoğrafı</h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Current / Selected Preview Circle */}
          <div className="flex flex-col items-center my-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-2 border-[#FF6B00]/40 shadow-lg"
                 style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
              {selectedPhoto ? (
                <img src={selectedPhoto} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-black">{initials}</span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-white/40">
              {selectedPhoto ? "Seçilen Fotoğraf Önizlemesi" : "Baş Harfleriniz Kullanılıyor"}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1 mb-4">
            <button
              onClick={() => setTab("upload")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                tab === "upload" ? "bg-[#FF6B00] text-black shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <Upload size={12} />
              <span>Yükle</span>
            </button>

            <button
              onClick={() => setTab("presets")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                tab === "presets" ? "bg-[#FF6B00] text-black shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <ImageIcon size={12} />
              <span>Hazır</span>
            </button>

            <button
              onClick={() => setTab("url")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                tab === "url" ? "bg-[#FF6B00] text-black shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <LinkIcon size={12} />
              <span>URL</span>
            </button>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Tab Contents */}
          <div className="min-h-[110px] flex flex-col justify-center">
            {tab === "upload" && (
              <div className="flex flex-col items-center justify-center py-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl px-5 py-3 bg-white/5 border border-white/10 hover:border-[#FF6B00]/50 text-white font-bold text-xs transition-colors"
                >
                  <Upload size={15} className="text-[#FF6B00]" />
                  <span>Cihazından Resim Seç</span>
                </motion.button>
                <p className="mt-2 text-[10px] text-white/30 text-center">
                  PNG, JPG veya WEBP (Otomatik boyutlandırılır)
                </p>
              </div>
            )}

            {tab === "presets" && (
              <div className="grid grid-cols-4 gap-2.5 py-1">
                {PRESET_AVATARS.map((url, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setSelectedPhoto(url); setUrlInput(""); }}
                    className={`relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all ${
                      selectedPhoto === url ? "border-[#FF6B00] scale-105 shadow-md" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="h-full w-full object-cover" />
                    {selectedPhoto === url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check size={14} className="text-[#FF6B00]" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {tab === "url" && (
              <div className="flex flex-col gap-2 py-1">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (e.target.value.trim()) setSelectedPhoto(e.target.value.trim());
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00]"
                />
                <p className="text-[10px] text-white/30">
                  Herhangi bir doğrudan görsel URL adresini yapıştırabilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-2 pt-3 border-t border-white/5">
            {currentUser?.photoURL && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Fotoğrafı Kaldır"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-black transition-transform active:scale-98 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
            >
              {loading ? (
                <span>Kaydediliyor...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Profil Fotoğrafını Kaydet</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
