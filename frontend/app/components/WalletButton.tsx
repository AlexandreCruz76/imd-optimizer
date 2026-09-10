"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./WalletProvider";

export function WalletButton() {
  const { address, balance, connected, connecting, connect, disconnect, chainId } = useWallet();
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && !!window.ethereum);
  }, []);

  if (connecting) {
    return (
      <button className="bg-[#00ff4120] text-[#00ff4160] px-3 py-1 text-xs border border-[#00ff4130]">
        CONNECTING...
      </button>
    );
  }

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-1 ${
          chainId === 1 ? "text-[#00ff41]" : "text-[#ff0040]"
        }`}>
          {chainId === 1 ? "MAINNET" : chainId ? `CHAIN ${chainId}` : "UNKNOWN"}
        </span>
        <span className="text-xs text-[#00ff4160]">{balance} ETH</span>
        <button
          onClick={disconnect}
          className="bg-[#ff004020] text-[#ff0040] px-2 py-1 text-xs border border-[#ff004030] hover:bg-[#ff004030]"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    );
  }

  // MetaMask not installed
  if (hasMetaMask === false) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#ffb000] text-[#0a0a0a] px-3 py-1 text-xs font-bold tracking-wider hover:bg-[#cc8c00]"
      >
        INSTALL METAMASK
      </a>
    );
  }

  return (
    <button
      onClick={connect}
      className="bg-[#00ff41] text-[#0a0a0a] px-3 py-1 text-xs font-bold tracking-wider hover:bg-[#00cc33] transition-colors"
    >
      CONNECT WALLET
    </button>
  );
}
