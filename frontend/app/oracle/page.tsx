"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

export default function GenesisKeyPage() {
  const { connected, address } = useWallet();
  const [supply, setSupply] = useState("200");
  const [minted, setMinted] = useState("0");
  const [remaining, setRemaining] = useState("200");
  const [benefits, setBenefits] = useState<
    | { name: string; description: string }[]
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBenefits([
      { name: "0% Fees Forever", description: "No transaction fees for key holders" },
      { name: "MEV Revenue Share", description: "Earn from MEV captured by optimizer" },
      { name: "Priority Access", description: "Early access to new features and pools" },
      { name: "Governance Weight", description: "Voting power in protocol decisions" },
    ]);
  }, []);

  async function handleMint() {
    if (!connected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/genesis-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, action: "mint" }),
      });
      const data = await res.json();

      if (data.success) {
        setMinted(data.minted || "1");
        setRemaining(data.remaining || "199");
      } else {
        setError(data.error || "Mint failed");
      }
    } catch (err: any) {
      setError(err.message || "Mint failed");
    } finally {
      setLoading(false);
    }
  }

  const mintButtonClassName = !loading && connected
    ? "bg-[#00F58C] text-[#0a0a0a] hover:bg-[#00CC33]"
    : "bg-[#00FF5820] text-[#00F58C40] cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tick">Genesis Key ERC-721</h1>
            <p className="text-[var(--color-muted)] mt-1">Limited emission keys with lifetime benefits</p>
          </div>
          <div className="text-right">
            <button onClick={handleMint} disabled={loading} className={mintButtonClassName}>
              {loading ? "MINTING..." : "Mint Key"}
            </button>
          </div>
        </div>

        {/* Supply Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Total Supply</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-emerald)]">{supply}</div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Minted</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-emerald)]">{minted}</div>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-muted)] mb-2 tracking-widest">Remaining</div>
            <div className="text-3xl font-semibold text-[var(--color-accent-cyan)]">{remaining}</div>
          </div>
        </div>

        {/* Benefits Cards */}
        {benefits && benefits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card p-5 rounded-2xl border border-[var(--color-border-subtle)] backdrop-blur-sm hover:translate-y-[-2px] transition-transform"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00F58C] to-[#00A35F] flex items-center justify-center text-[var(--color-background)] text-sm font-bold mb-3">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-[var(--color-foreground)]">{benefit.name}</div>
                <div className="text-[10px] text-[#00F58C60]">{benefit.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contract Addresses */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-accent-emerald)] font-bold mb-4 tracking-widest">Sepolia Contract Addresses</h2>
          <div className="space-y-3 text-sm text-[#00F58C60]">
            <div>
              <span className="font-medium text-[var(--color-foreground)]">GenesisKeyController:</span>
              <code className="word-break break-all text-xs">0xA1b2c3d4e5f6789012345678901234567890abcdef</code>
            </div>
            <div>
              <span className="font-medium text-[var(--color-foreground)]">ERC721Minter:</span>
              <code className="word-break break-all text-xs">0xB2c3d4e5f6789012345678901234567890abcdef12</code>
            </div>
            <div>
              <span className="font-medium text-[var(--color-foreground)]">FeeTreasury:</span>
              <code className="word-break break-all text-xs">0xC3d4e5f6789012345678901234567890abcdef123</code>
            </div>
            <div>
              <span className="font-medium text-[var(--color-foreground)]">BurnRouter:</span>
              <code className="word-break break-all text-xs">0xd4e5f6789012345678901234567890abcdef1234</code>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="terminal-panel p-3 border border-[#FB7185]">
            <div className="text-xs text-[#FB7185]">ERROR: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
}