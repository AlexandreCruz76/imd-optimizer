"use client";

import Link from "next/link";
import { useWallet } from "./WalletProvider";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/swap", label: "Swap" },
  { href: "/pool", label: "Meta Hook Pool" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/staking", label: "Staking" },
];

export function Navbar() {
  const { connected, address, chainId, connect, disconnect } = useWallet();
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(
      () => setHasMetaMask(typeof window !== "undefined" && !!window.ethereum),
      0
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left: Brand with avatar.jpg */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#00F58C]/50 shadow-[0_0_12px_rgba(0,245,140,0.3)] bg-[#0D121A] flex-shrink-0">
              <img
                src="/images/avatar.jpg"
                alt="IMD Optimizer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white tracking-tight">IMD Optimizer</h1>
              <p className="text-xs text-[#6B7A88] tracking-wide">The Agentic V4 Meta-Hook</p>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#6B7A88] hover:text-[#00F58C] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#00F58C] after:scale-x-0 after:origin-center after:transition-transform hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Network Badge + $BLD Brand + Connect Wallet */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#6B7A88] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F58C] animate-pulse"></span>
              Sepolia
            </span>

            {/* $BLD Ecosystem Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-[#00F58C] animate-pulse"></span>
              <span className="font-mono text-xs font-semibold text-white tracking-wider">$BLD</span>
              <span className="text-[10px] text-slate-400 font-mono">ECOSYSTEM</span>
            </div>
            
            {hasMetaMask === false ? (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FFB000] text-[#05080A] font-semibold px-5 py-2 rounded-full hover:brightness-110 transition-all text-sm"
              >
                Install MetaMask
              </a>
            ) : connected && address ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#00F58C] px-2 py-1 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20">
                  {chainId === 11155111 ? "Sepolia" : chainId === 1 ? "Mainnet" : `Chain ${chainId}`}
                </span>
                <button
                  onClick={disconnect}
                  className="bg-white/[0.06] text-white font-semibold px-4 py-2 rounded-full hover:bg-white/[0.12] transition-all text-sm border border-white/[0.08]"
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={!hasMetaMask}
                className="bg-[#00F58C] text-[#05080A] font-semibold px-5 py-2 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}