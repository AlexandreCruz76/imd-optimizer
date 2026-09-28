"use client";

import { useState } from "react";
import { useWallet } from "../components/WalletProvider";
import { PoolPairIcon } from "../components/PoolIcons";

const TOKENS = [
  {
    symbol: "IMD",
    name: "IMD Token",
    address: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",
    decimals: 18,
    color: "#00F58C",
    logo: "/images/imd.jpg",
  },
  {
    symbol: "BUILDER",
    name: "Buildercoin",
    address: "0x22ec88b9ff78c6f2458ab1a7aa8bb99d84bd4b86",
    decimals: 18,
    color: "#FFB000",
    logo: "/images/builder.jpg",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    color: "#67C23A",
    logo: "/images/weth.jpg",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    color: "#2775CA",
    logo: "/images/usdc.jpg",
  },
];

const POOLS = [
  {
    id: 1,
    name: "IMD/ETH V4 Hook",
    tokens: ["IMD", "WETH"],
    tvl: "$85.3M",
    volume24h: "$4.2M",
    fee: "0.05%",
    apr: "12.4%",
    type: "hook",
  },
  {
    id: 2,
    name: "BUILDER/USDC V4 Native",
    tokens: ["BUILDER", "USDC"],
    tvl: "$32.1M",
    volume24h: "$1.8M",
    fee: "0.30%",
    apr: "8.7%",
    type: "native",
  },
];

