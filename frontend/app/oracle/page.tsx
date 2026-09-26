"use client";

import { useState, useEffect } from "react";

interface AttackData {
  block: number;
  type: string;
  bot: string;
  victim?: string;
  profit_native: number;
  profit_usd: number;
  entryTX: string;
  victimTX?: string;
  exitTX: string;
  blocks_span?: number;
}

interface PoolData {
  pool: { id: string; name: string; label: string; startBlock: number; nativeSymbol: string };
  swaps: { total: number; buys: number; sells: number; traders: number };
  mev: {
    attacks_detected: number;
    sandwich: number;
    cross_block: number;
    bots: number;
    leaderboard: Array<{ address: string; type: string; attacks: number; profit_native: string; profit_usd: string }>;
    attack_samples: AttackData[];
  };
  losses: { total_mev_native: string; total_mev_usd: string; total_recoverable_native: string; total_recoverable_usd: string; estimated_annual_usd: string };
}

interface OracleData {
  status: string;
  last_block: number;
  timestamp: string;
  scan_blocks: number;
  summary: { total_swaps: number; total_attacks: number; total_bots: number; total_mev_usd: string; total_recoverable_usd: string };
  pools: PoolData[];
  report_generated: string;
}

export default function OraclePage() {
  const [data, setData] = useState<OracleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"losses" | "conclusions" | "report" | "forecast">("losses");
  const [selectedPool, setSelectedPool] = useState<number>(0);

  useEffect(() => {
    fetchOracle();
    const interval = setInterval(fetchOracle, 120000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOracle() {
    try {
      const res = await fetch("/api/oracle");
      if (res.ok) { setData(await res.json()); setLastUpdate(new Date()); }
    } catch {} finally { setLoading(false); }
  }

  const t = (a: string) => `${a.substring(0, 6)}...${a.substring(38)}`;
  const txL = (h: string) => `https://etherscan.io/tx/${h}`;
  const adL = (a: string) => `https://etherscan.io/address/${a}`;

  if (loading) return <div className="terminal-panel p-6 border-glow border-[#00ff41]"><div className="text-center text-[#00ff4160] animate-pulse">[SCANNING IMD POOLS FROM CREATION...]</div></div>;
  if (!data) return null;

  const s = data.summary;
  const pool = data.pools[selectedPool];

  return (
    <div className="space-y-3 fade-in">
      <div className="terminal-panel p-3 border-glow border-[#00ff41] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></div>
          <span className="text-[10px] tracking-widest text-[#00ff4160]">IMD POOL MONITOR — SINCE CREATION</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#00ff4160]">
          <span>Block #{data.last_block}</span><span>|</span>
          <span>{data.scan_blocks.toLocaleString()} blocks</span><span>|</span>
          <span>{lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}</span>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="terminal-panel p-4 border-glow border-[#ff0040] bg-[#ff004005]">
        <div className="text-center mb-3">
          <div className="text-[9px] tracking-widest text-[#ff004060] mb-1">EXECUTIVE SUMMARY</div>
          <div className="text-base text-[#ff0040] font-bold">
            IMD pools lost <span className="font-mono">${parseFloat(s.total_mev_usd).toLocaleString()}</span> to MEV bots
          </div>
          <div className="text-xs text-[#00ff41] mt-1">
            <span className="font-mono font-bold">${parseFloat(s.total_recoverable_usd).toLocaleString()}</span> recoverable with CappedBurnHook
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: s.total_swaps.toLocaleString(), l: "TOTAL SWAPS", c: "#ffb000" },
            { n: s.total_attacks, l: "MEV ATTACKS", c: "#ff0040" },
            { n: s.total_bots, l: "BOTS ACTIVE", c: "#ff0040" },
            { n: `$${parseFloat(s.total_recoverable_usd).toLocaleString()}`, l: "RECOVERABLE", c: "#00ff41" },
          ].map((item, i) => (
            <div key={i} className="p-2 bg-[#000000] border text-center" style={{ borderColor: item.c + "30" }}>
              <div className="text-lg font-mono font-bold" style={{ color: item.c }}>{item.n}</div>
              <div className="text-[8px]" style={{ color: item.c + "80" }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="terminal-panel p-1 border-glow border-[#00ff4140] flex">
            {data.pools.map((p, i) => (
              <button key={i} onClick={() => setSelectedPool(i)}
                className={`flex-1 py-1.5 text-[9px] tracking-wider transition-all ${
                  selectedPool === i ? "text-[#00ff41] bg-[#00ff4115] border-b border-[#00ff41]" : "text-[#00ff4160] hover:text-[#00ff4180]"
                }`}>
                {p.pool.name} — {p.pool.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { v: pool.swaps.total.toLocaleString(), l: "SWAPS", c: "#ffb000" },
              { v: pool.mev.attacks_detected, l: "ATTACKS", c: "#ff0040" },
              { v: pool.mev.sandwich, l: "SAME-BLOCK", c: "#ff0040" },
              { v: pool.mev.cross_block, l: "CROSS-BLOCK", c: "#ff0040" },
            ].map((item, i) => (
              <div key={i} className="terminal-panel p-2 border-glow" style={{ borderColor: item.c + "40" }}>
                <div className="text-[8px] mb-1" style={{ color: item.c + "80" }}>{item.l}</div>
                <div className="text-sm font-mono font-bold" style={{ color: item.c }}>{item.v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="terminal-panel p-2 border-glow border-[#ff004040]">
              <div className="text-[8px] text-[#ff004060] mb-1">MEV EXTRACTED</div>
              <div className="text-sm font-mono text-[#ff0040]">${parseFloat(pool.losses.total_mev_usd).toLocaleString()}</div>
              <div className="text-[8px] text-[#ff004060]">USD</div>
            </div>
            <div className="terminal-panel p-2 border-glow border-[#ff004040]">
              <div className="text-[8px] text-[#ff004060] mb-1">NATIVE VALUE</div>
              <div className="text-sm font-mono text-[#ffb000]">{pool.losses.total_mev_native} {pool.pool.nativeSymbol}</div>
              <div className="text-[8px] text-[#ff004060]">{pool.pool.nativeSymbol}</div>
            </div>
            <div className="terminal-panel p-2 border-glow border-[#00ff4140]">
              <div className="text-[8px] text-[#00ff4160] mb-1">RECOVERABLE</div>
              <div className="text-sm font-mono text-[#00ff41]">${parseFloat(pool.losses.total_recoverable_usd).toLocaleString()}</div>
              <div className="text-[8px] text-[#00ff4160]">USD (85%)</div>
            </div>
          </div>

          {pool.mev.leaderboard.length > 0 && (
            <div className="terminal-panel p-3 border-glow border-[#ff0040]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff0040] animate-pulse"></div>
                  <span className="text-[10px] tracking-widest text-[#ff0040]">MEV BOTS ON {pool.pool.name}</span>
                </div>
                <span className="text-[9px] text-[#ff004060]">{pool.mev.bots} bots</span>
              </div>
              <div className="space-y-1">
                {pool.mev.leaderboard.map((bot, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-[#ff004008] border-b border-[#ff004010]">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#ff004060] w-4">{i + 1}</span>
                      <a href={adL(bot.address)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#ff0040] font-mono hover:underline">{t(bot.address)}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-[#ffb000]">{bot.type}</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">{bot.attacks}</span>
                      <span className="text-[10px] text-[#ff0040] font-mono w-20 text-right">${bot.profit_usd}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pool.mev.attack_samples.length > 0 && (
            <div className="terminal-panel p-3 border-glow border-[#ff004040]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-widest text-[#ff0040]">ATTACKS LOG</span>
                <span className="text-[9px] text-[#ff004060]">{pool.mev.attack_samples.length} attacks</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {pool.mev.attack_samples.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 text-[9px] border-b border-[#ff004008] hover:bg-[#ff004005]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#ff004060] w-14">#{a.block}</span>
                      <span className="text-[#ffb000] w-16">{a.type}</span>
                      <a href={txL(a.entryTX)} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] font-mono hover:underline">{t(a.entryTX)}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#ff0040] font-mono">${a.profit_usd.toFixed(2)}</span>
                      <span className="text-[#00ff41] font-mono">${(a.profit_usd * 0.85).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 1/3 — TABS */}
        <div className="space-y-3">
          <div className="terminal-panel p-1 border-glow border-[#00ff4140] flex">
            {(["losses", "conclusions", "report", "forecast"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[9px] tracking-wider transition-all ${
                  activeTab === tab ? "text-[#00ff41] bg-[#00ff4115] border-b border-[#00ff41]" : "text-[#00ff4160] hover:text-[#00ff4180]"
                }`}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="terminal-panel p-3 border-glow border-[#00ff4140] min-h-[400px]">
            {activeTab === "losses" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">LOSS CALCULATIONS</div>
                <div className="space-y-2">
                  {data.pools.map((p, i) => (
                    <div key={i} className="p-2 bg-[#000000] border border-[#ff004020]">
                      <div className="text-[10px] text-[#ffb000] font-bold mb-1">{p.pool.name} ({p.pool.label})</div>
                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between"><span className="text-[#ff004060]">Sandwich</span><span className="text-[#ff0040] font-mono">{p.mev.sandwich}</span></div>
                        <div className="flex justify-between"><span className="text-[#ff004060]">Cross-block</span><span className="text-[#ff0040] font-mono">{p.mev.cross_block}</span></div>
                        <div className="flex justify-between"><span className="text-[#ff004060]">MEV</span><span className="text-[#ff0040] font-mono">${parseFloat(p.losses.total_mev_usd).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-[#00ff4160]">Recoverable</span><span className="text-[#00ff41] font-mono">${parseFloat(p.losses.total_recoverable_usd).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 bg-[#00ff4108] border border-[#00ff4120]">
                    <div className="text-[8px] text-[#00ff4160] mb-1">TOTAL RECOVERABLE</div>
                    <div className="text-sm text-[#00ff41] font-mono">${parseFloat(s.total_recoverable_usd).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "conclusions" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">CONCLUSIONS</div>
                <div className="p-2 bg-[#ff004008] border-l-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] font-bold">Standard Pool: {data.pools[1].mev.attacks_detected} Attack Patterns</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">ETH/USDT (no hook) in the scanned window. Detection only — no interception performed.</div>
                </div>
                <div className="p-2 bg-[#00ff4108] border-l-2 border-[#00ff41]">
                  <div className="text-[10px] text-[#00ff41] font-bold">IMD/ETH Hook Pool</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">{data.pools[0].mev.attacks_detected} patterns on CappedBurnHook pool. Pools differ in asset, volume and age — no controlled comparison is possible off-chain. Effectiveness requires Shadow Mode on mainnet.</div>
                </div>
                <div className="p-2 bg-[#ff004008] border-l-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] font-bold">Recoverable (Heuristic)</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">${parseFloat(s.total_recoverable_usd).toLocaleString()} estimated in scanned window (0.1% of min leg × 0.85). Theory — not yet recovered on-chain.</div>
                </div>
              </div>
            )}

            {activeTab === "report" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">ATTACK REPORT — {pool.pool.name}</div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto">
                  {pool.mev.attack_samples.map((a, i) => (
                    <div key={i} className="p-2 bg-[#000000] border border-[#ff004020] text-[9px]">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#ff0040]">{a.type}</span>
                        <span className="text-[#ff004060]">#{a.block}</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex gap-1"><span className="text-[#ff004060] w-12">Bot:</span><a href={adL(a.bot)} target="_blank" rel="noopener noreferrer" className="text-[#ff0040] font-mono hover:underline">{t(a.bot)}</a></div>
                        {a.victim && <div className="flex gap-1"><span className="text-[#ffb00060] w-12">Victim:</span><a href={adL(a.victim)} target="_blank" rel="noopener noreferrer" className="text-[#ffb000] font-mono hover:underline">{t(a.victim)}</a></div>}
                        <div className="flex gap-1"><span className="text-[#ff004060] w-12">Entry:</span><a href={txL(a.entryTX)} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] font-mono hover:underline">{t(a.entryTX)}</a></div>
                        <div className="flex gap-1"><span className="text-[#ff004060] w-12">Exit:</span><a href={txL(a.exitTX)} target="_blank" rel="noopener noreferrer" className="text-[#ff0040] font-mono hover:underline">{t(a.exitTX)}</a></div>
                        <div className="flex justify-between mt-1 pt-1 border-t border-[#ff004010]">
                          <span className="text-[#ff0040]">Lost: ${a.profit_usd.toFixed(2)}</span>
                          <span className="text-[#00ff41]">Recover: ${(a.profit_usd * 0.85).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">FORECAST</div>
                {data.pools.map((p, i) => (
                  <div key={i} className="p-2 bg-[#000000] border border-[#ff004020]">
                    <div className="text-[10px] text-[#ffb000] font-bold mb-1">{p.pool.name}</div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between"><span className="text-[#ff004060]">Attacks to date</span><span className="text-[#ff0040] font-mono">{p.mev.attacks_detected}</span></div>
                      <div className="flex justify-between"><span className="text-[#ff004060]">MEV to date</span><span className="text-[#ff0040] font-mono">${parseFloat(p.losses.total_mev_usd).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-[#ff004060]">Projected annual</span><span className="text-[#ff0040] font-mono">${parseFloat(p.losses.estimated_annual_usd).toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
                <div className="p-2 bg-[#00ff4108] border border-[#00ff4120]">
                  <div className="text-[8px] text-[#00ff4160] mb-1">OPTIMIZER IMPACT</div>
                  <div className="text-[9px] text-[#00ff4160]">With CappedBurnHook on both pools: recover <span className="text-[#00ff41] font-mono">${parseFloat(s.total_recoverable_usd).toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="terminal-panel p-2 border-glow border-[#00ff4120] flex items-center justify-between text-[8px] text-[#00ff4160]">
        <span>Optimizer Oracle v2.1 — IMD Pool Monitor | Ethereum Mainnet</span>
        <span>Generated: {data.report_generated}</span>
      </div>
    </div>
  );
}
