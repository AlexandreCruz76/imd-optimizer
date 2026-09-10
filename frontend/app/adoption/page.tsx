"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { ethers } from "ethers";
import { ADOPTION_CONFIG, ADOPTION_ABI } from "@/lib/contract-config";

interface TierConfig {
  name: string;
  minContribution: string;
  feeDiscount: number;
  revenueShare: number;
  maxPositions: number;
  earlyAccess: boolean;
  governance: boolean;
  description: string;
  color: string;
  icon: string;
}

interface SupporterInfo {
  tier: number;
  contributed: string;
  joinedAt: string;
  isActive: boolean;
  pendingBenefits: string;
}

const TIERS: TierConfig[] = [
  {
    name: "SEED",
    minContribution: "0.005",
    feeDiscount: 3,
    revenueShare: 0.5,
    maxPositions: 1,
    earlyAccess: false,
    governance: false,
    description: "Plant a seed - 3% fee discount, 0.5% revenue share",
    color: "#00ff41",
    icon: "🌱",
  },
  {
    name: "SPROUT",
    minContribution: "0.01",
    feeDiscount: 5,
    revenueShare: 1,
    maxPositions: 2,
    earlyAccess: false,
    governance: false,
    description: "Growing supporter - 5% fee discount, 1% revenue share",
    color: "#7fff00",
    icon: "🌿",
  },
  {
    name: "LEAF",
    minContribution: "0.025",
    feeDiscount: 8,
    revenueShare: 2,
    maxPositions: 3,
    earlyAccess: true,
    governance: false,
    description: "Active supporter - 8% fee discount, 2% revenue share, early access",
    color: "#ffb000",
    icon: "🍃",
  },
  {
    name: "BRANCH",
    minContribution: "0.05",
    feeDiscount: 12,
    revenueShare: 3.5,
    maxPositions: 5,
    earlyAccess: true,
    governance: true,
    description: "Core supporter - 12% fee discount, 3.5% revenue share, governance",
    color: "#00d4ff",
    icon: "🌳",
  },
  {
    name: "TRUNK",
    minContribution: "0.1",
    feeDiscount: 20,
    revenueShare: 5,
    maxPositions: 10,
    earlyAccess: true,
    governance: true,
    description: "Founding member - 20% fee discount, 5% revenue share, full governance",
    color: "#ff00d4",
    icon: "🏛️",
  },
];

