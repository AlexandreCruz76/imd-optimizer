"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";

interface MintStatus {
  deployed: boolean;
  mintOpen: boolean;
  totalMinted: number;
  maxSupply: number;
  genesisPrice: string;
  backerPrice: string;
  targetRaise: string;
}

interface KeyInfo {
  tier: string;
  totalMEVReceived: string;
}

const GENESIS_KEY_ABI = [
  "function mintGenesis() payable",
  "function mintBacker() payable",
];

const DEFAULT_STATUS: MintStatus = {
  deployed: false,
  mintOpen: false,
  totalMinted: 0,
  maxSupply: 501,
  genesisPrice: "0.05",
  backerPrice: "1.0",
  targetRaise: "25.05 ETH",
};

export default function NFTMintPage() {
  const { connected, address, signer, connect } = useWallet();
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

  async function mint(tier: "GENESIS" | "BACKER") {
    setError(null);
    if (!connected) {
      await connect();
      return;
    }
    if (!status?.deployed) {
      setError(
        "GenesisKey não configurado (GENESIS_KEY_ADDRESS ausente no .env do servidor)."
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
    try {
      const configRes = await fetch("/api/config");
      const cfg = await configRes.json();
      const keyAddr = cfg.genesisKey || "";
      if (!keyAddr) {
        setError("GENESIS_KEY_ADDRESS não encontrada no /api/config.");
        return;
      }
      const contract = new ethers.Contract(keyAddr, GENESIS_KEY_ABI, signer);
      const priceEth = tier === "GENESIS" ? status.genesisPrice : status.backerPrice;
      const tx =
        tier === "GENESIS"
          ? await contract.mintGenesis({ value: ethers.parseEther(priceEth) })
          : await contract.mintBacker({ value: ethers.parseEther(priceEth) });
      setTxHash(tx.hash);
      await tx.wait();
      fetchMintStatus();
      const keysRes = await fetch(`/api/nft/keys?address=${address}`);
      const keysData = await keysRes.json();
      setUserKeys(keysData.keys || []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.slice(0, 140) : "Mint falhou";
      setError(msg);
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
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-emerald-500 bg-[#0D121A] flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.429 15.429a12.062 12.062 0 00-1.429-5.714m-5.714 0a12.062 12.062 0 01-1.429 5.714m0 0a12.062 12.062 0 001.429 5.714m5.714-5.714a12.062 12.062 0 01-5.714 1.429m5.714 0a12.062 12.062 0 00-5.714-1.429m0 0a12.062 12.062 0 015.714-1.429" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Optimizer Genesis Key</h1>
          <p className="text-xs text-emerald-500/50">
            ERC-721 · pool única de {maxSupply} (Genesis + Backer)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">GENESIS KEY</div>
          <p className="text-xs text-emerald-500/50 mb-3">
            {status.genesisPrice} ETH · pool única de {maxSupply}
          </p>
          <ul className="space-y-2 text-xs text-emerald-400 mb-4">
            <li>✓ Swap 0.00% (Tier Alpha — Identity-Fi)</li>
            <li>✓ Success fee mínima: 5% só sobre o lucro</li>
            <li>✓ Yield 4x no Builder Staking</li>
            <li>✓ Participa da arbitragem (Aba ARBITRAGE)</li>
          </ul>
          <button
            onClick={() => mint("GENESIS")}
            disabled={minting || !status.mintOpen}
            className={`w-full py-2.5 text-xs font-bold tracking-wider rounded-xl ${
              status.mintOpen && !minting
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "bg-emerald-500/10 text-emerald-500/40 cursor-not-allowed"
            }`}
          >
            {minting ? "MINTING…" : `MINT GENESIS — ${status.genesisPrice} ETH`}
          </button>
        </div>

        <div className="bg-[#0B111A]/80 border border-amber-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-amber-500/60 tracking-widest font-mono mb-4">BACKER KEY</div>
          <p className="text-xs text-emerald-500/50 mb-3">
            {status.backerPrice} ETH · mesma pool de {maxSupply}
          </p>
          <ul className="space-y-2 text-xs text-amber-400 mb-4">
            <li>✓ Todos os benefícios do Genesis</li>
            <li>✓ Prioridade em allocações</li>
            <li>✓ Peso 2x em governança</li>
            <li>✓ Badge “BACKER”</li>
          </ul>
          <button
            onClick={() => mint("BACKER")}
            disabled={minting || !status.mintOpen}
            className={`w-full py-2.5 text-xs font-bold tracking-wider rounded-xl ${
              status.mintOpen && !minting
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "bg-amber-500/10 text-amber-500/40 cursor-not-allowed"
            }`}
          >
            {minting ? "MINTING…" : `MINT BACKER — ${status.backerPrice} ETH`}
          </button>
        </div>
      </div>

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">
          WHERE DOES THE {status.genesisPrice} ETH GO? — RADICAL HONESTY
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
            YOUR KEYS ({userKeys.length})
          </div>
          <div className="space-y-2">
            {userKeys.map((key, i) => (
              <div key={i} className="flex justify-between text-xs p-3 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <span className="text-emerald-400">Key #{i + 1}</span>
                <span className="text-emerald-500/60">Tier: {key.tier}</span>
                <span className="text-emerald-500/60">MEV: {key.totalMEVReceived} ETH</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">HOW IT WORKS</div>
        <ol className="space-y-2 text-xs text-emerald-500/60 list-decimal list-inside">
          <li>Connect wallet — Sepolia Testnet (mainnet após aprovação)</li>
          <li>Escolha Genesis ({status.genesisPrice} ETH) ou Backer ({status.backerPrice} ETH)</li>
          <li>Assine a transação (mint on-chain via contrato)</li>
          <li>Receba o ERC-721 (pool única de {maxSupply})</li>
          <li>Swap 0.00% + success fee mínima + yield 4x (Tier Alpha)</li>
          <li>Libera a aba ARBITRAGE (The Spear)</li>
        </ol>
      </div>
    </div>
  );
}
