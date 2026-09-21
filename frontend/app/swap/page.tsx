"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

const TOKENS = [
  {
    symbol: "IMD",
    name: "IMD Token",
    address: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",
    decimals: 18,
    color: "#00ff41",
    icon: "🐸",
  },
  {
    symbol: "BUILDER",
    name: "Buildercoin",
    address: "0x22ec88b9ff78c6f2458ab1a7aa8bb99d84bd4b86",
    decimals: 18,
    color: "#ffb000",
    icon: "$B",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    color: "#627eea",
    icon: "⟠",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    color: "#2775ca",
    icon: "$",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    color: "#50af95",
    icon: "$",
  },
];

const FEE_TIERS = [
  { bps: 10, label: "0.10%", description: "Ultra Low" },
  { bps: 30, label: "0.30%", description: "Low" },
  { bps: 50, label: "0.50%", description: "Medium" },
  { bps: 100, label: "1.00%", description: "High" },
  { bps: 150, label: "1.50%", description: "Premium" },
  { bps: 300, label: "3.00%", description: "Maximum" },
];

export default function SwapPage() {
  const { connected, address } = useWallet();
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[2]); // WETH default
  const [amount, setAmount] = useState("");
  const [feeTier, setFeeTier] = useState(100);
  const [slippage, setSlippage] = useState("0.5");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showTokenList, setShowTokenList] = useState<"in" | "out" | null>(null);

  const selectedFee = FEE_TIERS.find(f => f.bps === feeTier);

  function handleSelectToken(token: typeof TOKENS[0], type: "in" | "out") {
    if (type === "in") {
      setTokenIn(token);
    } else {
      setTokenOut(token);
    }
    setShowTokenList(null);
  }

  function handleSwapTokens() {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  }

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
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount,
          feeTier,
          slippage,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pepe/profile.jpeg" alt="Swap" className="w-8 h-8 rounded-full border border-[#00ff41]" />
          <h1 className="text-base md:text-lg glow-strong tracking-wider">
            ┌─ PROTECTED SWAP ────────────────────────────────────────────────────┐
          </h1>
        </div>
        <span className="text-xs text-[#00ff4140]">Uniswap V4</span>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            Connect your wallet to swap
          </div>
        </div>
      )}

      {connected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Swap Form */}
          <div className="terminal-panel p-4 border-glow border-[#00ff41]">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ SELECT PAIR & EXECUTE
            </div>

            {/* Token In Selector */}
            <div className="mb-3">
              <label className="text-xs text-[#00ff4160] mb-1 block">You Pay</label>
              <button
                onClick={() => setShowTokenList(showTokenList === "in" ? null : "in")}
                className="w-full p-3 border border-[#00ff4130] bg-[#0a0a0a] hover:border-[#00ff4160] transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tokenIn.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: tokenIn.color }}>
                        {tokenIn.symbol}
                      </div>
                      <div className="text-[10px] text-[#00ff4160]">{tokenIn.name}</div>
                    </div>
                  </div>
                  <span className="text-[#00ff4160]">▼</span>
                </div>
              </button>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-2">
              <button
                onClick={handleSwapTokens}
                className="w-8 h-8 rounded-full border border-[#00ff4130] bg-[#0d0d0d] hover:border-[#00ff41] hover:bg-[#00ff4110] transition-all flex items-center justify-center"
              >
                <span className="text-[#00ff41] text-lg">⇅</span>
              </button>
            </div>

            {/* Token Out Selector */}
            <div className="mb-4">
              <label className="text-xs text-[#00ff4160] mb-1 block">You Receive</label>
              <button
                onClick={() => setShowTokenList(showTokenList === "out" ? null : "out")}
                className="w-full p-3 border border-[#00ff4130] bg-[#0a0a0a] hover:border-[#00ff4160] transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tokenOut.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: tokenOut.color }}>
                        {tokenOut.symbol}
                      </div>
                      <div className="text-[10px] text-[#00ff4160]">{tokenOut.name}</div>
                    </div>
                  </div>
                  <span className="text-[#00ff4160]">▼</span>
                </div>
              </button>
            </div>

            {/* Token List Modal */}
            {showTokenList && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="terminal-panel border border-[#00ff41] w-full max-w-md max-h-[70vh] overflow-hidden">
                  <div className="p-3 border-b border-[#00ff4130] flex items-center justify-between">
                    <span className="text-xs text-[#00ff4160] tracking-widest">SELECT TOKEN</span>
                    <button
                      onClick={() => setShowTokenList(null)}
                      className="text-[#00ff4160] hover:text-[#00ff41] text-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[60vh]">
                    {TOKENS.map((token) => {
                      const isSelected = showTokenList === "in"
                        ? tokenIn.symbol === token.symbol
                        : tokenOut.symbol === token.symbol;
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => handleSelectToken(token, showTokenList as "in" | "out")}
                          className={`w-full p-3 border-b border-[#00ff4110] text-left hover:bg-[#00ff4105] transition-all ${
                            isSelected ? "bg-[#00ff4110]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{token.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: token.color }}>
                                  {token.symbol}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] px-1 bg-[#00ff41] text-[#0a0a0a]">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#00ff4160]">{token.name}</div>
                              <div className="text-[9px] text-[#00ff4140] font-mono">
                                {token.address.substring(0, 20)}...
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-xs text-[#00ff4160] mb-1 block">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-[#00ff4130] p-3 text-xs text-[#00ff41] focus:border-[#00ff41] outline-none"
              />
            </div>

            {/* Fee Tier */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#00ff4160]">Fee Tier</label>
                <button
                  onClick={() => setFeeTier(100)}
                  className="text-[10px] px-2 py-1 bg-[#00ff4110] text-[#00ff41] hover:bg-[#00ff4120]"
                >
                  DEFAULT
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FEE_TIERS.map((fee) => (
                  <button
                    key={fee.bps}
                    onClick={() => setFeeTier(fee.bps)}
                    className={`py-2 px-1 border text-center transition-all ${
                      feeTier === fee.bps
                        ? "border-[#00ff41] bg-[#00ff4110]"
                        : "border-[#00ff4120] hover:border-[#00ff4140]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00ff41]">{fee.label}</div>
                    <div className="text-[9px] text-[#00ff4160]">{fee.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Slippage */}
            <div className="mb-4">
              <label className="text-xs text-[#00ff4160] mb-1 block">Slippage</label>
              <div className="flex gap-2">
                {["0.1", "0.5", "1.0", "2.0"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`flex-1 py-2 text-xs border transition-all ${
                      slippage === val
                        ? "border-[#00ff41] bg-[#00ff4110] text-[#00ff41]"
                        : "border-[#00ff4120] text-[#00ff4160] hover:border-[#00ff4140]"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Execute */}
            <button
              onClick={handleSwap}
              disabled={loading || !amount}
              className={`w-full py-3 text-xs tracking-wider font-bold ${
                !loading && amount
                  ? "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]"
                  : "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
              }`}
            >
              {loading ? "EXECUTING..." : `SWAP ${tokenIn.symbol} → ${tokenOut.symbol}`}
            </button>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Transaction Result */}
            {txHash && (
              <div className="terminal-panel p-3 border border-[#00ff41]">
                <div className="text-xs text-[#00ff41] mb-1">Transaction submitted</div>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00ff4160] hover:text-[#00ff41] break-all"
                >
                  {txHash}
                </a>
                {result && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-[#00ff4160]">Received: <span className="text-[#00ff41]">{result.ethReceived} {tokenOut.symbol}</span></div>
                    <div className="text-[#00ff4160]">MEV Captured: <span className="text-[#00ff41]">{result.mevCaptured} {tokenIn.symbol}</span></div>
                    <div className="text-[#00ff4160]">Burned: <span className="text-[#00ff41]">{result.burnAmount} {tokenIn.symbol}</span></div>
                    <div className="text-[#00ff4160]">Yield to LPs: <span className="text-[#00ff41]">{result.yieldDistributed} {tokenOut.symbol}</span></div>
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

            {/* Fee Summary */}
            <div className="terminal-panel p-4 border-glow">
              <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
                ▸ SWAP SUMMARY
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#00ff4160]">Pair:</span>
                  <span className="text-[#00ff41]">{tokenIn.symbol} → {tokenOut.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#00ff4160]">Fee Tier:</span>
                  <span className="text-[#00ff41]">{selectedFee?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#00ff4160]">Slippage:</span>
                  <span className="text-[#00ff41]">{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#00ff4160]">MEV Protection:</span>
                  <span className="text-[#00ff41]">Active</span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="terminal-panel p-4 border-glow">
              <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
                ▸ HOW IT WORKS
              </div>
              <div className="space-y-2 text-xs text-[#00ff4160]">
                <div>1. You sell {tokenIn.symbol} for {tokenOut.symbol}</div>
                <div>2. Router captures price distortion (MEV)</div>
                <div>3. Back-swap buys {tokenIn.symbol} on the dip</div>
                <div>4. Tokens burned via CappedBurnHook</div>
                <div>5. Profit goes to LP vault as yield</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