export default function Adoption() {
  const { address, connected, connect, chainId, signer } = useWallet();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [supporterInfo, setSupporterInfo] = useState<SupporterInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (connected && address) {
      loadSupporterInfo();
    }
  }, [connected, address]);

  async function loadSupporterInfo() {
    // In production, load from contract
    // For now, use mock data
    setSupporterInfo(null);
  }

  async function handleJoinTier() {
    if (!connected || !signer || selectedTier === null) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const tier = TIERS[selectedTier];
      const amount = customAmount || tier.minContribution;
      const amountWei = ethers.parseEther(amount);

      // Call contract
      const contract = new ethers.Contract(ADOPTION_CONFIG.contractAddress, ADOPTION_ABI, signer);
      const tx = await contract.joinTier(selectedTier, message, { value: amountWei });
      await tx.wait();

      setSuccess(`Successfully joined ${tier.name} tier with ${amount} ETH!`);
      setSupporterInfo({
        tier: selectedTier,
        contributed: amount,
        joinedAt: new Date().toISOString(),
        isActive: true,
        pendingBenefits: "0",
      });
    } catch (err) {
      console.error("Join failed:", err);
      setError(`Failed to join: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimBenefits() {
    if (!connected || !signer) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call contract
      const contract = new ethers.Contract(ADOPTION_CONFIG.contractAddress, ADOPTION_ABI, signer);
      const tx = await contract.claimBenefits();
      await tx.wait();

      setSuccess("Benefits claimed successfully!");
    } catch (err) {
      console.error("Claim failed:", err);
      setError(`Failed to claim: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ ADOPTION PROGRAM ─────────────────────────────────────────────────────┐
      </h1>

      {/* Goal Progress */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-[#00ff4160] tracking-widest">FUNDRAISING GOAL</div>
          <div className="text-xs text-[#00ff41]">5.0 ETH</div>
        </div>
        <div className="w-full bg-[#0a0a0a] h-4 border border-[#00ff4130]">
          <div
            className="h-full bg-[#00ff41]"
            style={{ width: "0%" }} // Update with actual progress
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#00ff4160]">
          <span>0.0 ETH raised</span>
          <span>0% complete</span>
        </div>
      </div>

      {/* Benefits Overview */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="text-xs text-[#ffb000] mb-3 tracking-widest">
          ▸ EARLY SUPPORTER BENEFITS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="text-[#00ff41] text-lg">5-50%</div>
            <div className="text-[#00ff4160]">Fee Discounts</div>
          </div>
          <div className="text-center">
            <div className="text-[#00ff41] text-lg">1-20%</div>
            <div className="text-[#00ff4160]">Revenue Share</div>
          </div>
          <div className="text-center">
            <div className="text-[#00ff41] text-lg">Early</div>
            <div className="text-[#00ff4160]">Access Features</div>
          </div>
          <div className="text-center">
            <div className="text-[#00ff41] text-lg">Governance</div>
            <div className="text-[#00ff4160]">Voting Rights</div>
          </div>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIERS.map((tier, index) => (
          <div
            key={tier.name}
            className={`terminal-panel p-4 border-glow cursor-pointer transition-all ${
              selectedTier === index
                ? "border-[#00ff41] bg-[#00ff4110]"
                : "border-[#00ff4130] hover:border-[#00ff4160]"
            }`}
            onClick={() => setSelectedTier(index)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg">{tier.icon}</div>
              <div
                className="text-xs font-bold px-2 py-1"
                style={{ backgroundColor: tier.color + "20", color: tier.color }}
              >
                {tier.name}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Minimum</span>
                <span className="text-[#00ff41]">{tier.minContribution} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Fee Discount</span>
                <span className="text-[#00ff41]">{tier.feeDiscount}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Revenue Share</span>
                <span className="text-[#00ff41]">{tier.revenueShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Max Positions</span>
                <span className="text-[#00ff41]">{tier.maxPositions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Early Access</span>
                <span className={tier.earlyAccess ? "text-[#00ff41]" : "text-[#00ff4140]"}>
                  {tier.earlyAccess ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#00ff4160]">Governance</span>
                <span className={tier.governance ? "text-[#00ff41]" : "text-[#00ff4140]"}>
                  {tier.governance ? "✓" : "✗"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#00ff4115]">
              <div className="text-xs text-[#00ff4160]">{tier.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Join Form */}
      {selectedTier !== null && (
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ JOIN {TIERS[selectedTier].name} TIER
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#00ff4160] block mb-1">Amount (ETH)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`Minimum: ${TIERS[selectedTier].minContribution} ETH`}
                className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-xs w-full focus:outline-none focus:border-[#00ff41] glow"
                min={TIERS[selectedTier].minContribution}
                step="0.01"
              />
            </div>

            <div>
              <label className="text-xs text-[#00ff4160] block mb-1">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why are you supporting IMD?"
                className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-xs w-full focus:outline-none focus:border-[#00ff41] glow h-20 resize-none"
              />
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="terminal-panel p-3 border border-[#ff0040]">
                <div className="text-xs text-[#ff0040] text-center">{error}</div>
              </div>
            )}

            {success && (
              <div className="terminal-panel p-3 border border-[#00ff41]">
                <div className="text-xs text-[#00ff41] text-center">{success}</div>
              </div>
            )}

            <button
              onClick={handleJoinTier}
              disabled={!connected || loading}
              className="w-full py-3 text-xs font-bold tracking-wider disabled:opacity-50"
              style={{
                backgroundColor: connected ? TIERS[selectedTier].color : "#333",
                color: connected ? "#0a0a0a" : "#666",
              }}
            >
              {!connected
                ? "CONNECT WALLET TO JOIN"
                : loading
                ? "PROCESSING..."
                : `JOIN ${TIERS[selectedTier].name} - ${customAmount || TIERS[selectedTier].minContribution} ETH`}
            </button>
          </div>
        </div>
      )}

      {/* Current Supporter Status */}
      {supporterInfo && supporterInfo.isActive && (
        <div className="terminal-panel p-4 border-glow border-[#ffb000]">
          <div className="text-xs text-[#ffb000] mb-3 tracking-widest">
            ▸ YOUR SUPPORTER STATUS
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4160]">TIER</div>
              <div className="text-[#00ff41]">{TIERS[supporterInfo.tier].name}</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">CONTRIBUTED</div>
              <div className="text-[#00ff41]">{supporterInfo.contributed} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">PENDING BENEFITS</div>
              <div className="text-[#00ff41]">{supporterInfo.pendingBenefits} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">JOINED</div>
              <div className="text-[#00ff41]">
                {new Date(supporterInfo.joinedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleClaimBenefits}
              disabled={loading || parseFloat(supporterInfo.pendingBenefits) === 0}
              className="bg-[#ffb000] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#cc8c00] disabled:opacity-50"
            >
              {loading ? "CLAIMING..." : "CLAIM BENEFITS"}
            </button>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW IT WORKS
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <div className="flex items-start gap-3">
            <span className="text-[#00ff41]">1.</span>
            <span>Choose a support tier based on your contribution level</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#00ff41]">2.</span>
            <span>Contribute ETH to support the mainnet deployment</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#00ff41]">3.</span>
            <span>Receive fee discounts and revenue share based on your tier</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#00ff41]">4.</span>
            <span>Higher tiers get early access and governance rights</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
