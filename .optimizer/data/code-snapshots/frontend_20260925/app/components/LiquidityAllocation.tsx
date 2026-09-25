"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./WalletProvider";

interface AllocationMode {
  type: "eth-only" | "pair";
  label: string;
  description: string;
}

const ALLOCATION_MODES: AllocationMode[] = [
  {
    type: "eth-only",
    label: "ETH ONLY",
    description: "Investor deposits ETH. Optimizer automatically pairs with IMD from pool reserves.",
  },
  {
    type: "pair",
    label: "ETH + IMD PAIR",
    description: "Investor provides both tokens. Optimizer calculates optimal ratio.",
  },
];

interface PoolState {
  ethInPool: string;
  imdInPool: string;
  price: string;
}

interface Props {
  poolState: PoolState | null;
  onAllocationComplete?: () => void;
}

export function LiquidityAllocation({ poolState, onAllocationComplete }: Props) {
  const { connected, address, provider } = useWallet();
  const [mode, setMode] = useState<"eth-only" | "pair">("eth-only");
  const [ethAmount, setEthAmount] = useState("");
  const [imdAmount, setImdAmount] = useState("");
  const [targetPool, setTargetPool] = useState<"hook" | "native">("hook");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [estimatedImd, setEstimatedImd] = useState("0");

  // Calculate estimated IMD based on ETH amount and pool price
  useEffect(() => {
    if (ethAmount && poolState?.price) {
      const eth = parseFloat(ethAmount);
      const price = parseFloat(poolState.price);
      const imd = eth * price;
      setEstimatedImd(imd.toFixed(0));
      if (mode === "eth-only") {
        setImdAmount(imd.toFixed(0));
      }
    }
  }, [ethAmount, poolState?.price, mode]);

  // Calculate ETH needed when IMD is entered (pair mode)
  useEffect(() => {
    if (mode === "pair" && imdAmount && poolState?.price) {
      const imd = parseFloat(imdAmount);
      const price = parseFloat(poolState.price);
      if (price > 0) {
        const eth = imd / price;
        setEthAmount(eth.toFixed(4));
      }
    }
  }, [imdAmount, poolState?.price, mode]);

  async function handleAllocate() {
    if (!connected || !address || !provider) {
      setError("Connect your wallet first");
      return;
    }

    const eth = parseFloat(ethAmount);
    if (isNaN(eth) || eth <= 0) {
      setError("Enter a valid ETH amount");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get contract address from config
      const res = await fetch("/api/config");
      const config = await res.json();
      const routerAddress = config.migrationRouter;

      if (!routerAddress) {
        throw new Error("Migration Router not configured");
      }

      // Create contract interaction
      const signer = await provider.getSigner();
      const contract = new (window as any).ethers.Contract(
        routerAddress,
        [
          "function depositToHook() external payable",
          "function depositToNative() external payable",
          "function getUserBalance(address user) external view returns (uint256 hook, uint256 native, uint256 total)",
        ],
        signer
      );

      // Execute deposit
      const ethWei = (window as any).ethers.parseEther(ethAmount);
      
      let tx;
      if (targetPool === "hook") {
        tx = await contract.depositToHook({ value: ethWei });
      } else {
        tx = await contract.depositToNative({ value: ethWei });
      }

      setSuccess(`Transaction submitted! Hash: ${tx.hash}`);
      
      // Wait for confirmation
      await tx.wait();
      setSuccess(`Successfully deposited ${ethAmount} ETH to ${targetPool.toUpperCase()} pool!`);
      
      // Reset form
      setEthAmount("");
      setImdAmount("");
      
      if (onAllocationComplete) {
        onAllocationComplete();
      }
    } catch (err: any) {
      console.error("Allocation error:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="terminal-panel p-4 border-glow border-[#00ffff]">
      <div className="text-xs text-[#00ffff60] mb-3 tracking-widest">
        ▸ ALLOCATE LIQUIDITY
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
        {ALLOCATION_MODES.map((m) => (
          <button
            key={m.type}
            onClick={() => setMode(m.type)}
            className={`flex-1 p-3 text-xs border transition-all ${
              mode === m.type
                ? "border-[#00ffff] bg-[#00ffff10] text-[#00ffff]"
                : "border-[#00ff4120] text-[#00ff4160] hover:border-[#00ff4140]"
            }`}
          >
            <div className="font-bold mb-1">{m.label}</div>
            <div className="text-[10px] opacity-70">{m.description}</div>
          </button>
        ))}
      </div>

      {/* Target Pool Selection */}
      <div className="mb-4">
        <div className="text-xs text-[#00ff4160] mb-2">TARGET POOL</div>
        <div className="flex gap-2">
          <button
            onClick={() => setTargetPool("hook")}
            className={`flex-1 py-2 text-xs border transition-all ${
              targetPool === "hook"
                ? "border-[#00ff41] bg-[#00ff4110] text-[#00ff41]"
                : "border-[#00ff4120] text-[#00ff4160] hover:border-[#00ff4140]"
            }`}
          >
            HOOK POOL (V4)
          </button>
          <button
            onClick={() => setTargetPool("native")}
            className={`flex-1 py-2 text-xs border transition-all ${
              targetPool === "native"
                ? "border-[#ff0040] bg-[#ff004010] text-[#ff0040]"
                : "border-[#ff004020] text-[#ff004060] hover:border-[#ff004040]"
            }`}
          >
            NATIVE POOL (V4)
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 mb-4">
        {/* ETH Input */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#00ff4160]">ETH AMOUNT</span>
            {poolState?.price && (
              <span className="text-[#00ff4140]">
                ≈ {estimatedImd} IMD
              </span>
            )}
          </div>
          <input
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
            className="w-full bg-[#0a0a0a] border border-[#00ff4130] p-3 text-[#00ff41] text-sm focus:border-[#00ff41] focus:outline-none"
          />
          {poolState?.price && (
            <div className="text-[10px] text-[#00ff4140] mt-1">
              Pool Price: {poolState.price} IMD/ETH
            </div>
          )}
        </div>

        {/* IMD Input (Pair Mode) */}
        {mode === "pair" && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#00ff4160]">IMD AMOUNT</span>
            </div>
            <input
              type="number"
              value={imdAmount}
              onChange={(e) => setImdAmount(e.target.value)}
              placeholder="0"
              step="1"
              min="0"
              className="w-full bg-[#0a0a0a] border border-[#ff004030] p-3 text-[#ff0040] text-sm focus:border-[#ff0040] focus:outline-none"
            />
          </div>
        )}

        {/* Auto-calculated IMD (ETH-only Mode) */}
        {mode === "eth-only" && ethAmount && (
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-xs text-[#00ff4160] mb-1">
              OPTIMIZER WILL AUTO-PAIR
            </div>
            <div className="text-sm text-[#00ff41]">
              {estimatedImd} IMD will be sourced from pool reserves
            </div>
            <div className="text-[10px] text-[#00ff4140] mt-1">
              No need to hold IMD tokens — Optimizer handles the pairing
            </div>
          </div>
        )}
      </div>

      {/* Pool Info */}
      {poolState && (
        <div className="p-3 bg-[#00ff4105] border border-[#00ff4120] mb-4">
          <div className="text-xs text-[#00ff4160] mb-2">POOL RESERVES</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4140]">ETH</div>
              <div className="text-[#00ff41]">{poolState.ethInPool} ETH</div>
            </div>
            <div>
              <div className="text-[#ff004060]">IMD</div>
              <div className="text-[#ff0040]">{poolState.imdInPool} IMD</div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-[#ff004010] border border-[#ff004030] text-[#ff0040] text-xs mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-[#00ff4110] border border-[#00ff4130] text-[#00ff41] text-xs mb-4">
          {success}
        </div>
      )}

      {/* Allocate Button */}
      <button
        onClick={handleAllocate}
        disabled={!connected || loading || !ethAmount || parseFloat(ethAmount) <= 0}
        className={`w-full py-3 text-sm font-bold tracking-wider transition-all ${
          !connected || loading || !ethAmount || parseFloat(ethAmount) <= 0
            ? "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
            : "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00ff41cc]"
        }`}
      >
        {!connected
          ? "CONNECT WALLET"
          : loading
          ? "EXECUTING..."
          : `ALLOCATE ${ethAmount || "0"} ETH TO ${targetPool.toUpperCase()} POOL`}
      </button>

      {/* Instructions */}
      <div className="mt-4 text-[10px] text-[#00ff4140] space-y-1">
        <p>• <span className="text-[#00ff4160]">ETH Only:</span> Deposit ETH, Optimizer pairs with IMD automatically</p>
        <p>• <span className="text-[#00ff4160]">ETH + IMD:</span> Provide both tokens for full range liquidity</p>
        <p>• <span className="text-[#00ff4160]">Hook Pool:</span> Earns burn mechanics + MEV capture rewards</p>
        <p>• <span className="text-[#00ff4160]">Native Pool:</span> Standard Uniswap V4 LP (no hook benefits)</p>
      </div>
    </div>
  );
}
