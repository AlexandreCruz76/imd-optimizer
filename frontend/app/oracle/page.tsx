"use client";

import { useState, useEffect } from "react";

interface AttackData {
  block: number;
  type: string;
  bot: string;
  victim?: string;
  pool: string;
  profit_eth: number;
  victim_loss_eth: number;
  recoverable_eth: number;
  txHash: string;
  victim_txHash?: string;
  exit_txHash?: string;
  blocks_span?: number;
}

interface OracleData {
  status: string;
  last_block: number;
  timestamp: string;
  scan_blocks: number;
  summary: {
    total_swaps: number;
    unique_pools: number;
    unique_traders: number;
    unique_victims: number;
    unique_bots: number;
    scan_period_hours: string;
  };
  imd: { swaps: number; traders: number; top5: Array<{ addr: string; swaps: number }> };
  standard: { swaps: number; traders: number; top5: Array<{ addr: string; swaps: number }> };
  cross_pool: { shared_bots: number; addresses: string[] };
  mev: {
    attacks_detected: number;
    sandwich_attacks: number;
    cross_block_sandwiches: number;
    bots_detected: number;
    leaderboard: Array<{ address: string; type: string; attacks: number; estimated_profit_eth: string; pools_active: number }>;
    attack_samples: AttackData[];
  };
  losses: {
    total_mev_extracted_eth: string;
    total_victim_loss_eth: string;
    total_recoverable_eth: string;
    lp_fee_loss_eth: string;
    shieldable_value_eth: string;
    estimated_annual_loss_eth: string;
    estimated_annual_loss_usd: string;
    eth_price_usd: number;
  };
  recommendation: {
    action: string;
    priority: string;
    reason: string;
    shieldable_value_eth: string;
    recoverable_eth: string;
    hook_address: string;
  };
  report_generated: string;
}

