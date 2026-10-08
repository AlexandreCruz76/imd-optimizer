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

const ETH_ADDR = "0x0000000000000000000000000000000000000000";

const TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ether (nativo)",
    address: ETH_ADDR,
    decimals: 18,
    color: "#8C9EFF",
  },
  {
    symbol: "STANDARD",
    name: "Standard Token (faucet)",
    address: "0x8a095f673d49970641aF3B0fD9e4313DAdC9700C",
    decimals: 18,
    color: "#FFB000",
  },
  {
    symbol: "USD-T",
    name: "USD Test (not USDC)",
    address: "0xB6f89BA6BD12A047A2278F5C69cEA0a08E762490",
    decimals: 6,
    color: "#2775CA",
  },
  {
    symbol: "IMD",
    name: "IMD Token",
    address: "0x2c2ffC6C0cD0Ba216c7002BF4185bd974C24124e",
    decimals: 18,
    color: "#00F58C",
    logo: "/images/imd.jpg",
  },
  {
    symbol: "BUILDER",
    name: "Buildercoin",
    address: "0x97cf945E7cFAf895828c19F35F48f856AC9DBBd4",
    decimals: 18,
    color: "#FFB000",
    logo: "/images/builder.jpg",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    decimals: 18,
    color: "#8C9EFF",
  },
];

const PRICES_USD: Record<string, number> = {
  ETH: 2400,
  STANDARD: 1,
  "USD-T": 1,
  IMD: 0.1,
  BUILDER: 0.5,
  WETH: 2400,
};

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const ROUTER_ABI = [
  "function getPoolState() view returns (uint160, int24, bool)",
  "function getStats() view returns (uint256,uint256,uint256,uint256)",
  "function identityTier(address) view returns (uint8)",
  "function swapFeeBps(address) view returns (uint16)",
  "function successFeeBps(address) view returns (uint16)",
  "function minBlockDelay() view returns (uint256)",
  "function lastOperationBlock(address) view returns (uint256)",
  "function executeMultiHop(address[] venues, address[] tokens, uint256 amountIn, uint256 minAmountOut) external payable returns (uint256)",
  "event MultiHopExecuted(address indexed user, address[] tokens, uint256 amountIn, uint256 finalOut, uint256 feeTotal, uint256 userOut, uint256 timestamp)",
];

const POOL_ABI = [
  "function hopSqrtPriceX96() view returns (uint160)",
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
  feeBps: number | null;
  tier: number | null;
  successFeeBps: number | null;
  minDelay: number;
  lastOpBlock: number;
  blockNumber: number;
  sellVolume: string;
  mevCaptured: string;
  burnsExecuted: string;
  yieldDistributed: string;
}

const SLIPPAGE_PRESETS = ["0.1", "0.5", "1.0"];

