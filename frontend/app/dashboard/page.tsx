"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarList,
  DonutChart,
  fmtEthVal,
  GaugeArc,
  PulseDot,
  SERIES_COLORS,
  Sparkline,
  StackedAreaChart,
  SwapBars,
  useCountUp,
} from "./charts";

interface DashboardData {
  network: string;
  deployed: boolean;
  blockNumber?: number;
  addresses?: Record<string, string>;
  cofre?: Record<string, string | null>;
  swap?: Record<string, string | null>;
  staking?: Record<string, string | null>;
  nft?: Record<string, string | null>;
  users?: Record<string, number | null | Record<string, number | null>>;
  pools?: { totalEth: string; items: { symbol: string; address: string; eth: string }[] } | null;
  history?: {
    blocks: number[];
    totals: string[];
    pools: { symbol: string; values: string[] }[];
  } | null;
  swapSeries?: {
    block: number;
    user: string;
    amountIn: string;
    finalOut: string;
    userOut: string;
    timestamp: number;
  }[] | null;
  activity?: {
    type: "SWAP" | "STAKE" | "LP" | "MINT";
    block: number;
    tx: string;
    label: string;
    value: string;
  }[] | null;
  partial?: boolean;
  note?: string;
  fetchedAt?: string;
}

interface MevTest {
  id: string;
  name: string;
  status: "pass" | "fail" | "warn" | "info";
  detail: string;
}

interface MevData {
  deployed: boolean;
  router?: string;
  tests: MevTest[];
  samples: {
    tx: string;
    block: number;
    userOut: string;
    minAmountOut: string | null;
  }[];
  summary: { pass: number; fail: number; warn: number; info: number };
  note?: string;
}

const REFRESH_MS = 60_000;

function ethNum(v: string | null | undefined): number {
  if (!v) return 0;
  const n = Number(v) / 1e18;
  return isFinite(n) ? n : 0;
}

function fmtEth(v: string | null | undefined): string {
  if (!v) return "—";
  const n = Number(v) / 1e18;
  if (!isFinite(n)) return "—";
  return fmtEthVal(n);
}

function num(v: string | null | undefined): string {
  if (!v) return "—";
  const n = Number(v);
  return isFinite(n) ? n.toLocaleString("en-US") : "—";
}

function short(a?: string | null): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const STATUS_STYLE: Record<MevTest["status"], string> = {
  pass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(0,245,140,0.15)]",
  fail: "bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(251,113,133,0.2)]",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

const ACT_STYLE: Record<string, { bg: string; fg: string }> = {
  SWAP: { bg: "bg-[#00F58C]/10", fg: "text-[#00F58C]" },
  STAKE: { bg: "bg-[#00F5FF]/10", fg: "text-[#00F5FF]" },
  LP: { bg: "bg-violet-400/10", fg: "text-violet-300" },
  MINT: { bg: "bg-amber-500/10", fg: "text-amber-300" },
};

