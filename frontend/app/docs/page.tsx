"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";

export default function DocsPage() {
  const { connected, address } = useWallet();
  const [whitepaper, setWhitepaper] = useState<
    | { title: string; content: string }[]
    | null
  >(null);
  const [contracts, setContracts] = useState<
    | { name: string; address: string }[]
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWhitepaper([
      { title: "Protocol Overview", content: "IMD Optimizer is a V4 Meta-Hook protocol designed to maximize capital efficiency through MEV capture, elastic token burns, and tiered fee structures. The protocol operates on Uniswap V4 Singleton architecture with custom hooks for enhanced performance." },
      { title: "Token Economics", content: "$IMD supply is dynamically adjusted based on swap volume and tier participation. Four tiers exist: Genesis (0% fee), Alpha (0.1% fee), Holder (10% fee), and Retail (20% fee). Burn mechanics permanently reduce supply based on transaction volume." },
      { title: "Meta-Hook Architecture", content: "The V4 Singleton Meta-Hook enables private mempool integration, back-swap MEV capture, and capped burn operations. Hooks manage liquidity allocation, fee distribution, and burn execution in a single atomic operation." },
      { title: "Governance", content: "Token holders participate in protocol upgrades via on-chain voting. Key parameters (fee tiers, burn rates, bonus APY) are governed by DAO consensus with timelock execution." },
    ]);

    setContracts([
      { name: "IMD Token", address: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7" },
      { name: "Buildercoin", address: "0x22ec88b9ff78c6f2458ab1a7aa8bb99d84bd4b86" },
      { name: "Uniswap V4 Singleton", address: "0x0000000000000000000000000000000000000001" },
      { name: "Meta-Hook Router", address: "0xA1b2c3d4e5f6789012345678901234567890abcdef" },
      { name: "GenesisKeyController", address: "0xB2c3d4e5f6789012345678901234567890abcdef12" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tick">Whitepaper Técnico</h1>
          <p className="text-[var(--color-muted)] mt-4">IMD Optimizer V4 Meta-Hook Protocol</p>
        </div>

        {/* Whitepaper Cards */}
        {whitepaper && whitepaper.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {whitepaper.map((section, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-3xl border border-[var(--color-border-subtle)] backdrop-blur-sm hover:shadow-2xl transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-emerald)] to-[var(--color-accent-cyan)] flex items-center justify-center text-[var(--color-background)] text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-lg font-medium text-[var(--color-foreground)]">{section.title}</div>
                  </div>
                </div>
                <div className="text-sm text-[#00ff4160] leading-relaxed">{section.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sepolia Contract Addresses */}
        {contracts && contracts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest">Sepolia Contract Addresses</h2>
            <div className="grid grid-cols-2 gap-4">
              {contracts.map((contract, index) => (
                <div
                  key={index}
                  className="glass-card p-4 rounded-2xl border border-[var(--color-border-subtle)] backdrop-blur-sm"
                >
                  <div className="text-sm font-medium text-[var(--color-foreground)]">{contract.name}</div>
                  <code className="word-break break-all text-xs mt-2">{contract.address}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protocol Roadmap */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest">Roadmap</h2>
          <div className="space-y-3 text-sm text-[#00ff4160]">
            <div>• Q4 2024: V4 Singleton deployment & Meta-Hook launch</div>
            <div>• Q1 2025: Tier system & Burn mechanics v1</div>
            <div>• Q2 2025: Genesis Key ERC-721 minting</div>
            <div>• Q3 2025: Staking v2 with compound APR</div>
            <div>• Q4 2025: Cross-chain expansion & V5 research</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="terminal-panel p-3 border border-[#ff0040]">
            <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
}