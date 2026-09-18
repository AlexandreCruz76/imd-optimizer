"use client";

import { useState, useEffect } from "react";

interface WalletStatus {
  hasMetaMask: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  error: string | null;
}

export default function WalletTest() {
  const [status, setStatus] = useState<WalletStatus>({
    hasMetaMask: false,
    isConnected: false,
    address: null,
    chainId: null,
    balance: "0",
    error: null,
  });

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;
    setStatus((prev) => ({ ...prev, hasMetaMask }));

    if (hasMetaMask) {
      try {
        const accounts = await window.ethereum!.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          const chain = await window.ethereum!.request({
            method: "eth_chainId",
          });
          const bal = await window.ethereum!.request({
            method: "eth_getBalance",
            params: [accounts[0], "latest"],
          });

          setStatus({
            hasMetaMask: true,
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chain as string, 16),
            balance: (parseInt(bal as string, 16) / 1e18).toFixed(4),
            error: null,
          });
        }
      } catch (err) {
        setStatus((prev) => ({
          ...prev,
          error: String(err),
        }));
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus((prev) => ({
        ...prev,
        error: "MetaMask not installed",
      }));
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chain = await window.ethereum.request({
        method: "eth_chainId",
      });
      const bal = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });

      setStatus({
        hasMetaMask: true,
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chain as string, 16),
        balance: (parseInt(bal as string, 16) / 1e18).toFixed(4),
        error: null,
      });
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        error: String(err),
      }));
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ WALLET TEST ────────────────────────────────────────────────────────┐
      </h1>

      {/* Status */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ WALLET STATUS
        </div>
        <div className="space-y-2">
          <Row
            label="METAMASK"
            value={status.hasMetaMask ? "INSTALLED ✓" : "NOT INSTALLED ✗"}
            color={status.hasMetaMask ? "#00ff41" : "#ff0040"}
          />
          <Row
            label="CONNECTED"
            value={status.isConnected ? "YES ✓" : "NO ✗"}
            color={status.isConnected ? "#00ff41" : "#ff0040"}
          />
          {status.isConnected && (
            <>
              <Row label="ADDRESS" value={status.address || "-"} />
              <Row label="CHAIN" value={status.chainId === 1 ? "MAINNET" : `CHAIN ${status.chainId}`} />
              <Row label="BALANCE" value={`${status.balance} ETH`} />
            </>
          )}
          {status.error && (
            <Row label="ERROR" value={status.error} color="#ff0040" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ ACTIONS
        </div>
        <div className="space-y-3">
          {!status.hasMetaMask && (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#ffb000] text-[#0a0a0a] px-4 py-2 text-xs font-bold tracking-wider text-center hover:bg-[#cc8c00]"
            >
              INSTALL METAMASK
            </a>
          )}
          {status.hasMetaMask && !status.isConnected && (
            <button
              onClick={connectWallet}
              className="bg-[#00ff41] text-[#0a0a0a] px-4 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]"
            >
              CONNECT WALLET
            </button>
          )}
          {status.isConnected && (
            <button
              onClick={() => window.location.reload()}
              className="bg-[#ff0040] text-[#fff] px-4 py-2 text-xs font-bold tracking-wider hover:bg-[#cc0033]"
            >
              DISCONNECT (Refresh)
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ INSTRUCTIONS
        </div>
        <div className="text-xs text-[#00ff4170] space-y-1">
          <p>1. Install MetaMask browser extension</p>
          <p>2. Create or import a wallet</p>
          <p>3. Switch to Ethereum Mainnet</p>
          <p>4. Click "CONNECT WALLET" above</p>
          <p>5. Approve the connection in MetaMask</p>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#00ff4150]">{label}</span>
      <span style={{ color: color || "#00ff41" }}>{value}</span>
    </div>
  );
}
