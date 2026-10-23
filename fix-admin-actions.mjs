import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

const oldResetStats = `                  <button
                    onClick={async () => {
                      if (confirm("Toplam Yatırım istatistiğini sıfırlamak için onaylanmış tüm yatırım taleplerini (geçmişi) silmek ister misiniz? (Kullanıcı bakiyeleri etkilenmez)")) {
                        const deposits = requests.filter(r => r.type === "deposit" && r.status === "accepted");
                        for (const d of deposits) {
                          await deleteRequest(d.id);
                        }
                      }
                    }}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-500 cursor-pointer p-1"
                    title="Sıfırla (Onaylanmış Yatırımları Sil)"
                  >`;

const newResetStats = `                  <button
                    onClick={() => setShowStatsResetConfirm(true)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-500 cursor-pointer p-1"
                    title="Sıfırla (Onaylanmış Yatırımları Sil)"
                  >`;

content = content.replace(oldResetStats, newResetStats);

const oldDeleteBtn = `                            <button
                              onClick={async () => {
                                if (confirm("Bu talebi veritabanından kalıcı olarak silmek istediğinize emin misiniz? (Tüm dekontlar silinir)")) {
                                  await deleteRequest(req.id);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-bold"
                            >
                              <Trash2 size={12} /> Talebi Sil
                            </button>`;

const newDeleteBtn = `                            <button
                              onClick={() => setReqToDelete(req.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-bold"
                            >
                              <Trash2 size={12} /> Talebi Sil
                            </button>`;

content = content.replace(oldDeleteBtn, newDeleteBtn);


const oldModalsEnd = `      {/* ── User Delete Confirmation Modal ──────────────────────────────── */}`;

const newModals = `      {/* ── Delete Request Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {reqToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-red-500/10 to-transparent">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <h3 className="text-base font-black text-white">Talebi Sil</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Bu talebi veritabanından kalıcı olarak silmek istediğinize emin misiniz? (Tüm dekontlar silinir)
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#111] flex items-center gap-2">
                <button
                  disabled={isDeletingReq}
                  onClick={() => setReqToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={isDeletingReq}
                  onClick={async () => {
                    setIsDeletingReq(true);
                    await deleteRequest(reqToDelete);
                    setIsDeletingReq(false);
                    setReqToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeletingReq ? <span className="animate-pulse">Siliniyor...</span> : <span>Evet, Sil</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Stats Reset Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showStatsResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-red-500/10 to-transparent">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <h3 className="text-base font-black text-white">İstatistiği Sıfırla</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Toplam Yatırım istatistiğini sıfırlamak için onaylanmış tüm yatırım taleplerini (geçmişi) silmek ister misiniz? <br/><br/>
                    <strong className="text-white/80">Not:</strong> Kullanıcı bakiyeleri etkilenmez.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#111] flex items-center gap-2">
                <button
                  disabled={isResettingStats}
                  onClick={() => setShowStatsResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={isResettingStats}
                  onClick={async () => {
                    setIsResettingStats(true);
                    const deposits = requests.filter(r => r.type === "deposit" && r.status === "accepted");
                    for (const d of deposits) {
                      await deleteRequest(d.id);
                    }
                    setIsResettingStats(false);
                    setShowStatsResetConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isResettingStats ? <span className="animate-pulse">Siliniyor...</span> : <span>Evet, Sıfırla</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── User Delete Confirmation Modal ──────────────────────────────── */}`;

content = content.replace(oldModalsEnd, newModals);

fs.writeFileSync("src/pages/admin.tsx", content);
