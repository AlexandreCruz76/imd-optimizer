"use client";

import { useState } from "react";
import { useWallet } from "../components/WalletProvider";

export default function SwapPage() {
  const { connected, address } = useWallet();
  const [amount, setAmount] = useState("");
  const [minOut, setMinOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleSwap() {
    if (!amount || !connected) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    setResult(null);

    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardAmount: amount,
          minAmountOut: minOut || "0",
          address,
        }),
      });
      const data = await res.json();

      if (data.txHash) {
        setTxHash(data.txHash);
        setResult(data);
      } else {
        setError(data.error || "Swap failed");
      }
    } catch (err: any) {
      setError(err.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <img src="/pepe/profile.jpeg" alt="Swap" className="w-8 h-8 rounded-full border border-[#00ff41]" />
            <h1 className="text-base md:text-lg glow-strong tracking-wider">
              ┌─ PROTECTED SWAP ────────────────────────────────────────────────────┐
            </h1>
          </div>
        <span className="text-xs text-[#00ff4140]">The Standard</span>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            Connect your wallet to swap
          </div>
        </div>
      )}

      {/* Swap form */}
      {connected && (
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ EXECUTE PROTECTED SELL AND BURN
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#00ff4160] mb-1 block">$STANDARD Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-[#00ff4130] p-3 text-xs text-[#00ff41] focus:border-[#00ff41] outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#00ff4160] mb-1 block">Min ETH Out (slippage protection)</label>
              <input
                type="number"
                value={minOut}
                onChange={(e) => setMinOut(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-[#00ff4130] p-3 text-xs text-[#00ff41] focus:border-[#00ff41] outline-none"
              />
            </div>

            <div className="text-xs text-[#00ff4160] p-2 bg-[#00ff4105]">
              Atomic sequence: Sell → MEV Capture → Burn → Yield to LPs
            </div>

            <button
              onClick={handleSwap}
              disabled={loading || !amount}
              className={`w-full py-3 text-xs tracking-wider font-bold ${
                !loading && amount
                  ? "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]"
                  : "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
              }`}
            >
              {loading ? "EXECUTING..." : "EXECUTE PROTECTED SWAP"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction result */}
      {txHash && (
        <div className="terminal-panel p-3 border border-[#00ff41]">
          <div className="text-xs text-[#00ff41] mb-1">
            Transaction submitted
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00ff4160] hover:text-[#00ff41] break-all"
          >
            {txHash}
          </a>
          {result && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="text-[#00ff4160]">ETH Received: <span className="text-[#00ff41]">{result.ethReceived} ETH</span></div>
              <div className="text-[#00ff4160]">MEV Captured: <span className="text-[#00ff41]">{result.mevCaptured} $STANDARD</span></div>
              <div className="text-[#00ff4160]">Burned: <span className="text-[#00ff41]">{result.burnAmount} $STANDARD</span></div>
              <div className="text-[#00ff4160]">Yield to LPs: <span className="text-[#00ff41]">{result.yieldDistributed} ETH</span></div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="terminal-panel p-3 border border-[#ff0040]">
          <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
        </div>
      )}

      {/* How it works */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW IT WORKS
        </div>
        <div className="space-y-2 text-xs text-[#00ff4160]">
          <div>1. You sell $STANDARD for ETH</div>
          <div>2. Router captures price distortion (MEV)</div>
          <div>3. Back-swap buys $STANDARD on the dip</div>
          <div>4. Tokens burned via IStandardCore.burn()</div>
          <div>5. ETH profit goes to LP vault as yield</div>
        </div>
        <div className="mt-3 text-xs text-[#00ff4140]">
          ⚠️ Send via Flashbots RPC for sandwich protection
        </div>
      </div>
    </div>
  );
}
