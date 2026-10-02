"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../components/WalletProvider";

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
}

function fmtUsd(n: number): string {
  if (!isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmt(n: number, d = 4): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: d });
}

function Sparkline({ data, color = "#00F58C" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-20 flex items-center justify-center text-xs text-slate-500 font-mono">collecting…</div>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(2)},${(20 - ((v - min) / range) * 18 - 1).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 20" className="w-full h-20" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,20 ${pts} 100,20`} fill="url(#g)"/><polyline points={pts} fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 ${className}`}>
      <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">{title}</div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color = "#00F58C", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex justify-between py-2 border-t border-slate-800/30">
      <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">{label}</span>
      <div className="text-right">
        <div className="font-mono font-bold tracking-tight text-white" style={{ color }}>{value}</div>
        {sub && <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function MetaHookPoolPage() {
  const { connected, address } = useWallet();
  const [pool, setPool] = useState<PoolState | null>(null);
  const [ethSeries, setEthSeries] = useState<number[]>([]);
  const [mevSeries, setMevSeries] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadPool = useCallback(async () => {
    try {
      const res = await fetch("/api/pool-state");
      const json = await res.json();
      if (json?.price) {
        setPool(json);
        const p = parseFloat(json.ethUsd) || 0;
        if (p > 0) setEthSeries(prev => [...prev.slice(-39), p]);
        const mev = parseFloat(json.hookFeesUSD) || 0;
        setMevSeries(prev => [...prev.slice(-23), mev]);
        setError(null);
      } else if (json?.error) setError(json.error);
    } catch { setError("pool-state unavailable"); }
  }, []);

  useEffect(() => {
    const boot = setTimeout(loadPool, 0);
    const id = setInterval(loadPool, 15000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
    };
  }, [loadPool]);

  const price = pool ? parseFloat(pool.price) || 0 : 0;
  const ethUsd = pool ? parseFloat(pool.ethUsd) || 0 : 0;
  const hookTVL = parseFloat(pool?.hookTVL || "0");
  const nativeTVL = parseFloat(pool?.nativeTVL || "0");
  const hookVol = parseFloat(pool?.hookVolumeUSD || "0");
  const nativeVol = parseFloat(pool?.nativeVolumeUSD || "0");
  const hookFees = parseFloat(pool?.hookFeesUSD || "0");
  const nativeFees = parseFloat(pool?.nativeFeesUSD || "0");
  const hookAPY = parseFloat(pool?.hookAPY || "0");
  const nativeAPY = parseFloat(pool?.nativeAPY || "0");
  const spread = parseFloat(pool?.spreadAPY || "0");
  const hookTxs = pool?.hookTxs24h || 0;
  const nativeTxs = pool?.nativeTxs24h || 0;

  return (
    <div className="min-h-screen bg-[#070A0F] p-4 md:p-6">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-[#0D121A]"><img src="/images/avatar.jpg" alt="IMD" className="w-full h-full object-cover"/></div>
            <span className="hidden sm:block text-xl font-bold text-white">IMD Optimizer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-emerald-400 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg><span className="hidden sm:inline">Home</span></Link>
            <Link href="/swap" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Swap</Link>
            <Link href="/arbitrage" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Arbitrage</Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between font-mono text-sm tracking-[0.25em] text-slate-300 uppercase mb-6">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">┌─</span>
            <span className="text-white font-bold tracking-widest">META HOOK POOL</span>
            <span className="text-slate-600">──</span>
            <span className="text-slate-300 font-medium">ANTI-MEV ARBITRAGE</span>
            <span className="text-slate-700 hidden md:inline">────────────────────────────────────┐</span>
          </div>
          <div className="flex items-center gap-4 text-xs tracking-widest">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE 00:09:56
            </span>
            <button className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold">
              REFRESH
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="HOOK POOL">
            <StatRow label="TVL" value={fmtUsd(hookTVL)} color="#00F58C"/>
            <StatRow label="APY" value={`${hookAPY.toFixed(2)}%`} color="#00F58C"/>
            <StatRow label="FEES 24H" value={fmtUsd(hookFees)} color="#00F5FF"/>
            <StatRow label="VOL 24H" value={fmtUsd(hookVol)} color="#00F5FF"/>
            <StatRow label="TXS 24H" value={fmt(hookTxs, 0)} color="#BB86FC"/>
          </Card>

          <Card title="NATIVE POOL">
            <StatRow label="TVL" value={fmtUsd(nativeTVL)} color="#FF567E"/>
            <StatRow label="APY" value={`${nativeAPY.toFixed(2)}%`} color="#FF567E"/>
            <StatRow label="FEES 24H" value={fmtUsd(nativeFees)} color="#FFB000"/>
            <StatRow label="VOL 24H" value={fmtUsd(nativeVol)} color="#FFB000"/>
            <StatRow label="TXS 24H" value={fmt(nativeTxs, 0)} color="#BB86FC"/>
          </Card>

          <Card title="PRICING & SPREAD">
            <div className="text-center py-4">
              <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-1">IMD / ETH</div>
              <div className="font-mono font-bold tracking-tight text-white text-3xl">{price > 0 ? fmt(price, 2) : "—"}</div>
              <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mt-1">ETH/USD: {ethUsd > 0 ? fmtUsd(ethUsd) : "—"}</div>
            </div>
            <StatRow label="SPREAD" value={`${spread >= 0 ? "+" : ""}${spread.toFixed(2)}%`} color={spread >= 0 ? "#00F58C" : "#FF567E"} sub={spread >= 0 ? "hook premium" : "native premium"}/>
            <StatRow label="TOTAL VOL" value={fmtUsd(hookVol + nativeVol)} color="#00F5FF"/>
            <StatRow label="TOTAL FEES" value={fmtUsd(hookFees + nativeFees)} color="#FFB000"/>
          </Card>

          <Card title="MEV NEUTRALIZATION">
            <StatRow label="NEUTRALIZED" value={fmt(hookTxs + nativeTxs, 0)} color="#00F58C" sub="last 24h"/>
            <div className="pt-2"><Sparkline data={mevSeries} color="#FF567E"/></div>
            <p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase text-center mt-1">peaks = toxic swaps intercepted</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="ETH/USD SESSION" className="lg:col-span-2">
            <Sparkline data={ethSeries} color="#00F5FF"/>
          </Card>
        </div>
      </main>
    </div>
  );
}