export default function SwapPage() {
  const { connected, address } = useWallet();
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[2]); // WETH default
  const [amount, setAmount] = useState("");
  const [feeTier, setFeeTier] = useState<string>("0.05%");
  const [slippage, setSlippage] = useState("0.5");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedPool, setSelectedPool] = useState<typeof POOLS[number] | null>(null);

  const selectedFee = POOLS.find((p) => p.fee === "0.05%") || POOLS[0];

  function handleSelectToken(token: { symbol: string; name: string; address: string; decimals: number; color: string; logo: string }, type: "in" | "out") {
    if (type === "in") {
      setTokenIn(token);
    } else {
      setTokenOut(token);
    }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Swap failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pepe/profile.jpeg" alt="Swap" className="w-8 h-8 rounded-full border border-[#00F58C]" />
          <h1 className="text-base md:text-lg font-medium text-[#E8EAE9] tracking-wider">
            ┌─ PROTECTED SWAP ────────────────────────────────────────────────────┐
          </h1>
        </div>
        <span className="text-xs text-[#6B7A88]/40">Uniswap V4</span>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#3A4150]">
          <div className="text-xs text-[#6B7A88] text-center">
            Connect your wallet to swap
          </div>
        </div>
      )}

      {connected && (
        <div className="max-w-md mx-auto">
          {/* Swap Card */}
          <div className="rounded-3xl bg-[#121721]/90 border border-white/[0.06] backdrop-blur-xl p-6 max-w-md mx-auto shadow-xl">
            {/* Pool Selector */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* You Pay */}
              <div className="flex-1">
                <PoolPairIcon
                  token0Symbol={tokenOut.symbol}
                  token1Symbol={tokenIn.symbol}
                  token0Logo={tokenOut.logo}
                  token1Logo={tokenIn.logo}
                  tierFee={selectedFee?.fee}
                />
                <div className="mt-2">
                  <div className="text-xs text-[#6B7A88] mb-1">You Pay</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" style={{ color: tokenIn.color }}>{tokenIn.logo} {tokenIn.symbol}</span>
                    <span className="text-[10px] text-[#6B7A88]">{tokenIn.name}</span>
                  </div>
                </div>
              </div>

              {/* You Receive */}
              <div className="flex-1">
                <PoolPairIcon
                  token0Symbol={tokenIn.symbol}
                  token1Symbol={tokenOut.symbol}
                  token0Logo={tokenIn.logo}
                  token1Logo={tokenOut.logo}
                  tierFee={selectedFee?.fee}
                />
                <div className="mt-2">
                  <div className="text-xs text-[#6B7A88] mb-1">You Receive</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" style={{ color: tokenOut.color }}>{tokenOut.logo} {tokenOut.symbol}</span>
                    <span className="text-[10px] text-[#6B7A88]">{tokenOut.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pool Table Selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {POOLS.map((pool) => (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={selectedPool && selectedPool.id === pool.id
                    ? "rounded-xl border border-[#00F58C]/50 bg-[#00F58C]/5 transition-colors cursor-pointer"
                    : "rounded-xl border border-white/[0.04] bg-[#121721] transition-colors cursor-pointer"
                }
                >
                  <div className="p-3 flex items-center gap-2">
                    <PoolPairIcon
                      token0Symbol={pool.tokens[0]}
                      token1Symbol={pool.tokens[1]}
                      token0Logo={TOKENS.find((t) => t.symbol === pool.tokens[0])?.logo}
                      token1Logo={TOKENS.find((t) => t.symbol === pool.tokens[1])?.logo}
                    />
                    <span className="text-sm font-medium text-[#E8EAE9]">{pool.name}</span>
                  </div>
                  <div className="p-1 text-xs">
                    <div className="text-[#6B7A88] mb-1">TVL</div>
                    <div className="font-mono text-[#00F58C]">{pool.tvl}</div>
                    <div className="text-[#6B7A88]">Vol 24h</div>
                    <div className="font-mono text-[#00F5FF]">{pool.volume24h}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Tier */}
          <div className="mb-4">
            <label className="text-xs text-[#6B7A88] mb-1 block">Fee Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {POOLS[0].fee === "0.05%" ? (
                POOLS.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => setFeeTier(pool.fee)}
                    className="py-1 px-2 border text-center transition-all text-[9px]"
                  >
                    <div className="font-bold text-[#00F58C]">{pool.fee}</div>
                    <div className="text-[8px] text-[#6B7A88]">{pool.type === "hook" ? "V4 Hook" : "V4 Native"}</div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-[#6B7A88]">Fee tiers not configured</p>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="text-xs text-[#6B7A88] mb-1 block">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0A0D12] border border-[#2A3040]/40 p-3 text-sm text-[#E8EAE9] focus:border-[#00F58C] outline-none"
            />
          </div>

          {/* Slippage */}
          <div className="mb-4">
            <label className="text-xs text-[#6B7A88] mb-1 block">Slippage</label>
            <div className="flex gap-2">
              {["0.1", "0.5", "1.0", "2.0"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-1 text-xs border transition-all ${slippage === val ? "border-[#00F58C] bg-[#00F58C]/10 text-[#00F58C]" : "border-white/[0.10] text-[#6B7A88] hover:border-[#00F58C]/30"}`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleSwap}
            disabled={loading || !amount}
            className={`w-full py-3 text-sm font-medium tracking-wider transition-all ${!loading && amount ? "bg-[#00F58C] text-[#0A0D12] hover:bg:#00CC33 transition-all" : "bg-white/[0.10] text-[#6B7A88] cursor-not-allowed"}`}
          >
            {loading ? "EXECUTING..." : `Swap via Meta-Hook`}
          </button>
        </div>
      )}

      {/* Info Panel */}
      {connected && (
        <div className="mt-6 space-y-4">
          {/* Transaction Result */}
          {txHash && (
            <div className="terminal-panel p-3 border border-[#00F58C]/30">
              <div className="text-xs text-[#00F58C] mb-1">Transaction submitted</div>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#00F58C]/80 hover:text-[#00F58C] break-all"
              >
                {txHash}
              </a>
              {result && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="text-[#6B7A88]">Received: <span className="text-[#00F58C]">{result.ethReceived} {tokenOut.symbol}</span></div>
                  <div className="text-[#6B7A88]">MEV Captured: <span className="text-[#00F58C]">{result.mevCaptured} {tokenIn.symbol}</span></div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="terminal-panel p-3 border border-[#FF567E]/30">
              <div className="text-xs text-[#FF567E]">ERROR: {error}</div>
            </div>
          )}

          {/* Fee Summary */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#6B7A88] mb-3 tracking-widest">
              ▸ SWAP SUMMARY
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7A88]">Pair:</span>
                <span className="text-[#E8EAE9]">{tokenIn.symbol} → {tokenOut.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A88]">Fee Tier:</span>
                <span className="text-[#00F58C]">{selectedFee?.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A88]">Slippage:</span>
                <span className="text-[#00F58C]">{slippage}%</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#6B7A88] mb-3 tracking-widest">
              ▸ HOW IT WORKS
            </div>
            <div className="space-y-2 text-xs text-[#6B7A88]">
              <div>1. You sell {tokenIn.symbol} for {tokenOut.symbol}</div>
              <div>2. Router captures price distortion (MEV)</div>
              <div>3. Back-swap buys {tokenIn.symbol} on the dip</div>
              <div>4. Tokens burned via CappedBurnHook</div>
              <div>5. Profit goes to LP vault as yield</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}