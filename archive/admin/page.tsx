"use client";

import { useState } from "react";
import { useWallet } from "../components/WalletProvider";

interface ProtocolStats {
  totalCollected: number;
  pendingWithdraw: number;
  totalWithdrawn: number;
  totalAUM: number;
  subscriberCount: number;
  avgFee: number;
}

interface RecentFee {
  id: string;
  user: string;
  amount: string;
  tier: string;
  timestamp: string;
}

export default function Admin() {
  const { address, connected, connect, chainId } = useWallet();
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [fees, setFees] = useState<RecentFee[]>([]);

  useState(() => {
    // Mock data
    setStats({
      totalCollected: 2.45,
      pendingWithdraw: 0.87,
      totalWithdrawn: 1.58,
      totalAUM: 156.3,
      subscriberCount: 23,
      avgFee: 14.2,
    });

    setFees([
      { id: "1", user: "0x1234...5678", amount: "0.125", tier: "PRO", timestamp: "2h ago" },
      { id: "2", user: "0x8765...4321", amount: "0.089", tier: "BASIC", timestamp: "4h ago" },
      { id: "3", user: "0xabcd...ef01", amount: "0.234", tier: "WHALE", timestamp: "6h ago" },
      { id: "4", user: "0x1111...2222", amount: "0.045", tier: "FREE", timestamp: "8h ago" },
      { id: "5", user: "0x3333...4444", amount: "0.167", tier: "PRO", timestamp: "12h ago" },
    ]);
  });

  if (!connected || chainId !== 1) {
    return (
      <div className="space-y-4 fade-in">
        <h1 className="text-lg glow-strong tracking-wider">
          ┌─ ADMIN ─────────────────────────────────────────────────────────────┐
        </h1>
        <div className="terminal-panel p-8 border-glow text-center">
          <div className="text-[#00ff4160] mb-4">
            {!connected ? "Connect admin wallet" : "Switch to Mainnet"}
          </div>
          <button
            onClick={connect}
            className="bg-[#00ff41] text-[#0a0a0a] px-6 py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]"
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ ADMIN ─────────────────────────────────────────────────────────────┐
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ PROTOCOL FEES
            </div>
            <div className="space-y-2">
              <Row label="TOTAL COLLECTED" value={`${stats.totalCollected.toFixed(4)} ETH`} color="#00ff41" />
              <Row label="PENDING WITHDRAW" value={`${stats.pendingWithdraw.toFixed(4)} ETH`} color="#ffb000" />
              <Row label="TOTAL WITHDRAWN" value={`${stats.totalWithdrawn.toFixed(4)} ETH`} />
              <div className="mt-3 pt-3 border-t border-[#00ff4115]">
                <button className="bg-[#00ff41] text-[#0a0a0a] w-full py-2 text-xs font-bold tracking-wider hover:bg-[#00cc33]">
                  WITHDRAW FEES
                </button>
              </div>
            </div>
          </div>

          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ VAULT STATS
            </div>
            <div className="space-y-2">
              <Row label="TOTAL AUM" value={`${stats.totalAUM.toFixed(1)} ETH`} highlight />
              <Row label="SUBSCRIBERS" value={`${stats.subscriberCount}`} />
              <Row label="AVG FEE" value={`${stats.avgFee}%`} />
              <Row label="EST. ANNUAL REVENUE" value={`${(stats.totalAUM * 0.37 * stats.avgFee / 100).toFixed(2)} ETH`} color="#00ff41" />
            </div>
          </div>

          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ REVENUE PROJECTIONS
            </div>
            <div className="space-y-2">
              <Row label="MONTHLY" value={`${(stats.totalAUM * 0.37 * stats.avgFee / 100 / 12).toFixed(2)} ETH`} />
              <Row label="QUARTERLY" value={`${(stats.totalAUM * 0.37 * stats.avgFee / 100 / 4).toFixed(2)} ETH`} />
              <Row label="ANNUAL" value={`${(stats.totalAUM * 0.37 * stats.avgFee / 100).toFixed(2)} ETH`} color="#00ff41" />
              <div className="mt-3 pt-3 border-t border-[#00ff4115]">
                <div className="text-xs text-[#00ff4140]">AT $2000/ETH</div>
                <div className="text-lg text-[#00ff41] glow">
                  ${(stats.totalAUM * 0.37 * stats.avgFee / 100 * 2000).toFixed(0)}/year
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent fees */}
      <div className="terminal-panel p-4 border-glow overflow-x-auto">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ RECENT FEES COLLECTED
        </div>
        <table className="terminal-table">
          <thead>
            <tr className="text-[#00ff4150] text-xs">
              <th>USER</th>
              <th>AMOUNT</th>
              <th>TIER</th>
              <th>TIME</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.id} className="fade-in">
                <td className="text-[#00ff41]">{fee.user}</td>
                <td className="text-[#00ff41]">{fee.amount} ETH</td>
                <td>
                  <span className={`text-xs px-1 ${
                    fee.tier === "WHALE" ? "text-[#ffb000]" :
                    fee.tier === "PRO" ? "text-[#00ffff]" :
                    fee.tier === "BASIC" ? "text-[#00ff41]" :
                    "text-[#00ff4160]"
                  }`}>
                    {fee.tier}
                  </span>
                </td>
                <td className="text-[#00ff4160]">{fee.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#00ff4150]">{label}</span>
      <span
        className={highlight ? "glow" : ""}
        style={{ color: color || "#00ff41" }}
      >
        {value}
      </span>
    </div>
  );
}
