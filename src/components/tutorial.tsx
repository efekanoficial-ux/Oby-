import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Wallet } from "lucide-react";
import { t } from "@/i18n";
import { AssetIcon } from "@/lib/asset-icons";

const css = `
@keyframes tut-spin-slow { to { transform: rotate(360deg); } }
@keyframes tut-spin-fast { to { transform: rotate(360deg); } }
@keyframes tut-pulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:0; transform:scale(1.55); } }
@keyframes tut-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
@keyframes tut-bob-up { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
@keyframes tut-bob-down { 0%,100% { transform:translateY(0); } 50% { transform:translateY(5px); } }
@keyframes tut-blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }
@keyframes tut-glow { 0%,100% { box-shadow:0 0 0 0 #FF6B0055; } 50% { box-shadow:0 0 0 12px #FF6B0000; } }
`;

/* ─── Illustrations ──────────────────────────────────────────────────────── */

const TUTORIAL_ASSETS = [
  { label: "Crypto IDX",         flag: "₿",      payout: 90, color: "#F7931A", price: "6,850.25" },
  { label: "AUD/USD",            flag: "🇦🇺🇺🇸", payout: 86, color: "#0084C7", price: "0.66000" },
  { label: "AUD/JPY",            flag: "🇦🇺🇯🇵", payout: 86, color: "#BC002D", price: "97.200"  },
  { label: "AUD/CAD",            flag: "🇦🇺🇨🇦", payout: 85, color: "#D4202C", price: "0.90800" },
  { label: "CAD/CHF",            flag: "🇨🇦🇨🇭", payout: 85, color: "#FF0000", price: "0.60800" },
  { label: "AUD/CHF",            flag: "🇦🇺🇨🇭", payout: 85, color: "#E84142", price: "0.55200" },
];

