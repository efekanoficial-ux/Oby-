import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, MoveVertical, TrendingUp, Palette } from "lucide-react";
import type { DrawingItem, DrawingType } from "@/types/drawing";

interface Props {
  show: boolean;
  onClose: () => void;
  drawings: DrawingItem[];
  onAddDrawing: (item: Omit<DrawingItem, "id">) => void;
  onRemoveDrawing: (id: string) => void;
  onClearAll: () => void;
  currentPrice: number;
}

const COLORS = [
  { label: "Sarı",    value: "#FFD700" },
  { label: "Cyan",    value: "#00E5FF" },
  { label: "Yeşil",   value: "#00E676" },
  { label: "Kırmızı", value: "#FF3366" },
  { label: "Turuncu", value: "#FF9100" },
  { label: "Beyaz",   value: "#FFFFFF" },
  { label: "Mor",     value: "#B388FF" },
];

export function DrawingToolsModal({
  show,
  onClose,
  drawings,
  onAddDrawing,
  onRemoveDrawing,
  onClearAll,
  currentPrice,
}: Props) {
  const [selectedType, setSelectedType] = useState<DrawingType>("horizontal");
  const [selectedColor, setSelectedColor] = useState<string>("#FFD700");
  const [selectedWidth, setSelectedWidth] = useState<number>(2);
  const [isDashed, setIsDashed] = useState<boolean>(false);

  if (!show) return null;

  const handleAdd = () => {
    const nowSec = Math.floor(Date.now() / 1000);
    if (selectedType === "horizontal") {
      onAddDrawing({
        type: "horizontal",
        price: currentPrice,
        color: selectedColor,
        width: selectedWidth,
        dashed: isDashed,
      });
    } else if (selectedType === "vertical") {
      onAddDrawing({
        type: "vertical",
        time: nowSec,
        color: selectedColor,
        width: selectedWidth,
        dashed: isDashed,
      });
    } else if (selectedType === "trend") {
      // 2 points across the recent 60 seconds
      const p1 = { time: nowSec - 90, price: currentPrice * 0.9992 };
      const p2 = { time: nowSec,      price: currentPrice * 1.0008 };
      onAddDrawing({
        type: "trend",
        p1,
        p2,
        color: selectedColor,
        width: selectedWidth,
        dashed: isDashed,
      });
    }
  };

  const toolTypes: { type: DrawingType; title: string; subtitle: string; icon: typeof Minus }[] = [
    {
      type: "horizontal",
      title: "Yatay Çizgi",
      subtitle: "Destek ve Direnç seviyeleri",
      icon: Minus,
    },
    {
      type: "vertical",
      title: "Dikey Çizgi",
      subtitle: "Zaman ve kırılım işareti",
      icon: MoveVertical,
    },
    {
      type: "trend",
      title: "Çapraz Çizgi (Trend)",
      subtitle: "Trend kanalları ve eğik çizgiler",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[#121318] text-white shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Çizim Araçları</h2>
            <p className="text-[11px] text-white/40">Grafik analiz ve teknik çizimler</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tool Selection Cards */}
          <div>
            <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Çizgi Tipi Seçin
            </label>
            <div className="grid grid-cols-3 gap-2">
              {toolTypes.map((t) => {
                const isSelected = selectedType === t.type;
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-[#FF6B00]/15 border-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/10"
                        : "bg-white/3 border-white/8 hover:border-white/20 text-white/70"
                    }`}
                  >
                    <Icon size={20} className={isSelected ? "text-[#FF6B00]" : "text-white/60"} />
                    <span className="text-[11px] font-bold mt-1.5 leading-tight">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Style Customization */}
          <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-3">
            {/* Colors */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-white/60 flex items-center gap-1.5">
                  <Palette size={13} /> Çizgi Rengi
                </span>
              </div>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedColor(c.value)}
                    className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                      selectedColor === c.value ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#121318]" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ background: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Thickness & Style */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/6">
              <div>
                <span className="text-[10px] font-semibold text-white/50 block mb-1.5">Kalınlık</span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWidth(w)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                        selectedWidth === w ? "bg-white/20 text-white" : "text-white/40 hover:text-white/80"
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-white/50 block mb-1.5">Stil</span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setIsDashed(false)}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                      !isDashed ? "bg-white/20 text-white" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    Düz
                  </button>
                  <button
                    onClick={() => setIsDashed(true)}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                      isDashed ? "bg-white/20 text-white" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    Kesikli
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] shadow-lg shadow-[#FF6B00]/25 transition-all"
          >
            <Plus size={15} />
            <span>Grafiğe {toolTypes.find(t => t.type === selectedType)?.title} Ekle</span>
          </motion.button>

          {/* Active Drawings List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                Grafikteki Çizimler ({drawings.length})
              </span>
              {drawings.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] font-semibold text-[#FF3366] hover:underline flex items-center gap-1"
                >
                  <Trash2 size={11} /> Tümünü Temizle
                </button>
              )}
            </div>

            {drawings.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                <p className="text-xs text-white/40">Henüz grafiğe çizgi eklenmedi.</p>
                <p className="text-[10px] text-white/25 mt-0.5">Yukarıdan bir çizgi tipi seçip grafiğe ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {drawings.map((d, index) => {
                  const typeLabel =
                    d.type === "horizontal"
                      ? "Yatay Çizgi"
                      : d.type === "vertical"
                      ? "Dikey Çizgi"
                      : "Çapraz Çizgi (Trend)";
                  const detail =
                    d.type === "horizontal" && d.price
                      ? `$${d.price.toFixed(2)}`
                      : d.type === "vertical" && d.time
                      ? new Date(d.time * 1000).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "2 Noktalı";

                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 border border-white/6"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ background: d.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {typeLabel} <span className="text-[10px] text-white/40 font-normal">#{index + 1}</span>
                          </p>
                          <p className="text-[10px] text-white/50">{detail}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveDrawing(d.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-[#FF3366]/20 text-white/40 hover:text-[#FF3366] transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
