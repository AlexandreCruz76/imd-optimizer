"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

const LOCK_TIERS = [
  { days: 30, multiplier: "1.00x", apy: "37%", label: "30 DAYS" },
  { days: 90, multiplier: "1.35x", apy: "50%", label: "90 DAYS" },
  { days: 180, multiplier: "1.85x", apy: "68.5%", label: "180 DAYS" },
];

interface StakingPosition {
  amount: string;
  lockTier: number;
  multiplier: string;
  lockEnd: string;
  builderScore: string;
}

interface StakingStats {
  totalDeposited: string;
  totalBuilderScore: string;
  totalPositions: number;
  pendingRewards: string;
  userTotalStaked: string;
  userBuilderScore: string;
  userPositions: StakingPosition[];
}

export default function StakingPage() {
  const { connected, address, chainId } = useWallet();
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [selectedTier, setSelectedTier] = useState(30);
  const [stakeAmount, setStakeAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (connected && address) {
      fetchUserStats();
    }
  }, [connected, address]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/staking/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("Failed to load staking stats");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserStats() {
    if (!address) return;
    try {
      const res = await fetch(`/api/staking/user?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch (err) {
      console.error("Failed to fetch user stats");
    }
  }

  async function handleStake() {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    setStaking(true);
    setError(null);
    try {
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: stakeAmount,
          lockTier: selectedTier,
          address,
        }),
      });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setTimeout(() => {
          fetchStats();
          fetchUserStats();
        }, 5000);
      } else {
        setError(data.error || "Staking failed");
      }
    } catch (err: any) {
      setError(err.message || "Staking failed");
    } finally {
      setStaking(false);
    }
  }

  async function handleClaimRewards() {
    setStaking(true);
    setError(null);
    try {
      const res = await fetch("/api/staking/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setTimeout(() => {
          fetchStats();
          fetchUserStats();
        }, 5000);
      } else {
        setError(data.error || "Claim failed");
      }
    } catch (err: any) {
      setError(err.message || "Claim failed");
    } finally {
      setStaking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading staking data...
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#ffb000] flex items-center justify-center text-[#0a0a0a] font-bold text-sm">$B</div>
        <div>
          <h1 className="text-base md:text-lg glow-strong tracking-wider">
            ┌─ $BUILDER STAKING ───────────────────────────────────────────────────┐
          </h1>
          <div className="text-[10px] md:text-xs text-[#00ff4140]">Earn 60% of protocol fees</div>
        </div>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Connect your wallet to stake $BUILDER
          </div>
        </div>
      )}

      {/* Global stats */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ PROTOCOL STATS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-[#00ff4140]">TOTAL STAKED</div>
            <div className="text-[#00ff41] glow">{stats?.totalDeposited || "0"} $BUILD</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">TOTAL SCORE</div>
            <div className="text-[#00ff41]">{stats?.totalBuilderScore || "0"}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">POSITIONS</div>
            <div className="text-[#00ff41]">{stats?.totalPositions || 0}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">FEE SHARE</div>
            <div className="text-[#00ff41]">60% of fees</div>
          </div>
        </div>
      </div>

      {/* Lock tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LOCK_TIERS.map((tier) => (
          <div
            key={tier.days}
            className={`terminal-panel p-4 border-glow cursor-pointer transition-all ${
              selectedTier === tier.days
                ? "border-[#00ff41] bg-[#00ff4105]"
                : "border-[#00ff4130] hover:border-[#00ff4160]"
            }`}
            onClick={() => setSelectedTier(tier.days)}
          >
            <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">
              ▸ {tier.label}
            </div>
            <div className="text-2xl text-[#00ff41] glow mb-2">{tier.apy}</div>
            <div className="space-y-1 text-xs">
              <div className="text-[#00ff4160]">
                Multiplier: <span className="text-[#00ff41]">{tier.multiplier}</span>
              </div>
              <div className="text-[#00ff4160]">
                Lock: <span className="text-[#00ff41]">{tier.days} days</span>
              </div>
              <div className="text-[#00ff4160]">
                Score: <span className="text-[#00ff41]">{tier.multiplier} weight</span>
              </div>
            </div>
            {selectedTier === tier.days && (
              <div className="mt-2 text-xs text-[#00ff41]">✓ SELECTED</div>
            )}
          </div>
        ))}
      </div>

      {/* Stake form */}
      {connected && (
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ STAKE $BUILDER
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#00ff4160] mb-1 block">Amount</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-[#00ff4130] p-2 text-xs text-[#00ff41] focus:border-[#00ff41] outline-none"
              />
            </div>
            <div className="text-xs text-[#00ff4160]">
              Selected: {selectedTier} days ({LOCK_TIERS.find((t) => t.days === selectedTier)?.multiplier})
            </div>
            <button
              onClick={handleStake}
              disabled={staking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className={`w-full py-2 text-xs tracking-wider font-bold ${
                !staking && stakeAmount && parseFloat(stakeAmount) > 0
                  ? "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]"
                  : "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
              }`}
            >
              {staking ? "STAKING..." : `STAKE ${stakeAmount || "0"} $BUILD`}
            </button>
          </div>
        </div>
      )}

      {/* Transaction hash */}
      {txHash && (
        <div className="terminal-panel p-3 border border-[#00ff41]">
          <div className="text-xs text-[#00ff41]">
            ✅ Transaction submitted: {txHash.slice(0, 20)}...
          </div>
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            View on Etherscan →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="terminal-panel p-3 border border-[#ff0040]">
          <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
        </div>
      )}

      {/* User positions */}
      {connected && stats?.userPositions && stats.userPositions.length > 0 && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ YOUR POSITIONS
          </div>
          <div className="space-y-2">
            {stats.userPositions.map((pos, i) => (
              <div key={i} className="flex justify-between text-xs p-2 bg-[#00ff4105]">
                <span className="text-[#00ff41]">{pos.amount} $BUILD</span>
                <span className="text-[#00ff4160]">{pos.lockTier}d lock</span>
                <span className="text-[#00ff4160]">{pos.multiplier}</span>
                <span className="text-[#00ff4160]">Score: {pos.builderScore}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#00ff4115]">
            <div className="flex justify-between text-xs">
              <span className="text-[#00ff4160]">TOTAL STAKED</span>
              <span className="text-[#00ff41]">{stats.userTotalStaked} $BUILD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#00ff4160]">YOUR SCORE</span>
              <span className="text-[#00ff41]">{stats.userBuilderScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pending rewards */}
      {connected && stats?.pendingRewards && parseFloat(stats.pendingRewards) > 0 && (
        <div className="terminal-panel p-4 border-glow border-[#ffb000]">
          <div className="text-xs text-[#ffb00060] mb-3 tracking-widest">
            ▸ PENDING REWARDS
          </div>
          <div className="text-2xl text-[#ffb000] mb-3">{stats.pendingRewards} $BUILD</div>
          <button
            onClick={handleClaimRewards}
            disabled={staking}
            className="w-full py-2 text-xs tracking-wider font-bold bg-[#ffb000] text-[#0a0a0a] hover:bg-[#cc8800]"
          >
            {staking ? "CLAIMING..." : "CLAIM REWARDS"}
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>

      {/* How it works */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW STAKING WORKS
        </div>
        <div className="space-y-2 text-xs text-[#00ff4160]">
          <div>1. Stake $BUILDER tokens (min 100)</div>
          <div>2. Choose lock period (30/90/180 days)</div>
          <div>3. Earn 60% of Optimizer performance fees</div>
          <div>4. Longer lock = higher multiplier = more fees</div>
          <div>5. Early withdrawal: 2% penalty</div>
          <div>6. Claim rewards anytime (no lock required)</div>
        </div>
      </div>

      {/* Fee distribution */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ FEE DISTRIBUTION
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#00ff4160]">$BUILDER Stakers</span>
            <span className="text-[#00ff41]">60%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#00ff4160]">Treasury</span>
            <span className="text-[#00ff41]">20%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#00ff4160]">Developers</span>
            <span className="text-[#00ff41]">15%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#00ff4160]">Burn</span>
            <span className="text-[#00ff41]">5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
