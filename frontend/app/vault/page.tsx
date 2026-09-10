"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { ethers } from "ethers";
import { SEPOLIA_CONFIG, VAULT_ABI, TIER_NAMES, TIER_FEES, TIER_COSTS, TIER_MIN_DEPOSIT } from "@/lib/contract-config";

type VaultTab = "overview" | "deposit" | "withdraw" | "calculator" | "subscribe";

interface VaultPosition {
  deposited: number;
  currentValue: number;
  yield: number;
  shareOfPool: number;
  dailyFees: number;
  apy: number;
}

interface Subscription {
  tier: string;
  tierIndex: number;
  fee: number;
  active: boolean;
  expiresAt: string;
  minDeposit: string;
}

interface ContractState {
  totalDeposits: number;
  totalYield: number;
  totalFees: number;
  contractBalance: number;
}

const HOOK_APY = 208;
const NATIVE_APY = 5;
const HOOK_UNISWAP_URL = "https://app.uniswap.org/explore/pools/ethereum/0x267dacd01a4bd11784106f35e18d35993d0075cc4df45be3c95d0d9d344e62f6";

export default function Vault() {
  const { address, connected, connect, chainId, balance, provider, signer, switchChain } = useWallet();
  const [activeTab, setActiveTab] = useState<VaultTab>("overview");
  const [position, setPosition] = useState<VaultPosition | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [calcDeposit, setCalcDeposit] = useState("1");
  const [calcTier, setCalcTier] = useState(1);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

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
      const pos = await vaultContract.getPosition(address);
      const sub = await vaultContract.getSubscription(address);
      const cb = await vaultContract.getContractBalance();
      const td = await vaultContract.totalDeposits();
      const ty = await vaultContract.totalYield();
      const tf = await vaultContract.totalFeesCollected();

      const ethDeposited = parseFloat(ethers.formatEther(pos[0]));
      const yieldEarned = parseFloat(ethers.formatEther(pos[2]));
      const totalDep = parseFloat(ethers.formatEther(td));
      const contractBal = parseFloat(ethers.formatEther(cb));
      const tierIdx = Number(sub[0]);

      const tierInfo = await vaultContract.getTierInfo(tierIdx);
      const minDep = parseFloat(ethers.formatEther(tierInfo.minDeposit));
      const feePct = Number(tierInfo.fee) / 100;

      if (ethDeposited === 0) {
        setPosition(null);
      } else {
        setPosition({
          deposited: ethDeposited,
          currentValue: ethDeposited + yieldEarned,
          yield: yieldEarned,
          shareOfPool: totalDep > 0 ? (ethDeposited / totalDep) * 100 : 0,
          dailyFees: yieldEarned / 30,
          apy: ethDeposited > 0 ? (yieldEarned / ethDeposited) * 100 * 12 : 0,
        });
      }

      setSubscription({
        tier: TIER_NAMES[tierIdx] || "FREE",
        tierIndex: tierIdx,
        fee: feePct,
        active: sub[3],
        expiresAt: sub[2] > 0 ? new Date(Number(sub[2]) * 1000).toISOString().split("T")[0] : "N/A",
        minDeposit: minDep.toFixed(4),
      });

      setContractState({
        totalDeposits: totalDep,
        totalYield: parseFloat(ethers.formatEther(ty)),
        totalFees: parseFloat(ethers.formatEther(tf)),
        contractBalance: contractBal,
      });
    } catch (err) {
      console.error("Load position failed:", err);
      setPosition(null);
      setSubscription({ tier: "FREE", tierIndex: 0, fee: 20, active: false, expiresAt: "N/A", minDeposit: "0.01" });
      setContractState(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!contract || !depositAmount || parseFloat(depositAmount) <= 0) return;
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      if (!subscription?.active) {
        setError("Subscribe to a plan first");
        return;
      }
      const amountWei = ethers.parseEther(depositAmount);
      const minWei = BigInt(TIER_MIN_DEPOSIT[subscription.tierIndex]);
      if (amountWei < minWei) {
        throw new Error(`Minimum for ${subscription.tier} tier: ${ethers.formatEther(minWei)} ETH`);
      }
      const tx = await contract.deposit({ value: amountWei });
      setTxHash(tx.hash);
      await tx.wait();
      setDepositAmount("");
      loadPosition(contract);
    } catch (err) {
      setError(`Deposit failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!contract || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      const amountWei = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdraw(amountWei);
      setTxHash(tx.hash);
      await tx.wait();
      setWithdrawAmount("");
      loadPosition(contract);
    } catch (err) {
      setError(`Withdraw failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawAll() {
    if (!contract || !position) return;
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      const amountWei = ethers.parseEther(position.deposited.toString());
      const tx = await contract.withdraw(amountWei);
      setTxHash(tx.hash);
      await tx.wait();
      loadPosition(contract);
    } catch (err) {
      setError(`Withdraw all failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!contract) return;
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      const tx = await contract.claimYield();
      setTxHash(tx.hash);
      await tx.wait();
      loadPosition(contract);
    } catch (err) {
      setError(`Claim failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(tierIndex: number) {
    if (!contract) return;
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      const tierInfo = await contract.getTierInfo(tierIndex);
      const tx = await contract.subscribe(tierIndex, { value: tierInfo.cost });
      setTxHash(tx.hash);
      await tx.wait();
      loadPosition(contract);
    } catch (err) {
      setError(`Subscribe failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // Calculator projection
  function calcProjection(ethAmt: number, tierIdx: number) {
    const yearlyYield = ethAmt * (HOOK_APY / 100);
    const fee = yearlyYield * (TIER_FEES[tierIdx] / 10000);
    const netYield = yearlyYield - fee;
    const netApy = (netYield / ethAmt) * 100;
    return {
      yearlyYield: yearlyYield.toFixed(4),
      feeAmount: fee.toFixed(4),
      netYield: netYield.toFixed(4),
      netApy: netApy.toFixed(1),
      monthlyYield: (netYield / 12).toFixed(4),
      weeklyYield: (netYield / 52).toFixed(4),
      dailyYield: (netYield / 365).toFixed(6),
      vsNative: ((netApy / NATIVE_APY) * 100).toFixed(0),
    };
  }

  // Wrong network
  if (connected && chainId !== SEPOLIA_CONFIG.chainId) {
    return (
      <div className="space-y-4 fade-in">
        <div className="terminal-panel p-8 border-glow border-[#ffb000] text-center">
          <div className="text-[#ffb000] mb-4">WRONG NETWORK</div>
          <div className="text-sm text-[#00ff4160] mb-4">Switch to Sepolia Testnet in MetaMask</div>
          <button onClick={() => switchChain(SEPOLIA_CONFIG.chainId)} className="bg-[#ffb000] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider">SWITCH TO SEPOLIA</button>
        </div>
      </div>
    );
  }

  // Not connected
  if (!connected) {
    return (
      <div className="space-y-4 fade-in">
        <div className="terminal-panel p-8 border-glow text-center">
          <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">VAULT // CONNECT WALLET</div>
          <div className="text-sm text-[#00ff41] mb-4">Connect your wallet to manage your vault position</div>
          <button onClick={connect} className="bg-[#00ff41] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: VaultTab; label: string; key: string }[] = [
    { id: "overview", label: "OVERVIEW", key: "F1" },
    { id: "deposit", label: "DEPOSIT", key: "F2" },
    { id: "withdraw", label: "WITHDRAW", key: "F3" },
    { id: "calculator", label: "CALCULATOR", key: "F4" },
    { id: "subscribe", label: "SUBSCRIBE", key: "F5" },
  ];

  return (
    <div className="space-y-4 fade-in">
      {/* ── Header with pool info ── */}
      <div className="terminal-panel p-3 border-glow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#00ff4160] tracking-widest">VAULT // $IMD HOOK POOL</div>
            <div className="text-sm text-[#00ff41]">OptimizerVaultTest</div>
          </div>
          <div className="text-right text-xs">
            <div className="text-[#00ff4160]">CONTRACT</div>
            <a
              href={`https://sepolia.etherscan.io/address/${SEPOLIA_CONFIG.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff41] hover:underline"
            >
              {SEPOLIA_CONFIG.contractAddress.slice(0, 8)}...{SEPOLIA_CONFIG.contractAddress.slice(-6)}
            </a>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="terminal-panel border-glow">
        <div className="flex border-b border-[#00ff4120]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); setTxHash(null); }}
              className={`flex-1 px-4 py-2.5 text-xs tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-[#00ff41] text-[#0a0a0a] font-bold"
                  : "text-[#00ff4160] hover:text-[#00ff41] hover:bg-[#00ff4108]"
              }`}
            >
              [{tab.key}] {tab.label}
            </button>
          ))}
        </div>

        {/* ── Error Bar ── */}
        {error && (
          <div className="px-4 py-2 bg-[#ff004020] border-b border-[#ff004040]">
            <div className="text-xs text-[#ff0040]">{error}</div>
          </div>
        )}

        {/* ── TX Hash Bar ── */}
        {txHash && (
          <div className="px-4 py-2 bg-[#00ff4110] border-b border-[#00ff4120]">
            <div className="text-xs text-[#00ff4160]">
              TX: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-[#00ff41] hover:underline">{txHash.slice(0, 18)}...</a>
            </div>
          </div>
        )}

        {/* ── Loading Bar ── */}
        {loading && (
          <div className="px-4 py-2 bg-[#ffb00010] border-b border-[#ffb00030]">
            <div className="text-xs text-[#ffb000]">Processing...</div>
          </div>
        )}

        {/* ═══════════ TAB: OVERVIEW ═══════════ */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-4">
            {/* Subscription status */}
            {subscription && (
              <div className="flex items-center justify-between py-2 border-b border-[#00ff4115]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${subscription.active ? "bg-[#00ff41]" : "bg-[#ff0040]"}`} />
                  <span className="text-xs text-[#00ff41] font-bold">{subscription.tier} TIER</span>
                  <span className="text-xs text-[#00ff4160]">|</span>
                  <span className="text-xs text-[#00ff4160]">{subscription.fee}% fee</span>
                  <span className="text-xs text-[#00ff4160]">|</span>
                  <span className="text-xs text-[#00ff4160]">min {subscription.minDeposit} ETH</span>
                </div>
                <div className="text-xs text-[#00ff4160]">EXPIRES {subscription.expiresAt}</div>
              </div>
            )}

            {/* Position Grid */}
            {position ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatBox label="DEPOSITED" value={`${position.deposited.toFixed(4)} ETH`} />
                <StatBox label="CURRENT" value={`${position.currentValue.toFixed(4)} ETH`} glow />
                <StatBox label="YIELD" value={`+${position.yield.toFixed(4)} ETH`} color="#00ff41" />
                <StatBox label="APY" value={`${position.apy.toFixed(1)}%`} color="#00ff41" />
                <StatBox label="POOL SHARE" value={`${position.shareOfPool.toFixed(3)}%`} />
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-xs text-[#00ff4160] mb-3">NO POSITION</div>
                <div className="text-sm text-[#00ff4160]">
                  {subscription?.active
                    ? `Subscribe to ${subscription.tier} — min deposit ${subscription.minDeposit} ETH`
                    : "Subscribe to a tier and deposit to start earning yield"}
                </div>
                <div className="flex gap-2 justify-center mt-3">
                  {!subscription?.active && (
                    <button onClick={() => setActiveTab("subscribe")} className="bg-[#00ff41] text-[#0a0a0a] px-4 py-1.5 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
                      SUBSCRIBE
                    </button>
                  )}
                  {subscription?.active && (
                    <button onClick={() => setActiveTab("deposit")} className="bg-[#00ff41] text-[#0a0a0a] px-4 py-1.5 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
                      DEPOSIT NOW
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pool Stats */}
            {contractState && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#00ff4115]">
                <MiniStat label="VAULT BALANCE" value={`${contractState.contractBalance.toFixed(4)} ETH`} />
                <MiniStat label="TOTAL DEPOSITS" value={`${contractState.totalDeposits.toFixed(4)} ETH`} />
                <MiniStat label="TOTAL YIELD" value={`${contractState.totalYield.toFixed(4)} ETH`} />
                <MiniStat label="TOTAL FEES" value={`${contractState.totalFees.toFixed(4)} ETH`} />
              </div>
            )}

            {/* APY Comparison */}
            <div className="terminal-panel p-3 border border-[#00ff4120] mt-2">
              <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">YIELD COMPARISON</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[#00ff4140]">HOOK POOL (vault)</div>
                  <div className="text-lg text-[#00ff41] glow">{HOOK_APY}% APY</div>
                </div>
                <div>
                  <div className="text-[#00ff4140]">NATIVE POOL</div>
                  <div className="text-lg text-[#ffb000]">{NATIVE_APY}% APY</div>
                </div>
                <div>
                  <div className="text-[#00ff4140]">ADVANTAGE</div>
                  <div className="text-lg text-[#00ff41] glow">{(HOOK_APY / NATIVE_APY).toFixed(0)}x</div>
                </div>
              </div>
            </div>

            {/* Uniswap link */}
            <div className="text-center pt-2">
              <a href={HOOK_UNISWAP_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00ff4160] hover:text-[#00ff41] transition-colors">
                VIEW POOL ON UNISWAP ↗
              </a>
            </div>
          </div>
        )}

        {/* ═══════════ TAB: DEPOSIT ═══════════ */}
        {activeTab === "deposit" && (
          <div className="p-4 space-y-4">
            {subscription?.active ? (
              <>
                <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
                  DEPOSIT ETH → {subscription.tier} TIER ({subscription.fee}% fee, min {subscription.minDeposit} ETH)
                </div>

                {/* Quick deposit buttons */}
                <div className="flex gap-2">
                  {["0.01", "0.05", "0.1", "0.5", "1"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className={`px-3 py-1.5 text-xs border transition-all ${
                        depositAmount === amt
                          ? "border-[#00ff41] text-[#00ff41] bg-[#00ff4110]"
                          : "border-[#00ff4130] text-[#00ff4160] hover:border-[#00ff41] hover:text-[#00ff41]"
                      }`}
                    >
                      {amt} ETH
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.0"
                      className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-4 py-3 text-lg w-full focus:outline-none focus:border-[#00ff41] glow font-bold"
                      min="0.001"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#00ff4160]">ETH</span>
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="bg-[#00ff41] text-[#0a0a0a] px-8 py-3 text-sm font-bold tracking-wider hover:bg-[#00cc33] disabled:opacity-40 transition-all"
                  >
                    {loading ? "..." : "DEPOSIT"}
                  </button>
                </div>

                {/* Preview */}
                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <div className="terminal-panel p-3 border border-[#00ff4120]">
                    <div className="text-xs text-[#00ff4160] mb-2">DEPOSIT PREVIEW</div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[#00ff4140]">YOU DEPOSIT</div>
                        <div className="text-[#00ff41]">{depositAmount} ETH</div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">POOL SHARE</div>
                        <div className="text-[#00ff41]">
                          {contractState && contractState.totalDeposits > 0
                            ? ((parseFloat(depositAmount) / (contractState.totalDeposits + parseFloat(depositAmount))) * 100).toFixed(3)
                            : "100"}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">EST. DAILY YIELD</div>
                        <div className="text-[#00ff41]">
                          {((parseFloat(depositAmount) * HOOK_APY / 100 / 365) * (1 - subscription.fee / 100)).toFixed(6)} ETH
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current position summary */}
                {position && (
                  <div className="pt-2 border-t border-[#00ff4115]">
                    <div className="text-xs text-[#00ff4160] mb-1">CURRENT POSITION</div>
                    <div className="text-xs text-[#00ff41]">
                      {position.deposited.toFixed(4)} ETH deposited — {position.yield.toFixed(4)} ETH yield — {position.shareOfPool.toFixed(3)}% pool share
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-xs text-[#ffb000] mb-3">SUBSCRIBE FIRST</div>
                <div className="text-sm text-[#00ff4160] mb-4">You need a subscription tier to deposit into the vault</div>
                <button onClick={() => setActiveTab("subscribe")} className="bg-[#00ff41] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
                  SUBSCRIBE NOW
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB: WITHDRAW ═══════════ */}
        {activeTab === "withdraw" && (
          <div className="p-4 space-y-4">
            {position && position.deposited > 0 ? (
              <>
                <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
                  WITHDRAW ETH — FEE ON YIELD ONLY ({subscription?.fee}%)
                </div>

                {/* Quick withdraw percentages */}
                <div className="flex gap-2">
                  {[
                    { label: "25%", pct: 0.25 },
                    { label: "50%", pct: 0.5 },
                    { label: "75%", pct: 0.75 },
                    { label: "ALL", pct: 1 },
                  ].map(({ label, pct }) => (
                    <button
                      key={label}
                      onClick={() => setWithdrawAmount((position.deposited * pct).toFixed(4))}
                      className="px-3 py-1.5 text-xs border border-[#ff004040] text-[#ff004080] hover:border-[#ff0040] hover:text-[#ff0040] transition-all"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0"
                      className="bg-[#0a0a0a] border border-[#ff004030] text-[#ff0040] px-4 py-3 text-lg w-full focus:outline-none focus:border-[#ff0040] font-bold"
                      min="0.001"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#ff004060]">ETH</span>
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="bg-[#ff0040] text-[#fff] px-8 py-3 text-sm font-bold tracking-wider hover:bg-[#cc0033] disabled:opacity-40 transition-all"
                  >
                    {loading ? "..." : "WITHDRAW"}
                  </button>
                </div>

                {/* Withdraw preview */}
                {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                  <div className="terminal-panel p-3 border border-[#ff004020]">
                    <div className="text-xs text-[#00ff4160] mb-2">WITHDRAW PREVIEW</div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[#00ff4140]">YOU WITHDRAW</div>
                        <div className="text-[#ff0040]">{withdrawAmount} ETH</div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">REMAINING</div>
                        <div className="text-[#00ff41]">
                          {(position.deposited - parseFloat(withdrawAmount)).toFixed(4)} ETH
                        </div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">FEE ON YIELD</div>
                        <div className="text-[#ffb000]">
                          {position.yield > 0 ? `${subscription?.fee}%` : "0%"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim yield */}
                {position.yield > 0 && (
                  <div className="terminal-panel p-3 border border-[#ffb00030]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-[#00ff4160]">PENDING YIELD</div>
                        <div className="text-lg text-[#ffb000] font-bold">{position.yield.toFixed(4)} ETH</div>
                        <div className="text-xs text-[#00ff4140]">After {subscription?.fee}% fee: {(position.yield * (1 - (subscription?.fee || 0) / 100)).toFixed(4)} ETH</div>
                      </div>
                      <button
                        onClick={handleClaim}
                        disabled={loading}
                        className="bg-[#ffb000] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#cc8c00] disabled:opacity-40"
                      >
                        {loading ? "..." : "CLAIM"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-xs text-[#00ff4160] mb-3">NO DEPOSIT TO WITHDRAW</div>
                <button onClick={() => setActiveTab("deposit")} className="bg-[#00ff41] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
                  DEPOSIT FIRST
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB: CALCULATOR ═══════════ */}
        {activeTab === "calculator" && (
          <div className="p-4 space-y-4">
            <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
              YIELD PROJECTION — {HOOK_APY}% APY (HOOK) vs {NATIVE_APY}% (NATIVE)
            </div>

            {/* Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#00ff4150] block mb-1">DEPOSIT AMOUNT</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={calcDeposit}
                    onChange={(e) => setCalcDeposit(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-sm w-full focus:outline-none focus:border-[#00ff41] glow"
                    min="0.01"
                    step="0.1"
                  />
                  <span className="text-xs text-[#00ff4150]">ETH</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#00ff4150] block mb-1">TIER</label>
                <div className="flex gap-1">
                  {TIER_NAMES.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => setCalcTier(i)}
                      className={`flex-1 py-2 text-xs font-bold transition-all ${
                        calcTier === i
                          ? "bg-[#00ff41] text-[#0a0a0a]"
                          : "border border-[#00ff4130] text-[#00ff4160] hover:border-[#00ff41] hover:text-[#00ff41]"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            {calcDeposit && parseFloat(calcDeposit) > 0 && (() => {
              const r = calcProjection(parseFloat(calcDeposit), calcTier);
              return (
                <div className="space-y-3 fade-in">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox label="NET APY" value={`${r.netApy}%`} glow />
                    <StatBox label="YEARLY NET" value={`${r.netYield} ETH`} color="#00ff41" />
                    <StatBox label="MONTHLY NET" value={`${r.monthlyYield} ETH`} color="#00ff41" />
                    <StatBox label="vs NATIVE" value={`${r.vsNative}x`} glow />
                  </div>

                  {/* Period table */}
                  <div className="terminal-panel p-3 border border-[#00ff4120]">
                    <table className="terminal-table">
                      <thead>
                        <tr className="text-[#00ff4150] text-xs">
                          <th>PERIOD</th>
                          <th>GROSS YIELD</th>
                          <th>FEE ({TIER_FEES[calcTier] / 100}%)</th>
                          <th>NET YIELD</th>
                          <th>USD (@$2500)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>DAILY</td>
                          <td>{(parseFloat(r.yearlyYield) / 365).toFixed(6)} ETH</td>
                          <td className="text-[#ff0040]">-{(parseFloat(r.feeAmount) / 365).toFixed(6)} ETH</td>
                          <td className="text-[#00ff41]">{r.dailyYield} ETH</td>
                          <td className="text-[#00ff41]">${(parseFloat(r.dailyYield) * 2500).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>WEEKLY</td>
                          <td>{(parseFloat(r.yearlyYield) / 52).toFixed(6)} ETH</td>
                          <td className="text-[#ff0040]">-{(parseFloat(r.feeAmount) / 52).toFixed(6)} ETH</td>
                          <td className="text-[#00ff41]">{r.weeklyYield} ETH</td>
                          <td className="text-[#00ff41]">${(parseFloat(r.weeklyYield) * 2500).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>MONTHLY</td>
                          <td>{(parseFloat(r.yearlyYield) / 12).toFixed(6)} ETH</td>
                          <td className="text-[#ff0040]">-{(parseFloat(r.feeAmount) / 12).toFixed(6)} ETH</td>
                          <td className="text-[#00ff41]">{r.monthlyYield} ETH</td>
                          <td className="text-[#00ff41]">${(parseFloat(r.monthlyYield) * 2500).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="font-bold">ANNUAL</td>
                          <td className="font-bold">{r.yearlyYield} ETH</td>
                          <td className="text-[#ff0040] font-bold">-{r.feeAmount} ETH</td>
                          <td className="text-[#00ff41] glow font-bold">{r.netYield} ETH</td>
                          <td className="text-[#00ff41] glow font-bold">${(parseFloat(r.netYield) * 2500).toFixed(0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* All tiers comparison */}
                  <div className="terminal-panel p-3 border border-[#00ff4120]">
                    <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">ALL TIERS COMPARISON ({calcDeposit} ETH)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {TIER_NAMES.map((name, i) => {
                        const p = calcProjection(parseFloat(calcDeposit), i);
                        return (
                          <div key={name} className={`p-2 border ${calcTier === i ? "border-[#00ff41]" : "border-[#00ff4120]"}`}>
                            <div className={`text-xs font-bold mb-1 ${calcTier === i ? "text-[#00ff41]" : "text-[#00ff4160]"}`}>{name} ({TIER_FEES[i] / 100}%)</div>
                            <div className="text-sm text-[#00ff41]">{p.netApy}% APY</div>
                            <div className="text-xs text-[#00ff4160]">{p.netYield} ETH/yr</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════ TAB: SUBSCRIBE ═══════════ */}
        {activeTab === "subscribe" && (
          <div className="p-4 space-y-4">
            {subscription?.active ? (
              <div className="terminal-panel p-4 border border-[#00ff4130]">
                <div className="text-xs text-[#00ff4160] mb-2">ACTIVE SUBSCRIPTION</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg text-[#00ff41] font-bold">{subscription.tier}</div>
                    <div className="text-xs text-[#00ff4160]">{subscription.fee}% fee — min deposit {subscription.minDeposit} ETH</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#00ff4160]">EXPIRES</div>
                    <div className="text-sm text-[#00ff41]">{subscription.expiresAt}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
                SELECT TIER — One-time subscription payment
              </div>
            )}

            {/* Tier cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TIER_NAMES.map((name, i) => {
                const isActive = subscription?.active && subscription.tierIndex === i;
                const minDep = ethers.formatEther(BigInt(TIER_MIN_DEPOSIT[i]));
                const cost = ethers.formatEther(BigInt(TIER_COSTS[i]));
                const feePct = TIER_FEES[i] / 100;
                const color = ["#00ff4160", "#00ff41", "#00ffff", "#ffb000"][i];

                return (
                  <div
                    key={name}
                    className={`terminal-panel p-4 border-glow transition-all ${isActive ? "border-[#00ff41] glow" : ""}`}
                    style={{ borderColor: isActive ? color : color + "40" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold tracking-widest" style={{ color }}>
                        {name}
                      </div>
                      {isActive && <span className="text-xs text-[#00ff41]">ACTIVE</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <div className="text-[#00ff4140]">FEE</div>
                        <div className="text-[#00ff41]">{feePct}%</div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">MIN DEP</div>
                        <div className="text-[#00ff41]">{minDep} ETH</div>
                      </div>
                      <div>
                        <div className="text-[#00ff4140]">COST</div>
                        <div className="text-[#00ff41]">{cost === "0.0" ? "FREE" : cost + " ETH"}</div>
                      </div>
                    </div>

                    {/* Quick yield calc */}
                    {calcDeposit && parseFloat(calcDeposit) > 0 && (
                      <div className="text-xs text-[#00ff4140] border-t border-[#00ff4115] pt-2 mb-3">
                        {calcDeposit} ETH → <span className="text-[#00ff41]">{calcProjection(parseFloat(calcDeposit), i).netApy}% net APY</span> = <span className="text-[#00ff41]">{calcProjection(parseFloat(calcDeposit), i).netYield} ETH/yr</span>
                      </div>
                    )}

                    {!subscription?.active && (
                      <button
                        onClick={() => handleSubscribe(i)}
                        disabled={loading}
                        className="w-full py-2 text-xs font-bold tracking-wider transition-colors"
                        style={{ backgroundColor: isActive ? "#00ff41" : color, color: "#0a0a0a", opacity: loading ? 0.5 : 1 }}
                      >
                        {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}

function StatBox({ label, value, glow, color }: { label: string; value: string; glow?: boolean; color?: string }) {
  return (
    <div className="terminal-panel p-3">
      <div className="text-xs text-[#00ff4140] mb-1">{label}</div>
      <div className={`text-sm font-bold ${glow ? "glow" : ""}`} style={{ color: color || "#00ff41" }}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[#00ff4140]">{label}</div>
      <div className="text-xs text-[#00ff41]">{value}</div>
    </div>
  );
}
