"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";

type Token = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
  logo?: string;
};

const TOKENS: Token[] = [
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
    color: "#8C9EFF",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    color: "#2775CA",
  },
];

const PRICES_USD: Record<string, number> = {
  IMD: 0.1,
  BUILDER: 0.5,
  WETH: 2400,
  USDC: 1,
};

const LIQUIDITY_USD = 5_000_000;

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

const ROUTER_ABI = [
  "function getPoolState() view returns (uint160, int24, bool)",
  "function getStats() view returns (uint256,uint256,uint256,uint256)",
  "function feeBps() view returns (uint256)",
  "function minBlockDelay() view returns (uint256)",
  "function lastOperationBlock(address) view returns (uint256)",
  "function executeProtectedSellAndBurn(uint256 standardAmount, uint256 minAmountOut) external",
];

const TOKEN_ABI = [
  "function symbol() view returns(string)",
  "function decimals() view returns(uint8)",
  "function balanceOf(address) view returns(uint256)",
  "function mint(address,uint256)",
];

interface SepoliaInfo {
  tokenSymbol: string;
  tokenDecimals: number;
  tokenBalance: string;
  hasMint: boolean;
  sqrtPriceX96: bigint;
  routerEth: bigint;
  feeBps: number;
  minDelay: number;
  lastOpBlock: number;
  blockNumber: number;
  sellVolume: string;
  mevCaptured: string;
  burnsExecuted: string;
  yieldDistributed: string;
}

const SLIPPAGE_PRESETS = ["0.1", "0.5", "1.0"];

const FEE_TIER = { pct: "0.05%", label: "V4 Hook" };

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmt(n: number, decimals = 6): string {
  if (!isFinite(n) || n === 0) return "0";
  if (n > 0 && n < 1e-6) return n.toExponential(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function TokenLogo({ token, size = 32 }: { token: Token; size?: number }) {
  const [broken, setBroken] = useState(false);
  const showImg = token.logo && !broken;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        background: token.color + "22",
        border: `1px solid ${token.color}55`,
        color: token.color,
        fontSize: size * 0.42,
      }}
    >
      {showImg ? (
        <img
          src={token.logo}
          alt={token.symbol}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : token.symbol === "WETH" ? (
        "Ξ"
      ) : token.symbol === "USDC" ? (
        "$"
      ) : (
        token.symbol.slice(0, 2)
      )}
    </span>
  );
}

