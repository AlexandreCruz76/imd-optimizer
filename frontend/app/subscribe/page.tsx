"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { ethers } from "ethers";
import { SEPOLIA_CONFIG, VAULT_ABI, TIER_NAMES, TIER_FEES, TIER_COSTS, TIER_MIN_DEPOSIT } from "@/lib/contract-config";

interface Tier {
  id: string;
  name: string;
  fee: number;
  minDeposit: string;
  cost: string;
  costWei: string;
  features: string[];
  color: string;
}

const TIERS: Tier[] = [
  {
    id: "FREE",
    name: "FREE",
    fee: 20,
    minDeposit: "0.01 ETH",
    cost: "0",
    costWei: "0",
    features: [
      "Pool state dashboard",
      "Basic optimizer",
      "24h volume tracking",
      "Burn events",
    ],
    color: "#00ff4160",
  },
  {
    id: "BASIC",
    name: "BASIC",
    fee: 15,
    minDeposit: "0.1 ETH",
    cost: "0.05 ETH",
    costWei: "50000000000000000",
    features: [
      "Everything in FREE",
      "Real-time swap monitor",
      "Fee projections",
      "Risk analysis",
      "Priority alerts",
    ],
    color: "#00ff41",
  },
  {
    id: "PRO",
    name: "PRO",
    fee: 10,
    minDeposit: "1 ETH",
    cost: "0.2 ETH",
    costWei: "200000000000000000",
    features: [
      "Everything in BASIC",
      "Auto-rebalance alerts",
      "Optimal entry signals",
      "Impermanent loss calc",
      "Historical analytics",
    ],
    color: "#00ffff",
  },
  {
    id: "WHALE",
    name: "WHALE",
    fee: 5,
    minDeposit: "10 ETH",
    cost: "0.5 ETH",
    costWei: "500000000000000000",
    features: [
      "Everything in PRO",
      "Custom RPC endpoints",
      "API access",
      "Direct support channel",
      "Governance voting",
      "Early access features",
    ],
    color: "#ffb000",
  },
];

