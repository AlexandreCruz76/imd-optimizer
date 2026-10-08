"use client";

import Link from "next/link";
import { useWallet } from "./WalletProvider";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";

export function Navbar() {
  const { connected, address, chainId, connecting, walletError, walletName, connect, disconnect } = useWallet();
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);
  const { open: sidebarOpen, toggle: toggleSidebar } = useSidebar();

  useEffect(() => {
    const t = setTimeout(
      () => setHasMetaMask(typeof window !== "undefined" && !!window.ethereum),
      0
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Sidebar toggle + Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden md:flex w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] items-center justify-center text-slate-400 hover:text-[#00F58C] hover:border-[#00F58C]/40 transition-colors flex-shrink-0"
          >
            <span
              className={`inline-block transition-transform duration-300 text-xs ${
                sidebarOpen ? "" : "rotate-180"
              }`}
            >
              ◀
            </span>
          </button>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#00F58C]/50 shadow-[0_0_12px_rgba(0,245,140,0.3)] bg-[#0D121A] flex-shrink-0">
              <img
                src="/images/avatar.jpg"
                alt="IMD Optimizer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-xl font-bold text-white tracking-tight truncate">IMD Optimizer</h1>
              <p className="text-xs text-[#6B7A88] tracking-wide truncate">The Agentic V4 Meta-Hook</p>
            </div>
          </Link>
        </div>

        {/* Right: Network + Wallet */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Single network badge */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#6B7A88] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F58C] animate-pulse"></span>
            {connected
              ? chainId === 11155111
                ? "Sepolia"
                : chainId === 1
                ? "Mainnet"
                : `Chain ${chainId}`
              : "Sepolia"}
          </span>

          {hasMetaMask === false ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FFB000] text-[#05080A] font-semibold px-4 md:px-5 py-2 rounded-full hover:brightness-110 transition-all text-sm"
            >
              Install MetaMask
            </a>
          ) : connected && address ? (
            <div className="flex items-center gap-2">
              <span
                className="bg-white/[0.06] text-white font-semibold px-3 py-2 rounded-full text-sm border border-white/[0.08] font-mono"
                title={address}
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button
                onClick={disconnect}
                title="Disconnect wallet from this site"
                className="text-xs text-rose-400 font-semibold px-3 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={!hasMetaMask || connecting}
              className="bg-[#00F58C] text-[#05080A] font-semibold px-4 md:px-5 py-2 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? `Opening ${walletName}…` : `Connect ${walletName}`}
            </button>
          )}
          {walletError && !connected && (
            <span
              hidden
              className="hidden lg:inline text-[11px] text-rose-400 max-w-[260px] truncate"
              title={walletError}
            >
              {walletError}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