function IllustrationAsset() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setSelected(s => (s + 1) % TUTORIAL_ASSETS.length), 2200);
    return () => clearInterval(iv);
  }, []);

  const sel = TUTORIAL_ASSETS[selected];

  return (
    <div className="relative w-full h-full flex flex-col py-3 gap-3">
      <style>{css}</style>
      <div className="absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at 50% 40%,#FF6B0018 0%,transparent 70%)" }} />

      {/* Top hint */}
      <div className="flex justify-center relative z-10">
        <motion.div
          animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5"
          style={{ background: "rgba(255,107,0,0.13)", border: "1px solid rgba(255,107,0,0.28)" }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#FF6B00" }}>{t.tutAssetHint}</span>
        </motion.div>
      </div>

      {/* Asset bar — mimics real UI */}
      <div className="flex gap-2 px-3 overflow-x-hidden relative z-10">
        {TUTORIAL_ASSETS.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => setSelected(i)}
            animate={{
              scale: i === selected ? 1.06 : 0.93,
              opacity: i === selected ? 1 : 0.45,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              flexShrink: 0,
              borderRadius: 14,
              padding: "7px 11px",
              background: i === selected ? `${a.color}22` : "rgba(255,255,255,0.03)",
              border: `1px solid ${i === selected ? a.color + "66" : "rgba(255,255,255,0.07)"}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              boxShadow: i === selected ? `0 4px 16px ${a.color}30` : "none",
              cursor: "pointer",
            }}>
            <AssetIcon label={a.label} size={22} />
            <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis" }}>{a.label}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: a.color }}>%{a.payout}</span>
          </motion.button>
        ))}
      </div>

      {/* Selected asset detail */}
      <div className="flex-1 flex items-center justify-center px-5 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            style={{
              width: "100%", maxWidth: 240,
              background: `${sel.color}12`,
              border: `1px solid ${sel.color}33`,
              borderRadius: 20,
              padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${sel.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <AssetIcon label={sel.label} size={36} glow />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sel.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)", marginTop: 2, fontFamily: "monospace" }}>{sel.price}</div>
              <div style={{
                marginTop: 7, display: "inline-flex", alignItems: "center", gap: 5,
                background: `${sel.color}22`, borderRadius: 8, padding: "3px 9px",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel.color, animation: "tut-pulse 1.8s ease-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: sel.color }}>%{sel.payout} Payout</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicator */}
      <div className="flex justify-center gap-1.5 relative z-10">
        {TUTORIAL_ASSETS.map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === selected ? 16 : 5, backgroundColor: i === selected ? sel.color : "#2a2a2a" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ height: 5, borderRadius: 99 }} />
        ))}
      </div>
    </div>
  );
}

function IllustrationAmount() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 rounded-2xl" style={{ background:"radial-gradient(ellipse at 50% 80%,#FFB80015 0%,transparent 70%)" }} />
      <div className="absolute left-6 bottom-10 flex flex-col-reverse gap-1">
        {[0,1,2,3].map(i => (
          <motion.div key={i} initial={{ x:-24, opacity:0 }} animate={{ x:0, opacity:1 }}
            transition={{ delay:i*0.08, type:"spring", stiffness:300, damping:24 }}
            style={{ width:44, height:11, borderRadius:99, background:i===3?"linear-gradient(90deg,#FFB800,#FF6B00)":"linear-gradient(90deg,#2a2a2a,#1a1a1a)", boxShadow:"0 2px 6px rgba(0,0,0,0.4)" }} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <span style={{ fontSize:52, lineHeight:1, animation:"tut-float 2.4s ease-in-out infinite", filter:"drop-shadow(0 0 20px #FFB80055)" }}>💰</span>
        <motion.div initial={{ width:0 }} animate={{ width:88 }} transition={{ delay:0.5, duration:0.5 }}
          className="rounded-full overflow-hidden h-2" style={{ background:"#1a1a1a" }}>
          <div className="h-full rounded-full" style={{ width:"75%", background:"linear-gradient(90deg,#FFB800,#FF6B00)" }} />
        </motion.div>
        <span className="text-xs font-black text-white/50">$50 → $92.50</span>
      </div>
      <div className="absolute right-4 bottom-10 flex items-end gap-1">
        {[40,60,48,75,58,90,72].map((h, i) => (
          <motion.div key={i} initial={{ scaleY:0 }} animate={{ scaleY:1 }}
            transition={{ delay:0.3+i*0.06, type:"spring", stiffness:300 }}
            className="rounded-t-sm origin-bottom"
            style={{ width:7, height:h*0.55, background:i===5?"linear-gradient(180deg,#FFB800,#FF6B00)":"#222" }} />
        ))}
      </div>
      {/* Location hint */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background:"rgba(255,184,0,0.12)", border:"1px solid rgba(255,184,0,0.2)" }}>
        <span style={{ fontSize:10, fontWeight:900, color:"#FFB800" }}>{t.tutAmountHint}</span>
      </div>
    </div>
  );
}

function IllustrationTime() {
  const R = 56, C = 70, circ = 2 * Math.PI * R;
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 rounded-2xl" style={{ background:"radial-gradient(ellipse at 50% 50%,#00e5cc15 0%,transparent 70%)" }} />
      <div className="relative" style={{ width:140, height:140 }}>
        <svg width="140" height="140" style={{ overflow:"visible" }}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="#1a1a1a" strokeWidth="8" />
          <motion.circle cx={C} cy={C} r={R} fill="none" stroke="#00e5cc" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * 0.28 }}
            transition={{ duration:1.8, ease:"easeOut", delay:0.3 }}
            style={{ transform:"rotate(-90deg)", transformOrigin:`${C}px ${C}px` }} />
          {Array.from({ length:12 }).map((_, i) => {
            const a=(i/12)*Math.PI*2-Math.PI/2, r1=R-10, r2=R-4;
            return <line key={i} x1={C+r1*Math.cos(a)} y1={C+r1*Math.sin(a)} x2={C+r2*Math.cos(a)} y2={C+r2*Math.sin(a)} stroke={i%3===0?"#444":"#252525"} strokeWidth={i%3===0?2:1}/>;
          })}
          <g style={{ transformOrigin:`${C}px ${C}px`, animation:"tut-spin-slow 6s linear infinite" }}>
            <line x1={C} y1={C} x2={C} y2={C-R+14} stroke="white" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g style={{ transformOrigin:`${C}px ${C}px`, animation:"tut-spin-fast 1.2s linear infinite" }}>
            <line x1={C} y1={C} x2={C+R-10} y2={C} stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" />
          </g>
          <circle cx={C} cy={C} r="4" fill="#00e5cc" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center" style={{ color:"#00e5cc", fontSize:10, fontWeight:900, letterSpacing:"0.15em", animation:"tut-blink 1.5s ease-in-out infinite" }}>CANLI</div>
      </div>
      {[["5sn",true],["1dk",false],["5dk",false]].map(([t, active], i) => (
        <motion.div key={String(t)} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9+i*0.12 }}
          className="absolute rounded-lg px-2.5 py-1 text-[10px] font-black"
          style={{ background:active?"linear-gradient(135deg,#00e5cc,#00b3a0)":"#1a1a1a", color:active?"#000":"#444", bottom:i===0?14:i===1?6:14, left:i===0?6:undefined, right:i===2?6:undefined }}>
          {String(t)}
        </motion.div>
      ))}
    </div>
  );
}

function IllustrationDirection() {
  const upBars   = [38,52,46,60,68,78,88];
  const downBars = [88,78,70,63,52,44,30];
  return (
    <div className="relative w-full h-full flex items-stretch gap-2 px-2 py-4">
      <div className="relative flex-1 rounded-xl overflow-hidden flex flex-col items-center justify-end pb-4 gap-2"
        style={{ background:"rgba(14,203,129,0.05)", border:"1px solid rgba(14,203,129,0.14)" }}>
        <div className="flex items-end gap-0.5 h-14">
          {upBars.map((h, i) => (
            <motion.div key={i} initial={{ scaleY:0 }} animate={{ scaleY:1 }}
              transition={{ delay:0.15+i*0.05, type:"spring", stiffness:280 }}
              className="rounded-t-sm origin-bottom"
              style={{ width:9, height:`${h}%`, background:i<4?"#0ecb8135":"linear-gradient(180deg,#0ecb81,#05a660)" }} />
          ))}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background:"linear-gradient(135deg,#05a660,#0ecb81)", boxShadow:"0 4px 14px rgba(14,203,129,0.38)", animation:"tut-bob-up 1.6s ease-in-out infinite" }}>
          <span style={{ fontSize:20 }}>↑</span>
        </div>
        <span className="text-xs font-black text-[#0ecb81]">{t.tutDirUp}</span>
      </div>
      <div className="relative flex-1 rounded-xl overflow-hidden flex flex-col items-center justify-end pb-4 gap-2"
        style={{ background:"rgba(246,70,93,0.05)", border:"1px solid rgba(246,70,93,0.14)" }}>
        <div className="flex items-end gap-0.5 h-14">
          {downBars.map((h, i) => (
            <motion.div key={i} initial={{ scaleY:0 }} animate={{ scaleY:1 }}
              transition={{ delay:0.15+i*0.05, type:"spring", stiffness:280 }}
              className="rounded-t-sm origin-bottom"
              style={{ width:9, height:`${h}%`, background:i>=3?"linear-gradient(180deg,#f6465d,#c0283e)":"#f6465d35" }} />
          ))}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background:"linear-gradient(135deg,#c0283e,#f6465d)", boxShadow:"0 4px 14px rgba(246,70,93,0.38)", animation:"tut-bob-down 1.6s ease-in-out infinite" }}>
          <span style={{ fontSize:20 }}>↓</span>
        </div>
        <span className="text-xs font-black text-[#f6465d]">{t.tutDirDown}</span>
      </div>
      {/* Location indicator */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background:"rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.4)" }}>{t.tutDirHint}</span>
        </div>
      </div>
    </div>
  );
}

function IllustrationChart() {
  const candles = [
    {o:52,c:68,h:74,l:48,up:true},{o:68,c:60,h:72,l:57,up:false},
    {o:60,c:76,h:81,l:58,up:true},{o:76,c:70,h:80,l:67,up:false},
    {o:70,c:84,h:89,l:68,up:true},{o:84,c:78,h:87,l:75,up:false},
    {o:78,c:90,h:94,l:76,up:true},
  ];
  const H=86, min=38, max=100, range=max-min;
  const sc = (v:number) => H-((v-min)/range)*H;
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 rounded-2xl" style={{ background:"radial-gradient(ellipse at 50% 30%,#FF6B0010 0%,transparent 70%)" }} />
      <div className="relative" style={{ width:"88%", maxWidth:270 }}>
        <svg width="100%" height={H+24} style={{ overflow:"visible" }}>
          {[0,1,2,3].map(i=>(<line key={i} x1="0" y1={H*i/3} x2="100%" y2={H*i/3} stroke="#1a1a1a" strokeWidth="1"/>))}
          {candles.map((cd,i)=>{
            const x=16+i*30, bTop=sc(Math.max(cd.o,cd.c)), bBot=sc(Math.min(cd.o,cd.c)), bH=Math.max(3,bBot-bTop), col=cd.up?"#0ecb81":"#f6465d";
            return (
              <motion.g key={i} initial={{opacity:0,scaleY:0}} animate={{opacity:1,scaleY:1}} style={{transformOrigin:`${x}px ${H}px`}} transition={{delay:0.1+i*0.09,type:"spring",stiffness:260,damping:22}}>
                <line x1={x} y1={sc(cd.h)} x2={x} y2={sc(cd.l)} stroke={col} strokeWidth="1.5"/>
                <rect x={x-7} y={bTop} width="14" height={bH} rx="2" fill={col} fillOpacity="0.9"/>
              </motion.g>
            );
          })}
          <motion.line x1="96" y1="0" x2="96" y2={H} stroke="#0ecb81" strokeWidth="1.5" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.85,duration:0.35}}/>
          <motion.line x1="192" y1="0" x2="192" y2={H} stroke="#FF6B00" strokeWidth="1.5" strokeDasharray="4 3" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.1,duration:0.35}}/>
          <defs>
            <pattern id="hatch2" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#FF6B00" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <motion.rect x="96" y="0" width="96" height={H} fill="url(#hatch2)" initial={{opacity:0}} animate={{opacity:0.22}} transition={{delay:1.2,duration:0.35}}/>
          <motion.text x="96" y="-5" textAnchor="middle" fill="#0ecb81" fontSize="9" fontWeight="900" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.95}}>{t.tutEntryLabel}</motion.text>
          <motion.text x="192" y="-5" textAnchor="middle" fill="#FF6B00" fontSize="9" fontWeight="900" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}>{t.tutExpiryLabel}</motion.text>
        </svg>
      </div>
    </div>
  );
}

/* ─── NEW: Deposit illustration ──────────────────────────────────────────── */
function IllustrationDeposit() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style>{css}</style>
      <div className="absolute inset-0 rounded-2xl" style={{ background:"radial-gradient(ellipse at 50% 50%,#FF6B0018 0%,transparent 70%)" }} />

      {/* Phone mockup */}
      <div className="relative" style={{ width:160, height:260 }}>
        <div style={{ width:"100%", height:"100%", borderRadius:24, border:"2px solid #2a2a2a", background:"#080808", overflow:"hidden", position:"relative" }}>
          {/* Header bar */}
          <div style={{ height:40, background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:22, height:22, borderRadius:6, background:"#FF6B00", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#000" }}>O</div>
              <div>
                <div style={{ fontSize:8, fontWeight:900, color:"#fff" }}>Obyo</div>
                <div style={{ fontSize:7, color:"#FFB800", fontWeight:700 }}>$10,000</div>
              </div>
            </div>
            {/* Wallet button — highlighted */}
            <motion.div
              animate={{ boxShadow: ["0 0 0 0px rgba(255,107,0,0.6)","0 0 0 6px rgba(255,107,0,0)"] }}
              transition={{ duration:1.4, repeat:Infinity }}
              style={{ width:26, height:26, borderRadius:8, background:"#FF6B00", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Wallet size={13} color="#000" />
            </motion.div>
          </div>

          {/* Chart area */}
          <div style={{ height:110, background:"#040404", position:"relative", overflow:"hidden" }}>
            {[0,1,2,3,4,5,6].map(i => {
              const h = [30,45,35,55,40,60,50][i];
              const up = i % 2 === 0;
              return (
                <div key={i} style={{ position:"absolute", left:8+i*20, bottom:8, width:10, height:h, background:up?"#0ecb81":"#f6465d", borderRadius:2 }} />
              );
            })}
          </div>

          {/* Buttons area */}
          <div style={{ display:"flex", gap:6, padding:"8px" }}>
            <div style={{ flex:1, height:28, background:"#0ecb81", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"#000" }}>↑ YUKARI</div>
            <div style={{ flex:1, height:28, background:"#f6465d", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"#fff" }}>↓ AŞAĞI</div>
          </div>

          {/* Bottom nav */}
          <div style={{ height:40, borderTop:"1px solid #1a1a1a", display:"flex", alignItems:"center", justifyContent:"space-around" }}>
            {[t.tutNavHistory, t.tutNavTrade, t.tutNavBalance, t.navVip].map((l,i) => (
              <div key={l} style={{ fontSize:7, fontWeight:700, color:i===1?"#FF6B00":"#333" }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Arrow label pointing to wallet button */}
        <motion.div
          animate={{ x:[0,5,0] }} transition={{ duration:1.2, repeat:Infinity }}
          style={{ position:"absolute", top:8, right:-85, display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ background:"rgba(255,107,0,0.12)", border:"1px solid rgba(255,107,0,0.3)", borderRadius:8, padding:"4px 8px" }}>
            <div style={{ fontSize:9, fontWeight:900, color:"#FF6B00", whiteSpace:"nowrap" }}>{t.tutDepositLabel}</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>{t.tutDepositSub}</div>
          </div>
          <span style={{ color:"#FF6B00", fontSize:16 }}>←</span>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */
const STEPS = [
  { id:1, color:"#FF6B00", bg:"linear-gradient(160deg,#120800 0%,#000 100%)",
    title:t.tut1Title, subtitle:t.tut1Sub, body:t.tut1Body, tip:t.tut1Tip,
    illustration:<IllustrationAsset/> },
  { id:2, color:"#FFB800", bg:"linear-gradient(160deg,#120a00 0%,#000 100%)",
    title:t.tut2Title, subtitle:t.tut2Sub, body:t.tut2Body, tip:t.tut2Tip,
    illustration:<IllustrationAmount/> },
  { id:3, color:"#00e5cc", bg:"linear-gradient(160deg,#001210 0%,#000 100%)",
    title:t.tut3Title, subtitle:t.tut3Sub, body:t.tut3Body, tip:t.tut3Tip,
    illustration:<IllustrationTime/> },
  { id:4, color:"#0ecb81", bg:"linear-gradient(160deg,#001a0a 0%,#000 100%)",
    title:t.tut4Title, subtitle:t.tut4Sub, body:t.tut4Body, tip:t.tut4Tip,
    illustration:<IllustrationDirection/> },
  { id:5, color:"#FF6B00", bg:"linear-gradient(160deg,#120500 0%,#000 100%)",
    title:t.tut5Title, subtitle:t.tut5Sub, body:t.tut5Body, tip:t.tut5Tip,
    illustration:<IllustrationDeposit/> },
  { id:6, color:"#FF6B00", bg:"linear-gradient(160deg,#0d0500 0%,#000 100%)",
    title:t.tut6Title, subtitle:t.tut6Sub, body:t.tut6Body, tip:t.tut6Tip,
    illustration:<IllustrationChart/> },
];

export function Tutorial() {
  return null;
}
