"use client";

import { useState, useEffect } from "react";

interface OracleData {
  status: string;
  last_block: number;
  timestamp: string;
  scan_blocks: number;
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
    cross_pool_arbitrage: number;
    bots_detected: number;
    leaderboard: Array<{
      address: string;
      type: string;
      attacks: number;
      estimated_profit_eth: string;
      pools_active: number;
    }>;
    attack_samples: Array<{
      block: number;
      type: string;
      bot: string;
      victim?: string;
      pool: string;
      profit_eth: number;
      victim_loss_eth: number;
    }>;
  };
  losses: {
    total_mev_extracted_eth: string;
    total_victim_loss_eth: string;
    cross_pool_loss_eth: string;
    lp_fee_loss_eth: string;
    shieldable_value_eth: string;
    estimated_annual_loss_eth: string;
    estimated_annual_loss_usd: string;
  };
  recommendation: {
    action: string;
    priority: string;
    reason: string;
    shieldable_value_eth: string;
    hook_address: string;
  };
}

export default function OraclePage() {
  const [data, setData] = useState<OracleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

  function truncateAddr(addr: string) {
    return `${addr.substring(0, 8)}...${addr.substring(38)}`;
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "CRITICAL": return "text-[#ff0040]";
      case "HIGH": return "text-[#ff0040]";
      case "MEDIUM": return "text-[#ffb000]";
      default: return "text-[#00ff41]";
    }
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

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00ff41] animate-pulse"></div>
            <span className="text-xs tracking-widest text-[#00ff4160]">
              MEV THREAT INTELLIGENCE NODE
            </span>
          </div>
          <div className="text-xs text-[#00ff4160]">
            {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : "Connecting..."}
          </div>
        </div>
      </div>

      {/* MEV Status Alert */}
      {data?.mev?.attacks_detected > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ff0040] bg-[#ff004008]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#ff0040] animate-pulse"></div>
            <span className="text-xs tracking-widest text-[#ff0040]">
              MEV ATTACKS DETECTED
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#ff004060]">Sandwich</div>
              <div className="text-[#ff0040] font-bold">{data.mev.sandwich_attacks}</div>
            </div>
            <div>
              <div className="text-[#ff004060]">Cross-Pool</div>
              <div className="text-[#ff0040] font-bold">{data.mev.cross_pool_arbitrage}</div>
            </div>
            <div>
              <div className="text-[#ff004060]">Bots Active</div>
              <div className="text-[#ff0040] font-bold">{data.mev.bots_detected}</div>
            </div>
            <div>
              <div className="text-[#ff004060]">Total Attacks</div>
              <div className="text-[#ff0040] font-bold">{data.mev.attacks_detected}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loss Calculations */}
      <div className="terminal-panel p-4 border-glow border-[#ff0040]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest text-[#ff0040]">▸ LOSS CALCULATIONS</span>
          </div>
          <div className={`text-[10px] px-2 py-1 ${getPriorityColor(data?.recommendation?.priority || "")} bg-[#000000]`}>
            {data?.recommendation?.priority || "N/A"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-[#ff004008] border border-[#ff004020]">
            <div className="text-[10px] text-[#ff004060] mb-1">MEV EXTRACTED</div>
            <div className="text-lg text-[#ff0040] font-mono">
              {data?.losses?.total_mev_extracted_eth || "0"} ETH
            </div>
          </div>
          <div className="p-3 bg-[#ff004008] border border-[#ff004020]">
            <div className="text-[10px] text-[#ff004060] mb-1">VICTIM LOSS</div>
            <div className="text-lg text-[#ff0040] font-mono">
              {data?.losses?.total_victim_loss_eth || "0"} ETH
            </div>
          </div>
          <div className="p-3 bg-[#ffb00008] border border-[#ffb00020]">
            <div className="text-[10px] text-[#ffb00060] mb-1">CROSS-POOL LOSS</div>
            <div className="text-lg text-[#ffb000] font-mono">
              {data?.losses?.cross_pool_loss_eth || "0"} ETH
            </div>
          </div>
          <div className="p-3 bg-[#ffb00008] border border-[#ffb00020]">
            <div className="text-[10px] text-[#ffb00060] mb-1">LP FEE LOSS</div>
            <div className="text-lg text-[#ffb000] font-mono">
              {data?.losses?.lp_fee_loss_eth || "0"} ETH
            </div>
          </div>
        </div>

        {/* Shieldable Value */}
        <div className="p-4 bg-[#00ff4108] border border-[#00ff4120]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-[#00ff4160]">SHIELDABLE VALUE (CappedBurnHook)</div>
            <div className="text-xs text-[#00ff41] font-mono font-bold">
              {data?.losses?.shieldable_value_eth || "0"} ETH
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#00ff4160]">ESTIMATED ANNUAL LOSS</div>
            <div className="text-xs text-[#ff0040] font-mono font-bold">
              {data?.losses?.estimated_annual_loss_eth || "0"} ETH (~${data?.losses?.estimated_annual_loss_usd || "0"})
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="terminal-panel p-3 border-glow">
          <div className="text-[10px] text-[#00ff4160] mb-1">STATUS</div>
          <div className="text-sm text-[#00ff41] glow">{data?.status?.toUpperCase() || "OFFLINE"}</div>
        </div>
        <div className="terminal-panel p-3 border-glow">
          <div className="text-[10px] text-[#00ff4160] mb-1">LAST BLOCK</div>
          <div className="text-sm text-[#00ff41] glow">{data?.last_block || "—"}</div>
        </div>
        <div className="terminal-panel p-3 border-glow">
          <div className="text-[10px] text-[#00ff4160] mb-1">SCAN RANGE</div>
          <div className="text-sm text-[#00ff41] glow">{data?.scan_blocks || 500} blocks</div>
        </div>
        <div className="terminal-panel p-3 border-glow">
          <div className="text-[10px] text-[#00ff4160] mb-1">HOOK ADDRESS</div>
          <div className="text-[10px] text-[#00ff41] glow font-mono">
            {truncateAddr(data?.recommendation?.hook_address || "0x0000")}
          </div>
        </div>
      </div>

      {/* Pool Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IMD Pool */}
        <div className="terminal-panel p-4 border-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs tracking-widest text-[#00ff4160]">▸ IMD/ETH POOL</div>
            <div className="text-[10px] px-2 py-1 bg-[#00ff4110] text-[#00ff41]">CappedBurnHook</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[10px] text-[#00ff4160]">Swaps</div>
              <div className="text-lg text-[#00ff41] glow">{data?.imd?.swaps || 0}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#00ff4160]">Traders</div>
              <div className="text-lg text-[#00ff41] glow">{data?.imd?.traders || 0}</div>
            </div>
          </div>

          <div className="text-[10px] text-[#00ff4160] mb-2">TOP TRADERS</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data?.imd?.top5?.map((t, i) => (
              <div key={i} className="flex justify-between text-[11px] py-1 border-b border-[#00ff4110]">
                <span className="text-[#00ff4160] font-mono">{truncateAddr(t.addr)}</span>
                <span className="text-[#00ff41]">{t.swaps} swaps</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standard Pool */}
        <div className="terminal-panel p-4 border-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs tracking-widest text-[#00ff4160]">▸ STANDARD (ETH/USDC)</div>
            <div className="text-[10px] px-2 py-1 bg-[#ffb00010] text-[#ffb000]">Reference</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[10px] text-[#00ff4160]">Swaps</div>
              <div className="text-lg text-[#00ff41] glow">{data?.standard?.swaps || 0}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#00ff4160]">Traders</div>
              <div className="text-lg text-[#00ff41] glow">{data?.standard?.traders || 0}</div>
            </div>
          </div>

          <div className="text-[10px] text-[#00ff4160] mb-2">TOP TRADERS</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data?.standard?.top5?.map((t, i) => (
              <div key={i} className="flex justify-between text-[11px] py-1 border-b border-[#00ff4110]">
                <span className="text-[#00ff4160] font-mono">{truncateAddr(t.addr)}</span>
                <span className="text-[#00ff41]">{t.swaps} swaps</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MEV Bot Leaderboard */}
      {data?.mev?.leaderboard && data.mev.leaderboard.length > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ff0040]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff0040] animate-pulse"></div>
              <span className="text-xs tracking-widest text-[#ff0040]">MEV BOT LEADERBOARD</span>
            </div>
            <div className="text-xs text-[#ff004060]">
              {data.mev.leaderboard.length} bots tracked
            </div>
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
                    <td className="py-2 text-[#ff0040] font-mono">{truncateAddr(bot.address)}</td>
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

      {/* Cross-Pool Intelligence */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ffb000] animate-pulse"></div>
            <span className="text-xs tracking-widest text-[#ffb000]">CROSS-POOL INTELLIGENCE</span>
          </div>
          <div className="text-xs text-[#00ff4160]">
            {data?.cross_pool?.shared_bots || 0} bots detected
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {data?.cross_pool?.addresses?.map((addr, i) => (
            <div key={i} className="p-2 bg-[#000000] border border-[#00ff4120] text-center">
              <div className="text-[10px] text-[#00ff41] font-mono">{truncateAddr(addr)}</div>
              <div className="text-[8px] text-[#00ff4160] mt-1">Cross-Pool Operator</div>
            </div>
          ))}
        </div>

        {(data?.cross_pool?.shared_bots || 0) > 0 && (
          <div className="mt-4 p-3 bg-[#ff004008] border border-[#ff004030]">
            <div className="text-[10px] text-[#ff0040] mb-1">⚠ MEV OPPORTUNITY DETECTED</div>
            <div className="text-[11px] text-[#00ff4160]">
              {data?.cross_pool?.shared_bots} bots operating on both pools create arbitrage opportunities.
              CappedBurnHook can internalize this MEV as LP revenue.
            </div>
          </div>
        )}
      </div>

      {/* Optimizer Recommendation */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-widest text-[#00ff4160]">▸ OPTIMIZER RECOMMENDATION</div>
          <div className={`text-[10px] px-2 py-1 ${getPriorityColor(data?.recommendation?.priority || "")} bg-[#000000]`}>
            {data?.recommendation?.action || "N/A"}
          </div>
        </div>

        <div className="p-3 bg-[#00ff4108] border border-[#00ff4120]">
          <div className="text-[11px] text-[#00ff4160] mb-2">{data?.recommendation?.reason}</div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#00ff4160]">Shieldable Value</div>
            <div className="text-xs text-[#00ff41] font-mono">
              {data?.recommendation?.shieldable_value_eth || "0"} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Attack Samples */}
      {data?.mev?.attack_samples && data.mev.attack_samples.length > 0 && (
        <div className="terminal-panel p-4 border-glow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs tracking-widest text-[#00ff4160]">▸ RECENT ATTACKS</div>
            <button 
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
              className="text-[10px] px-2 py-1 bg-[#00ff4110] text-[#00ff41] hover:bg-[#00ff4120] transition-colors"
            >
              COPY ALL
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.mev.attack_samples.slice(0, 5).map((attack, i) => (
              <div key={i} className="p-2 bg-[#ff004008] border border-[#ff004020] text-[11px]">
                <div className="flex justify-between mb-1">
                  <span className="text-[#ff0040]">{attack.type}</span>
                  <span className="text-[#ff004060]">Block #{attack.block}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ff004060]">Bot: {truncateAddr(attack.bot)}</span>
                  <span className="text-[#ff0040]">+{attack.profit_eth.toFixed(6)} ETH</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Output */}
      <div className="terminal-panel p-4 border-glow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs tracking-widest text-[#00ff4160]">▸ RAW ORACLE OUTPUT</div>
        </div>
        <pre className="text-[10px] text-[#00ff4160] overflow-x-auto max-h-48 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
