"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../components/WalletProvider";

interface PoolState {
  hookTVL: string;
  hookVolumeUSD: string;
  hookFeesUSD: string;
  hookTxs24h: number;
  hookAPY: string;
  hookPair: string;
  hookFeeTier: number;
  nativeTVL: string;
  nativeVolumeUSD: string;
  nativeFeesUSD: string;
  nativeTxs24h: number;
  nativeAPY: string;
  nativePair: string;
  nativeFeeTier: number;
  spreadAPY: string;
  price: string;
  ethUsd: string;
  timestamp?: string;
}

interface UserLp {
  ethBalance: string;
  imdBalance: string;
  shareOfPool: string;
  feeEarned: string;
  pnl: string;
  pnlPercent: string;
}

interface BurnStats {
  totalBurned: string;
  totalRewards: string;
  burnRate: string;
  capUtilization: number;
}

interface NftKey {
  tier?: string;
}

interface NftKeys {
  keys: NftKey[];
  totalMEV: string;
}

// Genesis seal yield boost (config until on-chain tier oracle lands).
const SEAL_BOOST_PER_GENESIS = 0.25;
const SEAL_BOOST_CAP = 2;

type PoolId = "hook" | "native";

function fmtUsd(n: number): string {
  if (!isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmt(n: number, d = 4): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: d });
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-[#6B7A88]/70 font-mono">
        collecting live series…
      </div>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 28 - 1;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  const color = up ? "#00F58C" : "#FF567E";
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="w-full h-24"
      aria-label="price chart"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${pts} 100,30`} fill="url(#spark-fill)" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-[#6B7A88] font-mono">
        {label}
      </div>
      <div
        className={`font-mono ${big ? "text-3xl" : "text-lg"} mt-1`}
        style={{ color: color || "#E8E8E8" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-[#6B7A88]/80 font-mono mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

export default function MetaHookPoolPage() {
  const { connected, connect, connecting, address, balance } = useWallet();
  const [pool, setPool] = useState<PoolState | null>(null);
  const [lp, setLp] = useState<UserLp | null>(null);
  const [burns, setBurns] = useState<BurnStats | null>(null);
  const [keys, setKeys] = useState<NftKeys | null>(null);
  const [series, setSeries] = useState<number[]>([]);
  const [selected, setSelected] = useState<PoolId>("hook");
  const [ethInput, setEthInput] = useState("");
  const [imdInput, setImdInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [liqTx, setLiqTx] = useState<string | null>(null);
  const [liqError, setLiqError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const price = pool ? parseFloat(pool.price) || 0 : 0; // IMD per ETH
  const ethUsd = pool ? parseFloat(pool.ethUsd) || 0 : 0;

  const loadPool = useCallback(async () => {
    try {
      const res = await fetch("/api/pool-state");
      const json = await res.json();
      if (json && json.price) {
        setPool(json);
        const p = parseFloat(json.ethUsd) || 0;
        if (p > 0) {
          setSeries((prev) => [...prev.slice(-39), p]);
        }
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
        setError(null);
      } else if (json?.error) {
        setError(String(json.error));
      }
    } catch {
      setError("pool-state unavailable");
    }
  }, []);

  const loadBurns = useCallback(async () => {
    try {
      const res = await fetch("/api/burns");
      const json = await res.json();
      if (json && !json.error) setBurns(json.stats || json);
    } catch {
      // keep previous
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!address) return;
    try {
      const [lpRes, keysRes] = await Promise.all([
        fetch(`/api/user-lp?address=${address}`),
        fetch(`/api/nft/keys?address=${address}`),
      ]);
      const lpJson = await lpRes.json();
      if (lpJson && !lpJson.error) setLp(lpJson);
      const keysJson = await keysRes.json();
      if (keysJson && Array.isArray(keysJson.keys)) setKeys(keysJson);
    } catch {
      // keep previous
    }
  }, [address]);

  useEffect(() => {
    const boot = setTimeout(() => {
      loadPool();
      loadBurns();
    }, 0);
    const id = setInterval(() => {
      loadPool();
      loadUser();
    }, 15000);
    const id2 = setInterval(loadBurns, 60000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
      clearInterval(id2);
    };
  }, [loadPool, loadBurns, loadUser]);

  useEffect(() => {
    if (!address) return;
    const t = setTimeout(() => {
      loadUser();
    }, 0);
    return () => clearTimeout(t);
  }, [address, loadUser]);

  const metrics =
    selected === "hook"
      ? {
          tvl: parseFloat(pool?.hookTVL || "0"),
          vol: parseFloat(pool?.hookVolumeUSD || "0"),
          fees: parseFloat(pool?.hookFeesUSD || "0"),
          txs: pool?.hookTxs24h || 0,
          apy: parseFloat(pool?.hookAPY || "0"),
          pair: pool?.hookPair || "ETH/IMD",
          feePct: ((pool?.hookFeeTier || 500) / 10000).toFixed(2),
          label: "HOOK POOL",
        }
      : {
          tvl: parseFloat(pool?.nativeTVL || "0"),
          vol: parseFloat(pool?.nativeVolumeUSD || "0"),
          fees: parseFloat(pool?.nativeFeesUSD || "0"),
          txs: pool?.nativeTxs24h || 0,
          apy: parseFloat(pool?.nativeAPY || "0"),
          pair: pool?.nativePair || "ETH/IMD",
          feePct: ((pool?.nativeFeeTier || 3000) / 10000).toFixed(2),
          label: "NATIVE POOL",
        };

  function onEthChange(v: string) {
    setEthInput(v);
    const eth = parseFloat(v);
    setImdInput(eth > 0 && price > 0 ? fmt(eth * price, 2) : "");
  }

  function onImdChange(v: string) {
    setImdInput(v);
    const imd = parseFloat(v);
    setEthInput(imd > 0 && price > 0 ? fmt(imd / price, 6) : "");
  }

  const depositEth = parseFloat(ethInput) || 0;
  const depositUsd = depositEth * ethUsd;
  const sharePct =
    metrics.tvl > 0 && depositUsd > 0 ? (depositUsd / metrics.tvl) * 100 : 0;

  const genesisCount = (keys?.keys || []).filter(
    (k) => (k.tier || "").toUpperCase() === "GENESIS"
  ).length;
  const seals = (keys?.keys || []).length;
  const sealMult = Math.min(
    1 + SEAL_BOOST_PER_GENESIS * genesisCount,
    1 + SEAL_BOOST_CAP
  );

  const positionEth = lp ? parseFloat(lp.ethBalance) || 0 : 0;
  const baseYieldDaily =
    positionEth > 0 ? (positionEth * (metrics.apy / 100)) / 365 : 0;
  const yieldDaily = baseYieldDaily * sealMult;
  const yieldMonthly = yieldDaily * 30;
  const yieldYearly = yieldDaily * 365;
  const pnl = lp ? parseFloat(lp.pnl) || 0 : 0;
  const pnlPct = lp ? parseFloat(lp.pnlPercent) || 0 : 0;

  async function handleAddLiquidity() {
    if (!connected) {
      connect();
      return;
    }
    if (depositEth <= 0) return;
    setAdding(true);
    setLiqError(null);
    setLiqTx(null);
    try {
      const res = await fetch("/api/liquidity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          pool: selected,
          ethAmount: ethInput,
          imdAmount: imdInput,
          sharePercent: sharePct.toFixed(4),
        }),
      });
      const data = await res.json();
      if (data.txHash) setLiqTx(data.txHash);
      else setLiqError(data.error || "Deposit failed");
    } catch (err) {
      setLiqError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] p-4 md:p-8 fade-in relative">
      {/* Ambient Agentic Artwork Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/avatar.jpg"
          alt="Agent Background"
          className="w-full h-full object-cover object-center opacity-35 transition-opacity duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/imd.jpg";
          }}
        />
        {/* Subtle dark vignette around edges only */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#070A0F/40_70%,#070A0F/90_100%)]" />
      </div>
      <div className="max-w-6xl mx-auto space-y-4 relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-base md:text-lg font-medium text-[#E8E8E8] tracking-wider font-mono">
            ┌─ META HOOK POOL ─── ANTI-MEV ARBITRAGE ─────────────────────────┐
          </h1>
          <div className="flex items-center gap-3 text-xs text-[#6B7A88] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F58C] animate-pulse" />
              LIVE
            </span>
            <span>{lastUpdate}</span>
            <button
              onClick={() => {
                loadPool();
                loadBurns();
                loadUser();
              }}
              className="text-[#00F58C] hover:underline"
            >
              REFRESH
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-[#FFB000] font-mono">
            ⚠ {error} — exibindo último estado conhecido
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: chart + add liquidity */}
          <div className="space-y-4">
            {/* Moeda lastro chart */}
            <div className="glass-card rounded-3xl p-5 border border-white/[0.08]">
              <div className="flex items-start justify-between mb-3">
                <Stat
                  label="MOEDA LASTRO · ETH/USD"
                  value={ethUsd > 0 ? fmtUsd(ethUsd) : "—"}
                  sub="live session series · 15s"
                  color="#00F5FF"
                />
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.2em] text-[#6B7A88] font-mono">
                    POOL PRICE
                  </div>
                  <div className="text-lg font-mono text-[#00F58C] mt-1">
                    {price > 0 ? `${fmt(price, 2)} IMD/ETH` : "—"}
                  </div>
                  <div className="text-[10px] text-[#6B7A88]/80 font-mono">
                    spread {pool?.spreadAPY ?? "—"}%
                  </div>
                </div>
              </div>
              <Sparkline data={series} />
              <div className="mt-2 text-[10px] text-[#6B7A88] font-mono">
                {metrics.pair} · {metrics.label} · fee {metrics.feePct}%
              </div>
            </div>

            {/* Add liquidity — Uniswap style */}
            <div className="glass-card rounded-3xl p-5 border border-white/[0.08]">
              {/* pool tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(["hook", "native"] as PoolId[]).map((id) => {
                  const active = selected === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className={`rounded-2xl px-3 py-2.5 text-left transition-all ${
                        active
                          ? "bg-[#00F58C]/10 border border-[#00F58C]/50"
                          : "bg-[#0B0E14]/60 border border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div
                        className={`text-xs font-mono ${
                          active ? "text-[#00F58C]" : "text-[#6B7A88]"
                        }`}
                      >
                        {id === "hook" ? "HOOK · ANTI-MEV" : "NATIVE · V4"}
                      </div>
                      <div className="text-[10px] text-[#6B7A88] font-mono mt-0.5">
                        APY {id === "hook" ? pool?.hookAPY ?? "—" : pool?.nativeAPY ?? "—" }% ·
                        TVL{" "}
                        {fmtUsd(
                          id === "hook"
                            ? parseFloat(pool?.hookTVL || "0")
                            : parseFloat(pool?.nativeTVL || "0")
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* deposit fields */}
              <div className="rounded-2xl bg-[#0B0E14]/70 border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7A88]">ETH (lastro)</span>
                  <span className="text-[10px] font-mono text-[#6B7A88]">
                    wallet {balance}
                    {connected && parseFloat(balance) > 0 && (
                      <button
                        onClick={() => onEthChange(balance)}
                        className="ml-1.5 text-[#00F58C] hover:underline"
                      >
                        MAX
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ethInput}
                    onChange={(e) => onEthChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 bg-transparent text-2xl font-mono text-[#E8E8E8] placeholder-[#6B7A88]/50 outline-none"
                  />
                  <span className="text-sm font-mono text-[#6B7A88]">ETH</span>
                </div>

                <div className="text-center text-[#00F58C] text-sm leading-none">
                  +
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7A88]">IMD (paired)</span>
                  <span className="text-[10px] font-mono text-[#6B7A88]">
                    {price > 0 ? `1 ETH = ${fmt(price, 2)} IMD` : "price —"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={imdInput}
                    onChange={(e) => onImdChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 bg-transparent text-2xl font-mono text-[#E8E8E8] placeholder-[#6B7A88]/50 outline-none"
                  />
                  <span className="text-sm font-mono text-[#6B7A88]">IMD</span>
                </div>
              </div>

              {/* fundamental data — sem linhas */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Stat label="DEPOSIT" value={fmtUsd(depositUsd)} />
                <Stat
                  label="YOUR SHARE"
                  value={sharePct > 0 ? `${sharePct.toFixed(3)}%` : "—"}
                  color="#00F58C"
                />
                <Stat label="LP FEE" value={`${metrics.feePct}%`} />
                <Stat label="TVL" value={fmtUsd(metrics.tvl)} />
                <Stat label="APY" value={`${metrics.apy.toFixed(1)}%`} color="#00F58C" />
                <Stat label="VOL 24H" value={fmtUsd(metrics.vol)} />
              </div>

              <button
                onClick={handleAddLiquidity}
                disabled={adding || (connected && depositEth <= 0)}
                className={`w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold tracking-widest font-mono transition-all ${
                  adding
                    ? "bg-[#00F58C]/20 text-[#00F58C] cursor-wait"
                    : !connected || depositEth > 0
                    ? "bg-[#00F58C] text-[#0B0E14] hover:bg-[#00FF9E] shadow-[0_0_30px_rgba(0,245,140,0.25)]"
                    : "bg-white/[0.06] text-[#6B7A88] cursor-not-allowed"
                }`}
              >
                {adding
                  ? "DEPOSITING…"
                  : !connected
                  ? connecting
                    ? "CONNECTING..."
                    : "CONNECT WALLET"
                  : depositEth > 0
                  ? "ADD LIQUIDITY"
                  : "ENTER AN AMOUNT"}
              </button>

              {liqTx && (
                <div className="mt-3 text-xs font-mono text-[#00F58C] break-all">
                  ✓ tx {liqTx.slice(0, 18)}…
                </div>
              )}
              {liqError && (
                <div className="mt-3 text-xs font-mono text-[#FF567E]">
                  ERROR: {liqError}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: orders allocated + yield/burn */}
          <div className="space-y-4">
            {/* Orders allocated — minimalista sem linhas */}
            <div className="glass-card rounded-3xl p-6 border border-white/[0.08]">
              <div className="text-[10px] tracking-[0.25em] text-[#6B7A88] font-mono mb-4">
                ORDERS ALLOCATED · {metrics.label}
              </div>
              <div className="text-5xl font-mono text-[#00F58C] glow-emerald">
                {metrics.txs}
              </div>
              <div className="text-[10px] text-[#6B7A88] font-mono mt-1">
                rotas ao motor anti-MEV · últimas 24h
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <Stat label="VOLUME" value={fmtUsd(metrics.vol)} />
                <Stat label="FEES" value={fmtUsd(metrics.fees)} color="#00F5FF" />
                <Stat
                  label="SPREAD"
                  value={`${pool?.spreadAPY ?? "—"}%`}
                  color={
                    parseFloat(pool?.spreadAPY || "0") >= 0
                      ? "#00F58C"
                      : "#FF567E"
                  }
                  sub="hook vs native"
                />
              </div>
            </div>

            {/* Yield & PnL — sem linhas */}
            <div className="glass-card rounded-3xl p-6 border border-white/[0.08]">
              <div className="text-[10px] tracking-[0.25em] text-[#6B7A88] font-mono mb-4">
                YIELD & P&L — SUA POSIÇÃO
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Stat
                  label="P&L (UNREALIZED)"
                  value={`${pnl >= 0 ? "+" : ""}${fmt(pnl, 4)} ETH`}
                  sub={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% · fees ${fmt(
                    lp ? parseFloat(lp.feeEarned) || 0 : 0,
                    4
                  )} ETH`}
                  color={pnl >= 0 ? "#00F58C" : "#FF567E"}
                  big
                />
                <Stat
                  label="POSITION"
                  value={`${fmt(positionEth, 4)} ETH`}
                  sub={`+ ${lp?.imdBalance ?? "0"} IMD · share ${
                    lp?.shareOfPool ?? "0"
                  }%`}
                  big
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <Stat label="YIELD / DAY" value={`${fmt(yieldDaily, 6)} ETH`} color="#00F58C" />
                <Stat label="YIELD / 30D" value={`${fmt(yieldMonthly, 5)} ETH`} color="#00F58C" />
                <Stat label="YIELD / YEAR" value={`${fmt(yieldYearly, 4)} ETH`} color="#00F58C" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <Stat
                  label="SEALS (NFT)"
                  value={connected ? String(seals) : "—"}
                  sub={
                    connected
                      ? genesisCount > 0
                        ? `${genesisCount} GENESIS · boost ×${sealMult.toFixed(2)}`
                        : "base yield · sem selos"
                      : "connect wallet"
                  }
                  color={genesisCount > 0 ? "#FFB000" : undefined}
                />
                <Stat
                  label="BURNED (TOTAL)"
                  value={`${burns ? fmt(parseFloat(burns.totalBurned) || 0, 0) : "—"} IMD`}
                  sub={burns?.burnRate || "—"}
                  color="#FF567E"
                />
                <Stat
                  label="BURN REWARDS"
                  value={`${burns ? fmt(parseFloat(burns.totalRewards) || 0, 1) : "—"} IMD`}
                  sub={
                    burns
                      ? `cap ${burns.capUtilization.toFixed(1)}%`
                      : "—"
                  }
                  color="#FFB000"
                />
              </div>

              <div className="mt-5 text-[10px] text-[#6B7A88]/80 font-mono leading-relaxed">
                Yield = posição × APY da pool × boost dos selos (GENESIS +25%,
                máx ×2.0). P&L calculado sobre Deposited events do hook.
                Burned = Trimmed events globais do protocolo.
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#6B7A88]/50 font-mono tracking-wider">
          └────────────────────────────────────────────────────────────────────────┘
        </div>
      </div>
    </div>
  );
}
