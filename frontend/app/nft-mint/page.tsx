"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

const MAX_SUPPLY = 100;

interface KeyInfo {
  tier: string;
  totalMEVReceived: string;
}

export default function NFTMintPage() {
  const { connected, address } = useWallet();
  const [mintOpen, setMintOpen] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [userKeys, setUserKeys] = useState<KeyInfo[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchMintStatus(); }, []);
  useEffect(() => { if (connected && address) fetchUserKeys(); }, [connected, address]);

  async function fetchMintStatus() {
    try {
      const res = await fetch("/api/nft/status");
      const data = await res.json();
      setMintOpen(data.mintOpen);
      setTotalMinted(data.totalMinted);
    } catch { setError("Failed to load mint status"); }
    finally { setLoading(false); }
  }

  async function fetchUserKeys() {
    if (!address) return;
    try {
      const res = await fetch(`/api/nft/keys?address=${address}`);
      const data = await res.json();
      setUserKeys(data.keys || []);
    } catch { console.error("Failed to fetch user keys"); }
  }

  async function mint(tier: "GENESIS" | "BACKER") {
    setMinting(true); setError(null);
    try {
      const res = await fetch("/api/nft/mint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier, address }) });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setTimeout(() => { fetchMintStatus(); fetchUserKeys(); }, 5000);
      } else setError(data.error || "Mint failed");
    } catch (err: any) { setError(err.message || "Mint failed"); }
    finally { setMinting(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-emerald-500/40 h-64 justify-center"><span className="animate-pulse">█</span> Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-emerald-500 bg-[#0D121A] flex items-center justify-center"><svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.429 15.429a12.062 12.062 0 00-1.429-5.714m-5.714 0a12.062 12.062 0 01-1.429 5.714m0 0a12.062 12.062 0 001.429 5.714m5.714-5.714a12.062 12.062 0 01-5.714 1.429m5.714 0a12.062 12.062 0 00-5.714-1.429m0 0a12.062 12.062 0 015.714-1.429"/></svg></div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Optimizer Genesis Key</h1>
          <p className="text-xs text-emerald-500/50">ERC-721 · {MAX_SUPPLY} Supply</p>
        </div>
      </header>

      {!connected && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-amber-400 text-sm">
          Connect wallet to mint
        </div>
      )}

      <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
        <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">MINT STATUS</div>
        <div className="grid grid-cols-4 gap-4 text-center mb-4">
          <div><div className="text-emerald-500/50 text-xs">STATUS</div><div className={mintOpen ? "text-emerald-400" : "text-red-400"}>{mintOpen ? "OPEN" : "CLOSED"}</div></div>
          <div><div className="text-emerald-500/50 text-xs">MINTED</div><div className="text-emerald-400">{totalMinted} / {MAX_SUPPLY}</div></div>
          <div><div className="text-emerald-500/50 text-xs">REMAINING</div><div className="text-emerald-400">{MAX_SUPPLY - totalMinted}</div></div>
          <div><div className="text-emerald-500/50 text-xs">TARGET</div><div className="text-emerald-400">50–100 ETH</div></div>
        </div>
        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(totalMinted / MAX_SUPPLY) * 100}%` }}></div>
        </div>
        <p className="text-xs text-emerald-500/40 text-center mt-1">{((totalMinted / MAX_SUPPLY) * 100).toFixed(1)}% sold</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">GENESIS KEY</div>
          <p className="text-xs text-emerald-500/50 mb-3">Supply: 50</p>
          <ul className="space-y-2 text-xs text-emerald-400 mb-4">
            <li>✓ Zero fees on Optimizer router</li>
            <li>✓ MEV revenue share</li>
            <li>✓ Priority B2B access</li>
            <li>✓ Governance rights</li>
          </ul>
          <button onClick={() => mint("GENESIS")} disabled={!mintOpen || minting || !connected} className={`w-full py-2.5 text-xs font-bold tracking-wider rounded-xl ${mintOpen && !minting && connected ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-emerald-500/10 text-emerald-500/40 cursor-not-allowed"}`}>
            {minting ? "MINTING…" : "MINT GENESIS"}
          </button>
        </div>

        <div className="bg-[#0B111A]/80 border border-amber-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-amber-500/60 tracking-widest font-mono mb-4">BACKER KEY</div>
          <p className="text-xs text-emerald-500/50 mb-3">Supply: 50</p>
          <ul className="space-y-2 text-xs text-amber-400 mb-4">
            <li>✓ All Genesis benefits</li>
            <li>✓ Priority pool access</li>
            <li>✓ Higher governance weight</li>
            <li>✓ "BACKER" badge</li>
          </ul>
          <button onClick={() => mint("BACKER")} disabled={!mintOpen || minting || !connected} className={`w-full py-2.5 text-xs font-bold tracking-wider rounded-xl ${mintOpen && !minting && connected ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-amber-500/10 text-amber-500/40 cursor-not-allowed"}`}>
            {minting ? "MINTING…" : "MINT BACKER"}
          </button>
        </div>
      </div>

      {txHash && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">
          ✅ Submitted: {txHash.slice(0, 20)}… <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">View</a>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">ERROR: {error}</div>
      )}

      {connected && userKeys.length > 0 && (
        <div className="bg-[#0B111A]/80 border border-emerald-500/20 rounded-2xl p-5">
          <div className="text-[10px] text-emerald-500/60 tracking-widest font-mono mb-4">YOUR KEYS ({userKeys.length})</div>
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
          <li>Connect wallet (Mainnet)</li>
          <li>Choose Genesis or Backer</li>
          <li>Sign transaction</li>
          <li>Receive ERC-721 NFT</li>
          <li>Use on Optimizer for zero fees</li>
          <li>Earn MEV revenue automatically</li>
        </ol>
      </div>
    </div>
  );
}