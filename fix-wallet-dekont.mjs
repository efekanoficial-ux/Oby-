import fs from "fs";
let content = fs.readFileSync("src/pages/wallet.tsx", "utf-8");

const oldCode = `                      {req.receiptUrl && (
                        <div className="flex justify-end mb-2.5">
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