export default function OraclePage() {
  const [data, setData] = useState<OracleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"losses" | "conclusions" | "report" | "forecast">("losses");

  useEffect(() => {
    fetchOracle();
    const interval = setInterval(fetchOracle, 60000);
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

  if (loading) return <div className="terminal-panel p-6 border-glow border-[#00ff41]"><div className="text-center text-[#00ff4160] animate-pulse">[SCANNING BLOCKCHAIN...]</div></div>;
  if (!data) return null;

  const p = data.losses;
  const ethUsd = p.eth_price_usd;
  const lossUsd = (parseFloat(p.total_victim_loss_eth) * ethUsd).toFixed(0);
  const recUsd = (parseFloat(p.total_recoverable_eth) * ethUsd).toFixed(0);
  const recPct = (parseFloat(p.total_recoverable_eth) / parseFloat(p.total_victim_loss_eth) * 100).toFixed(0);

  return (
    <div className="space-y-3 fade-in">
      {/* ═══ HEADER ═══ */}
      <div className="terminal-panel p-3 border-glow border-[#00ff41] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse"></div>
          <span className="text-[10px] tracking-widest text-[#00ff4160]">MEV THREAT INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#00ff4160]">
          <span>Block #{data.last_block}</span>
          <span>|</span>
          <span>{data.scan_blocks}b scanned</span>
          <span>|</span>
          <span>{lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}</span>
        </div>
      </div>

      {/* ═══ EXECUTIVE SUMMARY ═══ */}
      <div className="terminal-panel p-4 border-glow border-[#ff0040] bg-[#ff004005]">
        <div className="text-center mb-3">
          <div className="text-[9px] tracking-widest text-[#ff004060] mb-1">EXECUTIVE SUMMARY</div>
          <div className="text-base text-[#ff0040] font-bold">
            Without Optimizer, retail traders lost <span className="font-mono">${lossUsd}</span> in MEV attacks
          </div>
          <div className="text-xs text-[#00ff41] mt-1">
            Optimizer recovers <span className="font-mono font-bold">${recUsd}</span> ({recPct}%)
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { n: data.mev.attacks_detected, l: "ATTACKS", c: "#ff0040" },
            { n: data.mev.bots_detected, l: "BOTS", c: "#ff0040" },
            { n: data.summary.unique_victims, l: "VICTIMS", c: "#ff0040" },
            { n: data.summary.unique_pools, l: "POOLS", c: "#ffb000" },
            { n: `${parseFloat(p.total_recoverable_eth).toFixed(1)}`, l: "RECOVERABLE", c: "#00ff41" },
          ].map((s, i) => (
            <div key={i} className="p-2 bg-[#000000] border text-center" style={{ borderColor: s.c + "30" }}>
              <div className="text-lg font-mono font-bold" style={{ color: s.c }}>{s.n}</div>
              <div className="text-[8px]" style={{ color: s.c + "80" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MAIN 2/3 + 1/3 LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* ═══ LEFT 2/3 ═══ */}
        <div className="lg:col-span-2 space-y-3">
          {/* Status Row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: p.total_mev_extracted_eth, l: "MEV EXTRACTED", u: "ETH", c: "#ff0040" },
              { v: p.total_victim_loss_eth, l: "VICTIM LOSS", u: `$${lossUsd}`, c: "#ff0040" },
              { v: p.total_recoverable_eth, l: "OPTIMIZER RECOVERS", u: `$${recUsd}`, c: "#00ff41" },
              { v: p.lp_fee_loss_eth, l: "LP FEE LOSS", u: "ETH", c: "#ffb000" },
            ].map((s, i) => (
              <div key={i} className="terminal-panel p-2 border-glow" style={{ borderColor: s.c + "40" }}>
                <div className="text-[8px] mb-1" style={{ color: s.c + "80" }}>{s.l}</div>
                <div className="text-sm font-mono font-bold" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[8px]" style={{ color: s.c + "60" }}>{s.u}</div>
              </div>
            ))}
          </div>

          {/* Bot Leaderboard */}
          <div className="terminal-panel p-3 border-glow border-[#ff0040]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff0040] animate-pulse"></div>
                <span className="text-[10px] tracking-widest text-[#ff0040]">MEV BOTS</span>
              </div>
              <span className="text-[9px] text-[#ff004060]">{data.mev.bots_detected} active</span>
            </div>
            <div className="space-y-1">
              {data.mev.leaderboard.map((bot, i) => (
                <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-[#ff004008] border-b border-[#ff004010]">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#ff004060] w-4">{i + 1}</span>
                    <a href={adL(bot.address)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#ff0040] font-mono hover:underline">{t(bot.address)}</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-[#ffb000]">{bot.type}</span>
                    <span className="text-[10px] text-[#ff0040] font-mono">{bot.attacks}</span>
                    <span className="text-[10px] text-[#ff0040] font-mono w-20 text-right">{bot.estimated_profit_eth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Samples - Compact */}
          <div className="terminal-panel p-3 border-glow border-[#ff004040]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-widest text-[#ff0040]">ATTACKS LOG</span>
              <span className="text-[9px] text-[#ff004060]">{data.mev.attack_samples.length} recent</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {data.mev.attack_samples.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1 px-2 text-[9px] border-b border-[#ff004008] hover:bg-[#ff004005]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#ff004060] w-14">#{a.block}</span>
                    <span className="text-[#ffb000] w-20">{a.type.replace(" Sandwich", "")}</span>
                    <a href={txL(a.txHash)} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] font-mono hover:underline">{t(a.txHash)}</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#ff0040] font-mono">{a.profit_eth.toFixed(4)}</span>
                    <span className="text-[#00ff41] font-mono">{a.recoverable_eth.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT 1/3 — TABS ═══ */}
        <div className="space-y-3">
          {/* Tab Headers */}
          <div className="terminal-panel p-1 border-glow border-[#00ff4140] flex">
            {(["losses", "conclusions", "report", "forecast"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[9px] tracking-wider transition-all ${
                  activeTab === tab
                    ? "text-[#00ff41] bg-[#00ff4115] border-b border-[#00ff41]"
                    : "text-[#00ff4160] hover:text-[#00ff4180]"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="terminal-panel p-3 border-glow border-[#00ff4140] min-h-[400px]">

            {/* LOSSES TAB */}
            {activeTab === "losses" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">LOSS CALCULATIONS</div>

                <div className="space-y-2">
                  <div className="p-2 bg-[#ff004008] border border-[#ff004020]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-[#ff004060]">Sandwich Attacks</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">{data.mev.sandwich_attacks}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-[#ff004060]">Cross-Block</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">{data.mev.cross_block_sandwiches}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#ff004008] border border-[#ff004020]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-[#ff004060]">Total MEV Extracted</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">{p.total_mev_extracted_eth} ETH</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-[#ff004060]">Victim Loss (real)</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">{p.total_victim_loss_eth} ETH</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-[#ff004060]">In USD</span>
                      <span className="text-[10px] text-[#ff0040] font-mono">${lossUsd}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#00ff4108] border border-[#00ff4120]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-[#00ff4160]">Optimizer Recovers</span>
                      <span className="text-[10px] text-[#00ff41] font-mono">{p.total_recoverable_eth} ETH</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-[#00ff4160]">In USD ({recPct}%)</span>
                      <span className="text-[10px] text-[#00ff41] font-mono">${recUsd}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#ffb00008] border border-[#ffb00020]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-[#ffb00060]">LP Fee Loss</span>
                      <span className="text-[10px] text-[#ffb000] font-mono">{p.lp_fee_loss_eth} ETH</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-[#ffb00060]">Shieldable Value</span>
                      <span className="text-[10px] text-[#ffb000] font-mono">{p.shieldable_value_eth} ETH</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-[#ff004005] border border-[#ff004015]">
                  <div className="text-[8px] text-[#ff004060] mb-1">ANNUAL PROJECTION</div>
                  <div className="text-xs text-[#ff0040] font-mono">{p.estimated_annual_loss_eth} ETH</div>
                  <div className="text-[9px] text-[#ff004060]">~${parseFloat(p.estimated_annual_loss_usd).toLocaleString()} USD/year</div>
                </div>
              </div>
            )}

            {/* CONCLUSIONS TAB */}
            {activeTab === "conclusions" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">CONCLUSIONS</div>

                <div className="p-2 bg-[#ff004008] border-l-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] font-bold">Real Losses Confirmed</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">
                    {data.mev.attacks_detected} sandwich attacks extracted {p.total_victim_loss_eth} ETH ({`$${lossUsd}`}) from {data.summary.unique_victims} unique victims across {data.summary.unique_pools} pools in {(parseFloat(data.summary.scan_period_hours)).toFixed(1)}h.
                  </div>
                </div>

                <div className="p-2 bg-[#ff004008] border-l-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] font-bold">Bots Are Organized</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">
                    Top bot {t(data.mev.leaderboard[0]?.address || "0x")} executed {data.mev.leaderboard[0]?.attacks || 0} attacks extracting {data.mev.leaderboard[0]?.estimated_profit_eth || "0"} ETH. These are automated, profit-driven operations.
                  </div>
                </div>

                <div className="p-2 bg-[#00ff4108] border-l-2 border-[#00ff41]">
                  <div className="text-[10px] text-[#00ff41] font-bold">Optimizer Solution Works</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">
                    CappedBurnHook blocks front-running by enforcing swap ordering. With the hook active, {recPct}% of extracted value (${recUsd}) stays with users.
                  </div>
                </div>

                <div className="p-2 bg-[#ffb00008] border-l-2 border-[#ffb000]">
                  <div className="text-[10px] text-[#ffb000] font-bold">Urgency: CRITICAL</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">
                    At current rates, {data.summary.unique_pools} pools lose ~{p.estimated_annual_loss_eth} ETH/year. Every block without the hook is money lost permanently.
                  </div>
                </div>

                <div className="p-2 bg-[#00ff4108] border-l-2 border-[#00ff41]">
                  <div className="text-[10px] text-[#00ff41] font-bold">Next Step</div>
                  <div className="text-[9px] text-[#00ff4160] mt-1">
                    Deploy CappedBurnHook on Sepolia → audit → mainnet. Target: protect {data.summary.unique_pools} pools generating {p.shieldable_value_eth} ETH in volume.
                  </div>
                </div>
              </div>
            )}

            {/* REPORT TAB */}
            {activeTab === "report" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">ATTACK REPORT</div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto">
                  {data.mev.attack_samples.map((a, i) => (
                    <div key={i} className="p-2 bg-[#000000] border border-[#ff004020] text-[9px]">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#ff0040]">{a.type}</span>
                        <span className="text-[#ff004060]">#{a.block}</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex gap-1">
                          <span className="text-[#ff004060] w-12">Bot:</span>
                          <a href={adL(a.bot)} target="_blank" rel="noopener noreferrer" className="text-[#ff0040] font-mono hover:underline">{t(a.bot)}</a>
                        </div>
                        {a.victim && (
                          <div className="flex gap-1">
                            <span className="text-[#ffb00060] w-12">Victim:</span>
                            <a href={adL(a.victim)} target="_blank" rel="noopener noreferrer" className="text-[#ffb000] font-mono hover:underline">{t(a.victim)}</a>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <span className="text-[#ff004060] w-12">TX:</span>
                          <a href={txL(a.txHash)} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] font-mono hover:underline">{t(a.txHash)}</a>
                        </div>
                        <div className="flex justify-between mt-1 pt-1 border-t border-[#ff004010]">
                          <span className="text-[#ff0040]">Lost: {a.profit_eth.toFixed(6)} ETH</span>
                          <span className="text-[#00ff41]">Recover: {a.recoverable_eth.toFixed(6)} ETH</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FORECAST TAB */}
            {activeTab === "forecast" && (
              <div className="space-y-3">
                <div className="text-[9px] tracking-widest text-[#00ff4160] mb-2">FORECAST</div>

                <div className="p-2 bg-[#000000] border border-[#ff004020]">
                  <div className="text-[8px] text-[#ff004060] mb-1">CURRENT RATE (per 500 blocks)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] text-[#ff004060]">Attacks</div>
                      <div className="text-sm text-[#ff0040] font-mono">{data.mev.attacks_detected}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#ff004060]">MEV ETH</div>
                      <div className="text-sm text-[#ff0040] font-mono">{parseFloat(p.total_mev_extracted_eth).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-[#000000] border border-[#ff004020]">
                  <div className="text-[8px] text-[#ff004060] mb-1">PROJECTED (1 YEAR)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] text-[#ff004060]">Total Attacks</div>
                      <div className="text-sm text-[#ff0040] font-mono">{(data.mev.attacks_detected * 105120).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#ff004060]">MEV ETH</div>
                      <div className="text-sm text-[#ff0040] font-mono">{p.estimated_annual_loss_eth}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-[#ff004010]">
                    <div className="text-[9px] text-[#ff004060]">In USD</div>
                    <div className="text-sm text-[#ff0040] font-mono">${parseFloat(p.estimated_annual_loss_usd).toLocaleString()}</div>
                  </div>
                </div>

                <div className="p-2 bg-[#00ff4108] border border-[#00ff4120]">
                  <div className="text-[8px] text-[#00ff4160] mb-1">OPTIMIZER IMPACT (1 YEAR)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] text-[#00ff4160]">Recovered</div>
                      <div className="text-sm text-[#00ff41] font-mono">{(parseFloat(p.total_recoverable_eth) * 105120 / 500).toFixed(2)} ETH</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#00ff4160]">In USD</div>
                      <div className="text-sm text-[#00ff41] font-mono">${((parseFloat(p.total_recoverable_eth) * 105120 / 500) * ethUsd).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-[#ffb00008] border border-[#ffb00020]">
                  <div className="text-[8px] text-[#ffb00060] mb-1">HOOK DEPLOYMENT TARGET</div>
                  <div className="text-[9px] text-[#ffb000] font-mono">{data.recommendation.hook_address}</div>
                  <div className="text-[9px] text-[#ffb00060] mt-1">Priority: {data.recommendation.priority}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="terminal-panel p-2 border-glow border-[#00ff4120] flex items-center justify-between text-[8px] text-[#00ff4160]">
        <span>Optimizer Oracle v1.0 | Ethereum Mainnet</span>
        <span>Generated: {data.report_generated}</span>
      </div>
    </div>
  );
}
