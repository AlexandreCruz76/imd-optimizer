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

interface UserLp {
  ethBalance: string;
  imdBalance: string;
  shareOfPool: string;
  feeEarned: string;
  pnl: string;
  pnlPercent: string;
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
  if (data.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-mono">collecting…</div>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(2)},${(30 - ((v - min) / range) * 28 - 1).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${pts} 100,30`} fill="url(#g)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111A]/90 border border-emerald-500/25 rounded-2xl p-5 ${className}`}>
      <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">{title}</div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color = "#00F58C", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex justify-between py-2 border-t border-slate-800/50">
      <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">{label}</span>
      <div className="text-right">
        <div className="font-mono font-bold tracking-tight text-white" style={{ color }}>{value}</div>
        {sub && <div className="font-mono text-[10px] tracking-widest text-slate-500 uppercase mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function DualStat({ leftLabel, leftValue, leftColor, rightLabel, rightValue, rightColor, sub }: { 
  leftLabel: string; leftValue: string; leftColor?: string;
  rightLabel: string; rightValue: string; rightColor?: string;
  sub?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 py-2 border-t border-slate-800/50">
      <div>
        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">{leftLabel}</div>
        <div className="font-mono font-bold tracking-tight text-white" style={{ color: leftColor }}>{leftValue}</div>
      </div>
      <div>
        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">{rightLabel}</div>
        <div className="font-mono font-bold tracking-tight text-white" style={{ color: rightColor }}>{rightValue}</div>
      </div>
      {sub && <div className="col-span-2 font-mono text-[10px] tracking-widest text-slate-500 uppercase mt-1">{sub}</div>}
    </div>
  );
}

export default function MetaHookPoolPage() {
  const { connected, address, connect } = useWallet();
  const [pool, setPool] = useState<PoolState | null>(null);
  const [lp, setLp] = useState<UserLp | null>(null);
  const [ethSeries, setEthSeries] = useState<number[]>([]);
  const [mevSeries, setMevSeries] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ethInput, setEthInput] = useState("");
  const [imdInput, setImdInput] = useState("");

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

  const loadUser = useCallback(async () => {
    if (!address) return;
    try {
      const lpRes = await fetch(`/api/user-lp?address=${address}`);
      const lpJson = await lpRes.json();
      if (lpJson && !lpJson.error) setLp(lpJson);
    } catch {}
  }, [address]);

  useEffect(() => {
    const boot = setTimeout(loadPool, 0);
    const id = setInterval(loadPool, 15000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
    };
  }, [loadPool]);

  useEffect(() => {
    if (address) {
      loadUser();
      const id = setInterval(loadUser, 30000);
      return () => clearInterval(id);
    }
  }, [address, loadUser]);

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
  const totalTxs = hookTxs + nativeTxs;
  const totalTVL = hookTVL + nativeTVL;
  const totalVol = hookVol + nativeVol;
  const totalFees = hookFees + nativeFees;

  const positionEth = lp ? parseFloat(lp.ethBalance) || 0 : 0;
  const imdBalance = lp ? parseFloat(lp.imdBalance) || 0 : 0;
  const shareOfPool = lp ? parseFloat(lp.shareOfPool) || 0 : 0;
  const feeEarned = lp ? parseFloat(lp.feeEarned) || 0 : 0;
  const pnl = lp ? parseFloat(lp.pnl) || 0 : 0;
  const pnlPct = lp ? parseFloat(lp.pnlPercent) || 0 : 0;

  const dailyYield = totalTVL > 0 ? (totalFees / totalTVL) * positionEth * 100 : 0;
  const monthlyYield = dailyYield * 30;
  const annualYield = dailyYield * 365;

  const handleDeposit = async (token: "ETH" | "IMD") => {
    const amount = token === "ETH" ? ethInput : imdInput;
    if (!amount || parseFloat(amount) <= 0) return;
    if (!connected) return;
    console.log(`Deposit ${amount} ${token}`);
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-[#0D121A]"><img src="/images/avatar.jpg" alt="IMD" className="w-full h-full object-cover"/></div>
            <span className="hidden sm:block text-xl font-bold text-white">IMD Optimizer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-emerald-400 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg><span className="hidden sm:inline">Home</span></Link>
            <Link href="/swap" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Swap</Link>
            <Link href="/pool" className="text-sm text-emerald-400 font-bold hidden sm:inline">Meta Hook Pool</Link>
            <Link href="/arbitrage" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Arbitrage</Link>
            <Link href="/staking" className="text-sm text-slate-400 hover:text-emerald-400 hidden sm:inline">Staking</Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 space-y-6 max-w-7xl mx-auto px-4 md:px-8">
        {/* Terminal Header */}
        <div className="flex items-center justify-between font-mono text-sm tracking-[0.25em] text-slate-300 uppercase mb-6">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">┌─</span>
            <span className="text-white font-bold tracking-widest">META HOOK POOL</span>
            <span className="text-slate-600">──</span>
            <span className="text-slate-300 font-medium">ANTI-MEV TELEMETRY</span>
            <span className="text-slate-700 hidden md:inline">────────────────────────────────────┐</span>
          </div>
          <div className="flex items-center gap-4 text-xs tracking-widest">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE {formatTime()}
            </span>
            <button onClick={loadPool} className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold">REFRESH</button>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm font-mono">{error}</div>}

        {/* Top Row: Quote/Chart + Quick Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Quote & Chart */}
          <Card title="QUOTE & CHART [SYS.01]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-4">
                  <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">ETH / USD</div>
                  <div className="font-mono font-bold tracking-tight text-white text-3xl">{ethUsd > 0 ? fmtUsd(ethUsd) : "—"}</div>
                </div>
                <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-4">
                  <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">POOL PRICE</div>
                  <div className="font-mono font-bold tracking-tight text-emerald-400 text-3xl">{price > 0 ? fmt(price, 2) : "—"} <span className="text-sm font-normal text-slate-400">IMD/ETH</span></div>
                </div>
              </div>
              <div className="pt-2">
                <Sparkline data={ethSeries} color="#00F58C" />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>24H SESSION</span>
                <span>{ethSeries.length > 0 ? fmtUsd(ethSeries[ethSeries.length - 1]) : "—"}</span>
              </div>
            </div>
          </Card>

          {/* RIGHT: Quick Metrics */}
          <Card title="QUICK METRICS [SYS.02]">
            <div className="space-y-3">
              <StatRow label="ORDERS ALLOCATED" value={fmt(totalTxs, 0)} color="#00F58C" sub="ordens processadas nas últimas 24h"/>
              <StatRow label="VOLUME 24H" value={fmtUsd(totalVol)} color="#00F58C" sub={`hook: ${fmtUsd(hookVol)} · native: ${fmtUsd(nativeVol)}`}/>
              <StatRow label="FEES 24H" value={fmtUsd(totalFees)} color="#00F58C" sub={`hook: ${fmtUsd(hookFees)} · native: ${fmtUsd(nativeFees)}`}/>
              <StatRow label="SPREAD" value={`${spread >= 0 ? "+" : ""}${spread.toFixed(2)}%`} color={spread >= 0 ? "#00F58C" : "#FF567E"} sub={spread >= 0 ? "hook premium" : "native premium"}/>
              <StatRow label="TOTAL TVL" value={fmtUsd(totalTVL)} color="#00F58C" sub={`hook: ${fmtUsd(hookTVL)} · native: ${fmtUsd(nativeTVL)}`}/>
              <StatRow label="HOOK APY" value={`${hookAPY.toFixed(2)}%`} color="#00F58C" sub={`native: ${nativeAPY.toFixed(2)}%`}/>
            </div>
          </Card>
        </div>

        {/* Bottom Row: Deposit Form + Yield/P&L */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Deposit Form */}
          <Card title="DEPOSIT FORM [SYS.03]">
            <div className="space-y-4">
              {connected && lp ? (
                <>
                  <DualStat
                    leftLabel="YOUR ETH BALANCE"
                    leftValue={fmt(positionEth, 4) + " ETH"}
                    leftColor="#00F58C"
                    rightLabel="YOUR IMD BALANCE"
                    rightValue={fmt(imdBalance, 2) + " IMD"}
                    rightColor="#00F58C"
                    sub={`pool share: ${shareOfPool.toFixed(4)}%`}
                  />
                  <StatRow label="LP FEES EARNED" value={fmt(feeEarned, 4) + " ETH"} color="#00F58C" sub="acumulado na posição"/>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400 font-mono text-sm">Connect wallet to view balances</div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-4">
                  <label className="font-mono text-[10px] tracking-widest text-slate-400 uppercase block mb-2">DEPOSIT ETH</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ethInput}
                    onChange={(e) => setEthInput(e.target.value)}
                    placeholder="0.0000"
                    className="w-full bg-[#070A0F]/80 border border-slate-700/50 rounded-xl px-3 py-2 text-white font-mono text-lg placeholder-slate-500 outline-none focus:border-emerald-500/50"
                    min="0"
                    step="0.0001"
                  />
                </div>
                <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-4">
                  <label className="font-mono text-[10px] tracking-widest text-slate-400 uppercase block mb-2">DEPOSIT IMD</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={imdInput}
                    onChange={(e) => setImdInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#070A0F]/80 border border-slate-700/50 rounded-xl px-3 py-2 text-white font-mono text-lg placeholder-slate-500 outline-none focus:border-emerald-500/50"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="text-xs font-mono text-slate-400">
                  LP FEE: <span className="text-white">0.05%</span> · TVL: <span className="text-emerald-400">{fmtUsd(totalTVL)}</span>
                </div>
              </div>

              <button
                onClick={() => connect()}
                disabled={connected}
                className="w-full bg-emerald-500 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(0,245,140,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,245,140,0.5)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {connected ? "WALLET CONNECTED" : "CONNECT WALLET"}
              </button>

              {!connected && (
                <div className="text-center text-xs text-slate-500 font-mono">Connect wallet to deposit liquidity</div>
              )}
            </div>
          </Card>

          {/* RIGHT: Yield & P&L */}
          <Card title="YIELD & P&L [SYS.04]">
            <div className="space-y-3">
              {connected && lp ? (
                <>
                  <StatRow
                    label="UNREALIZED P&L"
                    value={`${pnl >= 0 ? "+" : ""}${fmt(pnl, 4)} ETH`}
                    color={pnl >= 0 ? "#00F58C" : "#FF567E"}
                    sub={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% · fees earned: ${fmt(feeEarned, 4)} ETH`}
                  />
                  <StatRow label="POSITION (ETH)" value={fmt(positionEth, 4) + " ETH"} color="#00F58C" sub={`pool share: ${shareOfPool.toFixed(4)}%`}/>
                  <StatRow label="POSITION (IMD)" value={fmt(imdBalance, 2) + " IMD"} color="#00F58C" sub="balance in pool"/>
                  <div className="border-t border-slate-700/50 pt-2">
                    <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-2">YIELD PROJECTIONS</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-3">
                        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">DAILY</div>
                        <div className="font-mono font-bold text-emerald-400 text-lg">{dailyYield > 0 ? "+" + fmt(dailyYield, 4) : "—"} ETH</div>
                      </div>
                      <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-3">
                        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">MONTHLY</div>
                        <div className="font-mono font-bold text-emerald-400 text-lg">{monthlyYield > 0 ? "+" + fmt(monthlyYield, 2) : "—"} ETH</div>
                      </div>
                      <div className="bg-[#070A0F]/80 border border-slate-700/50 rounded-xl p-3">
                        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">ANNUAL</div>
                        <div className="font-mono font-bold text-emerald-400 text-lg">{annualYield > 0 ? "+" + fmt(annualYield, 2) : "—"} ETH</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-700/50 pt-2">
                    <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-2">PROTOCOL METRICS</div>
                    <StatRow label="IMD BURNED (TOTAL)" value={pool ? fmt(parseFloat(pool.hookTVL || "0") * 0.001, 0) + " IMD" : "—"} color="#FF567E" sub="estimativa via fee burn"/>
                    <StatRow label="REWARDS DISTRIBUTED" value={pool ? fmtUsd(parseFloat(pool.hookFeesUSD || "0") * 0.6) : "—"} color="#00F58C" sub="60% fees → stakers"/>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 font-mono text-sm">Connect wallet to view yield & P&L</div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 font-mono tracking-wider text-center pt-4 border-t border-slate-800/50">
          └────────────────────────────────────────────────────────────────────────┘
        </div>
      </main>
    </div>
  );
}