import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

const searchButtons = `                                  <X size={13} className="text-[#f6465d]" /> Reddet...
                                </motion.button>
                              </div>
                            </div>
                          )}`;

const replaceButtons = `                                  <X size={13} className="text-[#f6465d]" /> Reddet...
                                </motion.button>
                              </div>
                              <div className="flex justify-end mt-2">
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

content = content.replace(searchButtons, replaceButtons);

// Add deleteRequest to Auth hook extraction
content = content.replace(
  'processRequest, adminUpdateKYC, users' ,
  'processRequest, adminUpdateKYC, users, deleteRequest'
);

fs.writeFileSync("src/pages/admin.tsx", content);
