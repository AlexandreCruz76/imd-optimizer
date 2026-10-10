"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";
import {
  CompareAreaChart,
  PulseDot,
  Sparkline,
  useCountUp,
} from "../dashboard/charts";

// ---------------------------------------------------------------------------
// ABI
// ---------------------------------------------------------------------------
const ROUTER_ARB_ABI = [
  "function executeCustomArbitrage(address venueBuy, address venueSell, address token, uint256 amountIn, uint256 minProfit) payable",
];
const ROUTER_IDENTITY_ABI = [
  "function identityTier(address) view returns (uint8)",
];
const GENESIS_KEY_ABI = ["function balanceOf(address) view returns (uint256)"];

const TIER_NAMES = [
  "T1 · Buildercoin (Alpha)",
  "T2 · Identity md (Partner)",
  "T3 · $IMD/$BLD (Holder)",
  "T4 · Retail",
];

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface PoolState {
  hookTVL: string;
  hookVolumeUSD: string;
  hookFeesUSD: string;
  hookTxs24h: number;
  hookAPY: string;
  nativeTVL: string;
  nativeVolumeUSD: string;
  nativeFeesUSD: string;
  nativeTxs24h: number;
  nativeAPY: string;
  spreadAPY: string;
  price: string;
  ethUsd: string;
  dataSource?: string;
  timestamp?: string;
}

interface ArbFeed {
  current: {
    spread: number;
    hookAPY: number;
    nativeAPY: number;
    hookTVL: number;
    nativeTVL: number;
    winner: "hook" | "native";
    timestamp?: string;
  };
  stats?: {
    snapshotsCollected: number;
    avgSpread: string;
    maxSpread: string;
    minSpread: string;
    hookWins: number;
    nativeWins: number;
  };
  recommendation?: {
    migrationNeeded: boolean;
    recommendedPool: string;
    spreadThreshold: number;
    currentSpread: string;
    reasoning: string;
  };
  history: { timestamp: string; spread: number; winner: "hook" | "native" }[];
}

interface ArbConfig {
  optimizerRouter?: string;
  arbVenueBuy?: string;
  arbVenueSell?: string;
  standardToken?: string;
}