export default function Subscribe() {
  const { address, connected, connect, chainId, balance } = useWallet();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");
  const [projection, setProjection] = useState<any>(null);

  // Calculate projection when deposit amount changes
  useEffect(() => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      calculateProjection(parseFloat(depositAmount));
    }
  }, [depositAmount]);

  function calculateProjection(ethAmount: number) {
    const hookApy = 208; // Current hook pool APY
    const nativeApy = 5; // Native pool APY

    const results = TIERS.map((tier) => {
      const yearlyYield = ethAmount * (hookApy / 100);
      const fee = yearlyYield * (tier.fee / 100);
      const netYield = yearlyYield - fee;
      const netApy = (netYield / ethAmount) * 100;

      return {
        tier: tier.name,
        fee: tier.fee,
        yearlyYield: yearlyYield.toFixed(4),
        feeAmount: fee.toFixed(4),
        netYield: netYield.toFixed(4),
        netApy: netApy.toFixed(1),
        monthlyYield: (netYield / 12).toFixed(4),
        dailyYield: (netYield / 365).toFixed(6),
      };
    });

    setProjection(results);
  }

  async function handleSubscribe(tier: Tier) {
    if (!connected) {
      connect();
      return;
    }

    // Allow on mainnet (chainId 1) or Sepolia (chainId 11155111)
    if (chainId !== 1 && chainId !== 11155111) {
      alert("Please switch to Ethereum Mainnet or Sepolia");
      return;
    }

    // If on mainnet, warn that contract is on Sepolia
    if (chainId === 1) {
      const confirmed = window.confirm(
        "⚠️ Contract is deployed on Sepolia Testnet.\n\n" +
        "To test subscriptions, switch to Sepolia network.\n\n" +
        "Continue anyway?"
      );
      if (!confirmed) return;
    }

    setSelectedTier(tier.id);
    setSubscribing(true);

    try {
      // Check if we have a provider
      if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(
        SEPOLIA_CONFIG.contractAddress,
        VAULT_ABI,
        signer
      );

      // Get tier cost
      const tierIndex = TIERS.indexOf(tier);
      const tierInfo = await contract.getTierInfo(tierIndex);
      const cost = tierInfo.cost;

      // Call subscribe function
      const tx = await contract.subscribe(tierIndex, { value: cost });
      await tx.wait();

      alert(`Successfully subscribed to ${tier.name}! Performance fee: ${tier.fee}%`);
    } catch (err: any) {
      console.error("Subscription failed:", err);
      
      // If user is on mainnet, show helpful message
      if (chainId === 1) {
        alert("Contract is on Sepolia Testnet. Please switch to Sepolia network to subscribe.");
      } else {
        alert(`Subscription failed: ${err.message || String(err)}`);
      }
    } finally {
      setSubscribing(false);
      setSelectedTier(null);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ SUBSCRIPTION ───────────────────────────────────────────────────────┐
      </h1>

      {/* Wallet Info */}
      {connected && (
        <div className="terminal-panel p-4 border-glow">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-[#00ff4160] tracking-widest">WALLET</div>
              <div className="text-sm text-[#00ff41]">{address?.slice(0, 10)}...{address?.slice(-8)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00ff4160]">BALANCE</div>
              <div className="text-sm text-[#00ff41]">{parseFloat(balance).toFixed(4)} ETH</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00ff4160]">NETWORK</div>
              <div className={`text-sm ${chainId === 1 ? "#00ff41" : chainId === 11155111 ? "#ffb000" : "#ff0040"}`}>
                {chainId === 1 ? "Mainnet" : chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Warning */}
      {connected && chainId === 1 && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Contract is on Sepolia Testnet. Switch to Sepolia to test subscriptions.
          </div>
        </div>
      )}

      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">
          ▸ HOW IT WORKS
        </div>
        <div className="text-sm text-[#00ff4170] space-y-1">
          <p>1. Connect your wallet (MetaMask, etc.)</p>
          <p>2. Choose a subscription tier</p>
          <p>3. Deposit ETH into the Optimizer Vault</p>
          <p>4. Vault positions in $IMD Hook Pool automatically</p>
          <p>5. Earn yield from swap fees + burn rewards</p>
          <p>6. Protocol charges <span className="text-[#00ff41]">performance fee</span> on your profit only</p>
        </div>
      </div>

      {/* Projection Calculator */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ YIELD PROJECTION CALCULATOR
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-[#00ff4150]">DEPOSIT AMOUNT:</span>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-1 text-xs w-32 focus:outline-none focus:border-[#00ff41] glow"
            min="0.01"
            step="0.1"
          />
          <span className="text-xs text-[#00ff4150]">ETH</span>
        </div>

        {projection && (
          <div className="overflow-x-auto">
            <table className="terminal-table w-full">
              <thead>
                <tr className="text-[#00ff4150] text-xs">
                  <th>TIER</th>
                  <th>FEE</th>
                  <th>YEARLY YIELD</th>
                  <th>FEE AMOUNT</th>
                  <th>NET YIELD</th>
                  <th>NET APY</th>
                </tr>
              </thead>
              <tbody>
                {projection.map((p: any) => (
                  <tr key={p.tier}>
                    <td className="text-[#00ff41]">{p.tier}</td>
                    <td>{p.fee}%</td>
                    <td className="text-[#00ff41]">{p.yearlyYield} ETH</td>
                    <td className="text-[#ff0040]">-{p.feeAmount} ETH</td>
                    <td className="text-[#00ff41]">{p.netYield} ETH</td>
                    <td className="text-[#00ff41]">{p.netApy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`terminal-panel p-4 border-glow transition-all hover:border-[#00ff41] ${
              selectedTier === tier.id ? "border-[#00ff41] glow" : ""
            }`}
            style={{ borderColor: tier.color + "40" }}
          >
            <div className="text-xs tracking-widest mb-3" style={{ color: tier.color }}>
              ▸ {tier.name}
            </div>

            <div className="space-y-3">
              {/* Wallet Balance */}
              {connected && (
                <div className="bg-[#0a0a0a] border border-[#00ff4120] p-2">
                  <div className="text-xs text-[#00ff4140]">YOUR BALANCE</div>
                  <div className="text-sm text-[#00ff41]">{parseFloat(balance).toFixed(4)} ETH</div>
                </div>
              )}

              {/* Performance fee */}
              <div>
                <div className="text-xs text-[#00ff4140]">PERFORMANCE FEE</div>
                <div className="text-2xl font-bold" style={{ color: tier.color }}>
                  {tier.fee}%
                </div>
                <div className="text-xs text-[#00ff4140]">on yield only</div>
              </div>

              {/* Min deposit */}
              <div>
                <div className="text-xs text-[#00ff4140]">MIN DEPOSIT</div>
                <div className="text-sm text-[#00ff41]">{tier.minDeposit}</div>
              </div>

              {/* Subscription cost */}
              <div>
                <div className="text-xs text-[#00ff4140]">SUBSCRIPTION</div>
                <div className="text-sm text-[#00ff41]">
                  {tier.cost === "0" ? "FREE" : `${tier.cost} one-time`}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-[#00ff4160]">
                    <span style={{ color: tier.color }}>+</span> {f}
                  </div>
                ))}
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => handleSubscribe(tier)}
                disabled={subscribing && selectedTier === tier.id}
                className="w-full py-2 text-xs font-bold tracking-wider transition-colors mt-2"
                style={{
                  backgroundColor: tier.color,
                  color: "#0a0a0a",
                  opacity: subscribing && selectedTier === tier.id ? 0.5 : 1,
                }}
              >
                {!connected
                  ? "CONNECT WALLET"
                  : subscribing && selectedTier === tier.id
                  ? "SUBSCRIBING..."
                  : chainId === 1
                  ? "MAINNET (Switch to Sepolia)"
                  : "SUBSCRIBE"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fee comparison */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ FEE COMPARISON
        </div>
        <table className="terminal-table">
          <thead>
            <tr className="text-[#00ff4150] text-xs">
              <th>TIER</th>
              <th>FEE</th>
              <th>ON 10 ETH (37% APY)</th>
              <th>ANNUAL COST</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-[#00ff4160]">FREE</td>
              <td>20%</td>
              <td className="text-[#00ff41]">$2,900/year</td>
              <td className="text-[#ff0040]">$2,900</td>
            </tr>
            <tr>
              <td className="text-[#00ff41]">BASIC</td>
              <td>15%</td>
              <td className="text-[#00ff41]">$2,175/year</td>
              <td className="text-[#ffb000]">$2,175 + $125 sub</td>
            </tr>
            <tr>
              <td className="text-[#00ffff]">PRO</td>
              <td>10%</td>
              <td className="text-[#00ff41]">$1,450/year</td>
              <td className="text-[#00ff41]">$1,450 + $500 sub</td>
            </tr>
            <tr>
              <td className="text-[#ffb000]">WHALE</td>
              <td>5%</td>
              <td className="text-[#00ff41]">$725/year</td>
              <td className="text-[#00ff41]">$725 + $1,250 sub</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
