import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

const oldStats = `{/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-[#111]">
        {[
          { label: "Toplam Kullanıcı", value: users.length,                     icon: Users,      color: "#627EEA" },
          { label: "Bekleyen İstek",   value: pendingCount,                     icon: Clock,      color: "#FFB800" },
          { label: "Toplam Yatırım",   value: \`$\${totalDeposited.toFixed(0)}\`,  icon: TrendingUp, color: "#0ecb81" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-col gap-1 rounded-2xl p-3"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color: s.color }} />
                <span className="text-[9px] font-bold text-white/30 uppercase">{s.label}</span>
              </div>
              <span className="text-lg font-black" style={{ color: s.color }}>{s.value}</span>
            </div>
          );
        })}
      </div>`;

const newStats = `{/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-[#111]">
        {[
          { label: "Toplam Kullanıcı", value: users.length,                     icon: Users,      color: "#627EEA" },
          { label: "Bekleyen İstek",   value: pendingCount,                     icon: Clock,      color: "#FFB800" },
          { label: "Toplam Yatırım",   value: \`$\${totalDeposited.toFixed(0)}\`,  icon: TrendingUp, color: "#0ecb81" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-col gap-1 rounded-2xl p-3 relative group"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} style={{ color: s.color }} />
                  <span className="text-[9px] font-bold text-white/30 uppercase">{s.label}</span>
                </div>
                {s.label === "Toplam Yatırım" && (
                  <button
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
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <span className="text-lg font-black truncate" style={{ color: s.color }}>{s.value}</span>
            </div>
          );
        })}
      </div>`;

content = content.replace(oldStats, newStats);

fs.writeFileSync("src/pages/admin.tsx", content);