const TIER_LABELS: Record<number, string> = {
  0: "T1 Buildercoin NFT",
  1: "T2 Identity (md)",
  2: "T3 $IMD/$BLD",
  3: "T4 Retail",
};

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmt(n: number, decimals = 6): string {
  if (!isFinite(n) || n === 0) return "0";
  if (n > 0 && n < 1e-6) return n.toExponential(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

const isEth = (t: Token) => t.address.toLowerCase() === ETH_ADDR;

const Q96 = 2n ** 96n;

function hopFwd(a: bigint, sqrt: bigint): bigint {
  const s = (a * sqrt) / Q96;
  return (s * sqrt) / Q96;
}

function hopInv(a: bigint, sqrt: bigint): bigint {
  const s = (a * Q96) / sqrt;
  return (s * Q96) / sqrt;
}

type Quote = {
  amt: bigint;
  gross: bigint;
  out: bigint;
  minOut: bigint;
  feeTotal: bigint;
  price: number;
  slipBps: bigint;
};

function computeQuote(
  amountStr: string,
  tokenIn: Token,
  tokenOut: Token,
  sIn: bigint | undefined,
  sOut: bigint | undefined,
  feeBps: number,
  slipPct: number
): Quote | null {
  if (!amountStr) return null;
  if (isEth(tokenIn) && isEth(tokenOut)) return null;
  try {
    const amt = ethers.parseUnits(amountStr, tokenIn.decimals);
    if (amt <= 0n) return null;
    if (!isEth(tokenIn) && !sIn) return null;
    if (!isEth(tokenOut) && !sOut) return null;
    let gross: bigint;
    if (isEth(tokenIn)) {
      gross = hopInv(amt, sOut!);
    } else if (isEth(tokenOut)) {
      gross = hopFwd(amt, sIn!);
    } else {
      const eth = hopFwd(amt, sIn!);
      if (eth === 0n) return null;
      gross = hopInv(eth, sOut!);
    }
    if (gross === 0n) return null;
    const feeTotal = (gross * BigInt(feeBps)) / 10000n;
    const net = gross - feeTotal;
    if (net <= 0n) return null;
    const slipBps = BigInt(Math.min(Math.round(slipPct * 100), 1000));
    const minOut = (net * (10000n - slipBps)) / 10000n;
    const amtF = Number(amt) / 10 ** tokenIn.decimals;
    const outF = Number(net) / 10 ** tokenOut.decimals;
    return {
      amt,
      gross,
      out: net,
      minOut,
      feeTotal,
      price: amtF > 0 ? outF / amtF : 0,
      slipBps,
    };
  } catch {
    return null;
  }
}

function mapSwapError(err: unknown): string {
  const e = err as {
    code?: number | string;
    shortMessage?: string;
    message?: string;
    reason?: string;
    info?: { error?: { code?: number } };
  };
  const code = e.code ?? e.info?.error?.code;
  if (code === 4001 || code === "ACTION_REJECTED")
    return "Transaction rejected by the wallet.";
  if (code === -32603) return "Internal wallet error — try again.";
  const msg = [e.shortMessage, e.reason, e.message].filter(Boolean).join(" ");
  if (msg.includes("insufficient funds"))
    return "Not enough ETH for gas on Sepolia.";
  if (msg.includes("panic") || msg.includes("underflow"))
    return "Quote exceeded the contract limits — try a different amount.";
  if (msg.includes("Block delay not met"))
    return "Anti-sandwich: wait 1–2 blocks after your last wallet operation.";
  if (msg.includes("no ETH liquidity"))
    return "Pool has no ETH liquidity for this route — try another amount or pair.";
  if (msg.includes("no token liquidity"))
    return "No liquidity for the output token — pick another token or a smaller amount.";
  if (msg.includes("slippage"))
    return "Venue liquidity/slippage — try a smaller amount or increase your slippage tolerance.";
  if (msg.includes("insufficient allowance") || msg.includes("ERC20InsufficientAllowance"))
    return "Token approval required — try again.";
  if (msg.includes("could not coalesce"))
    return "Gas estimation failed on Sepolia (empty revert) — check the wallet has ETH for gas/value and that the amount fits the pool liquidity, then try again.";
  if (msg.includes("missing revert data"))
    return "Simulation failed before opening the wallet (empty revert) — the amount probably does not fit the pool liquidity; try a smaller amount.";
  return e.shortMessage || e.reason || e.message || "Swap failed.";
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
                      {isEth(t) ? "native" : shortAddr(t.address)}
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
    walletName,
    connect,
    address,
    provider,
    signer,
    chainId,
    switchChain,
    walletError,
  } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"approve" | "sim" | "send" | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    block?: number;
    finalOut?: string;
    feeTotal?: string;
    userOut?: string;
  } | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const [cfg, setCfg] = useState<{
    optimizerRouter?: string;
    standardToken?: string;
    chainId?: number;
    swapPools?: Record<string, string>;
  } | null>(null);
  const [sep, setSep] = useState<SepoliaInfo | null>(null);
  const [poolSqrt, setPoolSqrt] = useState<Record<string, bigint>>({});
  const [poolsReady, setPoolsReady] = useState(false);
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
  const pools = cfg?.swapPools ?? {};
  const poolFor = (t: Token) => (isEth(t) ? null : pools[t.symbol] ?? null);
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
      if (s) {
        if (SLIPPAGE_PRESETS.includes(s)) setSlippage(s);
        else setCustomSlippage(s);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("imd_slippage", effectiveSlippage);
    }
  }, [effectiveSlippage]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/config");
        const j = await r.json();
        setCfg(j);
      } catch {
        // sem /api/config — banner de configuracao ausente no UI
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
      const [state, stats, minDelay, lastOp, bn, routerEth] =
        await Promise.all([
          router.getPoolState(),
          router.getStats(),
          router.minBlockDelay(),
          router.lastOperationBlock(address),
          provider.getBlockNumber(),
          provider.getBalance(routerAddr),
        ]);
      // Funcoes DEC-020 podem nao existir no build do router — leituras
      // individuais para nao derrubar o painel inteiro (Promise.all).
      const [fee, tierV, sFee] = await Promise.all([
        router
          .swapFeeBps(address)
          .then((v: unknown) => Number(v))
          .catch(() => null),
        router
          .identityTier(address)
          .then((v: unknown) => Number(v))
          .catch(() => null),
        router
          .successFeeBps(address)
          .then((v: unknown) => Number(v))
          .catch(() => null),
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
        feeBps: fee,
        tier: tierV,
        successFeeBps: sFee,
        minDelay: Number(minDelay),
        lastOpBlock: Number(lastOp),
        blockNumber: bn,
        sellVolume: (stats[0] as bigint).toString(),
        mevCaptured: (stats[1] as bigint).toString(),
        burnsExecuted: (stats[2] as bigint).toString(),
        yieldDistributed: (stats[3] as bigint).toString(),
      });
      // Preco on-chain de cada pool (label -> hopSqrtPriceX96) para o quote
      // multi-pair: ETH->X usa o inverso, X->ETH o direto, X->Y 2 legs via ETH.
      const sqrts = await Promise.all(
        Object.entries(cfg?.swapPools ?? {}).map(async ([sym, addr]) => {
          try {
            const p = new ethers.Contract(addr, POOL_ABI, provider);
            const v: bigint = await p.hopSqrtPriceX96();
            return [sym, v] as const;
          } catch {
            return null;
          }
        })
      );
      const map: Record<string, bigint> = {};
      for (const e of sqrts) if (e) map[e[0]] = e[1];
      setPoolSqrt(map);
      setPoolsReady(true);
    } catch (err) {
      console.error("sepolia load failed:", err);
    }
  }, [realMode, provider, address, standardAddr, routerAddr, cfg]);

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
          let raw: bigint;
          if (isEth(t)) {
            raw = await provider.getBalance(address);
          } else {
            const contract = new ethers.Contract(
              t.address,
              ERC20_ABI,
              provider
            );
            raw = (await contract.balanceOf(address)) as bigint;
          }
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
  const usdValue = amountNum * (PRICES_USD[tokenIn.symbol] ?? 0);

  const realQuote = useMemo(() => {
    if (!realMode || !amount || amountNum <= 0) return null;
    return computeQuote(
      amount,
      tokenIn,
      tokenOut,
      poolSqrt[tokenIn.symbol],
      poolSqrt[tokenOut.symbol],
      sep?.feeBps ?? 50,
      slipNum
    );
  }, [
    realMode,
    amount,
    amountNum,
    slipNum,
    tokenIn,
    tokenOut,
    poolSqrt,
    sep,
  ]);

  async function handleFaucet() {
    if (!signer || !standardAddr || !address) {
      setError("Faucet: connect the wallet on Sepolia first.");
      return;
    }
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
      setError(mapSwapError(err));
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
  }

  function setSlippagePreset(v: string) {
    setSlippage(v);
    setCustomSlippage("");
  }

  async function handleSwap() {
    if (loading) return;
    setError(null);
    if (!connected) {
      setError("Connect the wallet to execute the swap.");
      return;
    }
    if (!isSepolia) {
      setError(
        "Wallet is not on Sepolia — click SWITCH TO SEPOLIA and try again."
      );
      return;
    }
    if (!routerAddr) {
      setError(
        "Missing config: OPTIMIZER_ROUTER_ADDRESS not set in .env.local."
      );
      return;
    }
    if (!signer) {
      setError(`${walletName} session missing — reconnect the wallet.`);
      return;
    }
    if (!amountNum) {
      setError("Enter the amount to swap.");
      return;
    }
    if (cooldownBlocks > 0) {
      setError(
        `Anti-sandwich: wait ${cooldownBlocks} block(s) after your last wallet operation.`
      );
      return;
    }
    if (!realQuote) {
      setError(
        "Quote unavailable — wait for the pool prices to load or adjust the amount."
      );
      return;
    }
    const pIn = poolFor(tokenIn);
    const pOut = poolFor(tokenOut);
    if ((!isEth(tokenIn) && !pIn) || (!isEth(tokenOut) && !pOut)) {
      setError("Pool unavailable for this pair — select another token.");
      return;
    }

    setLoading(true);
    setPhase(null);
    setTxHash(null);
    setRealStats(null);
    setResult(null);
    try {
      let q: Quote = realQuote;
      let freshIn: bigint | undefined;
      let freshOut: bigint | undefined;
      try {
        if (pIn)
          freshIn = (await new ethers.Contract(pIn, POOL_ABI, provider)
            .hopSqrtPriceX96()) as bigint;
        if (pOut)
          freshOut = (await new ethers.Contract(pOut, POOL_ABI, provider)
            .hopSqrtPriceX96()) as bigint;
        const fresh = computeQuote(
          amount,
          tokenIn,
          tokenOut,
          freshIn,
          freshOut,
          sep?.feeBps ?? 50,
          slipNum
        );
        if (fresh) {
          if (fresh.out < realQuote.minOut) {
            setError(
              `Price changed since the quote shown: output now ${fmt(
                parseFloat(ethers.formatUnits(fresh.out, tokenOut.decimals)),
                6
              )} ${tokenOut.symbol}, promised minimum ${fmt(
                parseFloat(
                  ethers.formatUnits(realQuote.minOut, tokenOut.decimals)
                ),
                6
              )} ${tokenOut.symbol} — review the updated values and click again.`
            );
            loadSepolia();
            return;
          }
          q = fresh;
          setPoolSqrt((prev) => {
            const next = { ...prev };
            if (freshIn !== undefined && !isEth(tokenIn))
              next[tokenIn.symbol] = freshIn;
            if (freshOut !== undefined && !isEth(tokenOut))
              next[tokenOut.symbol] = freshOut;
            return next;
          });
        }
      } catch {
        // fresh read unavailable — keep the displayed quote;
        // the staticCall below validates everything before opening the wallet
      }

      if (!isEth(tokenIn) && address) {
        const erc = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const allow: bigint = await erc.allowance(address, routerAddr);
        if (allow < q.amt) {
          setPhase("approve");
          const atx = await erc.approve(routerAddr, ethers.MaxUint256);
          await atx.wait();
        }
      }
      let venues: string[];
      let path: string[];
      if (isEth(tokenIn)) {
        venues = [pOut as string];
        path = [ETH_ADDR, tokenOut.address];
      } else if (isEth(tokenOut)) {
        venues = [pIn as string];
        path = [tokenIn.address, ETH_ADDR];
      } else {
        venues = [pIn as string, pOut as string];
        path = [tokenIn.address, ETH_ADDR, tokenOut.address];
      }
      const router = new ethers.Contract(routerAddr, ROUTER_ABI, signer);
      setPhase("sim");
      await router.executeMultiHop.staticCall(venues, path, q.amt, q.minOut, {
        value: isEth(tokenIn) ? q.amt : 0n,
      });
      setPhase("send");
      const tx = await router.executeMultiHop(
        venues,
        path,
        q.amt,
        q.minOut,
        { value: isEth(tokenIn) ? q.amt : 0n }
      );
      setTxHash(tx.hash as string);
      const receipt = await tx.wait();
      if (!receipt) {
        setError("Transaction replaced or cancelled in the wallet.");
        return;
      }
      const readRouter = new ethers.Contract(
        routerAddr,
        ROUTER_ABI,
        provider
      );
      // Registro on-chain: decodifica o evento MultiHopExecuted do receipt
      // para mostrar o que foi efetivamente registrado na Sepolia.
      let ev: {
        finalOut?: string;
        feeTotal?: string;
        userOut?: string;
      } = {};
      for (const l of receipt.logs) {
        try {
          const p = readRouter.interface.parseLog(l);
          if (p?.name === "MultiHopExecuted") {
            ev = {
              finalOut: ethers.formatUnits(
                p.args.finalOut as bigint,
                tokenOut.decimals
              ),
              feeTotal: ethers.formatUnits(
                p.args.feeTotal as bigint,
                tokenOut.decimals
              ),
              userOut: ethers.formatUnits(
                p.args.userOut as bigint,
                tokenOut.decimals
              ),
            };
            break;
          }
        } catch {
          // log de outro contrato — ignora
        }
      }
      const stats = await readRouter.getStats();
      setRealStats({
        sellVolume: ethers.formatEther(stats[0] as bigint),
        mevCaptured: ethers.formatEther(stats[1] as bigint),
        burnsExecuted: (stats[2] as bigint).toString(),
        yieldDistributed: ethers.formatEther(stats[3] as bigint),
      });
      setResult({ block: receipt.blockNumber, ...ev });
      loadSepolia();
    } catch (err: unknown) {
      setError(mapSwapError(err));
    } finally {
      setLoading(false);
      setPhase(null);
    }
  }

  const highSlip = slipNum > 5;
  const lowSlip = slipNum < 0.1;

  const poolsMissing = realMode && Object.keys(pools).length === 0;
  const quotePending =
    realMode &&
    amountNum > 0 &&
    !realQuote &&
    !poolsMissing &&
    (!poolsReady || Object.keys(poolSqrt).length === 0);
  const payBal = balances[tokenIn.address.toLowerCase()] ?? "—";
  const payBalNum = parseFloat(payBal);

  const btnState = !connected
    ? "connect"
    : !isSepolia
    ? "switch"
    : !routerAddr
    ? "config"
    : !amountNum || !realQuote
    ? quotePending
      ? "quote"
      : "enter"
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
            <Link href="/docs" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors hidden sm:inline">Docs</Link>
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
                {!connected
                  ? "CONNECT WALLET · REQUIRES SEPOLIA"
                  : "WRONG NETWORK · SWITCH TO SEPOLIA"}
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
        {realMode && sep && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 font-mono">
            DEC-020 Identity-Fi · Your Swap Fee:{" "}
            <span className="text-white">
              {sep.feeBps !== null && sep.tier !== null
                ? `${(sep.feeBps / 100).toFixed(2)}% (Tier ${
                    sep.tier + 1
                  } · ${TIER_LABELS[sep.tier] ?? "—"})`
                : "n/d — build do router sem tiers DEC-020"}
            </span>{" "}
            · V4 MEV Protection: ACTIVE
          </div>
        )}
        {isSepolia && !routerAddr && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 p-3 text-xs text-amber-400 font-mono">
            ⚠ Contracts not deployed on Sepolia — run <span className="text-white">npm run deploy:sepolia</span> and configure OPTIMIZER_ROUTER_ADDRESS / STANDARD_TOKEN_ADDRESS in .env
          </div>
        )}
        {poolsMissing && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 p-3 text-xs text-amber-400 font-mono">
            ⚠ SWAP_POOLS_JSON missing in .env.local — pair pools not configured (SWAP_POOLS_JSON / WETH_ADDRESS)
          </div>
        )}
        {realMode && connected && cooldownBlocks > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 font-mono">
            Anti-sandwich: wait {cooldownBlocks} block(s) after last wallet operation
          </div>
        )}
        {realMode && sep && realQuote && isEth(tokenOut) && realQuote.out > sep.routerEth && (
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
              </div>
            )}

            {/* You Pay */}
            <div className="rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono uppercase">YOU PAY</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {`Balance: ${payBal}`}
                  {payBalNum > 0 ? (
                    <button
                      onClick={() => setAmount(payBal)}
                      className="ml-1.5 text-emerald-400 hover:underline"
                    >
                      MAX
                    </button>
                  ) : realMode && tokenIn.symbol === "STANDARD" && sep?.hasMint ? (
                    <button
                      onClick={handleFaucet}
                      disabled={faucetBusy}
                      className="ml-1.5 text-cyan-400 hover:underline disabled:opacity-50"
                    >
                      {faucetBusy ? "MINTING…" : "MINT 1.000 (FAUCET)"}
                    </button>
                  ) : null}
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
                  <span className="text-xs font-mono text-slate-400">
                    {usdValue > 0 ? `≈ $${fmt(usdValue, 2)}` : ""}
                  </span>
                  <TokenSelector
                    token={tokenIn}
                    other={tokenOut}
                    onSelect={handleSelectIn}
                  />
                </div>
              </div>
            </div>

            {/* Reverse button */}
            <div className="flex justify-center -my-2.5 relative z-10">
              <button
                onClick={handleReverse}
                title="Switch tokens"
                className="w-10 h-10 rounded-xl bg-[#0B111A]/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 text-lg hover:border-emerald-500/60 hover:rotate-180 transition-all duration-300"
              >
                ⇅
              </button>
            </div>

            {/* You Receive */}
            <div className="rounded-2xl bg-[#070A0F]/80 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono uppercase">YOU RECEIVE</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {`Balance: ${balances[tokenOut.address.toLowerCase()] ?? "—"}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 text-2xl font-mono text-white">
                  {realQuote ? (
                    fmt(
                      parseFloat(
                        ethers.formatUnits(realQuote.out, tokenOut.decimals)
                      ),
                      6
                    )
                  ) : (
                    <span className="text-slate-500/50">0.00</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {realQuote
                      ? `≈ $${fmt(
                          parseFloat(
                            ethers.formatUnits(realQuote.out, tokenOut.decimals)
                          ) * (PRICES_USD[tokenOut.symbol] ?? 0),
                          2
                        )}`
                      : ""}
                  </span>
                  <TokenSelector
                    token={tokenOut}
                    other={tokenIn}
                    onSelect={handleSelectOut}
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 rounded-2xl bg-[#070A0F]/40 border border-slate-800/50 px-4 py-3 space-y-1.5">
              <>
                  <InfoRow
                    label="Rate (on-chain)"
                    value={
                      realQuote
                        ? `1 ${tokenIn.symbol} = ${fmt(
                            realQuote.price,
                            6
                          )} ${tokenOut.symbol}`
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Minimum Received"
                    value={
                      realQuote
                        ? `${fmt(
                            parseFloat(
                              ethers.formatUnits(
                                realQuote.minOut,
                                tokenOut.decimals
                              )
                            ),
                            6
                          )} ${tokenOut.symbol}`
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
                    label="Your Swap Fee (Identity-Fi Tier)"
                    value={
                      sep && sep.feeBps !== null && sep.tier !== null
                        ? `${(sep.feeBps / 100).toFixed(2)}% · Tier ${
                            sep.tier + 1
                          } (${TIER_LABELS[sep.tier] ?? "—"})${
                            realQuote
                              ? ` · ${fmt(
                                  parseFloat(
                                    ethers.formatUnits(
                                      realQuote.feeTotal,
                                      tokenOut.decimals
                                    )
                                  ),
                                  6
                                )} ${tokenOut.symbol}`
                              : ""
                          }`
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Success Fee (profit only)"
                    value={
                      sep && sep.successFeeBps !== null
                        ? `${(sep.successFeeBps / 100).toFixed(2)}%`
                        : "—"
                    }
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
                    value={`${tokenIn.symbol} → ${tokenOut.symbol} ${
                      !isEth(tokenIn) && !isEth(tokenOut)
                        ? "(2 hops via ETH)"
                        : "(1 hop)"
                    } · OptimizerRouter`}
                  />
              </>
            </div>

            {/* CTA */}
            <button
              onClick={
                btnState === "connect"
                  ? connect
                  : btnState === "switch"
                  ? () => void switchChain(11155111)
                  : handleSwap
              }
              disabled={
                btnState === "enter" ||
                btnState === "quote" ||
                btnState === "config" ||
                btnState === "loading" ||
                (realMode && cooldownBlocks > 0) ||
                (realMode &&
                  !!realQuote &&
                  !!sep &&
                  isEth(tokenOut) &&
                  realQuote.out > sep.routerEth)
              }
              className={`w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold tracking-widest font-mono uppercase transition-all ${
                btnState === "swap"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(0,245,140,0.25)]"
                  : btnState === "connect" || btnState === "switch"
                  ? "bg-emerald-500/90 text-black hover:bg-emerald-500"
                  : btnState === "loading"
                  ? "bg-emerald-500/20 text-emerald-400 cursor-wait"
                  : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
              }`}
            >
              {btnState === "connect"
                ? connecting
                  ? `ABRINDO ${walletName.toUpperCase()}…`
                  : `CONNECT ${walletName.toUpperCase()}`
                : btnState === "switch"
                ? "SWITCH TO SEPOLIA"
                : btnState === "config"
                ? "MISSING CONFIG"
                : btnState === "enter"
                ? "ENTER AN AMOUNT"
                : btnState === "quote"
                ? "CALCULATING QUOTE…"
                : btnState === "loading"
                ? phase === "approve"
                  ? "APPROVING TOKEN…"
                  : phase === "send"
                  ? "SENDING TX…"
                  : "SIMULATING…"
                : cooldownBlocks > 0
                ? `COOLDOWN · ${cooldownBlocks} BLOCK(S)`
                : "EXECUTE PROTECTED SWAP"}
            </button>

            {!connected && (
              <div className="mt-3 text-[10px] text-slate-500 text-center font-mono">
                {walletError ? (
                  <span className="text-amber-400 break-words">
                    CARTERA: {walletError}
                  </span>
                ) : (
                  "Connect your wallet to swap"
                )}
              </div>
            )}
          </div>

          {/* Transaction result */}
          {txHash && (
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
              {result && (
                <div className="mt-2 space-y-1 text-xs">
                  <InfoRow
                    label="Block (Sepolia)"
                    value={result.block !== undefined ? String(result.block) : "—"}
                    color="#00F58C"
                  />
                  {result.userOut !== undefined && (
                    <InfoRow
                      label="MultiHopExecuted event · net output"
                      value={`${fmt(parseFloat(result.userOut), 6)} ${tokenOut.symbol}`}
                      color="#00F58C"
                    />
                  )}
                  {result.feeTotal !== undefined && (
                    <InfoRow
                      label="Evento · fee registrada"
                      value={`${fmt(parseFloat(result.feeTotal), 6)} ${tokenOut.symbol}`}
                      color="#FFB000"
                    />
                  )}
                </div>
              )}
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
              <div>1. You swap {tokenIn.symbol} for {tokenOut.symbol}</div>
              <div>2. On-chain route via OptimizerRouter {(isEth(tokenIn) || isEth(tokenOut)) ? "(1 hop)" : "(2 hops via ETH)"}</div>
              <div>3. DEC-020 fee charged once on the net output</div>
              <div>4. Anti-sandwich cooldown ({sep?.minDelay ?? 1} block) between wallet operations</div>
              <div>5. Minimum received protects against slippage/sandwich</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}