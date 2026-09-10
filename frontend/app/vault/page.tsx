"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { ethers } from "ethers";
import { SEPOLIA_CONFIG, VAULT_ABI, TIER_NAMES, TIER_FEES, TIER_COSTS, TIER_MIN_DEPOSIT } from "@/lib/contract-config";

interface VaultPosition {
  deposited: number;
  currentValue: number;
  yield: number;
  entryPrice: number;
  currentPrice: number;
  shareOfPool: number;
  dailyFees: number;
  apy: number;
}

interface Subscription {
  tier: string;
  fee: number;
  active: boolean;
  expiresAt: string;
  totalDeposited: number;
  totalClaimed: number;
  feesPaid: number;
}

export default function Vault() {
  const { address, connected, connect, chainId, provider, signer } = useWallet();
  const [position, setPosition] = useState<VaultPosition | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [action, setAction] = useState<"deposit" | "withdraw" | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract when wallet is connected
  useEffect(() => {
    if (connected && provider && chainId === SEPOLIA_CONFIG.chainId) {
      const vaultContract = new ethers.Contract(
        SEPOLIA_CONFIG.contractAddress,
        VAULT_ABI,
        signer || provider
      );
      setContract(vaultContract);
      loadPosition(vaultContract);
    }
  }, [connected, provider, signer, chainId]);

  async function loadPosition(vaultContract: ethers.Contract) {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      // Get position from contract
      const pos = await vaultContract.getPosition(address);
      const sub = await vaultContract.getSubscription(address);
      const contractBalance = await vaultContract.getContractBalance();

      // Check if user has a position (ethDeposited > 0)
      const ethDeposited = parseFloat(ethers.formatEther(pos.ethDeposited));
      
      if (ethDeposited === 0) {
        // User has no position yet
        setPosition(null);
        setSubscription({
          tier: TIER_NAMES[sub.tier] || "FREE",
          fee: 20, // Default FREE tier fee
          active: sub.active,
          expiresAt: sub.expiresAt > 0 ? new Date(Number(sub.expiresAt) * 1000).toISOString().split("T")[0] : "Not subscribed",
          totalDeposited: 0,
          totalClaimed: 0,
          feesPaid: 0,
        });
        return;
      }

      // Convert from wei to ETH
      const yieldEarned = parseFloat(ethers.formatEther(pos.yieldEarned));
      const totalDeposited = parseFloat(ethers.formatEther(contractBalance));

      // Get tier info
      const tierInfo = await vaultContract.getTierInfo(sub.tier);
      const fee = Number(tierInfo.fee) / 100; // Convert from basis points to percentage

      setPosition({
        deposited: ethDeposited,
        currentValue: ethDeposited + yieldEarned,
        yield: yieldEarned,
        entryPrice: 0,
        currentPrice: 0,
        shareOfPool: totalDeposited > 0 ? (ethDeposited / totalDeposited) * 100 : 0,
        dailyFees: yieldEarned / 30, // Estimate daily fees
        apy: ethDeposited > 0 ? (yieldEarned / ethDeposited) * 100 * 12 : 0, // Estimate APY
      });

      setSubscription({
        tier: TIER_NAMES[sub.tier] || "FREE",
        fee: fee,
        active: sub.active,
        expiresAt: sub.expiresAt > 0 ? new Date(Number(sub.expiresAt) * 1000).toISOString().split("T")[0] : "Not subscribed",
        totalDeposited: ethDeposited,
        totalClaimed: 0,
        feesPaid: 0,
      });
    } catch (err) {
      console.error("Failed to load position:", err);
      // Set default state for new users
      setPosition(null);
      setSubscription({
        tier: "FREE",
        fee: 20,
        active: false,
        expiresAt: "Not subscribed",
        totalDeposited: 0,
        totalClaimed: 0,
        feesPaid: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!contract || !depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setAction("deposit");
      setLoading(true);
      setError(null);

      // Check if user is subscribed
      if (!subscription?.active) {
        setError("Please subscribe to a plan first before depositing");
        return;
      }

      // Convert ETH to wei
      const amountWei = ethers.parseEther(depositAmount);

      // Check minimum deposit
      const tierIndex = TIER_NAMES.indexOf(subscription?.tier || "FREE");
      const minDeposit = BigInt(TIER_MIN_DEPOSIT[tierIndex]);
      if (amountWei < minDeposit) {
        throw new Error(`Minimum deposit is ${ethers.formatEther(minDeposit)} ETH`);
      }

      // Call deposit function
      const tx = await contract.deposit({ value: amountWei });
      await tx.wait();

      alert(`Successfully deposited ${depositAmount} ETH!`);
      setDepositAmount("");
      loadPosition(contract);
    } catch (err) {
      console.error("Deposit failed:", err);
      setError(`Deposit failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAction(null);
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!contract || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

    try {
      setAction("withdraw");
      setLoading(true);
      setError(null);

      // Convert ETH to wei
      const amountWei = ethers.parseEther(withdrawAmount);

      // Call withdraw function
      const tx = await contract.withdraw(amountWei);
      await tx.wait();

      alert(`Successfully withdrew ${withdrawAmount} ETH!`);
      setWithdrawAmount("");
      loadPosition(contract);
    } catch (err) {
      console.error("Withdraw failed:", err);
      setError(`Withdraw failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAction(null);
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!contract) return;

    try {
      setAction("withdraw");
      setLoading(true);
      setError(null);

      // Call claimYield function
      const tx = await contract.claimYield();
      await tx.wait();

      alert(`Successfully claimed ${position?.yield.toFixed(4)} ETH yield!`);
      loadPosition(contract);
    } catch (err) {
      console.error("Claim failed:", err);
      setError(`Claim failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAction(null);
      setLoading(false);
    }
  }

  async function handleSubscribe(tierIndex: number) {
    if (!contract) return;

    try {
      setAction("deposit"); // Reuse action state
      setLoading(true);
      setError(null);

      // Get tier cost
      const tierInfo = await contract.getTierInfo(tierIndex);
      const cost = tierInfo.cost;

      // Call subscribe function
      const tx = await contract.subscribe(tierIndex, { value: cost });
      await tx.wait();

      alert(`Successfully subscribed to ${TIER_NAMES[tierIndex]}!`);
      loadPosition(contract);
    } catch (err) {
      console.error("Subscription failed:", err);
      setError(`Subscription failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAction(null);
      setLoading(false);
    }
  }

  // Check if wrong network
  if (connected && chainId !== SEPOLIA_CONFIG.chainId) {
    return (
      <div className="space-y-4 fade-in">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ VAULT ─────────────────────────────────────────────────────────────┐
        </h1>
        <div className="terminal-panel p-8 border-glow border-[#ffb000] text-center">
          <div className="text-[#ffb000] mb-4">WRONG NETWORK</div>
          <div className="text-sm text-[#00ff4160] mb-4">
            Please switch to Sepolia Testnet in MetaMask
          </div>
          <div className="text-xs text-[#00ff4140]">
            Network: {chainId === 1 ? "Mainnet" : `Chain ${chainId}`}
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-4 fade-in">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ VAULT ─────────────────────────────────────────────────────────────┐
        </h1>
        <div className="terminal-panel p-8 border-glow text-center">
          <div className="text-[#00ff4160] mb-4">Connect your wallet to view your vault position</div>
          <button
            onClick={connect}
            className="bg-[#00ff41] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]"
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ VAULT ─────────────────────────────────────────────────────────────┐
      </h1>

      {/* Network info */}
      <div className="terminal-panel p-3 border border-[#00ff41]">
        <div className="text-xs text-[#00ff41] text-center">
          🧪 SEPOLIA TESTNET - Contract: {SEPOLIA_CONFIG.contractAddress.slice(0, 10)}...
        </div>
      </div>

      {/* Subscription warning - not blocking */}
      {subscription && !subscription.active && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ You need to subscribe to a plan to deposit. <a href="/subscribe" className="underline">Subscribe now</a>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="terminal-panel p-3 border border-[#ff0040]">
          <div className="text-xs text-[#ff0040] text-center">{error}</div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">Loading...</div>
        </div>
      )}

      {/* Exclusive access warning */}
      <div className="terminal-panel p-3 border border-[#ffb000]">
        <div className="text-xs text-[#ffb000] text-center">
          ⚠️ THIS IS THE ONLY WAY TO ACCESS HOOK POOL YIELD
        </div>
        <div className="text-xs text-[#00ff4160] text-center mt-1">
          Our Vault handles all complexity: position management, rebalancing, MEV protection, auto-compound.
          Going direct to Uniswap V4 is NOT recommended.
        </div>
      </div>

      {/* Subscription status */}
      {subscription && (
        <div className="terminal-panel p-4 border-glow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#00ff4160] tracking-widest">SUBSCRIPTION</div>
              <div className="text-lg text-[#00ff41] font-bold">{subscription.tier}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00ff4160]">PERFORMANCE FEE</div>
              <div className="text-lg text-[#00ff41]">{subscription.fee}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#00ff4160]">EXPIRES</div>
              <div className="text-sm text-[#00ff41]">{subscription.expiresAt}</div>
            </div>
          </div>
        </div>
      )}

      {/* Position */}
      {position && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Position summary */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ YOUR POSITION
            </div>
            <div className="space-y-2">
              <Row label="DEPOSITED" value={`${position.deposited.toFixed(4)} ETH`} />
              <Row label="CURRENT" value={`${position.currentValue.toFixed(4)} ETH`} highlight />
              <Row label="YIELD" value={`+${position.yield.toFixed(4)} ETH`} color="#00ff41" />
              <Row label="APY" value={`${position.apy.toFixed(1)}%`} color="#00ff41" />
              <Row label="POOL SHARE" value={`${position.shareOfPool.toFixed(2)}%`} />
            </div>
          </div>

          {/* Yield details */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ YIELD BREAKDOWN
            </div>
            <div className="space-y-2">
              <Row label="DAILY FEES" value={`${position.dailyFees.toFixed(4)} ETH`} />
              <Row label="WEEKLY" value={`${(position.dailyFees * 7).toFixed(4)} ETH`} />
              <Row label="MONTHLY" value={`${(position.dailyFees * 30).toFixed(4)} ETH`} />
              <Row label="ANNUAL" value={`${(position.dailyFees * 365).toFixed(4)} ETH`} />
              <div className="mt-3 pt-3 border-t border-[#00ff4115]">
                <Row label="AFTER FEE (${subscription?.fee}%)" value={`${(position.yield * (1 - (subscription?.fee || 0) / 100)).toFixed(4)} ETH`} color="#00ff41" />
              </div>
            </div>
          </div>

          {/* Fee stats */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ FEE HISTORY
            </div>
            <div className="space-y-2">
              <Row label="TOTAL DEPOSITED" value={`${subscription?.totalDeposited.toFixed(2)} ETH`} />
              <Row label="TOTAL CLAIMED" value={`${subscription?.totalClaimed.toFixed(2)} ETH`} />
              <Row label="FEES PAID" value={`${subscription?.feesPaid.toFixed(4)} ETH`} color="#ff0040" />
              <div className="mt-3 pt-3 border-t border-[#00ff4115]">
                <div className="text-xs text-[#00ff4140]">NET RETURN</div>
                <div className="text-lg text-[#00ff41] glow">
                  {((subscription?.totalClaimed || 0) - (subscription?.feesPaid || 0)).toFixed(4)} ETH
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deposit */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ DEPOSIT
          </div>
          <div className="space-y-3">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount in ETH"
              className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-xs w-full focus:outline-none focus:border-[#00ff41] glow"
              min="0.01"
              step="0.01"
            />
            <button
              onClick={handleDeposit}
              disabled={action === "deposit" || loading}
              className="bg-[#00ff41] text-[#0a0a0a] w-full py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33] disabled:opacity-50"
            >
              {action === "deposit" ? "DEPOSITING..." : "DEPOSIT ETH"}
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ WITHDRAW
          </div>
          <div className="space-y-3">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in ETH (0 = all)"
              className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-xs w-full focus:outline-none focus:border-[#00ff41] glow"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleWithdraw}
              disabled={action === "withdraw" || loading}
              className="bg-[#ff0040] text-[#fff] w-full py-2 text-xs font-bold tracking-wider hover:bg-[#cc0033] disabled:opacity-50"
            >
              {action === "withdraw" ? "WITHDRAWING..." : "WITHDRAW ETH"}
            </button>
          </div>
        </div>

        {/* Claim */}
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ CLAIM YIELD
          </div>
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="text-xs text-[#00ff4140]">PENDING YIELD</div>
              <div className="text-2xl text-[#00ff41] glow-strong">
                {position?.yield.toFixed(4) || "0.0000"} ETH
              </div>
              <div className="text-xs text-[#00ff4140] mt-1">
                After {subscription?.fee}% fee: {((position?.yield || 0) * (1 - (subscription?.fee || 0) / 100)).toFixed(4)} ETH
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={action === "withdraw" || loading}
              className="bg-[#ffb000] text-[#0a0a0a] w-full py-2 text-xs font-bold tracking-wider hover:bg-[#cc8c00] disabled:opacity-50"
            >
              {action === "withdraw" ? "CLAIMING..." : "CLAIM YIELD"}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#00ff4150]">{label}</span>
      <span
        className={highlight ? "glow" : ""}
        style={{ color: color || "#00ff41" }}
      >
        {value}
      </span>
    </div>
  );
}