function Panel({
  title,
  children,
  subtitle,
  right,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/[0.08] bg-[#0B0F17]/70 p-5 backdrop-blur-sm transition-shadow duration-300 hover:border-white/[0.14] hover:shadow-[0_0_30px_-12px_rgba(0,245,140,0.25)] ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-[#00F58C] flex items-center gap-2">
            <span className="h-3 w-[2px] bg-[#00F58C] shadow-[0_0_6px_#00F58C]" />
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function KpiTile({
  label,
  value,
  sub,
  spark,
  accent = "#00F58C",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  spark?: number[];
  accent?: string;
}) {
  return (
    <div className="group rounded-xl border border-white/[0.08] bg-[#0B0F17]/70 p-4 transition-all duration-300 hover:border-white/[0.16] hover:shadow-[0_0_28px_-10px_rgba(0,245,140,0.3)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">{label}</span>
        {spark && spark.length > 1 && <Sparkline values={spark} color={accent} width={72} height={24} />}
      </div>
      <div
        className="mt-2 font-mono text-xl text-white tabular-nums transition-colors"
        style={{ textShadow: `0 0 18px ${accent}33` }}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}

function CountUpEth({ wei }: { wei: string | null | undefined }) {
  const n = ethNum(wei);
  const v = useCountUp(n);
  return <>{fmtEth(String(Math.round(v * 1e18)))}</>;
}

function CountUpInt({ value }: { value: number }) {
  const v = useCountUp(value, 500);
  return <>{Math.round(v).toLocaleString("en-US")}</>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mev, setMev] = useState<MevData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mevLoading, setMevLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Relógio controlado por state (render deve ser puro — sem Date.now no corpo)
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  async function load() {
    try {
      const [d, m] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/mev-trace").then((r) => r.json()),
      ]);
      setData(d);
      setMev(m);
      setError(null);
      const t = Date.now();
      setLastFetchAt(t);
      setNow(t);
    } catch {
      setError("Falha ao carregar dados on-chain — RPC indisponível.");
    } finally {
      setLoading(false);
    }
  }

  const runMev = useCallback(async () => {
    try {
      setMevLoading(true);
      const m = await fetch("/api/mev-trace", { cache: "no-store" }).then((r) => r.json());
      setMev(m);
      const t = Date.now();
      setLastFetchAt(t);
      setNow(t);
    } catch {
      setError("Falha ao rodar rastreio MEV.");
    } finally {
      setMevLoading(false);
    }
  }, []);

  useEffect(() => {
    // load() é async — setState só ocorre após await (não é cascata síncrona)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
    };
  }, []);

  // barra de progresso do próximo refresh (derivada de states, não de Date.now no render)
  const elapsed =
    lastFetchAt !== null && now !== null
      ? Math.min(REFRESH_MS, Math.max(0, now - lastFetchAt))
      : 0;
  const progressPct = (elapsed / REFRESH_MS) * 100;
  const secsLeft = Math.max(0, Math.ceil((REFRESH_MS - elapsed) / 1000));

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#07090F] pt-24 px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="skeleton h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-72" />
          <p className="font-mono text-xs text-slate-500 pt-2">
            Inicializando Protocol Monitor…
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#07090F] pt-24 px-8">
        <p className="font-mono text-sm text-red-400">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-4 px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/[0.04]"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const users = (data?.users ?? {}) as Record<
    string,
    number | null | Record<string, number | null>
  >;
  const swapUsers = (users.swap as number | null) ?? 0;
  const arbUsers = (users.arbitrage as number | null) ?? 0;
  const stakeUsers = (users.staking as number | null) ?? 0;
  const lpUsers = (users.cofreLp as number | null) ?? 0;
  const nftUsers = (users.nftMinters as number | null) ?? 0;
  const totalUsers = swapUsers + arbUsers + stakeUsers + lpUsers + nftUsers;

  // Série empilhada de liquidez por venue (dados históricos reais)
  const stackSeries =
    data?.history?.pools.map((p, i) => ({
      name: p.symbol,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      values: p.values.map((v) => Number(v) / 1e18),
    })) ?? [];

  const donutItems =
    data?.pools?.items.map((p, i) => ({
      label: p.symbol,
      value: Number(p.eth) / 1e18,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    })) ?? [];

  // Gauges derivados de dados reais
  const mevTests = mev?.tests ?? [];
  const mevPassRatio =
    mevTests.length > 0
      ? (mevTests.filter((t) => t.status === "pass").length /
          mevTests.filter((t) => t.status !== "info").length) *
        100
      : 0;
  const samplesWithMin = (mev?.samples ?? []).filter((s) => s.minAmountOut !== null);
  const slippageHonored =
    samplesWithMin.length > 0
      ? (samplesWithMin.filter(
          (s) => BigInt(s.userOut) >= BigInt(s.minAmountOut!)
        ).length /
          samplesWithMin.length) *
        100
      : 0;

  const swapSpark =
    data?.swapSeries?.map((s) => Number(s.userOut) / 1e18) ?? [];
  const liqSpark = data?.history?.totals.map((t) => Number(t) / 1e18) ?? [];

  return (
    <div className="relative min-h-screen bg-[#07090F] pt-20 pb-16 px-4 md:px-8 overflow-x-hidden">
      {/* HUD glow decorativo — identidade Stark, paleta IMD */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #00F58C 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -left-40 h-[360px] w-[360px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #00F5FF 0%, transparent 65%)" }}
      />

      <div className="relative max-w-6xl mx-auto space-y-5">
        {/* ── BARRA DE COMANDO ─────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-mono text-white flex items-center gap-3">
              <span className="glow-emerald">IMD://PROTOCOL-MONITOR</span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-[#00F58C]/30 bg-[#00F58C]/10 text-[#00F58C] font-mono uppercase tracking-widest">
                {data?.network === "sepolia" ? "Sepolia" : "Mainnet"}
              </span>
              {data?.partial && (
                <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono">
                  dados parciais
                </span>
              )}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-mono flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <PulseDot />
                <span className="text-[#00F58C]">LIVE</span>
              </span>
              <span>
                bloco{" "}
                <span className="text-white tabular-nums">
                  {data?.blockNumber?.toLocaleString("en-US") ?? "—"}
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                atualiza em{" "}
                <span className="text-white tabular-nums">{secsLeft}s</span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="progress-shine h-full rounded-full bg-gradient-to-r from-[#00F58C] to-[#00F5FF] transition-[width] duration-1000 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <button
              onClick={() => void load()}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/[0.04] hover:border-[#00F58C]/40 hover:text-[#00F58C] transition-colors"
            >
              ⟳ Sincronizar
            </button>
          </div>
        </header>

        {!data?.deployed ? (
          <Panel title="Contratos">
            <p className="text-sm text-slate-400">{data?.note ?? "Sem deploy nesta rede."}</p>
          </Panel>
        ) : (
          <>
            {/* ── TILES KPI ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiTile
                label="TVL Pools"
                value={<CountUpEth wei={data.pools?.totalEth ?? null} />}
                sub={`${data.pools?.items.length ?? 0} venues`}
                spark={liqSpark}
                accent="#00F58C"
              />
              <KpiTile
                label="MEV Capturado"
                value={<CountUpEth wei={data.swap?.mevCapturedEth ?? null} />}
                sub="ETH resgatados"
                accent="#00F5FF"
              />
              <KpiTile
                label="Volume Vendido"
                value={<CountUpEth wei={data.swap?.sellVolumeEth ?? null} />}
                sub="acumulado router"
                spark={swapSpark}
                accent="#FFB000"
              />
              <KpiTile
                label="Yield Distribuído"
                value={
                  <CountUpEth
                    wei={
                      data.swap?.yieldDistributedEth &&
                      Number(data.swap.yieldDistributedEth) > 0
                        ? data.swap.yieldDistributedEth
                        : (data.staking?.totalYieldDistributedEth ?? null)
                    }
                  />
                }
                sub="router + staking"
                accent="#A78BFA"
              />
              <KpiTile
                label="Usuários"
                value={<CountUpInt value={totalUsers} />}
                sub={`${swapUsers} swap · ${stakeUsers} stake · ${nftUsers} nft`}
                accent="#FB7185"
              />
              <KpiTile
                label="Buildercoins"
                value={<CountUpInt value={Number(data.nft?.totalSupply ?? 0)} />}
                sub="NFTs mintados"
                accent="#34D399"
              />
            </div>

            {/* ── HERO: LIQUIDEZ HISTÓRICA ─────────────────────────── */}
            <Panel
              title="Liquidez por Venue — Série Histórica"
              subtitle={`Amostragem on-chain real (${data.history?.blocks.length ?? 0} pontos entre os blocos do deploy e agora)`}
              right={
                <span className="font-mono text-[10px] text-slate-600 hidden md:block">
                  clique na legenda p/ isolá-la
                </span>
              }
            >
              <StackedAreaChart blocks={data.history?.blocks ?? []} series={stackSeries} />
            </Panel>

            {/* ── LINHA: DONUT + USUÁRIOS + GAUGES ─────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Panel title="Distribuição Atual" subtitle="Saldo ETH por venue agora">
                <DonutChart items={donutItems} />
              </Panel>

              <Panel title="Usuários por Serviço" subtitle="Carteiras únicas via eventos">
                <BarList
                  items={[
                    { label: "Swap", value: swapUsers },
                    { label: "Staking", value: stakeUsers },
                    { label: "NFT Mint", value: nftUsers },
                    { label: "Cofre LP", value: lpUsers },
                    { label: "Arbitrage", value: arbUsers },
                  ]}
                />
              </Panel>

              <Panel title="Integridade do Protocolo" subtitle="Derivado do rastreio MEV ao vivo">
                <div className="flex items-start justify-around pt-2">
                  <GaugeArc
                    value={mevPassRatio}
                    label="Testes PASS"
                    color="#00F58C"
                  />
                  <GaugeArc
                    value={slippageHonored}
                    label="Slippage honrado"
                    color="#00F5FF"
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 py-1.5">
                    <div className="text-emerald-400 text-sm">{mev?.summary.pass ?? 0}</div>
                    <div className="text-slate-600">PASS</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 py-1.5">
                    <div className="text-amber-400 text-sm">{mev?.summary.warn ?? 0}</div>
                    <div className="text-slate-600">WARN</div>
                  </div>
                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 py-1.5">
                    <div className="text-red-400 text-sm">{mev?.summary.fail ?? 0}</div>
                    <div className="text-slate-600">FAIL</div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* ── SWAP BARS + COFRE/STAKING ────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Panel
                title="Atividade de Swap"
                subtitle="Cada barra = 1 MultiHopExecuted real"
                className="lg:col-span-2"
              >
                <SwapBars
                  swaps={(data.swapSeries ?? []).map((s) => ({
                    block: s.block,
                    userOut: s.userOut,
                    user: s.user,
                  }))}
                />
              </Panel>

              <Panel title="Cofre + Staking" subtitle="Estado consolidado">
                <dl className="space-y-2.5 font-mono text-[11px]">
                  {[
                    ["Yield cofre", fmtEth(data.cofre?.totalYieldAccumulated)],
                    ["Deposits cofre", fmtEth(data.cofre?.totalDeposits)],
                    ["Shares", num(data.cofre?.totalSharesIssued)],
                    ["Stake BLD", fmtEth(data.staking?.totalDepositedBld)],
                    ["Posições stake", num(data.staking?.totalPositions)],
                    ["Fees router", fmtEth(data.swap?.feesCollectedEth)],
                    ["Burns", num(data.swap?.burnsExecuted)],
                    ["minBlockDelay", num(data.swap?.minBlockDelay) + " bloco(s)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-white/[0.04] pb-1.5">
                      <dt className="text-slate-500 uppercase tracking-wider text-[9px]">{k}</dt>
                      <dd className="text-white tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            {/* ── FEED + MEV CONSOLE ───────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Panel
                title="Fluxo On-Chain"
                subtitle="Eventos recentes — SWAP · STAKE · LP · MINT"
                right={<PulseDot color="#00F5FF" />}
              >
                <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {(data.activity ?? []).map((a) => {
                    const st = ACT_STYLE[a.type] ?? ACT_STYLE.SWAP;
                    return (
                      <li
                        key={`${a.tx}-${a.block}-${a.type}`}
                        className="fade-in flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors"
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider ${st.bg} ${st.fg}`}
                        >
                          {a.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[11px] text-slate-300 truncate">
                            {a.label}
                            <span className="text-slate-600 ml-2">{a.value}</span>
                          </div>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${a.tx}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[9px] text-slate-600 hover:text-[#00F58C] transition-colors"
                          >
                            bloco {a.block.toLocaleString("en-US")} · {short(a.tx)} ↗
                          </a>
                        </div>
                      </li>
                    );
                  })}
                  {(data.activity ?? []).length === 0 && (
                    <li className="font-mono text-xs text-slate-600 py-6 text-center">
                      Nenhum evento indexado ainda.
                    </li>
                  )}
                </ul>
              </Panel>

              <Panel
                title="MEV Console"
                subtitle={`Router ${short(mev?.router)} — testes read-only`}
                right={
                  <button
                    onClick={() => void runMev()}
                    disabled={mevLoading}
                    className="px-3 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 hover:bg-white/[0.04] hover:border-[#00F58C]/40 disabled:opacity-50 transition-colors"
                  >
                    {mevLoading ? "Rastreando…" : "▶ Rodar testes"}
                  </button>
                }
              >
                <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {mev?.tests.map((t) => (
                    <li
                      key={t.id}
                      className="fade-in rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${STATUS_STYLE[t.status]}`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-[11px] text-slate-300">{t.name}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{t.detail}</p>
                    </li>
                  ))}
                  {(!mev || mev.tests.length === 0) && (
                    <li className="font-mono text-xs text-slate-600 py-6 text-center">
                      Console aguardando rastreio…
                    </li>
                  )}
                </ul>
              </Panel>
            </div>

            {/* ── ENDEREÇOS ────────────────────────────────────────── */}
            <Panel title="Endereços desta Rede">
              <div className="grid md:grid-cols-2 gap-2 font-mono text-xs text-slate-400">
                {Object.entries(data.addresses ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <a
                      className="text-[#00F58C] hover:underline"
                      href={`https://sepolia.etherscan.io/address/${v}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {short(v)}
                    </a>
                  </div>
                ))}
              </div>
            </Panel>

            <p className="text-[11px] text-slate-600 font-mono">
              Sincronizado às {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString("en-US") : "—"} ·
              auto-refresh 60s · dados 100% on-chain ·{" "}
              <Link href="/swap" className="text-[#00F58C] hover:underline">
                Swap →
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
