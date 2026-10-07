"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";
import { Navbar } from "../components/Navbar";

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

const BUILDERCOIN_ABI = [
  "function mint() payable",
  "error MintNotOpen()",
  "error MaxSupplyReached()",
  "error WrongPayment(uint256 sent, uint256 required)",
  "error SplitNotConfigured()",
  "error SplitWalletRejected(address wallet)",
];

function mapMintError(err: unknown): string {
  const e = err as {
    code?: number | string;
    shortMessage?: string;
    message?: string;
    info?: { error?: { code?: number } };
    args?: readonly unknown[];
    name?: string;
  };
  const code = e.code ?? e.info?.error?.code;
  if (code === 4001 || code === "ACTION_REJECTED")
    return "Transação rejeitada na carteira.";
  if (code === -32603) return "Erro interno da carteira — tente novamente.";
  const msg = e.message || "";
  if (e.name === "WrongPayment")
    return `Valor errado: envie exatamente 0.05 ETH.`;
  if (e.name === "MintNotOpen") return "Mint fechado no contrato (mintOpen = false).";
  if (e.name === "MaxSupplyReached") return "Esgotado: 501/501 mintados.";
  if (e.name === "SplitNotConfigured")
    return "Split 40/40/20 não configurado no contrato.";
  if (e.name === "SplitWalletRejected")
    return "Carteira de split rejeitou o receive() — mint revertido.";
  if (msg.includes("insufficient funds"))
    return "ETH insuficiente na carteira (precisa de 0.05 ETH + gas na Sepolia).";
  if (msg.includes("network") || msg.includes("chain"))
    return "Carteira na rede errada — selecione Sepolia.";
  return e.shortMessage || e.message || "Mint falhou.";
}

const DEFAULT_STATUS: MintStatus = {
  deployed: false,
  mintOpen: false,
  totalMinted: 0,
  maxSupply: 501,
  mintPrice: "0.05",
  targetRaise: "25.05 ETH",
};

