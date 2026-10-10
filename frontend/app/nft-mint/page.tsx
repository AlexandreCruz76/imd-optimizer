"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { useWallet } from "../components/WalletProvider";
import { PulseDot, useCountUp } from "../dashboard/charts";

interface MintStatus {
  deployed: boolean;
  mintOpen: boolean;
  totalMinted: number;
  maxSupply: number;
  mintPrice: string;
  targetRaise: string;
}

interface KeyInfo {
  tokenId?: number;
  tier?: string;
  level?: number;
  totalMEVReceived?: string;
}

interface RecentMint {
  tokenId: number;
  owner: string;
  level: number | null;
  blockNumber: number;
  txHash: string;
}

const BUILDERCOIN_ABI = [
  "function mint() payable",
  "error MintNotOpen()",
  "error MaxSupplyReached()",
  "error WrongPayment(uint256 sent, uint256 required)",
  "error SplitNotConfigured()",
  "error SplitWalletRejected(address wallet)",
];

const LEVEL_FRAMES: Record<number, { name: string; color: string }> = {
  1: { name: "Bronze", color: "#CD7F32" },
  2: { name: "Prata", color: "#C0C0C0" },
  3: { name: "Ouro", color: "#FFD700" },
  4: { name: "Neon", color: "#00F58C" },
};

function mapMintError(err: unknown): string {
  const e = err as {
    code?: number | string;
    shortMessage?: string;
    message?: string;
    info?: { error?: { code?: number } };
    name?: string;
  };
  const code = e.code ?? e.info?.error?.code;
  if (code === 4001 || code === "ACTION_REJECTED") return "Transaction rejected by the wallet.";
  if (code === -32603) return "Internal wallet error — try again.";
  const msg = e.message || "";
  if (e.name === "WrongPayment") return `Wrong amount: send exactly 0.05 ETH.`;
  if (e.name === "MintNotOpen") return "Mint is closed in the contract (mintOpen = false).";
  if (e.name === "MaxSupplyReached") return "Sold out: 501/501 minted.";
  if (e.name === "SplitNotConfigured") return "Split 40/40/20 not configured in the contract.";
  if (e.name === "SplitWalletRejected") return "Split wallet rejected receive() — mint reverted.";
  if (msg.includes("insufficient funds"))
    return "Not enough ETH in the wallet (needs 0.05 ETH + gas on Sepolia).";
  if (msg.includes("network") || msg.includes("chain"))
    return "Wallet is on the wrong network — select Sepolia.";
  return e.shortMessage || e.message || "Mint failed.";
}

const DEFAULT_STATUS: MintStatus = {
  deployed: false,
  mintOpen: false,
  totalMinted: 0,
  maxSupply: 501,
  mintPrice: "0.05",
  targetRaise: "25.05 ETH",
};

/** Count-up para supply minted. */
function CountUpInt({ value }: { value: number }) {
  const shown = useCountUp(value, 600);
  return <span className="tabular-nums">{Math.round(shown)}</span>;
}