interface ArbLogEntry {
  time: string;
  spread: number;
  action: string;
  status: "ok" | "fail" | "info";
  tx?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function usd(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1000)
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Math.abs(n) >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function pct(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toFixed(2) + "%";
}

function shortAddr(a: string) {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

/** Count-up animado para valores USD (evita re-render do pai). */
function CountUpUsd({ value, color = "#00F58C" }: { value: number; color?: string }) {
  const shown = useCountUp(value);
  return (
    <span style={{ color }} className="tabular-nums">
      {usd(shown)}
    </span>
  );
}

function CountUpPct({ value, color = "#00F58C" }: { value: number; color?: string }) {
  const shown = useCountUp(value);
  return (
    <span style={{ color }} className="tabular-nums">
      {pct(shown)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function PoolCard({
  label,
  tag,
  color,
  tvl,
  volume,
  fees,
  apy,
  txs,
  tvlSeries,
  active,
  delay = 0,
}: {
  label: string;
  tag: string;
  color: string;
  tvl: number;
  volume: number;
  fees: number;
  apy: number;
  txs: number;
  tvlSeries: number[];
  active: boolean;
  delay?: number;
}) {
  return (
    <div
      className="rise relative overflow-hidden rounded-2xl border p-5 transition-all duration-300"
      style={{
        animationDelay: `${delay}ms`,
        borderColor: active ? `${color}66` : "rgba(255,255,255,0.08)",
        background: "linear-gradient(160deg, #0B111A 0%, #0D1520 100%)",
        boxShadow: active ? `0 0 30px ${color}22` : "none",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      {/* Orbe de liquidez: flutua e "respira" — ganha corpo quando a pool vence */}
      <div aria-hidden className="orb-float pointer-events-none absolute right-4 top-14 h-12 w-12">
        <div
          className="orb-breath h-full w-full rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, #FFFFFFAA, ${color} 45%, transparent 75%)`,
            boxShadow: `0 0 ${active ? 28 : 16}px ${color}${active ? "88" : "44"}`,
            opacity: active ? 1 : 0.65,
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="font-mono text-[11px] tracking-[0.2em] text-slate-300 uppercase">{label}</span>
        </div>
        <span
          className="rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase"
          style={{ color, borderColor: `${color}55`, background: `${color}15` }}
        >
          {tag}
        </span>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">TVL</div>
        <div className="mt-0.5 text-3xl font-bold tracking-tight">
          <CountUpUsd value={tvl} color={color} />
        </div>
      </div>

      <div className="mt-3 h-12">
        <Sparkline values={tvlSeries} color={color} width={240} height={44} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">VOLUME 24H</div>
          <div className="mt-0.5 font-mono text-sm text-white/90">{usd(volume)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">FEES 24H</div>
          <div className="mt-0.5 font-mono text-sm text-white/90">{usd(fees)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">TXS 24H</div>
          <div className="mt-0.5 font-mono text-sm text-white/90">{txs}</div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-white/5 pt-3">
        <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">APY (fees reais)</span>
        <span className="text-xl font-bold">
          <CountUpPct value={apy} color={color} />
        </span>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color = "#00F58C",
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex justify-between py-2 border-t border-slate-800/50">
      <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">{label}</span>
      <div className="text-right">
        <div className="font-mono font-bold tracking-tight" style={{ color }}>
          {value}
        </div>
        {sub && <div className="font-mono text-[10px] tracking-widest text-slate-500 uppercase mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default function MetaHookPoolPage() {
  const { connected, address, connecting, walletError, walletName, connect, signer, provider } = useWallet();

  const [pool, setPool] = useState<PoolState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  // Série de TVL para os sparklines (hook / native)
  const [hookSeries, setHookSeries] = useState<number[]>([]);
  const [nativeSeries, setNativeSeries] = useState<number[]>([]);

  // Arbitrage feed
  const [feed, setFeed] = useState<ArbFeed | null>(null);
  const [config, setConfig] = useState<ArbConfig>({});
  const [threshold, setThreshold] = useState(2.0);
  const [capital, setCapital] = useState("0.001");
  const [autoOn, setAutoOn] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [arbLog, setArbLog] = useState<ArbLogEntry[]>([]);
  const lastAutoAtRef = useRef(0);

  // Identidade
  const [tier, setTier] = useState<number | null>(null);
  const [nftHeld, setNftHeld] = useState<number | null>(null);

  const hookTvl = parseFloat(pool?.hookTVL || "0") || 0;
  const nativeTvl = parseFloat(pool?.nativeTVL || "0") || 0;
  const hookVol = parseFloat(pool?.hookVolumeUSD || "0") || 0;
  const nativeVol = parseFloat(pool?.nativeVolumeUSD || "0") || 0;
  const hookFees = parseFloat(pool?.hookFeesUSD || "0") || 0;
  const nativeFees = parseFloat(pool?.nativeFeesUSD || "0") || 0;
  const hookApy = parseFloat(pool?.hookAPY || "0") || 0;
  const nativeApy = parseFloat(pool?.nativeAPY || "0") || 0;
  const hookTxs = pool?.hookTxs24h || 0;
  const nativeTxs = pool?.nativeTxs24h || 0;
  const totalTvl = hookTvl + nativeTvl;
  const totalVol = hookVol + nativeVol;
  const totalFees = hookFees + nativeFees;
  const totalTxs = hookTxs + nativeTxs;
  const ethUsd = parseFloat(pool?.ethUsd || "0") || 0;
  const poolPrice = parseFloat(pool?.price || "0") || 0;
  const spread = feed?.current.spread ?? (parseFloat(pool?.spreadAPY || "0") || 0);
  const absSpread = Math.abs(spread);
  const actionable = absSpread >= threshold;
  const winner = spread > 0 ? "hook" : "native";

  const loadPool = useCallback(async () => {
    try {
      const res = await fetch("/api/pool-state");
      const json = await res.json();
      if (json?.error) {
        setError(json.error);
        return;
      }
      setPool(json);
      setError(null);
      const h = parseFloat(json.hookTVL) || 0;
      const n = parseFloat(json.nativeTVL) || 0;
      if (h > 0 || n > 0) {
        setHookSeries((prev) => [...prev.slice(-39), h]);
        setNativeSeries((prev) => [...prev.slice(-39), n]);
      }
    } catch {
      setError("pool-state indisponível");
    }
  }, []);

  const loadArb = useCallback(async () => {
    try {
      const res = await fetch("/api/arbitrage");
      const json = await res.json();
      if (!json.error) setFeed(json);
    } catch {
      /* feed opcional */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPool();
    void loadArb();
    const iv = setInterval(() => {
      void loadPool();
      void loadArb();
    }, 15000);
    return () => clearInterval(iv);
  }, [loadPool, loadArb]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  // Relógio LIVE + "now" para animações (evita Date.now em render)
  useEffect(() => {
    const tick = () => {
      setLiveTime(
        new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setNow(Date.now());
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Identidade on-chain
  useEffect(() => {
    let alive = true;
    if (!connected || !address) {
      const t = setTimeout(() => {
        setTier(null);
        setNftHeld(null);
      }, 0);
      return () => clearTimeout(t);
    }
    (async () => {
      try {
        const cfgRes = await fetch("/api/config");
        const cfg = await cfgRes.json();
        const p = new ethers.JsonRpcProvider(cfg.rpcUrl || "https://ethereum-sepolia-rpc.publicnode.com");
        if (!alive) return;
        if (cfg?.genesisKey) {
          try {
            const key = new ethers.Contract(cfg.genesisKey, GENESIS_KEY_ABI, p);
            const bal = await key.balanceOf(address);
            if (alive) setNftHeld(Number(bal));
          } catch {
            if (alive) setNftHeld(-1);
          }
        } else if (alive) setNftHeld(-1);
        if (cfg?.optimizerRouter) {
          try {
            const router = new ethers.Contract(cfg.optimizerRouter, ROUTER_IDENTITY_ABI, p);
            const t = await router.identityTier(address);
            if (alive) setTier(Number(t));
          } catch {
            if (alive) setTier(null);
          }
        }
      } catch {
        if (alive) {
          setTier(null);
          setNftHeld(-1);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, address]);

  const pushLog = useCallback((entry: ArbLogEntry) => {
    setArbLog((prev) => [entry, ...prev].slice(0, 12));
  }, []);

  /** Dry-run: chama executeCustomArbitrage via provider (eth_call) sem gastar gas. */
  const runDry = useCallback(async () => {
    if (!config.optimizerRouter || !config.arbVenueBuy || !config.arbVenueSell || !config.standardToken) {
      pushLog({ time: new Date().toLocaleTimeString("en-US", { hour12: false }), spread, action: "dry-run", status: "fail", tx: "venues não configuradas" });
      return;
    }
    setDryRunning(true);
    try {
      const p = provider ?? new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const router = new ethers.Contract(config.optimizerRouter, ROUTER_ARB_ABI, p);
      const amt = ethers.parseEther(capital || "0");
      const minProfit = (amt * BigInt(Math.round(threshold * 100))) / 10000n;
      await router.executeCustomArbitrage.staticCall(config.arbVenueBuy, config.arbVenueSell, config.standardToken, amt, minProfit, { value: amt });
      pushLog({
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        spread,
        action: "dry-run OK",
        status: "ok",
        tx: "simulação passou (sem gas)",
      });
    } catch (err) {
      pushLog({
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        spread,
        action: "dry-run FAIL",
        status: "fail",
        tx: err instanceof Error ? err.message.slice(0, 90) : "revert",
      });
    } finally {
      setDryRunning(false);
    }
  }, [config, capital, threshold, spread, provider, pushLog]);

  /** Execução live (assinada pela wallet). */
  const runLive = useCallback(async () => {
    if (!connected) {
      await connect();
      return;
    }
    if (!signer || !config.optimizerRouter || !config.arbVenueBuy || !config.arbVenueSell || !config.standardToken) {
      pushLog({ time: new Date().toLocaleTimeString("en-US", { hour12: false }), spread, action: "execute", status: "fail", tx: "wallet/venues prontas?" });
      return;
    }
    setExecuting(true);
    try {
      const router = new ethers.Contract(config.optimizerRouter, ROUTER_ARB_ABI, signer);
      const amt = ethers.parseEther(capital || "0");
      const minProfit = (amt * BigInt(Math.round(threshold * 100))) / 10000n;
      const tx = await router.executeCustomArbitrage(config.arbVenueBuy, config.arbVenueSell, config.standardToken, amt, minProfit, { value: amt });
      pushLog({ time: new Date().toLocaleTimeString("en-US", { hour12: false }), spread, action: "execute tx", status: "info", tx: tx.hash.slice(0, 18) + "…" });
      await tx.wait();
      pushLog({ time: new Date().toLocaleTimeString("en-US", { hour12: false }), spread, action: "confirmed", status: "ok", tx: tx.hash.slice(0, 18) + "…" });
    } catch (err) {
      pushLog({
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        spread,
        action: "execute FAIL",
        status: "fail",
        tx: err instanceof Error ? err.message.slice(0, 90) : "reverted",
      });
    } finally {
      setExecuting(false);
    }
  }, [connected, signer, config, capital, threshold, spread, connect, pushLog]);

  // Engine automática: quando ligada e spread cruza o threshold, dry-run sozinho.
  // Cooldown de 45s para não spammar. Live NUNCA roda automático (precisa clique).
  const autoArmedRef = useRef(false);
  useEffect(() => {
    if (!autoOn || !actionable || dryRunning || executing) return;
    if (now - lastAutoAtRef.current < 45_000) return;
    lastAutoAtRef.current = now;
    autoArmedRef.current = true;
    void runDry();
  }, [autoOn, actionable, now, dryRunning, executing, runDry]);

  // Gráfico comparativo: histórico de spread (acumulado em memória)
  const [spreadHist, setSpreadHist] = useState<{ t: string; h: number; n: number }[]>([]);
  useEffect(() => {
    if (!feed?.current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpreadHist((prev) => {
      const stamp = feed.current.timestamp
        ? new Date(feed.current.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
        : String(prev.length + 1).padStart(2, "0");
      const last = prev[prev.length - 1];
      if (last && last.h === feed.current.hookAPY && last.n === feed.current.nativeAPY) return prev;
      return [...prev.slice(-39), { t: stamp, h: feed.current.hookAPY, n: feed.current.nativeAPY }];
    });
  }, [feed]);

  return (
    <div className="relative min-h-screen bg-[#070A0F] font-mono">
      {/* Background sutil (arte existente) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.10]"
        style={{
          backgroundImage: "url(/images/meta-hook-bg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% -10%, rgba(0,245,140,0.06), transparent), radial-gradient(900px 500px at 90% 10%, rgba(0,245,255,0.05), transparent)",
        }}
      />

      <main className="relative z-10 pt-24 space-y-6 max-w-7xl mx-auto px-4 md:px-8 pb-10">
        {/* Command bar */}
        <div className="rise flex flex-wrap items-center justify-between gap-3 font-mono text-sm tracking-[0.25em] text-slate-300 uppercase">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">┌─</span>
            {/* Gancho dourado: assinatura anti-MEV balançando */}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="hook-sway h-5 w-5 shrink-0"
              fill="none"
              stroke="#FFD700"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 3v8a5 5 0 0 0 10 0" />
              <path d="M9 5l3-3 3 3" />
              <circle cx="22" cy="11" r="1.6" fill="#FFD700" stroke="none" />
            </svg>
            <span className="text-white/92 font-bold tracking-widest">META HOOK POOL</span>
            <span className="text-slate-600">──</span>
            <span className="text-slate-300 font-medium">DUAL POOL · ANTI-MEV · ARB</span>
          </div>
          <div className="flex items-center gap-4 text-xs tracking-widest">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <PulseDot /> LIVE {liveTime ?? "--:--:--"}
            </span>
            <button
              onClick={() => {
                void loadPool();
                void loadArb();
              }}
              className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold"
            >
              ⟳ SYNC
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm font-mono">
            {error}
          </div>
        )}

        {/* Header KPIs agregados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "TVL COMBINADA", v: <CountUpUsd value={totalTvl} />, c: "#00F58C" },
            { l: "VOLUME 24H", v: <CountUpUsd value={totalVol} />, c: "#00F5FF" },
            { l: "FEES 24H", v: <CountUpUsd value={totalFees} />, c: "#FFB000" },
            { l: "TXS 24H", v: <span style={{ color: "#A78BFA" }} className="tabular-nums">{totalTxs}</span>, c: "#A78BFA" },
          ].map((k, i) => (
            <div
              key={i}
              className="rise rounded-xl border border-white/[0.07] bg-[#0B111A]/80 px-4 py-3"
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <div className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">{k.l}</div>
              <div className="mt-0.5 text-xl font-bold tracking-tight">{k.v}</div>
            </div>
          ))}
        </div>

        {/* As 2 POOLS lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PoolCard
            label="HOOK POOL"
            tag="anti-MEV"
            color="#00F58C"
            tvl={hookTvl}
            volume={hookVol}
            fees={hookFees}
            apy={hookApy}
            txs={hookTxs}
            tvlSeries={hookSeries}
            active={winner === "hook" && actionable}
            delay={240}
          />
          <PoolCard
            label="NATIVE POOL"
            tag="baseline"
            color="#00F5FF"
            tvl={nativeTvl}
            volume={nativeVol}
            fees={nativeFees}
            apy={nativeApy}
            txs={nativeTxs}
            tvlSeries={nativeSeries}
            active={winner === "native" && actionable}
            delay={320}
          />
        </div>

        {/* Rota de arbitragem: linha pontilhada com fluxo animado no sentido da rota */}
        <div
          className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 px-5 py-4"
          style={{ animationDelay: "400ms" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
              ROTA DE ARBITRAGEM AO VIVO
            </span>
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: actionable ? (winner === "hook" ? "#00F58C" : "#00F5FF") : "#6B7A88" }}
            >
              {actionable
                ? `fluxo ${winner === "hook" ? "NATIVE → HOOK" : "HOOK → NATIVE"} · ${absSpread.toFixed(2)}%`
                : "sem fluxo — spread abaixo do threshold"}
            </span>
          </div>
          <svg
            aria-hidden
            viewBox="0 0 800 44"
            className="h-11 w-full"
            preserveAspectRatio="none"
          >
            {/* Sentido do fluxo: origem (esquerda) → destino (direita) */}
            <line
              x1="60"
              y1="22"
              x2="740"
              y2="22"
              stroke={actionable ? (winner === "hook" ? "#00F58C" : "#00F5FF") : "#1E293B"}
              strokeWidth="2"
              className={actionable ? "flow-line" : ""}
              style={actionable ? undefined : { strokeDasharray: "6 8" }}
            />
            <circle cx="60" cy="22" r="6" fill="#0B111A" stroke="#6B7A88" strokeWidth="2" />
            <circle
              cx="740"
              cy="22"
              r="7"
              fill={actionable ? (winner === "hook" ? "#00F58C" : "#00F5FF") : "#1E293B"}
              className={actionable ? "flow-node" : ""}
            />
            <text x="60" y="42" textAnchor="middle" fontSize="10" fill="#6B7A88" fontFamily="monospace">
              {winner === "hook" ? "NATIVE" : "HOOK"}
            </text>
            <text x="740" y="42" textAnchor="middle" fontSize="10" fill={actionable ? "#E8E8E8" : "#6B7A88"} fontFamily="monospace">
              {winner === "hook" ? "HOOK" : "NATIVE"}
            </text>
          </svg>
        </div>

        {/* Spread + Gráfico comparativo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="rise lg:col-span-2 rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5"
            style={{ animationDelay: "460ms" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
                APY HOOK vs NATIVE — SÉRIE AO VIVO
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                poll 15s · {feed?.stats?.snapshotsCollected ?? 0} snapshots
              </span>
            </div>
            <CompareAreaChart
              labels={spreadHist.map((s) => s.t)}
              series={[
                { name: "Hook APY", color: "#00F58C", values: spreadHist.map((s) => s.h) },
                { name: "Native APY", color: "#00F5FF", values: spreadHist.map((s) => s.n) },
              ]}
              height={220}
              unit="%"
            />
          </div>

          <div
            className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5 flex flex-col"
            style={{ animationDelay: "520ms", ...(actionable ? { boxShadow: `0 0 26px ${spread >= 0 ? "rgba(0,245,140,0.18)" : "rgba(0,245,255,0.18)"}` } : {}) }}
          >
            <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">
              SPREAD (HOOK − NATIVE)
            </span>
            <div className="text-4xl font-bold tracking-tight" style={{ color: spread >= 0 ? "#00F58C" : "#FB7185" }}>
              {spread >= 0 ? "+" : ""}
              <CountUpPct value={spread} color={spread >= 0 ? "#00F58C" : "#FB7185"} />
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-500">
              vencedor agora: <span className="text-white/80 uppercase">{winner}</span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-400 uppercase tracking-widest font-mono text-[10px]">HOOK APY</span>
                <span className="text-emerald-400 font-mono">{pct(hookApy)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-400 uppercase tracking-widest font-mono text-[10px]">NATIVE APY</span>
                <span className="text-cyan-400 font-mono">{pct(nativeApy)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-400 uppercase tracking-widest font-mono text-[10px]">ETH/USD</span>
                <span className="text-white/90 font-mono">{usd(ethUsd)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-400 uppercase tracking-widest font-mono text-[10px]">POOL PRICE</span>
                <span className="text-white/90 font-mono">{poolPrice > 0 ? poolPrice.toFixed(2) : "—"} IMD/ETH</span>
              </div>
            </div>

            <div
              className="mt-4 rounded-xl border px-3 py-2 text-[11px] font-mono"
              style={{
                borderColor: actionable ? `${spread >= 0 ? "#00F58C" : "#00F5FF"}55` : "rgba(255,255,255,0.08)",
                background: actionable ? `${spread >= 0 ? "#00F58C" : "#00F5FF"}10` : "transparent",
                color: actionable ? (spread >= 0 ? "#00F58C" : "#00F5FF") : "#6B7A88",
              }}
            >
              {actionable
                ? `⚠ SPREAD ACIMA DO THRESHOLD (${threshold}%) — rota ${winner === "hook" ? "NATIVE → HOOK" : "HOOK → NATIVE"} candidata`
                : `spread abaixo do threshold (${threshold}%) — hold`}
            </div>
          </div>
        </div>

        {/* ENGINE DE ARBITRAGEM AUTOMÁTICA */}
        <div
          className={`rise rounded-2xl border border-emerald-500/20 bg-[#0B111A]/80 p-5 ${autoOn ? "engine-armed" : ""}`}
          style={{ animationDelay: "580ms" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.2em] text-emerald-400 uppercase">
                ⚡ ENGINE DE ARBITRAGEM AUTOMÁTICA
              </span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-amber-400 uppercase">
                testnet
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <span className={`inline-block h-2 w-2 rounded-full ${autoOn ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              {autoOn ? "AUTO ARMADA" : "AUTO DESLIGADA"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Controles */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">THRESHOLD SPREAD (%)</label>
                <div className="mt-1 flex gap-2">
                  {[0.5, 1, 2, 5].map((t) => (
                    <button
                      key={t}
                      onClick={() => setThreshold(t)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-mono transition-all ${
                        threshold === t
                          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
                          : "border-slate-700/50 bg-slate-900/40 text-slate-300 hover:border-emerald-500/30"
                      }`}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">CAPITAL (ETH)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 font-mono text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} className="accent-emerald-500 h-4 w-4" />
                <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                  Auto (dry-run no threshold)
                </span>
              </label>
              <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
                A engine automática só roda <span className="text-emerald-400">dry-run</span> (eth_call, sem gas).
                A execução <span className="text-amber-400">live</span> exige clique manual — nunca assina sozinha.
              </p>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <button
                onClick={() => void runDry()}
                disabled={dryRunning}
                className={`w-full rounded-xl border border-emerald-500/50 bg-slate-800/40 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400 hover:bg-slate-700/50 transition-all active:scale-[0.98] disabled:opacity-60 ${actionable && !dryRunning ? "cta-pulse" : ""}`}
              >
                {dryRunning ? "SIMULANDO…" : "▶ DRY-RUN (sem gas)"}
              </button>
              <button
                onClick={() => void runLive()}
                disabled={executing}
                className={`w-full rounded-xl bg-emerald-500 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-black hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(0,245,140,0.35)] transition-all active:scale-[0.98] disabled:opacity-60 ${actionable && !executing ? "cta-pulse" : ""}`}
              >
                {executing ? "EXECUTANDO…" : connected ? "▶ EXECUTE LIVE (assina tx)" : `CONECTAR ${walletName.toUpperCase()}`}
              </button>
              <div className="rounded-lg border border-white/[0.06] bg-slate-900/30 p-2 text-[10px] font-mono text-slate-500">
                venues: {config.arbVenueBuy ? shortAddr(config.arbVenueBuy) : "—"} /{" "}
                {config.arbVenueSell ? shortAddr(config.arbVenueSell) : "—"} · token:{" "}
                {config.standardToken ? shortAddr(config.standardToken) : "—"}
              </div>
              {walletError && !connected && (
                <div className="text-[10px] font-mono text-rose-400">{walletError}</div>
              )}
            </div>

            {/* Log */}
            <div className="rounded-xl border border-white/[0.06] bg-slate-900/30 p-3">
              <div className="mb-2 font-mono text-[10px] tracking-widest text-slate-400 uppercase">EXECUTION LOG</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {arbLog.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-600">
                    sem ações nesta sessão. ligue a engine ou dispare um dry-run.
                  </div>
                ) : (
                  arbLog.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded bg-white/[0.02] px-2 py-1 text-[10px] font-mono">
                      <span className="text-slate-500">{e.time}</span>
                      <span style={{ color: e.status === "ok" ? "#00F58C" : e.status === "fail" ? "#FB7185" : "#00F5FF" }}>
                        {e.action}
                        {e.tx ? ` · ${e.tx}` : ""}
                      </span>
                      <span className="text-slate-400">{e.spread >= 0 ? "+" : ""}{e.spread.toFixed(2)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Identidade + Radar (compacto) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5"
            style={{ animationDelay: "640ms" }}
          >
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">IDENTIDADE / TIER</div>
            {connected ? (
              <div className="space-y-2">
                <StatRow
                  label="OPTIMIZER NFT"
                  value={nftHeld === null ? "querying…" : nftHeld === -1 ? "—" : nftHeld > 0 ? `${nftHeld} Buildercoin` : "none"}
                  color={nftHeld !== null && nftHeld > 0 ? "#FFD700" : "#00F58C"}
                />
                <StatRow
                  label="TIER"
                  value={tier !== null ? TIER_NAMES[tier] ?? `Tier ${tier}` : "querying…"}
                  color="#00F5FF"
                />
                <div className="pt-2">
                  <Link href="/nft-mint" className="text-emerald-400 hover:text-emerald-300 underline text-xs font-mono">
                    → mint Buildercoin para destravar Tier Alpha
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Conecte a wallet para ler seu tier on-chain. Leitura apenas — a engine de arbitragem usa a mesma
                  carteira só quando você clica em EXECUTE LIVE.
                </p>
                <button
                  onClick={() => void connect()}
                  disabled={connecting}
                  className="w-full rounded-xl border border-emerald-500/50 bg-slate-800/40 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400 hover:bg-slate-700/50 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {connecting ? "OPENING…" : `CONNECT ${walletName.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>

          <div
            className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5"
            style={{ animationDelay: "700ms" }}
          >
            <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-3">COMPARATIVO RÁPIDO</div>
            <StatRow label="TVL HOOK" value={usd(hookTvl)} color="#00F58C" sub={`${((hookTvl / Math.max(totalTvl, 1)) * 100).toFixed(1)}% do total`} />
            <StatRow label="TVL NATIVE" value={usd(nativeTvl)} color="#00F5FF" sub={`${((nativeTvl / Math.max(totalTvl, 1)) * 100).toFixed(1)}% do total`} />
            <StatRow
              label="RECOMENDAÇÃO"
              value={feed?.recommendation?.recommendedPool?.toUpperCase() ?? (actionable ? winner.toUpperCase() : "HOLD")}
              color={actionable ? "#FFB000" : "#6B7A88"}
              sub={feed?.recommendation?.reasoning ?? "feed de arbitragem"}
            />
            <StatRow
              label="WIN RATE (sessão)"
              value={`${feed?.stats?.hookWins ?? 0}H / ${feed?.stats?.nativeWins ?? 0}N`}
              color="#A78BFA"
              sub={`avg spread ${feed?.stats?.avgSpread ?? "—"}%`}
            />
            <div className="mt-3 text-[10px] font-mono text-slate-600">
              fonte: {pool?.dataSource ?? "—"} · dados reais (The Graph / event indexer / StateView)
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono tracking-wider text-center pt-2 border-t border-slate-800/50">
          └────────────────────────────────────────────────────────────────────────┘
        </div>
      </main>
    </div>
  );
}
