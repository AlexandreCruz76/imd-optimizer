"use client";

import { useState, useEffect } from "react";

interface PoolData {
  hookAPY: string;
  nativeAPY: string;
  spreadAPY: string;
  hookTVL: string;
  nativeTVL: string;
}

interface MigrationStatus {
  status: string;
  contractAddress: string | null;
  message: string;
}

interface UserBalance {
  hook: string;
  native: string;
  total: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Migration() {
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [autoMigrate, setAutoMigrate] = useState(false);
  const [spreadThreshold, setSpreadThreshold] = useState("2.0");

  useEffect(() => {
    fetchData();
    checkWallet();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [poolRes, migrationRes] = await Promise.all([
        fetch("/api/pool-state"),
        fetch("/api/migration?action=status"),
      ]);

      if (poolRes.ok) {
        const pool = await poolRes.json();
        setPoolData(pool);
      }

      if (migrationRes.ok) {
        const migration = await migrationRes.json();
        setMigrationStatus(migration);
      }

      setError(null);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function checkWallet() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const chainIdHex = await window.ethereum.request({
            method: "eth_chainId",
          });
          setChainId(parseInt(chainIdHex, 16));
        }

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          setWalletAddress(accounts[0] || "");
        });

        window.ethereum.on("chainChanged", (chainIdHex: string) => {
          setChainId(parseInt(chainIdHex, 16));
        });
      } catch (err) {
        console.error("Wallet check failed:", err);
      }
    }
  }

  async function connectWallet() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        const chainIdHex = await window.ethereum.request({
          method: "eth_chainId",
        });
        setChainId(parseInt(chainIdHex, 16));
      } catch (err) {
        setError("Failed to connect wallet");
      }
    } else {
      setError("MetaMask not installed");
    }
  }

  async function executeMigration(direction: "toNative" | "toHook") {
    if (!walletAddress) {
      setError("Connect wallet first");
      return;
    }

    if (!migrationStatus?.contractAddress) {
      setError("MigrationRouter not deployed yet");
      return;
    }

    setTxPending(true);
    setTxHash("");
    setError(null);

    try {
      const spread = poolData ? Math.abs(parseFloat(poolData.spreadAPY)) : 0;

      // Prepare transaction data
      const res = await fetch("/api/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: direction === "toNative" ? "migrateToNative" : "migrateToHook",
          user: walletAddress,
          spreadAtMigration: spread,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Send transaction via MetaMask
      const txParams = {
        from: walletAddress,
        to: data.txData.to,
        value: data.txData.value === "0" ? "0x0" : `0x${BigInt(Math.round(parseFloat(data.txData.value) * 1e18)).toString(16)}`,
        data: data.txData.data,
        gas: "0x493E0", // 300000 gas
      };

      const txHashResult = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setTxHash(txHashResult);

      // Wait for confirmation
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHashResult],
        });
        if (receipt) {
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        fetchData(); // Refresh data
      }
    } catch (err: any) {
      setError(err.message || "Migration failed");
    } finally {
      setTxPending(false);
    }
  }

  async function depositToPool(pool: "hook" | "native") {
    if (!walletAddress) {
      setError("Connect wallet first");
      return;
    }

    if (!migrationStatus?.contractAddress) {
      setError("MigrationRouter not deployed yet");
      return;
    }

    setTxPending(true);
    setError(null);

    try {
      const res = await fetch("/api/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: pool === "hook" ? "depositToHook" : "depositToNative",
          user: walletAddress,
          amount: depositAmount,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const txParams = {
        from: walletAddress,
        to: data.txData.to,
        value: `0x${BigInt(Math.round(parseFloat(depositAmount) * 1e18)).toString(16)}`,
        data: data.txData.data,
        gas: "0x493E0",
      };

      const txHashResult = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setTxHash(txHashResult);

      // Wait for confirmation
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHashResult],
        });
        if (receipt) break;
      }

      fetchData();
    } catch (err: any) {
      setError(err.message || "Deposit failed");
    } finally {
      setTxPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#00ff4160]">
        <span className="cursor">█</span> Loading migration engine...
      </div>
    );
  }

  const hookAPY = poolData ? parseFloat(poolData.hookAPY) : 0;
  const nativeAPY = poolData ? parseFloat(poolData.nativeAPY) : 0;
  const spread = poolData ? parseFloat(poolData.spreadAPY) : 0;
  const hookWins = hookAPY > nativeAPY;
  const threshold = parseFloat(spreadThreshold);
  const shouldMigrate = Math.abs(spread) > threshold;
  const isSepolia = chainId === 11155111;

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ MIGRATION ENGINE ────────────────────────────────────────────────┐
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4140]">LIVE</span>
          <button
            onClick={fetchData}
            className="text-xs text-[#00ff4160] hover:text-[#00ff41]"
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* WALLET CONNECTION */}
      <div className="terminal-panel p-4 border-glow border-[#00ffff]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#00ffff60] tracking-widest mb-1">
              ▸ WALLET
            </div>
            {walletAddress ? (
              <div className="text-sm text-[#00ffff]">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                <span className={`ml-2 text-xs ${isSepolia ? 'text-[#00ff41]' : 'text-[#ff0040]'}`}>
                  ({isSepolia ? 'Sepolia' : chainId === 1 ? 'Mainnet' : `Chain ${chainId}`})
                </span>
              </div>
            ) : (
              <div className="text-sm text-[#00ff4160]">Not connected</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {migrationStatus?.contractAddress ? (
              <span className="text-xs bg-[#00ff41] text-[#0a0a0a] px-2 py-0.5">
                DEPLOYED
              </span>
            ) : (
              <span className="text-xs bg-[#ff004020] text-[#ff0040] px-2 py-0.5 border border-[#ff004030]">
                NOT DEPLOYED
              </span>
            )}
            {!walletAddress && (
              <button
                onClick={connectWallet}
                className="px-4 py-1 text-xs bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffffcc]"
              >
                CONNECT METAMASK
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CURRENT STATE */}
      {poolData && (
        <div className={`terminal-panel p-4 border glow ${shouldMigrate ? 'border-[#ffb000]' : 'border-[#00ff4130]'}`}>
          <div className="text-center">
            <div className="text-xs text-[#00ff4160] tracking-widest mb-2">
              ▸ MIGRATION STATUS
            </div>
            <div className={`text-2xl glow-strong font-bold ${shouldMigrate ? 'text-[#ffb000]' : 'text-[#00ff41]'}`}>
              {shouldMigrate
                ? `MIGRATE → ${hookWins ? 'HOOK' : 'NATIVE'}`
                : 'HOLD POSITION'}
            </div>
            <div className="text-sm text-[#00ff4160] mt-1">
              Spread: {spread >= 0 ? '+' : ''}{spread.toFixed(1)}%
              {shouldMigrate && (
                <span className="text-[#ffb000] ml-2">
                  (threshold: {threshold}%)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POOL COMPARISON + MIGRATION ACTIONS */}
      {poolData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hook Pool */}
          <div className={`terminal-panel p-4 border-glow ${hookWins ? 'border-[#00ff41]' : 'border-[#00ff4130]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#00ff41] tracking-widest">
                ▸ HOOK POOL
              </div>
              {hookWins && (
                <div className="text-xs bg-[#00ff41] text-[#0a0a0a] px-2 py-0.5">
                  WINNING
                </div>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <Row label="APY" value={`${hookAPY.toFixed(1)}%`} color="#00ff41" />
              <Row label="TVL" value={`$${Number(poolData.hookTVL).toLocaleString()}`} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[#00ff4160]">DEPOSIT AMOUNT (ETH)</div>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-2 text-sm"
              />
              <button
                onClick={() => depositToPool("hook")}
                disabled={txPending || !walletAddress}
                className="w-full px-4 py-2 text-xs bg-[#00ff41] text-[#0a0a0a] hover:bg-[#00ff41cc] disabled:opacity-50"
              >
                {txPending ? "PROCESSING..." : `DEPOSIT ${depositAmount} ETH → HOOK`}
              </button>
              {!hookWins && shouldMigrate && (
                <button
                  onClick={() => executeMigration("toHook")}
                  disabled={txPending || !walletAddress}
                  className="w-full px-4 py-2 text-xs bg-[#00ff4120] text-[#00ff41] border border-[#00ff4130] hover:bg-[#00ff4130] disabled:opacity-50"
                >
                  {txPending ? "MIGRATING..." : "MIGRATE ALL → HOOK"}
                </button>
              )}
            </div>
          </div>

          {/* Native Pool */}
          <div className={`terminal-panel p-4 border-glow ${!hookWins ? 'border-[#ff0040]' : 'border-[#ff004030]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#ff0040] tracking-widest">
                ▸ NATIVE POOL
              </div>
              {!hookWins && (
                <div className="text-xs bg-[#ff0040] text-[#fff] px-2 py-0.5">
                  WINNING
                </div>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <Row label="APY" value={`${nativeAPY.toFixed(1)}%`} color="#ff0040" />
              <Row label="TVL" value={`$${Number(poolData.nativeTVL).toLocaleString()}`} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[#ff004060]">DEPOSIT AMOUNT (ETH)</div>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full bg-[#0a0a0a] border border-[#ff004030] text-[#ff0040] px-3 py-2 text-sm"
              />
              <button
                onClick={() => depositToPool("native")}
                disabled={txPending || !walletAddress}
                className="w-full px-4 py-2 text-xs bg-[#ff0040] text-[#fff] hover:bg-[#ff0040cc] disabled:opacity-50"
              >
                {txPending ? "PROCESSING..." : `DEPOSIT ${depositAmount} ETH → NATIVE`}
              </button>
              {hookWins && shouldMigrate && (
                <button
                  onClick={() => executeMigration("toNative")}
                  disabled={txPending || !walletAddress}
                  className="w-full px-4 py-2 text-xs bg-[#ff004020] text-[#ff0040] border border-[#ff004030] hover:bg-[#ff004030] disabled:opacity-50"
                >
                  {txPending ? "MIGRATING..." : "MIGRATE ALL → NATIVE"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTO-MIGRATION SETTINGS */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="text-xs text-[#ffb00060] mb-3 tracking-widest">
          ▸ AUTO-MIGRATION SETTINGS
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#00ff4160] mb-1">SPREAD THRESHOLD (%)</div>
            <input
              type="number"
              value={spreadThreshold}
              onChange={(e) => setSpreadThreshold(e.target.value)}
              step="0.5"
              min="0.5"
              className="w-full bg-[#0a0a0a] border border-[#ffb00030] text-[#ffb000] px-3 py-2 text-sm"
            />
            <div className="text-xs text-[#00ff4140] mt-1">
              Migrate only when spread &gt; {threshold}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#00ff4160] mb-1">AUTO-MIGRATE</div>
            <button
              onClick={() => setAutoMigrate(!autoMigrate)}
              className={`w-full px-4 py-2 text-xs ${
                autoMigrate
                  ? 'bg-[#ffb000] text-[#0a0a0a]'
                  : 'bg-[#ffb00020] text-[#ffb000] border border-[#ffb00030]'
              }`}
            >
              {autoMigrate ? 'AUTO-MIGRATE: ON' : 'AUTO-MIGRATE: OFF'}
            </button>
            <div className="text-xs text-[#00ff4140] mt-1">
              {autoMigrate ? 'Will migrate when threshold reached' : 'Manual migration only'}
            </div>
          </div>
        </div>
      </div>

      {/* TX STATUS */}
      {txHash && (
        <div className="terminal-panel p-4 border-glow border-[#00ffff]">
          <div className="text-xs text-[#00ffff60] tracking-widest mb-2">
            ▸ TRANSACTION
          </div>
          <div className="text-sm text-[#00ffff] break-all">
            {txPending ? '⏳ Pending...' : '✅ Confirmed'}
          </div>
          <div className="text-xs text-[#00ff4140] mt-1 break-all">
            Hash: {txHash}
          </div>
          {chainId === 11155111 && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00ffff60] hover:text-[#00ffff] mt-2 inline-block"
            >
              View on Etherscan →
            </a>
          )}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="terminal-panel p-4 border-glow border-[#ff0040]">
          <div className="text-xs text-[#ff0040]">ERROR: {error}</div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ HOW MIGRATION WORKS
        </div>
        <div className="space-y-2 text-xs text-[#00ff4170]">
          <p>1. <span className="text-[#00ffff]">Deposit</span> ETH to Hook Pool or Native Pool</p>
          <p>2. <span className="text-[#00ffff]">Monitor</span> APY spread in real-time via The Graph</p>
          <p>3. <span className="text-[#00ffff]">Migrate</span> when spread exceeds threshold (atomic tx)</p>
          <p>4. <span className="text-[#00ffff]">Earn</span> highest available APY automatically</p>
          <p className="text-[#00ff4140]">• Migration is atomic: withdraw + deposit in one tx</p>
          <p className="text-[#00ff4140]">• Gas cost: ~200k gas (~$2-5 on Sepolia)</p>
          <p className="text-[#00ff4140]">• Profitable when spread savings &gt; gas cost</p>
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
