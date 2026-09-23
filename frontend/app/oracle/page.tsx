"use client";

import { useState, useEffect, useRef } from "react";

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
  imd: {
    swaps: number;
    traders: number;
    top5: Array<{ addr: string; swaps: number }>;
  };
  standard: {
    swaps: number;
    traders: number;
    top5: Array<{ addr: string; swaps: number }>;
  };
  cross_pool: {
    shared_bots: number;
    addresses: string[];
  };
  mev: {
    attacks_detected: number;
    sandwich_attacks: number;
    cross_block_sandwiches: number;
    bots_detected: number;
    leaderboard: Array<{
      address: string;
      type: string;
      attacks: number;
      estimated_profit_eth: string;
      pools_active: number;
    }>;
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
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOracle();
    const interval = setInterval(fetchOracle, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOracle() {
    try {
      const res = await fetch("/api/oracle");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Oracle fetch failed");
    } finally {
      setLoading(false);
    }
  }

  function t(addr: string) {
    return `${addr.substring(0, 8)}...${addr.substring(38)}`;
  }

  function txLink(hash: string) {
    return `https://etherscan.io/tx/${hash}`;
  }

  function addrLink(addr: string) {
    return `https://etherscan.io/address/${addr}`;
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="terminal-panel p-6 border-glow border-[#00ff41]">
        <div className="text-center text-[#00ff4160]">
          <div className="animate-pulse">[SCANNING BLOCKCHAIN...]</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const p = data.losses;
  const ethUsd = p.eth_price_usd;
  const totalLossUsd = (parseFloat(p.total_victim_loss_eth) * ethUsd).toFixed(0);
  const recoverableUsd = (parseFloat(p.total_recoverable_eth) * ethUsd).toFixed(0);

  return (
    <div className="space-y-4 fade-in" ref={reportRef}>
      {/* HEADER */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00ff41] animate-pulse"></div>
            <span className="text-xs tracking-widest text-[#00ff4160]">OPTIMIZER MEV ORACLE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#00ff4160]">
              Block #{data.last_block} | {data.scan_blocks} blocks scanned
            </div>
            <button onClick={handlePrint} className="text-[10px] px-3 py-1 bg-[#00ff4115] text-[#00ff41] hover:bg-[#00ff4125] border border-[#00ff4130] transition-colors">
              EXPORT REPORT
            </button>
          </div>
        </div>
      </div>

      {/* ═══ OBJECTIVE SUMMARY ═══ */}
      <div className="terminal-panel p-5 border-glow border-[#ff0040] bg-[#ff004005]">
        <div className="text-center mb-3">
          <div className="text-[11px] tracking-widest text-[#ff004060] mb-2">EXECUTIVE SUMMARY</div>
          <div className="text-lg text-[#ff0040] font-bold leading-relaxed">
            Without Optimizer, retail traders lost <span className="text-[#ff0040] font-mono">${totalLossUsd}</span> in MEV attacks.
          </div>
          <div className="text-sm text-[#00ff41] mt-2">
            Optimizer would have recovered <span className="font-mono font-bold">${recoverableUsd}</span> ({(parseFloat(p.total_recoverable_eth) / parseFloat(p.total_victim_loss_eth) * 100).toFixed(0)}% of losses).
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="p-3 bg-[#000000] border border-[#ff004030] text-center">
            <div className="text-2xl text-[#ff0040] font-mono font-bold">{data.mev.attacks_detected}</div>
            <div className="text-[9px] text-[#ff004060] mt-1">ATTACKS DETECTED</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#ff004030] text-center">
            <div className="text-2xl text-[#ff0040] font-mono font-bold">{data.mev.bots_detected}</div>
            <div className="text-[9px] text-[#ff004060] mt-1">MEV BOTS ACTIVE</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#ff004030] text-center">
            <div className="text-2xl text-[#ff0040] font-mono font-bold">{data.summary.unique_victims}</div>
            <div className="text-[9px] text-[#ff004060] mt-1">VICTIMS IDENTIFIED</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#ff004030] text-center">
            <div className="text-2xl text-[#ff0040] font-mono font-bold">{data.summary.unique_pools}</div>
            <div className="text-[9px] text-[#ff004060] mt-1">POOLS AFFECTED</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#00ff4130] text-center">
            <div className="text-2xl text-[#00ff41] font-mono font-bold">{parseFloat(p.total_recoverable_eth).toFixed(2)}</div>
            <div className="text-[9px] text-[#00ff4160] mt-1">ETH RECOVERABLE</div>
          </div>
        </div>
      </div>

      {/* ═══ KEY FINDINGS ═══ */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="text-xs tracking-widest text-[#ffb000] mb-4">KEY FINDINGS</div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-[#ffb00005] border border-[#ffb00015]">
            <div className="text-[#ffb000] font-mono text-sm mt-0.5">01</div>
            <div>
              <div className="text-sm text-[#ffb000] font-bold">{data.mev.sandwich_attacks} Same-Block Sandwich Attacks</div>
              <div className="text-[11px] text-[#00ff4160] mt-1">Bots front-run and back-run trades within the same block, extracting {data.mev.sandwich_attacks > 0 ? (data.mev.attack_samples.filter(a => a.type === "Sandwich").reduce((s, a) => s + a.profit_eth, 0)).toFixed(2) : "0"} ETH from {data.summary.unique_victims} victims.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#ffb00005] border border-[#ffb00015]">
            <div className="text-[#ffb000] font-mono text-sm mt-0.5">02</div>
            <div>
              <div className="text-sm text-[#ffb000] font-bold">{data.mev.cross_block_sandwiches} Cross-Block Sandwiches</div>
              <div className="text-[11px] text-[#00ff4160] mt-1">Advanced MEV bots span 2-3 blocks to execute larger sandwiches, making detection harder and losses bigger per attack.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#ffb00005] border border-[#ffb00015]">
            <div className="text-[#ffb000] font-mono text-sm mt-0.5">03</div>
            <div>
              <div className="text-sm text-[#ffb000] font-bold">{data.mev.bots_detected} MEV Bots Identified Across {data.summary.unique_pools} Pools</div>
              <div className="text-[11px] text-[#00ff4160] mt-1">Top bot {t(data.mev.leaderboard[0]?.address || "0x")} extracted {data.mev.leaderboard[0]?.estimated_profit_eth || "0"} ETH in {data.mev.leaderboard[0]?.attacks || 0} attacks.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#ff004005] border border-[#ff004015]">
            <div className="text-[#ff0040] font-mono text-sm mt-0.5">04</div>
            <div>
              <div className="text-sm text-[#ff0040] font-bold">Losses are Real and Unrecoverable Without Hook</div>
              <div className="text-[11px] text-[#00ff4160] mt-1">Without Optimizer&apos;s CappedBurnHook, these {data.mev.attacks_detected} attacks extracted <span className="text-[#ff0040] font-mono">${totalLossUsd}</span> from retail traders in {(parseFloat(data.summary.scan_period_hours)).toFixed(1)} hours.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#00ff4105] border border-[#00ff4115]">
            <div className="text-[#00ff41] font-mono text-sm mt-0.5">05</div>
            <div>
              <div className="text-sm text-[#00ff41] font-bold">Projected Annual Impact: ${parseFloat(p.estimated_annual_loss_usd).toLocaleString()}</div>
              <div className="text-[11px] text-[#00ff4160] mt-1">At current attack rates, this translates to ~{p.estimated_annual_loss_eth} ETH/year in MEV extraction across all Uniswap V4 pools.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LOSS CALCULATIONS ═══ */}
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-widest text-[#ff0040]">LOSS CALCULATIONS</div>
          <div className="text-[10px] px-2 py-1 bg-[#ff004015] text-[#ff0040]">
            {data?.recommendation?.priority || "N/A"}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#000000] border border-[#ff004020]">
            <div className="text-[9px] text-[#ff004060] mb-1">MEV EXTRACTED</div>
            <div className="text-lg text-[#ff0040] font-mono">{p.total_mev_extracted_eth}</div>
            <div className="text-[9px] text-[#ff004060]">ETH</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#ff004020]">
            <div className="text-[9px] text-[#ff004060] mb-1">VICTIM LOSS</div>
            <div className="text-lg text-[#ff0040] font-mono">{p.total_victim_loss_eth}</div>
            <div className="text-[9px] text-[#ff004060]">ETH (${totalLossUsd})</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#00ff4120]">
            <div className="text-[9px] text-[#00ff4160] mb-1">RECOVERABLE WITH OPTIMIZER</div>
            <div className="text-lg text-[#00ff41] font-mono">{p.total_recoverable_eth}</div>
            <div className="text-[9px] text-[#00ff4160]">ETH (${recoverableUsd})</div>
          </div>
          <div className="p-3 bg-[#000000] border border-[#ffb00020]">
            <div className="text-[9px] text-[#ffb00060] mb-1">LP FEE LOSS</div>
            <div className="text-lg text-[#ffb000] font-mono">{p.lp_fee_loss_eth}</div>
            <div className="text-[9px] text-[#ffb00060]">ETH</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-[#ff004008] border border-[#ff004020]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#ff004060]">ANNUAL PROJECTION (at current rate)</span>
            <span className="text-xs text-[#ff0040] font-mono">{p.estimated_annual_loss_eth} ETH (${parseFloat(p.estimated_annual_loss_usd).toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* ═══ MEV BOT LEADERBOARD ═══ */}
      {data.mev.leaderboard.length > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ff0040]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff0040] animate-pulse"></div>
              <span className="text-xs tracking-widest text-[#ff0040]">MEV BOT LEADERBOARD</span>
            </div>
            <div className="text-xs text-[#ff004060]">{data.mev.bots_detected} bots tracked</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#ff004030]">
                  <th className="text-left py-2 text-[#ff004060]">#</th>
                  <th className="text-left py-2 text-[#ff004060]">Address</th>
                  <th className="text-left py-2 text-[#ff004060]">Type</th>
                  <th className="text-right py-2 text-[#ff004060]">Attacks</th>
                  <th className="text-right py-2 text-[#ff004060]">Profit (ETH)</th>
                  <th className="text-right py-2 text-[#ff004060]">Pools</th>
                </tr>
              </thead>
              <tbody>
                {data.mev.leaderboard.map((bot, i) => (
                  <tr key={i} className="border-b border-[#ff004010] hover:bg-[#ff004008]">
                    <td className="py-2 text-[#ff004060]">{i + 1}</td>
                    <td className="py-2">
                      <a href={addrLink(bot.address)} target="_blank" rel="noopener noreferrer" className="text-[#ff0040] font-mono hover:underline">{t(bot.address)}</a>
                    </td>
                    <td className="py-2 text-[#ffb000]">{bot.type}</td>
                    <td className="py-2 text-right text-[#ff0040]">{bot.attacks}</td>
                    <td className="py-2 text-right text-[#ff0040] font-mono">{bot.estimated_profit_eth}</td>
                    <td className="py-2 text-right text-[#ff004060]">{bot.pools_active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ATTACK REPORT ═══ */}
      {data.mev.attack_samples.length > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ff0040]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff0040]"></div>
              <span className="text-xs tracking-widest text-[#ff0040]">ATTACK REPORT — TX DETAILS</span>
            </div>
            <button onClick={handlePrint} className="text-[10px] px-3 py-1 bg-[#ff004015] text-[#ff0040] hover:bg-[#ff004025] border border-[#ff004030] transition-colors">
              PRINT REPORT
            </button>
          </div>

          <div className="space-y-3">
            {data.mev.attack_samples.map((attack, i) => (
              <div key={i} className="p-4 bg-[#000000] border border-[#ff004020]">
                {/* Attack Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 bg-[#ff004015] text-[#ff0040]">{attack.type}</span>
                    <span className="text-[10px] text-[#ff004060]">Block #{attack.block}</span>
                    {attack.blocks_span && (
                      <span className="text-[10px] text-[#ffb000]">+{attack.blocks_span} blocks</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#ff0040] font-mono font-bold">-{attack.profit_eth.toFixed(6)} ETH</div>
                    <div className="text-[9px] text-[#ff004060]">lost by victim</div>
                  </div>
                </div>

                {/* Wallets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="p-2 bg-[#ff004008] border border-[#ff004015]">
                    <div className="text-[9px] text-[#ff004060] mb-1">BOT (Attacker)</div>
                    <a href={addrLink(attack.bot)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#ff0040] font-mono hover:underline break-all">{attack.bot}</a>
                  </div>
                  {attack.victim && (
                    <div className="p-2 bg-[#ffb00008] border border-[#ffb00015]">
                      <div className="text-[9px] text-[#ffb00060] mb-1">VICTIM</div>
                      <a href={addrLink(attack.victim)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#ffb000] font-mono hover:underline break-all">{attack.victim}</a>
                    </div>
                  )}
                  <div className="p-2 bg-[#00ff4108] border border-[#00ff4115]">
                    <div className="text-[9px] text-[#00ff4160] mb-1">RECOVERABLE (85%)</div>
                    <div className="text-[11px] text-[#00ff41] font-mono font-bold">{attack.recoverable_eth.toFixed(6)} ETH</div>
                    <div className="text-[9px] text-[#00ff4160]">(${(attack.recoverable_eth * ethUsd).toFixed(0)} USD)</div>
                  </div>
                </div>

                {/* TX Hashes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#ff004060] w-16">Entry TX:</span>
                    <a href={txLink(attack.txHash)} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] font-mono hover:underline break-all">{attack.txHash}</a>
                  </div>
                  {attack.victim_txHash && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#ffb00060] w-16">Victim TX:</span>
                      <a href={txLink(attack.victim_txHash)} target="_blank" rel="noopener noreferrer" className="text-[#ffb000] font-mono hover:underline break-all">{attack.victim_txHash}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#ff004060] w-16">Exit TX:</span>
                    <a href={txLink(attack.exit_txHash)} target="_blank" rel="noopener noreferrer" className="text-[#ff0040] font-mono hover:underline break-all">{attack.exit_txHash}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ OPTIMIZER RECOMMENDATION ═══ */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-widest text-[#00ff4160]">OPTIMIZER RECOMMENDATION</div>
          <div className="text-[10px] px-2 py-1 bg-[#00ff4115] text-[#00ff41]">
            {data.recommendation.action}
          </div>
        </div>
        <div className="p-3 bg-[#00ff4108] border border-[#00ff4120]">
          <div className="text-[11px] text-[#00ff4160] mb-2">{data.recommendation.reason}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-[#00ff4160]">Shieldable Value</div>
              <div className="text-sm text-[#00ff41] font-mono">{data.recommendation.shieldable_value_eth} ETH</div>
            </div>
            <div>
              <div className="text-[10px] text-[#00ff4160]">Recoverable</div>
              <div className="text-sm text-[#00ff41] font-mono">{data.recommendation.recoverable_eth} ETH</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[#00ff4160]">
            Hook: <span className="font-mono text-[#00ff41]">{data.recommendation.hook_address}</span>
          </div>
        </div>
      </div>

      {/* ═══ REPORT FOOTER ═══ */}
      <div className="terminal-panel p-3 border-glow border-[#00ff4130]">
        <div className="flex items-center justify-between text-[10px] text-[#00ff4160]">
          <div>Report generated: {data.report_generated}</div>
          <div>Last block: #{data.last_block} | Chain: Ethereum Mainnet</div>
        </div>
      </div>
    </div>
  );
}
