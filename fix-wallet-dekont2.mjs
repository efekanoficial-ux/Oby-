import fs from "fs";
let content = fs.readFileSync("src/pages/wallet.tsx", "utf-8");

const oldCode = `                      {req.receiptUrl && (
                        <div className="mb-2.5 p-3 rounded-xl bg-[#0ecb81]/[0.08] border border-[#0ecb81]/25 flex items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={15} className="text-[#0ecb81] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-white/35 uppercase block">Havale / EFT Dekontu</span>
                              <span className="text-xs text-white/80 font-medium truncate block max-w-[170px]">
                                {req.receiptName || "Dekont Belgesi"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptModal({ url: req.receiptUrl!, name: req.receiptName || "Havale Dekontu" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ecb81]/15 hover:bg-[#0ecb81]/25 text-[#0ecb81] text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            <Eye size={13} />
                            <span>Dekontu İncele</span>
                          </button>
                        </div>
                      )}`;

content = content.replace(oldCode, "");

fs.writeFileSync("src/pages/wallet.tsx", content);
