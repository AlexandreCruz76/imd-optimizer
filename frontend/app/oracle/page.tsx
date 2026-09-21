"use client";

import { useState, useEffect } from "react";

interface OracleData {
  status: string;
  last_block: number;
  timestamp: string;
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
          <div className="text-[10px] text-[#00ff4160] mb-1">CROSS-POOL BOTS</div>
          <div className="text-sm text-[#ffb000] glow-amber">{data?.cross_pool?.shared_bots || 0}</div>
        </div>
        <div className="terminal-panel p-3 border-glow">
          <div className="text-[10px] text-[#00ff4160] mb-1">ARBITRAGE SIGNAL</div>
          <div className={`text-sm ${(data?.cross_pool?.shared_bots || 0) > 0 ? 'text-[#ff0040]' : 'text-[#00ff41]'} glow`}>
            {(data?.cross_pool?.shared_bots || 0) > 0 ? "DETECTED" : "NONE"}
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

      {/* Oracle Output */}
      <div className="terminal-panel p-4 border-glow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs tracking-widest text-[#00ff4160]">▸ RAW ORACLE OUTPUT</div>
          <button 
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
            className="text-[10px] px-2 py-1 bg-[#00ff4110] text-[#00ff41] hover:bg-[#00ff4120] transition-colors"
          >
            COPY
          </button>
        </div>
        <pre className="text-[10px] text-[#00ff4160] overflow-x-auto max-h-48 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
