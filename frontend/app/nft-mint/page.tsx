"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../components/WalletProvider";

// DEC-020: Buildercoin NFT — 501 supply, 0.05 ETH, Tier 1 (Alpha)
const MAX_SUPPLY = 501;
const GENESIS_ABI = [
  "function mintGenesis() payable",
  "function mintBacker() payable",
  "function totalSupply() view returns (uint256)",
];

interface KeyInfo {
  tokenId?: number;
  tier: string;
  mintedAt: number;
  totalMEVReceived: string;
  active: boolean;
}

interface MintStatus {
  deployed: boolean;
  mintOpen: boolean;
  totalMinted: number;
  maxSupply: number;
  genesisPrice: string;
  backerPrice: string;
  targetRaise: string;
}

const DEFAULT_STATUS: MintStatus = {
  deployed: false,
  mintOpen: false,
  totalMinted: 0,
  maxSupply: MAX_SUPPLY,
  genesisPrice: "0.05",
  backerPrice: "1.0",
  targetRaise: "25.05 ETH",
};

export default function NFTMintPage() {
  const { connected, address, chainId, signer } = useWallet();
  const [status, setStatus] = useState<MintStatus>(DEFAULT_STATUS);
  const [genesisAddr, setGenesisAddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [userKeys, setUserKeys] = useState<KeyInfo[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMintStatus();
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => setGenesisAddr(j.genesisKey || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (connected && address) {
      fetchUserKeys();
    }
  }, [connected, address]);

  async function fetchMintStatus() {
    try {
      const res = await fetch("/api/nft/status");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus({ ...DEFAULT_STATUS, ...data });
    } catch {
      setError("Failed to load mint status");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserKeys() {
    if (!address) return;
    try {
      const res = await fetch(`/api/nft/keys?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setUserKeys(data.keys || []);
      }
    } catch {
      console.error("Failed to fetch user keys");
    }
  }

  // Mint REAL na chain (client-side via carteira) — sem tx mock
  async function mintKey(kind: "GENESIS" | "BACKER") {
    if (!signer || !genesisAddr) {
      setError("Conecte a carteira Sepolia e configure GENESIS_KEY_ADDRESS");
      return;
    }
    setMinting(true);
    setError(null);
    setTxHash(null);
    try {
      const contract = new ethers.Contract(genesisAddr, GENESIS_ABI, signer);
      const value = ethers.parseEther(
        kind === "GENESIS" ? status.genesisPrice : status.backerPrice
      );
      const tx =
        kind === "GENESIS"
          ? await contract.mintGenesis({ value })
          : await contract.mintBacker({ value });
      setTxHash(tx.hash as string);
      await tx.wait();
      setTimeout(() => {
        fetchMintStatus();
        fetchUserKeys();
      }, 2000);
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage || e.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  const isSepolia = chainId === 11155111;
  const canMint =
    status.mintOpen && status.deployed && connected && isSepolia && !minting;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading NFT status...
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Title */}
      <div className="flex items-center gap-3 mb-4">
        <img src="/pepe/profile.jpeg" alt="Genesis" className="w-10 h-10 rounded-full border border-[#00ff41]" />
        <div>
          <h1 className="text-base md:text-lg glow-strong tracking-wider">
            ┌─ OPTIMIZER GENESIS KEY ──────────────────────────────────────────────┐
          </h1>
          <div className="text-[10px] md:text-xs text-[#00ff4140]">
            ERC-721 — 501 Supply · 0.05 ETH · Tier 1 (Alpha)
          </div>
        </div>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Connect your wallet to mint a Buildercoin Key
          </div>
        </div>
      )}

      {/* Contracts warning */}
      {connected && !status.deployed && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠ Contrato GenesisKey ainda não deployado — configure
            GENESIS_KEY_ADDRESS no .env
          </div>
        </div>
      )}

      {connected && status.deployed && !isSepolia && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠ Mint disponível apenas na Sepolia Testnet
          </div>
        </div>
      )}

      {/* Mint status */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ MINT STATUS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-[#00ff4140]">STATUS</div>
            <div className={status.mintOpen ? "text-[#00ff41] glow" : "text-[#ff0040]"}>
              {status.mintOpen ? "● OPEN" : "● CLOSED"}
            </div>
          </div>
          <div>
            <div className="text-[#00ff4140]">MINTED</div>
            <div className="text-[#00ff41]">{status.totalMinted} / {status.maxSupply}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">REMAINING</div>
            <div className="text-[#00ff41]">{Math.max(0, status.maxSupply - status.totalMinted)}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">TARGET</div>
            <div className="text-[#00ff41]">{status.targetRaise}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-[#00ff4140] mb-1">SUPPLY</div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill bg-[#00ff41]"
              style={{ width: `${(status.totalMinted / status.maxSupply) * 100}%` }}
            />
          </div>
          <div className="text-xs text-[#00ff4150] mt-1">
            {((status.totalMinted / status.maxSupply) * 100).toFixed(1)}% sold
          </div>
        </div>
      </div>

      {/* Transparência 40/40/20 (front_final §2) */}
      <div className="terminal-panel p-4 border border-[#00ff41]/40">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ USO DOS FUNDOS (TRANSPARÊNCIA)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2 bg-[#00ff4105] border border-[#00ff41]/20">
            <div className="text-[#00ff41] font-bold">40% Core Team</div>
            <div className="text-[#00ff4160]">Codeming — dev, auditoria e manutenção</div>
          </div>
          <div className="p-2 bg-[#00ff4105] border border-[#00ff41]/20">
            <div className="text-[#00ff41] font-bold">40% Infra & Security</div>
            <div className="text-[#00ff4160]">RPCs, monitoramento, bug bounty e testes</div>
          </div>
          <div className="p-2 bg-[#00ff4105] border border-[#00ff41]/20">
            <div className="text-[#00ff41] font-bold">20% Growth & Bounties</div>
            <div className="text-[#00ff4160]">Liquidez, parcerias e incentivos da comunidade</div>
          </div>
        </div>
        <div className="text-xs text-[#00ff4150] mt-3">
          Alvo máximo: {status.maxSupply} × {status.genesisPrice} ETH ={" "}
          {status.targetRaise} (Genesis) · Backer 1 ETH cada · sem venda de token — só o NFT
        </div>
      </div>

      {/* Mint cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Genesis Key */}
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ GENESIS KEY · TIER 1 (ALPHA)
          </div>
          <div className="space-y-3">
            <div className="text-xs text-[#00ff4160]">
              Supply: {status.maxSupply} keys · {status.genesisPrice} ETH
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-[#00ff41]">✓ 0.00% de taxa no swap (Tier Alpha)</div>
              <div className="text-[#00ff41]">✓ Success Fee 5% — só sobre o lucro de arbitragem</div>
              <div className="text-[#00ff41]">✓ 4x de yield no Builder Staking</div>
              <div className="text-[#00ff41]">✓ Acesso prioritário B2B</div>
            </div>
            <button
              onClick={() => mintKey("GENESIS")}
              disabled={!canMint}
              className={`w-full py-2 text-xs tracking-wider font-bold ${
                canMint
                  ? "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]"
                  : "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
              }`}
            >
              {minting ? "MINTING..." : `MINT GENESIS · ${status.genesisPrice} ETH`}
            </button>
          </div>
        </div>

        {/* Backer Key */}
        <div className="terminal-panel p-4 border-glow border-[#ffb000]">
          <div className="text-xs text-[#ffb00060] mb-3 tracking-widest">
            ▸ BACKER KEY (PRIORITY)
          </div>
          <div className="space-y-3">
            <div className="text-xs text-[#00ff4160]">
              Mesma pool de {status.maxSupply} · {status.backerPrice} ETH
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-[#ffb000]">✓ Tudo do Genesis Key (Tier 1 Alpha)</div>
              <div className="text-[#ffb000]">✓ Acesso prioritário a novos pools</div>
              <div className="text-[#ffb000]">✓ Weight maior na governança</div>
              <div className="text-[#ffb000]">✓ Badge &quot;BACKER&quot; na comunidade</div>
            </div>
            <button
              onClick={() => mintKey("BACKER")}
              disabled={!canMint}
              className={`w-full py-2 text-xs tracking-wider font-bold ${
                canMint
                  ? "bg-[#ffb000] text-[#0a0a0a] hover:bg-[#cc8800]"
                  : "bg-[#ffb00020] text-[#ffb00040] cursor-not-allowed"
              }`}
            >
              {minting ? "MINTING..." : `MINT BACKER · ${status.backerPrice} ETH`}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction hash */}
      {txHash && (
        <div className="terminal-panel p-3 border border-[#00ff41]">
          <div className="text-xs text-[#00ff41]">
            ✅ Transaction submitted: {txHash.slice(0, 20)}...
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            View on Sepolia Etherscan →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="terminal-panel p-3 border border-[#ff0040]">
          <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
        </div>
      )}

      {/* User keys */}
      {connected && userKeys.length > 0 && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ YOUR KEYS ({userKeys.length})
          </div>
          <div className="space-y-2">
            {userKeys.map((key, i) => (
              <div key={i} className="flex justify-between text-xs p-2 bg-[#00ff4105]">
                <span className="text-[#00ff41]">Key #{key.tokenId ?? i + 1}</span>
                <span className="text-[#00ff4160]">Tier: {key.tier}</span>
                <span className="text-[#00ff4160]">
                  MEV: {key.totalMEVReceived} ETH
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>

      {/* How it works */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW IT WORKS
        </div>
        <div className="space-y-2 text-xs text-[#00ff4160]">
          <div>1. Connect wallet (Sepolia Testnet)</div>
          <div>2. Choose Genesis ({status.genesisPrice} ETH) or Backer ({status.backerPrice} ETH)</div>
          <div>3. Sign transaction — mint real on-chain, sem intermediário</div>
          <div>4. Receive ERC-721 NFT in your wallet</div>
          <div>5. Tier 1 Alpha no router: 0.00% swap · 5% success · 4x yield</div>
          <div>6. Sua parte do MEV via claimMEV()</div>
        </div>
      </div>
    </div>
  );
}