export default function NFTMintPage() {
  const {
    connected,
    address,
    signer,
    connect,
    chainId,
    switchChain,
    walletError,
  } = useWallet();
  const [status, setStatus] = useState<MintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [userKeys, setUserKeys] = useState<KeyInfo[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMintStatus = useCallback(() => {
    fetch("/api/nft/status")
      .then((r) => r.json())
      .then((data) => setStatus({ ...DEFAULT_STATUS, ...data }))
      .catch(() => setStatus(DEFAULT_STATUS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMintStatus();
  }, [fetchMintStatus]);

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
        setError(
          "Buildercoin não configurado (GENESIS_KEY_ADDRESS ausente no .env do servidor)."
        );
        return;
      }
      if (chainId !== null && chainId !== 11155111) {
        setError(
          `Carteira na rede ${chainId} — troque para Sepolia e tente de novo.`
        );
        return;
      }
      if (!signer || !address) {
        setError("Carteira não pronta — reconecte.");
        return;
      }
      if (!status.mintOpen) {
        setError("Mint fechado (mintOpen = false no contrato).");
        return;
      }

      setMinting(true);
      const configRes = await fetch("/api/config");
      const cfg = await configRes.json();
      const keyAddr = cfg.genesisKey || "";
      if (!keyAddr) {
        setError("GENESIS_KEY_ADDRESS não encontrada no /api/config.");
        return;
      }
      const price = ethers.parseEther(status.mintPrice);
      const provider = signer.provider;
      if (provider) {
        const bal = await provider.getBalance(address);
        if (bal < price + ethers.parseEther("0.002")) {
          setError(
            `Saldo insuficiente: precisa de ${status.mintPrice} ETH + gas (tem ${ethers.formatEther(bal)} ETH).`
          );
          return;
        }
      }
      const contract = new ethers.Contract(keyAddr, BUILDERCOIN_ABI, signer);
      const tx = await contract.mint({ value: price });
      setTxHash(tx.hash);
      await tx.wait();
      fetchMintStatus();
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
      <div className="flex items-center gap-2 text-emerald-500/40 h-64 justify-center">
        <span className="animate-pulse">█</span> Loading…
      </div>
    );
  }

  const maxSupply = status.maxSupply;
  const supplyPct = maxSupply > 0 ? (status.totalMinted / maxSupply) * 100 : 0;

  return (
    <>
    <Navbar />
    <div className="max-w-3xl mx-auto p-4 md:p-6 pt-20 md:pt-24 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-emerald-500 bg-[#0D121A] flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.429 15.429a12.062 12.062 0 00-1.429-5.714m-5.714 0a12.062 12.062 0 01-1.429 5.714m0 0a12.062 12.062 0 001.429 5.714m5.714-5.714a12.062 12.062 0 01-5.714 1.429m5.714 0a12.062 12.062 0 00-5.714-1.429m0 0a12.062 12.062 0 015.714-1.429" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Buildercoin</h1>
          <p className="text-xs text-emerald-500/50">
            dNFT ERC-721 · pool única de {maxSupply} · evolui de Level no protocolo
          </p>
        </div>
      </header>

      {!status.deployed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-amber-400 text-sm">
          Contrato não configurado no servidor (GENESIS_KEY_ADDRESS). Mint real
          disponível após configurar o .env.
        </div>
      )}

      {status.deployed && !connected && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-amber-400 text-sm">
          <button onClick={() => connect()} className="font-bold underline hover:text-amber-300">
            Connect wallet
          </button>{" "}
          — Sepolia Testnet
          {walletError && (
            <div className="mt-2 text-xs text-amber-300 break-words">
              CARTERA: {walletError}
            </div>
          )}
        </div>
      )}

      {connected && chainId !== null && chainId !== 11155111 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-amber-400 text-sm">
          Rede errada (chain {chainId}) —{" "}
          <button
            onClick={() => switchChain(11155111)}
            className="font-bold underline hover:text-amber-300"
          >
            MUDAR PARA SEPOLIA
          </button>
        </div>
      )}

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">MINT STATUS</div>
        <div className="grid grid-cols-4 gap-4 text-center mb-4">
          <div>
            <div className="text-emerald-500/50 text-xs">STATUS</div>
            <div className={status.mintOpen ? "text-emerald-400" : "text-red-400"}>
              {status.mintOpen ? "OPEN" : "CLOSED"}
            </div>
          </div>
          <div>
            <div className="text-emerald-500/50 text-xs">MINTED</div>
            <div className="text-emerald-400">{status.totalMinted} / {maxSupply}</div>
          </div>
          <div>
            <div className="text-emerald-500/50 text-xs">REMAINING</div>
            <div className="text-emerald-400">{maxSupply - status.totalMinted}</div>
          </div>
          <div>
            <div className="text-emerald-500/50 text-xs">TARGET</div>
            <div className="text-emerald-400">{status.targetRaise}</div>
          </div>
        </div>
        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${supplyPct}%` }}></div>
        </div>
        <p className="text-xs text-emerald-500/40 text-center mt-1">
          {supplyPct.toFixed(1)}% sold
        </p>
      </div>

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">BUILDCOIN (dNFT)</div>
        <p className="text-xs text-emerald-500/50 mb-3">
          {status.mintPrice} ETH · pool única de {maxSupply} · split 40/40/20
          on-chain
        </p>
        <ul className="space-y-2 text-xs text-emerald-400 mb-4">
          <li>✓ Swap 0.00% (Tier Alpha — Identity-Fi)</li>
          <li>✓ Success fee mínima: 5% só sobre o lucro</li>
          <li>✓ Yield 4x no Builder Staking</li>
          <li>✓ dNFT evolui de Level (Bronze → Neon) via updateTokenLevel</li>
        </ul>
        <button
          onClick={() => mint()}
          disabled={
            minting ||
            !status.mintOpen ||
            (chainId !== null && chainId !== 11155111)
          }
          className={`w-full py-2.5 text-xs font-bold tracking-wider rounded-xl ${
            status.mintOpen &&
            !minting &&
            (chainId === null || chainId === 11155111)
              ? "bg-emerald-500 text-black hover:bg-emerald-400"
              : "bg-emerald-500/10 text-emerald-500/40 cursor-not-allowed"
          }`}
        >
          {minting
            ? "MINTING…"
            : chainId !== null && chainId !== 11155111
            ? "WRONG NETWORK — MUDAR PARA SEPOLIA"
            : `MINT — ${status.mintPrice} ETH`}
        </button>
      </div>

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">
          WHERE DOES THE {status.mintPrice} ETH GO? — RADICAL HONESTY
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/40 rounded-xl p-3">
            <div className="text-emerald-400 font-bold">40%</div>
            <div className="text-[10px] text-emerald-500/50 mt-1">CORE TEAM (Codeming)</div>
          </div>
          <div className="bg-slate-900/40 rounded-xl p-3">
            <div className="text-emerald-400 font-bold">40%</div>
            <div className="text-[10px] text-emerald-500/50 mt-1">INFRA &amp; SECURITY</div>
          </div>
          <div className="bg-slate-900/40 rounded-xl p-3">
            <div className="text-emerald-400 font-bold">20%</div>
            <div className="text-[10px] text-emerald-500/50 mt-1">GROWTH &amp; BOUNTIES</div>
          </div>
        </div>
      </div>

      {txHash && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">
          ✅ Submitted: {txHash.slice(0, 20)}…{" "}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-300"
          >
            View
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          ERROR: {error}
        </div>
      )}

      {connected && userKeys.length > 0 && (
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">
            YOUR TOKENS ({userKeys.length})
          </div>
          <div className="space-y-2">
            {userKeys.map((key, i) => (
              <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <span className="flex items-center gap-3">
                  {key.tokenId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/metadata/${key.tokenId}/image`}
                      alt={`Buildercoin #${key.tokenId}`}
                      className="w-9 h-9 rounded-lg border border-slate-700/50"
                    />
                  ) : null}
                  <span className="text-emerald-400">Token #{key.tokenId ?? i + 1}</span>
                </span>
                <span className="text-emerald-500/60">
                  {key.level ? `Level ${key.level} · ` : ""}{key.tier ?? "Buildercoin"}
                </span>
                {key.totalMEVReceived && key.totalMEVReceived !== "0" && (
                  <span className="text-emerald-500/60">MEV: {key.totalMEVReceived} ETH</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">HOW IT WORKS</div>
        <ol className="space-y-2 text-xs text-emerald-500/60 list-decimal list-inside">
          <li>Connect wallet — Sepolia Testnet (mainnet após aprovação)</li>
          <li>Minte por {status.mintPrice} ETH — split 40/40/20 automático na mesma tx</li>
          <li>Assine a transação (mint on-chain via contrato)</li>
          <li>Receba o dNFT (pool única de {maxSupply}) com Level 1 (Bronze)</li>
          <li>Swap 0.00% + success fee mínima + yield 4x (Tier Alpha)</li>
          <li>Libera a aba ARBITRAGE (The Spear)</li>
        </ol>
      </div>
    </div>
    </>
  );
}
