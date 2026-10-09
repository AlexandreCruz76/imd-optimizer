"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";
import { STAKING_CONFIG, STAKING_ABI } from "@/lib/contract-config";

interface StakingPosition {
  index: number;
  amount: number;
  lockEnd: number;
  lockTier: number;
  multiplier: number;
  depositTime: number;
  unbondInitiatedAt: number;
}

const LOCK_TIERS = [
  { days: 30, mult: "1.00x", label: "30 DAYS" },
  { days: 90, mult: "1.35x", label: "90 DAYS" },
  { days: 180, mult: "1.85x", label: "180 DAYS" },
];

function fmt(n: number, d = 4) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });
}

function timeLeft(ts: number) {
  const s = ts - Math.floor(Date.now() / 1000);
  if (s <= 0) return "expired";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function StakingPage() {
  const { address, connected, connect, chainId, provider, signer, switchChain, walletName } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State
  const [bldBalance, setBldBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [totalStaked, setTotalStaked] = useState("0");
  const [yieldWeight, setYieldWeight] = useState("0");
  const [claimable, setClaimable] = useState("0");
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [penaltyBps, setPenaltyBps] = useState(200);

  // Form
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeLock, setStakeLock] = useState(30);

  function getContracts() {
    if (!signer) return { sv: null, bld: null };
    return {
      sv: new ethers.Contract(STAKING_CONFIG.stakingVault, STAKING_ABI, signer),
      bld: new ethers.Contract(STAKING_CONFIG.bldToken, STAKING_ABI, signer),
    };
  }

  useEffect(() => {
    if (connected && provider && chainId === STAKING_CONFIG.chainId && signer) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, provider, signer, chainId, address]);

  async function loadData() {
    if (!address || !signer) return;
    const { sv, bld } = getContracts();
    if (!sv || !bld) return;
    try {
      setLoading(true);
      setError(null);
      const [bal, allw, staked, weight, claim, count, penBps] = await Promise.all([
        bld.balanceOf(address),
        bld.allowance(address, STAKING_CONFIG.stakingVault),
        sv.totalStaked(address),
        sv.yieldWeightOf(address),
        sv.claimableYield(address),
        sv.getPositionCount(address),
        sv.instantPenaltyBps(),
      ]);
      setBldBalance(ethers.formatEther(bal));
      setAllowance(ethers.formatEther(allw));
      setTotalStaked(ethers.formatEther(staked));
      setYieldWeight(ethers.formatEther(weight));
      setClaimable(ethers.formatEther(claim));
      setPenaltyBps(Number(penBps));

      const posArr: StakingPosition[] = [];
      for (let i = 0; i < Number(count); i++) {
        const p = await sv.getStakingPosition(address, i);
        posArr.push({
          index: i,
          amount: parseFloat(ethers.formatEther(p.amount)),
          lockEnd: Number(p.lockEnd),
          lockTier: Number(p.lockTier),
          multiplier: Number(p.multiplier),
          depositTime: Number(p.depositTime),
          unbondInitiatedAt: Number(p.unbondInitiatedAt),
        });
      }
      setPositions(posArr.filter((p) => p.amount > 0));
    } catch (err) {
      console.error("Load staking failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function ensureChain() {
    if (chainId !== STAKING_CONFIG.chainId) {
      await switchChain(STAKING_CONFIG.chainId);
      return false;
    }
    return true;
  }

  async function handleApprove() {
    if (!signer || !stakeAmount) return;
    const { bld } = getContracts();
    if (!bld) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const amountWei = ethers.parseEther(stakeAmount);
      const tx = await bld.approve(STAKING_CONFIG.stakingVault, amountWei);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess("BLD approved for staking vault");
      loadData();
    } catch (err) {
      setError(`Approve failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleStake() {
    if (!signer || !stakeAmount || parseFloat(stakeAmount) <= 0) return;
    const { sv, bld } = getContracts();
    if (!sv || !bld) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const amountWei = ethers.parseEther(stakeAmount);
      const allw = await bld.allowance(address, STAKING_CONFIG.stakingVault);
      if (allw < amountWei) {
        setError("Insufficient allowance — click APPROVE first");
        return;
      }
      const tx = await sv.stake(amountWei, stakeLock);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess(`Staked ${stakeAmount} BLD for ${stakeLock} days`);
      setStakeAmount("");
      loadData();
    } catch (err) {
      setError(`Stake failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(idx: number) {
    if (!signer) return;
    const { sv } = getContracts();
    if (!sv) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const tx = await sv.withdraw(idx);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess("Withdrawn (0% fee — lock expired)");
      loadData();
    } catch (err) {
      setError(`Withdraw failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBeginUnbond(idx: number) {
    if (!signer) return;
    const { sv } = getContracts();
    if (!sv) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const tx = await sv.beginUnbond(idx);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess("Unbond initiated — 7-day countdown started (0% fee)");
      loadData();
    } catch (err) {
      setError(`Begin unbond failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteUnbond(idx: number) {
    if (!signer) return;
    const { sv } = getContracts();
    if (!sv) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const tx = await sv.completeUnbond(idx);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess("Unbond complete — BLD returned (0% fee)");
      loadData();
    } catch (err) {
      setError(`Complete unbond failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergency(idx: number) {
    if (!signer) return;
    const { sv } = getContracts();
    if (!sv) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const tx = await sv.emergencyInstantWithdraw(idx);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess(`Emergency withdraw done — penalty ${(penaltyBps / 100).toFixed(0)}% (50% burn / 25% treasury / 25% yield)`);
      loadData();
    } catch (err) {
      setError(`Emergency withdraw failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimYield() {
    if (!signer) return;
    const { sv } = getContracts();
    if (!sv) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!(await ensureChain())) return;
      const tx = await sv.claimYield();
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess("Yield claimed — 0% fee (DEC-020)");
      loadData();
    } catch (err) {
      setError(`Claim yield failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const wrongChain = connected && chainId !== STAKING_CONFIG.chainId;
  const needsApproval = parseFloat(allowance) < parseFloat(stakeAmount || "0");
  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono p-4 md:p-6">
      <main className="pt-24 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border border-emerald-500/40 bg-[#0B111A] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,245,140,0.25)]">
            <img
              src="/images/buildercoin.jpeg"
              alt="Buildercoin"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/builder.jpg";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px w-8 bg-emerald-500/45" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/45 whitespace-nowrap">
                Diamond Hands Vault
              </span>
              <span className="h-px flex-1 bg-emerald-500/20" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/92 mt-2">
              Builder Staking
            </h1>
            <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mt-1">
              Stake $BLD → Real Yield em ETH (DEC-020)
            </p>
          </div>
        </div>

        {/* Status */}
        {wrongChain && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="font-mono text-xs text-amber-400">
              Wrong network — switch to Sepolia to stake.
            </p>
            <button
              onClick={() => switchChain(STAKING_CONFIG.chainId)}
              className="mt-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-mono text-xs font-semibold uppercase tracking-widest hover:bg-amber-400 transition-colors"
            >
              Switch to Sepolia
            </button>
          </div>
        )}

        {txHash && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="font-mono text-xs text-emerald-400">
              Tx:{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {txHash.slice(0, 20)}…
              </a>
            </p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="font-mono text-xs text-emerald-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
            <p className="font-mono text-xs text-rose-400">ERRO: {error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="BLD BALANCE" value={fmt(parseFloat(bldBalance))} />
          <StatCard label="YOUR STAKE" value={fmt(parseFloat(totalStaked))} accent />
          <StatCard label="YIELD WEIGHT" value={fmt(parseFloat(yieldWeight))} />
          <StatCard label="CLAIMABLE" value={`${fmt(parseFloat(claimable), 6)} ETH`} accent />
        </div>

        {/* Stake Form */}
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 shadow-[var(--elevation-1)]">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">
            STAKE $BLD
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount of BLD"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1 bg-[#131823] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-sm text-white/92 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <select
              value={stakeLock}
              onChange={(e) => setStakeLock(Number(e.target.value))}
              className="bg-[#131823] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-sm text-white/92 focus:outline-none focus:border-emerald-500/50"
            >
              {LOCK_TIERS.map((t) => (
                <option key={t.days} value={t.days}>
                  {t.label} · {t.mult}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            {needsApproval && parseFloat(stakeAmount) > 0 && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {loading ? "…" : "1. APPROVE BLD"}
              </button>
            )}
            <button
              onClick={handleStake}
              disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0 || needsApproval}
              className="flex-1 rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {loading ? "…" : needsApproval ? "APPROVE FIRST" : "2. STAKE"}
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-500 mt-3">
            Lock tiers: 30d 1.00x · 90d 1.35x · 180d 1.85x (builder score multiplier)
          </p>
        </div>

        {/* Claim Yield */}
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 shadow-[var(--elevation-1)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
                CLAIM YIELD
              </div>
              <div className="font-mono font-bold text-emerald-400 text-2xl mt-1">
                {fmt(parseFloat(claimable), 6)} ETH
              </div>
              <div className="font-mono text-[10px] tracking-widest text-slate-500 mt-1">
                0% TAX — DEC-020
              </div>
            </div>
            <button
              onClick={handleClaimYield}
              disabled={loading || parseFloat(claimable) <= 0}
              className="px-6 py-3 rounded-xl font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              CLAIM
            </button>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5 shadow-[var(--elevation-1)]">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">
            YOUR POSITIONS ({positions.length})
          </div>
          {positions.length === 0 ? (
            <p className="font-mono text-xs text-slate-500">
              No positions yet — stake $BLD above to start earning real yield.
            </p>
          ) : (
            <div className="space-y-3">
              {positions.map((p) => {
                const locked = now < p.lockEnd;
                const unbondReady = p.unbondInitiatedAt > 0 && now >= p.unbondInitiatedAt + 7 * 86400;
                const canUnbond = locked && p.unbondInitiatedAt === 0;
                return (
                  <div
                    key={p.index}
                    className="bg-[#131823] border border-white/[0.07] rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-mono font-bold text-white/92 text-lg">
                          {fmt(p.amount)} BLD
                        </div>
                        <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mt-1">
                          Lock {p.lockTier}d · mult {p.multiplier / 10000}x ·{" "}
                          {locked ? `ends ${timeLeft(p.lockEnd)}` : "LOCK EXPIRED"}
                        </div>
                        {p.unbondInitiatedAt > 0 && !unbondReady && (
                          <div className="font-mono text-[10px] tracking-widest text-amber-400 uppercase mt-1">
                            UNBONDING: {timeLeft(p.unbondInitiatedAt + 7 * 86400)} left
                          </div>
                        )}
                        {unbondReady && (
                          <div className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase mt-1">
                            READY TO COMPLETE UNBOND
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!locked && (
                          <button
                            onClick={() => handleWithdraw(p.index)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                          >
                            WITHDRAW 0%
                          </button>
                        )}
                        {canUnbond && (
                          <button
                            onClick={() => handleBeginUnbond(p.index)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-widest bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
                          >
                            BEGIN UNBOND
                          </button>
                        )}
                        {unbondReady && (
                          <button
                            onClick={() => handleCompleteUnbond(p.index)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                          >
                            COMPLETE UNBOND
                          </button>
                        )}
                        <button
                          onClick={() => handleEmergency(p.index)}
                          disabled={loading}
                          className="px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-widest bg-rose-500/80 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
                        >
                          INSTANT {(penaltyBps / 100).toFixed(0)}%
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase mb-4">
            RULES (DEC-020)
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { t: "T1 · ALPHA", c: "#00F58C", m: "4x yield · 0% fee" },
              { t: "T2 · PARTNER", c: "#00F5FF", m: "3x · 0.10% fee" },
              { t: "T3 · HOLDER", c: "#FFB000", m: "1x · 0.30% fee" },
              { t: "T4 · RETAIL", c: "#6B7A88", m: "0x · 0.50% fee" },
            ].map((tier) => (
              <span
                key={tier.t}
                className="inline-flex items-center gap-2 text-[10px] font-mono px-2.5 py-1.5 rounded-full border uppercase tracking-wider"
                style={{ color: tier.c, borderColor: `${tier.c}55`, background: `${tier.c}12` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.c }} />
                {tier.t}
                <span className="opacity-70 normal-case tracking-normal">{tier.m}</span>
              </span>
            ))}
          </div>
          <div className="space-y-2 font-mono text-xs text-slate-400">
            <RuleRow>Yield = Stake × Identity Tier Multiplier (4x / 3x / 1x / 0x)</RuleRow>
            <RuleRow>Vault distributes 60% Stakers · 20% Treasury · 15% Devs · 5% Buy-and-Burn</RuleRow>
            <RuleRow>claimYield() with 0% fee — no promised APY, yield comes from real revenue</RuleRow>
            <RuleRow>Unstake with 7-day lock-up (beginUnbond → completeUnbond): 0%</RuleRow>
            <RuleRow danger>
              Instant unstake: penalty {(penaltyBps / 100).toFixed(0)}% → 50% Buy-and-Burn · 25% Treasury · 25% weighted yield
            </RuleRow>
            <RuleRow>Yield weight only changes with stake — NFT is the engine, stake is the fuel</RuleRow>
          </div>
        </div>

        {!connected && (
          <button
            onClick={connect}
            className="w-full rounded-xl py-4 font-mono text-sm font-semibold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.98] transition-all"
          >
            CONNECT {walletName.toUpperCase()} FOR STAKING
          </button>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#0B111A]/80 border border-white/[0.07] rounded-xl p-4">
      <div className="font-mono text-[10px] tracking-widest text-slate-400 uppercase mb-1">
        {label}
      </div>
      <div
        className={`font-mono font-bold tracking-tight text-xl ${
          accent ? "text-emerald-400" : "text-white/92"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RuleRow({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`font-bold shrink-0 ${danger ? "text-rose-500" : "text-emerald-400"}`}>▸</span>
      <span className={danger ? "text-rose-500" : ""}>{children}</span>
    </div>
  );
}