export default function NFTMintPage() {
  const { connected, address, signer, connect, chainId, switchChain, walletError } = useWallet();
  const [status, setStatus] = useState<MintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [userKeys, setUserKeys] = useState<KeyInfo[]>([]);
  const [recent, setRecent] = useState<RecentMint[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMintStatus = useCallback(() => {
    fetch("/api/nft/status")
      .then((r) => r.json())
      .then((data) => setStatus({ ...DEFAULT_STATUS, ...data }))
      .catch(() => setStatus(DEFAULT_STATUS))
      .finally(() => setLoading(false));
  }, []);

  const fetchRecent = useCallback(() => {
    setRecentLoading(true);
    fetch("/api/nft/recent")
      .then((r) => r.json())
      .then((data) => setRecent(data.items || []))
      .catch(() => setRecent([]))
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMintStatus();
      fetchRecent();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchMintStatus, fetchRecent]);

  useEffect(() => {
    if (!connected || !address) return;
    fetch(`/api/nft/keys?address=${address}`)
      .then((r) => r.json())
      .then((data) => setUserKeys(data.keys || []))
      .catch(() => setUserKeys([]));
  }, [connected, address]);

  async function mint() {
    setError(null);
    try {
      if (!connected) {
        await connect();
        return;
      }
      if (!status?.deployed) {
        setError("Buildercoin not configured on the server (GENESIS_KEY_ADDRESS missing).");
        return;
      }
      if (chainId !== null && chainId !== 11155111) {
        setError(`Wallet on chain ${chainId} — switch to Sepolia and try again.`);
        return;
      }
      if (!signer || !address) {
        setError("Wallet not ready — reconnect.");
        return;
      }
      if (!status.mintOpen) {
        setError("Mint is closed (mintOpen = false in the contract).");
        return;
      }

      setMinting(true);
      const configRes = await fetch("/api/config");
      const cfg = await configRes.json();
      const keyAddr = cfg.genesisKey || "";
      if (!keyAddr) {
        setError("GENESIS_KEY_ADDRESS not found in /api/config.");
        return;
      }
      const price = ethers.parseEther(status.mintPrice);
      const provider = signer.provider;
      if (provider) {
        const bal = await provider.getBalance(address);
        if (bal < price + ethers.parseEther("0.002")) {
          setError(
            `Insufficient balance: needs ${status.mintPrice} ETH + gas (has ${ethers.formatEther(bal)} ETH).`
          );
          return;
        }
      }
      const contract = new ethers.Contract(keyAddr, BUILDERCOIN_ABI, signer);
      const tx = await contract.mint({ value: price });
      setTxHash(tx.hash);
      await tx.wait();
      fetchMintStatus();
      fetchRecent();
      const keysRes = await fetch(`/api/nft/keys?address=${address}`);
      const keysData = await keysRes.json();
      setUserKeys(keysData.keys || []);
    } catch (err) {
      setError(mapMintError(err));
    } finally {
      setMinting(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-emerald-500/40" suppressHydrationWarning>
        <span className="animate-pulse">█</span>&nbsp;Loading…
      </div>
    );
  }

  const maxSupply = status.maxSupply;
  const supplyPct = maxSupply > 0 ? (status.totalMinted / maxSupply) * 100 : 0;
  const mintReady =
    status.mintOpen && !minting && (chainId === null || chainId === 11155111);

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <main className="max-w-6xl mx-auto p-4 md:p-6 pt-24 space-y-8 pb-10">
        {/* ===== Título ===== */}
        <header className="rise flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-emerald-500 bg-[#0D121A] flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.429 15.429a12.062 12.062 0 00-1.429-5.714m-5.714 0a12.062 12.062 0 01-1.429 5.714m0 0a12.062 12.062 0 001.429 5.714m5.714-5.714a12.062 12.062 0 01-5.714 1.429m5.714 0a12.062 12.062 0 00-5.714-1.429m0 0a12.062 12.062 0 015.714-1.429"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Buildercoin</h1>
              <p className="text-xs text-emerald-500/50">
                dNFT ERC-721 · fornecimento único de {maxSupply} · evolui de Level no protocolo
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
            <PulseDot /> Sepolia · mint live
          </span>
        </header>

        {/* =====================================================================
            SEÇÃO 1 — HERO: arte à esquerda + caixa de mint à direita (seção inteira)
           ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Arte buildercoin */}
          <div
            className="rise relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#0B111A] min-h-[380px] flex items-center justify-center"
            style={{ animationDelay: "80ms" }}
          >
            <div
              className="hero-glow pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% 0%, rgba(0,245,140,0.18), transparent)",
              }}
            />
            {/* Vídeo Gemini (autoplay silencioso em loop) — poster = arte estática como fallback */}
            <video
              src="/images/gemini-hero.mp4"
              poster="/images/buildercoin.jpeg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Buildercoin dNFT"
              className="hero-breathe relative z-10 h-full w-full object-cover"
              style={{ filter: "drop-shadow(0 0 40px rgba(0,245,140,0.25))" }}
            />
            <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-emerald-500/30 bg-black/60 px-3 py-1.5 font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
              TIER 1 · ALPHA · dNFT
            </div>
          </div>

          {/* Caixa de mint */}
          <div
            className="rise flex flex-col rounded-3xl border border-emerald-500/25 bg-[#0B111A]/90 p-6"
            style={{ animationDelay: "160ms" }}
          >
            <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">MINT STATUS</div>

            {!status.deployed && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-400">
                Contrato não configurado no servidor (GENESIS_KEY_ADDRESS). Mint real após configurar o .env.
              </div>
            )}
            {status.deployed && !connected && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-400">
                <button onClick={() => void connect()} className="font-bold underline hover:text-amber-300">
                  Conecte a wallet
                </button>{" "}
                — Sepolia Testnet
                {walletError && <div className="mt-2 text-[10px] text-amber-300 break-words">WALLET: {walletError}</div>}
              </div>
            )}
            {connected && chainId !== null && chainId !== 11155111 && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-400">
                Rede errada (chain {chainId}) —{" "}
                <button onClick={() => void switchChain(11155111)} className="font-bold underline hover:text-amber-300">
                  TROCAR PARA SEPOLIA
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 text-center mb-4">
              <div>
                <div className="text-emerald-500/50 text-[10px] font-mono tracking-widest">STATUS</div>
                <div className={status.mintOpen ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {status.mintOpen ? "OPEN" : "CLOSED"}
                </div>
              </div>
              <div>
                <div className="text-emerald-500/50 text-[10px] font-mono tracking-widest">MINTED</div>
                <div className="text-emerald-400 font-bold">
                  <CountUpInt value={status.totalMinted} /> / {maxSupply}
                </div>
              </div>
              <div>
                <div className="text-emerald-500/50 text-[10px] font-mono tracking-widest">RESTANTES</div>
                <div className="text-emerald-400 font-bold">{maxSupply - status.totalMinted}</div>
              </div>
              <div>
                <div className="text-emerald-500/50 text-[10px] font-mono tracking-widest">META</div>
                <div className="text-emerald-400 font-bold">{status.targetRaise}</div>
              </div>
            </div>

            <div className="progress-glow h-2 bg-slate-800/50 rounded-full overflow-hidden">
              <div
                className="progress-shine h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${supplyPct}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-500/40 text-center mt-1 font-mono">{supplyPct.toFixed(1)}% esgotado</p>

            <ul className="mt-5 space-y-1.5 text-xs text-emerald-400">
              <li>✓ Swap 0.00% (Tier Alpha — Identity-Fi)</li>
              <li>✓ Taxa de sucesso mínima: 5% apenas do lucro</li>
              <li>✓ Yield 4x no Builder Staking</li>
              <li>✓ dNFT evolui de Level (Bronze → Neon)</li>
            </ul>

            <button
              onClick={() => void mint()}
              disabled={!mintReady}
              className={`mt-5 w-full rounded-xl py-3 font-mono text-sm font-semibold uppercase tracking-widest transition-all active:scale-[0.98] ${
                mintReady
                  ? "cta-pulse bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(0,245,140,0.45)]"
                  : "bg-emerald-500/10 text-emerald-500/40 cursor-not-allowed"
              }`}
            >
              {minting
                ? "MINTING…"
                : chainId !== null && chainId !== 11155111
                ? "REDE ERRADA — TROQUE PARA SEPOLIA"
                : `MINT — ${status.mintPrice} ETH`}
            </button>

            {txHash && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                ✅ Enviado: {txHash.slice(0, 18)}…{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  Ver
                </a>
              </div>
            )}
            {error && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                ERRO: {error}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 2 — MARKETPLACE (estilo OpenSea): últimos 5 NFTs mintados
           ===================================================================== */}
        <section className="rise" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Marketplace · Últimos mints</h2>
              <div className="rule-grow mt-1 h-px w-40 bg-gradient-to-r from-emerald-500/60 to-transparent" style={{ animationDelay: "400ms" }} />
              <p className="text-xs text-emerald-500/40 font-mono mt-1.5">
                Últimos {recent.length} Buildercoin mintados on-chain · clique para ver no Etherscan
              </p>
            </div>
            <button
              onClick={fetchRecent}
              className="rounded-lg border border-emerald-500/30 px-3 py-1.5 font-mono text-[10px] tracking-widest text-emerald-400 uppercase hover:bg-emerald-500/10 transition-colors"
            >
              ⟳ Atualizar
            </button>
          </div>

          {recentLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0B111A]/60 p-8 text-center text-xs font-mono text-slate-500">
              Nenhum mint recente encontrado (varredura de blocos). Verifique o contrato GENESIS_KEY.
            </div>
          ) : (
            <div className="vitrine rounded-2xl border border-white/[0.06] p-4 bg-[#0B111A]/60">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recent.map((item, idx) => {
                  const frame = LEVEL_FRAMES[item.level ?? 1] ?? LEVEL_FRAMES[1];
                  return (
                    <a
                      key={item.tokenId}
                      href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rise shine-hover group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B111A] transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(0,245,140,0.15)] hover:-translate-y-1"
                      style={{ animationDelay: `${280 + idx * 70}ms` }}
                    >
                      <div className="relative aspect-square overflow-hidden border-b border-white/[0.06]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/metadata/${item.tokenId}/image`}
                          alt={`Buildercoin #${item.tokenId}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span
                          className="shine-hover absolute top-2 left-2 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase"
                          style={{ color: frame.color, background: `${frame.color}22`, border: `1px solid ${frame.color}55` }}
                        >
                          {frame.name}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white">#{item.tokenId}</span>
                          <span className="font-mono text-[9px] text-slate-500">LVL {item.level ?? 1}</span>
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-slate-500 truncate">
                          {item.owner ? `${item.owner.slice(0, 6)}…${item.owner.slice(-4)}` : "—"}
                        </div>
                        <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-slate-600">
                          <span>blk {item.blockNumber}</span>
                          <span className="text-emerald-500/60 group-hover:text-emerald-400">ver ↗</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            SEÇÃO 3 — Informações relevantes
           ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Split 40/40/20 */}
          <div
            className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5"
            style={{ animationDelay: "560ms" }}
          >
            <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-2">
              PARA ONDE VAI A {status.mintPrice} ETH — HONESTIDADE RADICAL
            </div>
            <div className="rule-grow mb-4 h-px w-full bg-gradient-to-r from-emerald-500/50 to-transparent" style={{ animationDelay: "640ms" }} />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-4">
                <div className="text-2xl font-bold text-emerald-400">40%</div>
                <div className="text-[10px] text-emerald-500/50 mt-1 font-mono">CORE TEAM</div>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4">
                <div className="text-2xl font-bold text-cyan-400">40%</div>
                <div className="text-[10px] text-cyan-500/50 mt-1 font-mono">INFRA &amp; SEGURANÇA</div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-slate-900/40 p-4">
                <div className="text-2xl font-bold text-amber-400">20%</div>
                <div className="text-[10px] text-amber-500/50 mt-1 font-mono">CRESCIMENTO</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-mono text-slate-500 leading-relaxed">
              Split 40/40/20 aplicado on-chain na própria tx de mint — sem custódia manual.
            </p>
          </div>

          {/* How it works */}
          <div
            className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5"
            style={{ animationDelay: "620ms" }}
          >
            <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-2">COMO FUNCIONA</div>
            <div className="rule-grow mb-4 h-px w-full bg-gradient-to-r from-cyan-500/40 to-transparent" style={{ animationDelay: "700ms" }} />
            <ol className="space-y-2 text-xs text-emerald-500/60 list-decimal list-inside">
              <li>Conecte a wallet — Sepolia Testnet (mainnet após aprovação)</li>
              <li>Mint por {status.mintPrice} ETH — split 40/40/20 automático na mesma tx</li>
              <li>Assine a transação (mint on-chain via contrato)</li>
              <li>Receba o dNFT (fornecimento único de {maxSupply}) no Level 1 (Bronze)</li>
              <li>Swap 0.00% + taxa de sucesso mínima + yield 4x (Tier Alpha)</li>
              <li>Destrava a aba ARBITRAGE (The Spear)</li>
            </ol>
            <Link
              href="/pool"
              className="mt-4 inline-block text-xs font-mono text-emerald-400 underline hover:text-emerald-300"
            >
              → ir para Meta Hook Pool (monitor das 2 pools + arbitragem)
            </Link>
          </div>
        </section>

        {/* Seus tokens (se houver) */}
        {connected && userKeys.length > 0 && (
          <section className="rise rounded-2xl border border-white/[0.07] bg-[#0B111A]/80 p-5" style={{ animationDelay: "680ms" }}>
            <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">
              SEUS TOKENS ({userKeys.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {userKeys.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/30 p-3 text-xs"
                >
                  <span className="flex items-center gap-3">
                    {key.tokenId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/metadata/${key.tokenId}/image`}
                        alt={`Buildercoin #${key.tokenId}`}
                        className="w-10 h-10 rounded-lg border border-slate-700/50"
                      />
                    ) : null}
                    <span className="text-emerald-400 font-mono">Token #{key.tokenId ?? i + 1}</span>
                  </span>
                  <span className="text-emerald-500/60 font-mono">
                    {key.level ? `Level ${key.level} · ` : ""}
                    {key.tier ?? "Buildercoin"}
                  </span>
                  {key.totalMEVReceived && key.totalMEVReceived !== "0" && (
                    <span className="text-emerald-500/60 font-mono">MEV: {key.totalMEVReceived} ETH</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