function TokenSelector({
  token,
  other,
  onSelect,
}: {
  token: Token;
  other: Token;
  onSelect: (t: Token) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-2xl bg-[#0B111A]/80 border border-slate-700/50 hover:border-emerald-500/40 pl-2 pr-3 py-2 transition-colors"
      >
        <TokenLogo token={token} size={26} />
        <span className="text-sm font-semibold text-white font-mono">
          {token.symbol}
        </span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0B111A]/90 border border-emerald-500/25 rounded-3xl w-full max-w-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white tracking-wider font-mono uppercase">
                SELECT TOKEN
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or paste address"
              className="w-full bg-[#070A0F]/80 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 mb-3 font-mono"
            />

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filtered.map((t) => {
                const disabled = t.symbol === other.symbol;
                return (
                  <button
                    key={t.symbol}
                    disabled={disabled}
                    onClick={() => {
                      onSelect(t);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      disabled
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-emerald-500/5"
                    }`}
                  >
                    <TokenLogo token={t} size={32} />
                    <span className="text-left">
                      <span className="block text-sm font-semibold text-white font-mono">
                        {t.symbol}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {t.name}
                      </span>
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">
                      {shortAddr(t.address)}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">No tokens found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({
  label,
  value,
  color,
  mono = true,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400 font-mono uppercase tracking-wider">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""}`}
        style={{ color: color || "white" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function SwapPage() {
  const {
    connected,
    connecting,
    connect,
    address,
    provider,
    signer,
    chainId,
    switchChain,
  } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[2]);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [customSlippage, setCustomSlippage] = useState("");
  const [deadline, setDeadline] = useState("20");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const [cfg, setCfg] = useState<{
    optimizerRouter?: string;
    standardToken?: string;
    chainId?: number;
  } | null>(null);
  const [sep, setSep] = useState<SepoliaInfo | null>(null);
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [realStats, setRealStats] = useState<{
    sellVolume: string;
    mevCaptured: string;
    burnsExecuted: string;
    yieldDistributed: string;
  } | null>(null);

  const isSepolia = chainId === 11155111;
  const routerAddr = cfg?.optimizerRouter || "";
  const standardAddr = cfg?.standardToken || "";
  const realMode = isSepolia && !!routerAddr;
  const cooldownBlocks = sep
    ? Math.max(0, sep.lastOpBlock + sep.minDelay + 1 - sep.blockNumber)
    : 0;

  const effectiveSlippage = customSlippage !== "" ? customSlippage : slippage;
  const slipNum = Math.min(Math.max(parseFloat(effectiveSlippage) || 0, 0), 50);
  const isCustom = customSlippage !== "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setTimeout(() => {
      const s = localStorage.getItem("imd_slippage");
      const d = localStorage.getItem("imd_deadline");
      if (s) {
        if (SLIPPAGE_PRESETS.includes(s)) setSlippage(s);
        else setCustomSlippage(s);
      }
      if (d) setDeadline(d);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("imd_slippage", effectiveSlippage);
      localStorage.setItem("imd_deadline", deadline);
    }
  }, [effectiveSlippage, deadline]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/config");
        const j = await r.json();
        setCfg(j);
      } catch {
        // offline — keep demo mode
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const loadSepolia = useCallback(async () => {
    if (!realMode || !provider || !address || !standardAddr) return;
    try {
      const token = new ethers.Contract(standardAddr, TOKEN_ABI, provider);
      const [symbol, decimals, balanceRaw] = await Promise.all([
        token.symbol(),
        token.decimals(),
        token.balanceOf(address),
      ]);
      let hasMint = false;
      try {
        await token.mint.staticCall(address, 1n);
        hasMint = true;
      } catch {
        hasMint = false;
      }
      const router = new ethers.Contract(routerAddr, ROUTER_ABI, provider);
      const [state, stats, feeBps, minDelay, lastOp, bn, routerEth] =
        await Promise.all([
          router.getPoolState(),
          router.getStats(),
          router.feeBps(),
          router.minBlockDelay(),
          router.lastOperationBlock(address),
          provider.getBlockNumber(),
          provider.getBalance(routerAddr),
        ]);
      setSep({
        tokenSymbol: symbol as string,
        tokenDecimals: Number(decimals),
        tokenBalance: parseFloat(
          ethers.formatUnits(balanceRaw, Number(decimals))
        ).toFixed(4),
        hasMint,
        sqrtPriceX96: state[0] as bigint,
        routerEth,
        feeBps: Number(feeBps),
        minDelay: Number(minDelay),
        lastOpBlock: Number(lastOp),
        blockNumber: bn,
        sellVolume: (stats[0] as bigint).toString(),
        mevCaptured: (stats[1] as bigint).toString(),
        burnsExecuted: (stats[2] as bigint).toString(),
        yieldDistributed: (stats[3] as bigint).toString(),
      });
    } catch (err) {
      console.error("sepolia load failed:", err);
    }
  }, [realMode, provider, address, standardAddr, routerAddr]);

  useEffect(() => {
    if (!realMode) return;
    const t = setTimeout(() => {
      loadSepolia();
    }, 0);
    const iv = setInterval(() => {
      loadSepolia();
    }, 20000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [realMode, loadSepolia]);

  useEffect(() => {
    let alive = true;
    async function loadBalances() {
      if (!connected || !provider || !address) return;
      const toFetch = [tokenIn, tokenOut].filter(
        (t) => !(t.address.toLowerCase() in balances)
      );
      for (const t of toFetch) {
        try {
          const contract = new ethers.Contract(t.address, ERC20_ABI, provider);
          const raw: bigint = await contract.balanceOf(address);
          if (alive) {
            setBalances((prev) => ({
              ...prev,
              [t.address.toLowerCase()]: parseFloat(
                ethers.formatUnits(raw, t.decimals)
              ).toFixed(4),
            }));
          }
        } catch {
          if (alive) {
            setBalances((prev) => ({
              ...prev,
              [t.address.toLowerCase()]: "—",
            }));
          }
        }
      }
    }
    loadBalances();
    return () => {
      alive = false;
    };
  }, [connected, provider, address, tokenIn, tokenOut, balances]);

  const amountNum = parseFloat(amount) || 0;
  const rate = useMemo(() => {
    const pIn = PRICES_USD[tokenIn.symbol] ?? 0;
    const pOut = PRICES_USD[tokenOut.symbol] ?? 0;
    return pOut > 0 ? pIn / pOut : 0;
  }, [tokenIn, tokenOut]);

  const outAmount = amountNum * rate;
  const minReceived = outAmount * (1 - slipNum / 100);
  const usdValue = amountNum * (PRICES_USD[tokenIn.symbol] ?? 0);
  const priceImpact = Math.min((usdValue / LIQUIDITY_USD) * 100, 50);

  const realQuote = useMemo(() => {
    if (!realMode || !sep || !amount || amountNum <= 0) return null;
    try {
      const amt = ethers.parseUnits(amount, sep.tokenDecimals);
      const price = (sep.sqrtPriceX96 * sep.sqrtPriceX96) / (2n ** 192n);
      const out = (amt * price) / (10n ** 18n);
      if (out === 0n) return null;
      const slipBps = BigInt(Math.min(Math.round(slipNum * 100), 1000));
      const minOut = (out * (10000n - slipBps)) / 10000n;
      return { amt, out, minOut, price, slipBps };
    } catch {
      return null;
    }
  }, [realMode, sep, amount, amountNum, slipNum]);

  async function handleFaucet() {
    if (!signer || !standardAddr || !address) return;
    setFaucetBusy(true);
    setError(null);
    try {
      const token = new ethers.Contract(standardAddr, TOKEN_ABI, signer);
      const tx = await token.mint(
        address,
        ethers.parseUnits("1000", sep?.tokenDecimals ?? 18)
      );
      await tx.wait();
      loadSepolia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Faucet failed");
    } finally {
      setFaucetBusy(false);
    }
  }

  function handleSelectIn(t: Token) {
    if (t.symbol === tokenOut.symbol) setTokenOut(tokenIn);
    setTokenIn(t);
  }

  function handleSelectOut(t: Token) {
    if (t.symbol === tokenIn.symbol) setTokenIn(tokenOut);
    setTokenOut(t);
  }

  function handleReverse() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmount(outAmount > 0 ? String(parseFloat(outAmount.toPrecision(6))) : "");
  }

  function setSlippagePreset(v: string) {
    setSlippage(v);
    setCustomSlippage("");
  }

  async function handleSwap() {
    if (!amountNum || !connected) return;

    if (realMode) {
      if (!signer || !realQuote || cooldownBlocks > 0) return;
      setLoading(true);
      setError(null);
      setTxHash(null);
      setRealStats(null);
      try {
        const router = new ethers.Contract(routerAddr, ROUTER_ABI, signer);
        const tx = await router.executeProtectedSellAndBurn(
          realQuote.amt,
          realQuote.minOut
        );
        setTxHash(tx.hash as string);
        const receipt = await tx.wait();
        const readRouter = new ethers.Contract(
          routerAddr,
          ROUTER_ABI,
          provider
        );
        const stats = await readRouter.getStats();
        setRealStats({
          sellVolume: ethers.formatEther(stats[0] as bigint),
          mevCaptured: ethers.formatEther(stats[1] as bigint),
          burnsExecuted: (stats[2] as bigint).toString(),
          yieldDistributed: ethers.formatEther(stats[3] as bigint),
        });
        setResult({ block: receipt.blockNumber });
        loadSepolia();
      } catch (err: unknown) {
        const anyErr = err as { shortMessage?: string; message?: string };
        setError(anyErr.shortMessage || anyErr.message || "Swap failed");
      } finally {
        setLoading(false);
      }
      return;
    }

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
          standardAmount: amount,
          minAmountOut: minReceived.toFixed(6),
          feeTier: FEE_TIER.pct,
          slippage: effectiveSlippage,
          deadline,
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

  const highSlip = slipNum > 5;
  const lowSlip = slipNum < 0.1;
  const impactColor =
    priceImpact > 3 ? "#FF567E" : priceImpact > 1 ? "#FFB000" : "#00F58C";

  const btnState = !connected
    ? "connect"
    : !amountNum || (realMode && !realQuote)
    ? "enter"
    : loading
    ? "loading"
    : "swap";

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 shadow-[0_0_12px_rgba(0,245,140,0.3)] bg-[#0D121A] flex-shrink-0">
              <img src="/images/avatar.jpg" alt="IMD Optimizer" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:block text-xl font-bold text-white tracking-tight">IMD Optimizer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link href="/swap" className="text-sm font-medium text-emerald-400 font-bold hidden sm:inline">Swap</Link>
            <Link href="/pool" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors hidden sm:inline">Meta Hook Pool</Link>
            <Link href="/arbitrage" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors hidden sm:inline">Arbitrage</Link>
            <Link href="/staking" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors hidden sm:inline">Staking</Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <img
              src="/images/agente.png"
              alt="Agent"
              className="w-8 h-8 rounded-full border border-emerald-500 object-cover"
            />
            <h1 className="text-base md:text-lg font-medium text-white tracking-widest font-mono uppercase">
              ┌─ PROTECTED SWAP ── EXECUTION ROUTE ────────────────────────┐
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {realMode ? (
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
                SEPOLIA · LIVE EXECUTION
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400">
                DEMO · SIMULATION ONLY
              </span>
            )}
            {connected && !isSepolia && chainId !== null && (
              <button
                onClick={() => switchChain(11155111)}
                className="text-[10px] font-mono px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20"
              >
                ▸ SWITCH TO SEPOLIA
              </button>
            )}
          </div>
        </div>

        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 -mt-20">
          <img
            src="/images/Cyberpunk_frog_examining_hologra._20260926020301.jpg"
            alt="Agentic Frog analyzing swap data"
            className="w-full h-full object-cover object-center opacity-35 transition-opacity duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedPng) {
                target.dataset.triedPng = "true";
                target.src = "/images/Cyberpunk_character_monitoring_t._20260926015147.jpg";
              }
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#070A0F/40_70%,#070A0F/90_100%)]" />
        </div>

        {/* Tactical Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_3px] opacity-20" />

        {/* State Banners */}
        {isSepolia && !routerAddr && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 p-3 text-xs text-amber-400 font-mono">
            ⚠ Contracts not deployed on Sepolia — run <span className="text-white">npm run deploy:sepolia</span> and configure OPTIMIZER_ROUTER_ADDRESS / STANDARD_TOKEN_ADDRESS in .env
          </div>
        )}
        {realMode && connected && cooldownBlocks > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 font-mono">
            Anti-sandwich: wait {cooldownBlocks} block(s) after last wallet operation
          </div>
        )}
        {realMode && sep && realQuote && realQuote.out > sep.routerEth && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-400 font-mono">
            Sell exceeds router fund (mock 1:1): available {fmt(parseFloat(ethers.formatUnits(sep.routerEth, 18)), 4)} ETH — reduce amount
          </div>
        )}

        {/* Swap Card */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-5 border border-emerald-500/25 shadow-2xl bg-[#0B111A]/90">
            {/* Card header: title + settings */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs tracking-[0.25em] text-slate-400 font-mono uppercase">SWAP EXECUTION</span>
              <button
                onClick={() => setShowSettings((v) => !v)}
                title="Transaction settings"
                className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-all ${
                  showSettings
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700/50 text-slate-400 hover:text-white hover:border-emerald-500/30"
                }`}
              >
                ⚙
              </button>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 p-3 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono uppercase">Slippage Tolerance</span>
                  <div className="flex items-center gap-1.5">
                    {SLIPPAGE_PRESETS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSlippagePreset(v)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                          !isCustom && slippage === v
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-700/50 text-slate-400 hover:border-emerald-500/30"
                        }`}
                      >
                        {v}%
                      </button>
                    ))}
                    <div
                      className={`flex items-center rounded-lg border px-2 py-1 ${
                        isCustom
                          ? "border-emerald-500/60 bg-emerald-500/10"
                          : "border-slate-700/50"
                      }`}
                    >
                      <input
                        type="number"
                        min="0.01"
                        max="50"
                        step="0.01"
                        value={customSlippage}
                        onChange={(e) => setCustomSlippage(e.target.value)}
                        placeholder=">"
                        className="w-12 bg-transparent text-xs font-mono text-white placeholder-slate-500 outline-none text-right"
                      />
                      <span className="text-xs text-slate-400 ml-0.5">%</span>
                    </div>
                  </div>
                </div>

                {highSlip && (
                  <div className="text-[10px] text-amber-400 font-mono">High slippage — you may receive significantly less than expected.</div>
                )}
                {lowSlip && (
                  <div className="text-[10px] text-rose-400 font-mono">Very low slippage — your transaction is likely to fail.</div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono uppercase">Transaction Deadline</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="4320"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-16 bg-[#070A0F]/80 border border-slate-700/50 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none focus:border-emerald-500/50 text-right"
                    />
                    <span className="text-xs text-slate-400">min</span>
                  </div>
                </div>
              </div>
            )}

            {/* You Pay */}
            <div className="rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono uppercase">YOU PAY</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {realMode
                    ? `Balance: ${sep?.tokenBalance ?? "—"} ${sep?.tokenSymbol ?? "STANDARD"}`
                    : `Balance: ${balances[tokenIn.address.toLowerCase()] ?? "—"}`}
                  {realMode ? (
                    sep && parseFloat(sep.tokenBalance) > 0 ? (
                      <button
                        onClick={() => setAmount(sep.tokenBalance)}
                        className="ml-1.5 text-emerald-400 hover:underline"
                      >
                        MAX
                      </button>
                    ) : sep?.hasMint ? (
                      <button
                        onClick={handleFaucet}
                        disabled={faucetBusy}
                        className="ml-1.5 text-cyan-400 hover:underline disabled:opacity-50"
                      >
                        {faucetBusy ? "MINTING…" : "MINT 1.000 (FAUCET)"}
                      </button>
                    ) : null
                  ) : (
                    connected &&
                    balances[tokenIn.address.toLowerCase()] &&
                    balances[tokenIn.address.toLowerCase()] !== "—" && (
                      <button
                        onClick={() =>
                          setAmount(balances[tokenIn.address.toLowerCase()] || "")
                        }
                        className="ml-1.5 text-emerald-400 hover:underline"
                      >
                        MAX
                      </button>
                    )
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 bg-transparent text-2xl font-mono text-white placeholder-slate-500/50 outline-none"
                />
                <div className="flex items-center gap-2">
                  {!realMode && (
                    <span className="text-xs font-mono text-slate-400">
                      {usdValue > 0 ? `≈ $${fmt(usdValue, 2)}` : ""}
                    </span>
                  )}
                  {realMode ? (
                    <span className="flex items-center gap-2 rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 pl-2 pr-3 py-2">
                      <span
                        className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full font-bold text-xs"
                        style={{
                          background: "#FFB00022",
                          border: "1px solid #FFB00055",
                          color: "#FFB000",
                        }}
                      >
                        S
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        {sep?.tokenSymbol ?? "STANDARD"}
                      </span>
                    </span>
                  ) : (
                    <TokenSelector
                      token={tokenIn}
                      other={tokenOut}
                      onSelect={handleSelectIn}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Reverse button */}
            {!realMode && (
              <div className="flex justify-center -my-2.5 relative z-10">
                <button
                  onClick={handleReverse}
                  title="Switch tokens"
                  className="w-10 h-10 rounded-xl bg-[#0B111A]/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 text-lg hover:border-emerald-500/60 hover:rotate-180 transition-all duration-300"
                >
                  ⇅
                </button>
              </div>
            )}

            {/* You Receive */}
            <div
              className={`rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 p-4 ${
                realMode ? "mt-2" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono uppercase">YOU RECEIVE</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {realMode
                    ? "ETH (gas token)"
                    : `Balance: ${balances[tokenOut.address.toLowerCase()] ?? "—"}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 text-2xl font-mono text-white">
                  {realMode && realQuote ? (
                    fmt(
                      parseFloat(ethers.formatUnits(realQuote.out, 18)),
                      6
                    )
                  ) : amountNum > 0 ? (
                    fmt(outAmount)
                  ) : (
                    <span className="text-slate-500/50">0.00</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!realMode && (
                    <span className="text-xs font-mono text-slate-400">
                      {outAmount > 0
                        ? `≈ $${fmt(outAmount * (PRICES_USD[tokenOut.symbol] ?? 0), 2)}`
                        : ""}
                    </span>
                  )}
                  {realMode ? (
                    <span className="flex items-center gap-2 rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 pl-2 pr-3 py-2">
                      <span
                        className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full font-bold text-xs"
                        style={{
                          background: "#8C9EFF22",
                          border: "1px solid #8C9EFF55",
                          color: "#8C9EFF",
                        }}
                      >
                        Ξ
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        ETH
                      </span>
                    </span>
                  ) : (
                    <TokenSelector
                      token={tokenOut}
                      other={tokenIn}
                      onSelect={handleSelectOut}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 rounded-2xl bg-[#070A0F]/40 border border-slate-800/50 px-4 py-3 space-y-1.5">
              {realMode ? (
                <>
                  <InfoRow
                    label="Rate (on-chain)"
                    value={
                      realQuote
                        ? `1 ${sep?.tokenSymbol ?? "STANDARD"} = ${fmt(
                            Number(realQuote.price) / 1e18,
                            6
                          )} ETH`
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Minimum Received"
                    value={
                      realQuote
                        ? `${fmt(
                            parseFloat(
                              ethers.formatUnits(realQuote.minOut, 18)
                            ),
                            6
                          )} ETH`
                        : "—"
                    }
                    color="#00F58C"
                  />
                  <InfoRow
                    label="Slippage Tolerance"
                    value={
                      realMode && realQuote
                        ? `${Number(realQuote.slipBps) / 100}%${
                            slipNum > 10 ? " · max contract 10%" : ""
                          }`
                        : `${effectiveSlippage}%`
                    }
                    color={highSlip ? "#FFB000" : lowSlip ? "#FF567E" : undefined}
                  />
                  <InfoRow
                    label="Protocol Fee"
                    value={sep ? `${(sep.feeBps / 100).toFixed(2)}%` : "—"}
                  />
                  <InfoRow
                    label="Anti-Sandwich Cooldown"
                    value={
                      sep
                        ? `${cooldownBlocks} block(s) · min ${sep.minDelay}`
                        : "—"
                    }
                    color={cooldownBlocks > 0 ? "#FFB000" : undefined}
                  />
                  <InfoRow
                    label="Route"
                    value={`${sep?.tokenSymbol ?? "STANDARD"} → ETH · OptimizerRouter`}
                  />
                </>
              ) : (
                <>
                  <InfoRow
                    label="Rate"
                    value={`1 ${tokenIn.symbol} = ${fmt(rate, 6)} ${tokenOut.symbol}`}
                  />
                  <InfoRow
                    label="Price Impact"
                    value={amountNum > 0 ? `${priceImpact.toFixed(2)}%` : "—"}
                    color={amountNum > 0 ? impactColor : undefined}
                  />
                  <InfoRow
                    label="Minimum Received"
                    value={
                      amountNum > 0
                        ? `${fmt(minReceived, 6)} ${tokenOut.symbol}`
                        : "—"
                    }
                    color="#00F58C"
                  />
                  <InfoRow
                    label="Slippage Tolerance"
                    value={`${effectiveSlippage}%`}
                    color={highSlip ? "#FFB000" : lowSlip ? "#FF567E" : undefined}
                  />
                  <InfoRow
                    label="Pool Fee"
                    value={`${FEE_TIER.pct} (${FEE_TIER.label})`}
                  />
                  <InfoRow
                    label="Route"
                    value={`${tokenIn.symbol} → ${tokenOut.symbol} (simulated quote)`}
                  />
                  <InfoRow label="Deadline" value={`${deadline} min`} />
                </>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={btnState === "connect" ? connect : handleSwap}
              disabled={
                btnState === "enter" ||
                btnState === "loading" ||
                (realMode && cooldownBlocks > 0) ||
                (realMode &&
                  !!realQuote &&
                  !!sep &&
                  realQuote.out > sep.routerEth)
              }
              className={`w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold tracking-widest font-mono uppercase transition-all ${
                btnState === "swap"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(0,245,140,0.25)]"
                  : btnState === "connect"
                  ? "bg-emerald-500/90 text-black hover:bg-emerald-500"
                  : btnState === "loading"
                  ? "bg-emerald-500/20 text-emerald-400 cursor-wait"
                  : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
              }`}
            >
              {btnState === "connect"
                ? connecting
                  ? "CONNECTING..."
                  : "CONNECT WALLET"
                : btnState === "enter"
                ? "ENTER AN AMOUNT"
                : btnState === "loading"
                ? realMode
                  ? "SENDING TX..."
                  : "SWAPPING..."
                : realMode
                ? cooldownBlocks > 0
                  ? `COOLDOWN · ${cooldownBlocks} BLOCK(S)`
                  : "EXECUTE PROTECTED SELL"
                : "EXECUTE SWAP (DEMO)"}
            </button>

            {!connected && (
              <div className="mt-3 text-[10px] text-slate-500 text-center font-mono">Connect your wallet to swap</div>
            )}
          </div>

          {/* Transaction result */}
          {txHash && realMode && (
            <div className="mt-4 rounded-2xl bg-[#0B111A]/90 border border-emerald-500/30 p-4">
              <div className="text-xs text-emerald-400 mb-1 font-mono uppercase">✓ TX CONFIRMED ON SEPOLIA</div>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400/80 hover:text-emerald-400 break-all font-mono"
              >
                {txHash}
              </a>
              {realStats && (
                <div className="mt-2 space-y-1 text-xs">
                  <InfoRow
                    label="Router · Sell Volume"
                    value={`${fmt(parseFloat(realStats.sellVolume), 4)} ETH`}
                    color="#00F58C"
                  />
                  <InfoRow
                    label="Router · MEV Captured"
                    value={`${fmt(parseFloat(realStats.mevCaptured), 4)} ETH`}
                    color="#00F58C"
                  />
                  <InfoRow
                    label="Router · Burns"
                    value={realStats.burnsExecuted}
                    color="#FF567E"
                  />
                  <InfoRow
                    label="Router · Yield Distributed"
                    value={`${fmt(parseFloat(realStats.yieldDistributed), 4)} ETH`}
                    color="#00F58C"
                  />
                </div>
              )}
            </div>
          )}

          {txHash && !realMode && (
            <div className="mt-4 rounded-2xl bg-[#0B111A]/90 border border-amber-500/30 p-4">
              <div className="text-xs text-amber-400 mb-1 font-mono uppercase">DEMO — SIMULATED TX, NOT ON CHAIN</div>
              <div className="text-xs text-slate-400 break-all font-mono">{txHash}</div>
              {result && (
                <div className="mt-2 space-y-1 text-xs">
                  <InfoRow
                    label="Received (simulated)"
                    value={`${String(result.ethReceived ?? "—")} ${tokenOut.symbol}`}
                    color="#00F58C"
                  />
                  <InfoRow
                    label="MEV Captured (simulated)"
                    value={`${String(result.mevCaptured ?? "—")} ${tokenIn.symbol}`}
                    color="#00F58C"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl bg-slate-900/80 border border-rose-500/30 p-4">
              <div className="text-xs text-rose-400 font-mono uppercase">ERROR: {error}</div>
            </div>
          )}

          {/* How it works */}
          <div className="mt-4 rounded-2xl bg-[#0B111A]/90 border border-slate-700/50 p-4">
            <div className="text-xs text-slate-400 mb-3 tracking-widest font-mono uppercase">▸ HOW IT WORKS</div>
            <div className="space-y-2 text-xs text-slate-400">
              <div>1. You sell {tokenIn.symbol} for {tokenOut.symbol}</div>
              <div>2. Router captures price distortion (MEV)</div>
              <div>3. Back-swap buys {tokenIn.symbol} on the dip</div>
              <div>4. Tokens burned via CappedBurnHook</div>
              <div>5. Profit goes to LP vault as yield</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}