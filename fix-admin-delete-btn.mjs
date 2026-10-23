import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

const oldCode = `                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={async () => {
                                    if (confirm("Bu talebi veritabanından kalıcı olarak silmek istediğinize emin misiniz? (Tüm dekontlar silinir)")) {
                                      await deleteRequest(req.id);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-xs font-bold"
                                >
                                  <Trash2 size={12} /> Talebi Sil
                                </button>
                              </div>
                            </div>
                          )}`;

const newCode = `                            </div>
                          )}
                          
                          <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                            <button
                              onClick={async () => {
                                if (confirm("Bu talebi veritabanından kalıcı olarak silmek istediğinize emin misiniz? (Tüm dekontlar silinir)")) {
                                  await deleteRequest(req.id);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-bold"
                            >
                              <Trash2 size={12} /> Talebi Sil
                            </button>
                          </div>
`;

content = content.replace(oldCode, newCode);
fs.writeFileSync("src/pages/admin.tsx", content);
