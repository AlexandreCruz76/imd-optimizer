"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

const GENESIS_PRICE_ETH = 0.5;
const BACKER_PRICE_ETH = 1.0;
const MAX_SUPPLY = 100;

interface KeyInfo {
  tier: string;
  mintedAt: number;
  totalMEVReceived: string;
  active: boolean;
}

export default function NFTMintPage() {
  const { connected, address, chainId } = useWallet();
  const [mintOpen, setMintOpen] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [userKeys, setUserKeys] = useState<KeyInfo[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMintStatus();
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
      setMintOpen(data.mintOpen);
      setTotalMinted(data.totalMinted);
    } catch (err) {
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
    } catch (err) {
      console.error("Failed to fetch user keys");
    }
  }

  async function mintGenesis() {
    setMinting(true);
    setError(null);
    try {
      const res = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "GENESIS", address }),
      });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setTimeout(() => {
          fetchMintStatus();
          fetchUserKeys();
        }, 5000);
      } else {
        setError(data.error || "Mint failed");
      }
    } catch (err: any) {
      setError(err.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  async function mintBacker() {
    setMinting(true);
    setError(null);
    try {
      const res = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "BACKER", address }),
      });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setTimeout(() => {
          fetchMintStatus();
          fetchUserKeys();
        }, 5000);
      } else {
        setError(data.error || "Mint failed");
      }
    } catch (err: any) {
      setError(err.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

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
          <div className="text-[10px] md:text-xs text-[#00ff4140]">ERC-721 — 200 Supply</div>
        </div>
      </div>

      {/* Wallet warning */}
      {!connected && (
        <div className="terminal-panel p-3 border border-[#ffb000]">
          <div className="text-xs text-[#ffb000] text-center">
            ⚠️ Connect your wallet to mint a Genesis Key
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
            <div className={mintOpen ? "text-[#00ff41] glow" : "text-[#ff0040]"}>
              {mintOpen ? "● OPEN" : "● CLOSED"}
            </div>
          </div>
          <div>
            <div className="text-[#00ff4140]">MINTED</div>
            <div className="text-[#00ff41]">{totalMinted} / {MAX_SUPPLY}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">REMAINING</div>
            <div className="text-[#00ff41]">{MAX_SUPPLY - totalMinted}</div>
          </div>
          <div>
            <div className="text-[#00ff4140]">TARGET</div>
            <div className="text-[#00ff41]">50-100 ETH</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-[#00ff4140] mb-1">SUPPLY</div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill bg-[#00ff41]"
              style={{ width: `${(totalMinted / MAX_SUPPLY) * 100}%` }}
            />
          </div>
          <div className="text-xs text-[#00ff4150] mt-1">
            {((totalMinted / MAX_SUPPLY) * 100).toFixed(1)}% sold
          </div>
        </div>
      </div>

      {/* Mint cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Genesis Key */}
        <div className="terminal-panel p-4 border-glow border-[#00ff41]">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ GENESIS KEY
          </div>
          <div className="space-y-3">
            <div className="text-2xl text-[#00ff41] glow">{GENESIS_PRICE_ETH} ETH</div>
            <div className="text-xs text-[#00ff4160]">Supply: 50 keys</div>
            <div className="space-y-2 text-xs">
              <div className="text-[#00ff41]">✓ Taxa ZERO no Optimizer router</div>
              <div className="text-[#00ff41]">✓ % do MEV capturado</div>
              <div className="text-[#00ff41]">✓ Acesso prioritário B2B</div>
              <div className="text-[#00ff41]">✓ Direitos de governança</div>
            </div>
            <button
              onClick={mintGenesis}
              disabled={!mintOpen || minting || !connected}
              className={`w-full py-2 text-xs tracking-wider font-bold ${
                mintOpen && !minting && connected
                  ? "bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00cc33]"
                  : "bg-[#00ff4120] text-[#00ff4140] cursor-not-allowed"
              }`}
            >
              {minting ? "MINTING..." : "MINT GENESIS (0.5 ETH)"}
            </button>
          </div>
        </div>

        {/* Backer Key */}
        <div className="terminal-panel p-4 border-glow border-[#ffb000]">
          <div className="text-xs text-[#ffb00060] mb-3 tracking-widest">
            ▸ BACKER KEY (PRIORITY)
          </div>
          <div className="space-y-3">
            <div className="text-2xl text-[#ffb000]">{BACKER_PRICE_ETH} ETH</div>
            <div className="text-xs text-[#00ff4160]">Supply: 50 keys</div>
            <div className="space-y-2 text-xs">
              <div className="text-[#ffb000]">✓ Tudo do Genesis Key</div>
              <div className="text-[#ffb000]">✓ Acesso prioritário a novos pools</div>
              <div className="text-[#ffb000]">✓ Weight maior na governança</div>
              <div className="text-[#ffb000]">✓ Badge "BACKER" no社区</div>
            </div>
            <button
              onClick={mintBacker}
              disabled={!mintOpen || minting || !connected}
              className={`w-full py-2 text-xs tracking-wider font-bold ${
                mintOpen && !minting && connected
                  ? "bg-[#ffb000] text-[#0a0a0a] hover:bg-[#cc8800]"
                  : "bg-[#ffb00020] text-[#ffb00040] cursor-not-allowed"
              }`}
            >
              {minting ? "MINTING..." : "MINT BACKER (1 ETH)"}
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
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            View on Etherscan →
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
                <span className="text-[#00ff41]">Key #{i + 1}</span>
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
          <div>1. Connect wallet (Mainnet)</div>
          <div>2. Choose Genesis (0.5 ETH) or Backer (1 ETH)</div>
          <div>3. Sign transaction</div>
          <div>4. Receive ERC-721 NFT in your wallet</div>
          <div>5. Use NFT on Optimizer router for ZERO fees</div>
          <div>6. Receive MEV revenue share automatically</div>
        </div>
      </div>
    </div>
  );
}
