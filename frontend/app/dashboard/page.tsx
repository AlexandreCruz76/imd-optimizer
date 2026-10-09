"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
  samples: { tx: string; block: number; userOut: string; minAmountOut: string | null }[];
  summary: { pass: number; fail: number; warn: number; info: number };
  note?: string;
}

function eth(v: string | null | undefined): string {
  if (!v) return "—";
  const n = Number(v) / 1e18;
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
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

function Card({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#0B0F17]/70 p-5">
      <header className="mb-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-[#00F58C]">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

const STATUS_STYLE: Record<MevTest["status"], string> = {
  pass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  fail: "bg-red-500/10 text-red-400 border-red-500/30",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mev, setMev] = useState<MevData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mevLoading, setMevLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [d, m] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/mev-trace").then((r) => r.json()),
      ]);
      setData(d);
      setMev(m);
      setError(null);
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
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#07090F] pt-24 px-8">
        <p className="font-mono text-sm text-slate-400">Carregando métricas on-chain…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#07090F] pt-24 px-8">
        <p className="font-mono text-sm text-red-400">{error}</p>
        <button onClick={() => void load()} className="mt-4 px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/[0.04]">
          Tentar de novo
        </button>
      </div>
    );
  }

  const users = (data?.users ?? {}) as Record<string, number | null | Record<string, number | null>>;
  const swapUsers = users.swap as number | null;
  const arbUsers = users.arbitrage as number | null;
  const stakeUsers = users.staking as number | null;
  const lpUsers = users.cofreLp as number | null;
  const nftUsers = users.nftMinters as number | null;
  const eventsFound = (users.eventsFound ?? {}) as Record<string, number | null>;

  return (
    <div className="min-h-screen bg-[#07090F] pt-24 pb-16 px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono text-white">Dashboard</h1>
            <p className="mt-1 text-xs text-slate-500">
              Métricas reais lidas on-chain (Sepolia). Sem APY estimado — só dado que existe.
              {data?.blockNumber ? ` Bloco atual: ${data.blockNumber.toLocaleString("en-US")}.` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.partial && (
              <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                dados parciais (RPC instável)
              </span>
            )}
            <button
              onClick={() => void load()}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/[0.04]"
            >
              Atualizar
            </button>
          </div>
        </header>

        {!data?.deployed ? (
          <Card title="Contratos">
            <p className="text-sm text-slate-400">{data?.note ?? "Sem deploy nesta rede."}</p>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <Card title="Cofre Yieldfarm (OptimizerVaultV2)" subtitle={short(data.addresses?.vaultV2)}>
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Liquidez ETH (cofre)" value={eth(data.cofre?.ethBalance)} />
                  <Stat label="Total depositado (ETH)" value={eth(data.cofre?.totalDeposits)} />
                  <Stat label="Yield acumulado (ETH)" value={eth(data.cofre?.totalYieldAccumulated)} />
                  <Stat label="Shares emitidas" value={num(data.cofre?.totalSharesIssued)} />
                  <Stat label="Yield per share (wei)" value={num(data.cofre?.yieldPerShare)} />
                  <Stat label="Accrued stakers (ETH)" value={eth(data.cofre?.stakersAccrued)} />
                  <Stat label="Accrued treasury (ETH)" value={eth(data.cofre?.treasuryAccrued)} />
                  <Stat label="Accrued devs (ETH)" value={eth(data.cofre?.devsAccrued)} />
                  <Stat label="Accrued burn (ETH)" value={eth(data.cofre?.burnAccrued)} />
                  <Stat label="Fees totais do protocolo (ETH)" value={eth(data.cofre?.totalProtocolFees)} />
                </div>
              </Card>

              <Card title="Staking BLD" subtitle={short(data.addresses?.stakingVault)}>
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Total em stake (BLD)" value={eth(data.staking?.totalDepositedBld)} />
                  <Stat label="Yield distribuído (ETH)" value={eth(data.staking?.totalYieldDistributedEth)} />
                  <Stat label="Posições abertas" value={num(data.staking?.totalPositions)} />
                  <Stat label="Builder score total" value={num(data.staking?.totalBuilderScore)} />
                  <Stat label="Saldo ETH do vault" value={eth(data.staking?.contractEthBalance)} />
                  <Stat label="Penalty de saída instantânea" value={data.staking?.instantPenaltyBps ? `${Number(data.staking.instantPenaltyBps) / 100}%` : "—"} />
                  <Stat label="Unbond (dias)" value={data.staking?.unbondPeriodSec ? String(Number(data.staking.unbondPeriodSec) / 86400) : "—"} />
                </div>
              </Card>

              <Card title="Swap & MEV" subtitle={short(data.addresses?.router)}>
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="MEV capturado (ETH)" value={eth(data.swap?.mevCapturedEth)} />
                  <Stat label="Volume vendido (ETH)" value={eth(data.swap?.sellVolumeEth)} />
                  <Stat label="Burns executados" value={num(data.swap?.burnsExecuted)} />
                  <Stat label="Yield distribuído (ETH)" value={eth(data.swap?.yieldDistributedEth)} />
                  <Stat label="Fees coletadas (ETH)" value={eth(data.swap?.feesCollectedEth)} />
                  <Stat label="minBlockDelay (blocos)" value={num(data.swap?.minBlockDelay)} />
                </div>
              </Card>

              <Card title="Pools de Swap (venues)" subtitle="Saldo ETH de cada venue = liquidez">
                {data.pools ? (
                  <div className="space-y-2">
                    {data.pools.items.map((p) => (
                      <div key={p.symbol} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-slate-400">{p.symbol}</span>
                        <span className="font-mono text-white">{eth(p.eth)} ETH</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">Total</span>
                      <span className="font-mono text-[#00F58C]">{eth(data.pools.totalEth)} ETH</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </Card>
            </div>

            <Card title="Usuários por serviço" subtitle="Contagem de usuários únicos via eventos on-chain">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Stat label="Swap (MultiHopExecuted)" value={swapUsers === null ? "—" : String(swapUsers)} />
                <Stat label="Arbitrage" value={arbUsers === null ? "—" : String(arbUsers)} />
                <Stat label="Staking" value={stakeUsers === null ? "—" : String(stakeUsers)} />
                <Stat label="Cofre LP (Deposited)" value={lpUsers === null ? "—" : String(lpUsers)} />
                <Stat label="NFT minters" value={nftUsers === null ? "—" : String(nftUsers)} />
              </div>
              <p className="mt-4 text-[11px] text-slate-600 font-mono">
                Eventos lidos: swap={eventsFound.multiHop ?? "—"} · arbitrage={eventsFound.arbitrage ?? "—"} ·
                staked={eventsFound.staked ?? "—"} · vaultDeposits={eventsFound.vaultDeposits ?? "—"} ·
                nftMints={eventsFound.nftMints ?? "—"} · NFT supply={num(data.nft?.totalSupply)}
              </p>
            </Card>

            <Card title="Rastreio MEV" subtitle={`Router ${short(mev?.router)} — testes read-only sobre swaps recentes`}>
              {mev?.deployed === false ? (
                <p className="text-sm text-slate-400">{mev?.note}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mev?.tests.map((t) => (
                      <span key={t.id} className={`text-[10px] font-mono px-2 py-1 rounded border ${STATUS_STYLE[t.status]}`}>
                        {t.status.toUpperCase()} · {t.name}
                      </span>
                    ))}
                    <button
                      onClick={() => void runMev()}
                      disabled={mevLoading}
                      className="ml-auto px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/[0.04] disabled:opacity-50"
                    >
                      {mevLoading ? "Rodando…" : "Rodar testes"}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {mev?.tests.map((t) => (
                      <li key={t.id} className="text-xs text-slate-400 leading-relaxed">
                        <span className={`font-mono ${t.status === "pass" ? "text-emerald-400" : t.status === "fail" ? "text-red-400" : t.status === "warn" ? "text-amber-400" : "text-sky-400"}`}>
                          [{t.status.toUpperCase()}]
                        </span>{" "}
                        <span className="text-slate-300">{t.name}</span> — {t.detail}
                      </li>
                    ))}
                  </ul>
                  {mev?.samples?.length ? (
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Amostra ({mev.samples.length})</p>
                      <div className="space-y-1 font-mono text-[11px] text-slate-500">
                        {mev.samples.map((s) => (
                          <div key={s.tx} className="flex justify-between gap-2">
                            <span>{short(s.tx)}</span>
                            <span>bloco {s.block.toLocaleString("en-US")}</span>
                            <span>out {eth(s.userOut)} ETH</span>
                            <span>minOut {s.minAmountOut ? eth(s.minAmountOut) : "?"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </Card>

            {data.addresses && (
              <Card title="Endereços desta rede">
                <div className="grid md:grid-cols-2 gap-2 font-mono text-xs text-slate-400">
                  {Object.entries(data.addresses).map(([k, v]) => (
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
              </Card>
            )}

            <p className="text-[11px] text-slate-600 font-mono">
              Atualizado às {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString("en-US") : "—"}. Auto-refresh 60s.
              {" "}
              <Link href="/swap" className="text-[#00F58C] hover:underline">Ir para o Swap →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
