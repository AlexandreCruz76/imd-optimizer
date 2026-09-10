"use client";

import { useState, useEffect } from "react";

interface BurnEvent {
  id: string;
  block: number;
  ethSent: string;
  imdBurned: string;
  rewardClaimed: string;
  time: string;
}

interface BurnStats {
  totalBurned: string;
  totalRewards: string;
  burnRate: string;
  capUtilization: number;
  decaySchedule: string;
}

export default function Burns() {
  const [events, setEvents] = useState<BurnEvent[]>([]);
  const [stats, setStats] = useState<BurnStats | null>(null);

  useEffect(() => {
    setStats({
      totalBurned: "21,000",
      totalRewards: "3,700",
      burnRate: "~500 IMD/day",
      capUtilization: 78.5,
      decaySchedule: "3,000 IMD/day → floor 20,000",
    });
    setEvents(getMockBurns());
  }, []);

  function getMockBurns(): BurnEvent[] {
    return [
      { id: "1", block: 25930120, ethSent: "0.5234", imdBurned: "942", rewardClaimed: "165", time: "2h ago" },
      { id: "2", block: 25929980, ethSent: "1.2100", imdBurned: "2,178", rewardClaimed: "382", time: "4h ago" },
      { id: "3", block: 25929750, ethSent: "0.0891", imdBurned: "160", rewardClaimed: "28", time: "6h ago" },
      { id: "4", block: 25929500, ethSent: "0.3450", imdBurned: "621", rewardClaimed: "109", time: "8h ago" },
      { id: "5", block: 25929200, ethSent: "2.1000", imdBurned: "3,780", rewardClaimed: "662", time: "12h ago" },
      { id: "6", block: 25928800, ethSent: "0.1567", imdBurned: "282", rewardClaimed: "49", time: "18h ago" },
      { id: "7", block: 25928400, ethSent: "0.8900", imdBurned: "1,602", rewardClaimed: "281", time: "1d ago" },
      { id: "8", block: 25928000, ethSent: "1.4500", imdBurned: "2,610", rewardClaimed: "457", time: "1d ago" },
    ];
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ BURNS ──────────────────────────────────────────────────────────────┐
      </h1>

      {/* Stats */}
      {stats && (
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
            ▸ BURN STATISTICS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4140]">TOTAL BURNED</div>
              <div className="text-lg text-[#ff0040] glow">{stats.totalBurned}</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">TOTAL REWARDS</div>
              <div className="text-lg text-[#00ff41] glow">{stats.totalRewards}</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">BURN RATE</div>
              <div className="text-lg text-[#ffb000] glow">{stats.burnRate}</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">CAP UTIL</div>
              <div className="text-lg text-[#00ff41] glow">{stats.capUtilization}%</div>
            </div>
            <div>
              <div className="text-[#00ff4140]">DECAY</div>
              <div className="text-sm text-[#ffb000]">{stats.decaySchedule}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-[#ff0040]"
                style={{ width: `${stats.capUtilization}%` }}
              />
            </div>
            <div className="text-xs text-[#00ff4150] mt-1">
              CAP: 27,000 IMD │ FLOOR: 20,000 IMD
            </div>
          </div>
        </div>
      )}

      {/* Burn events */}
      <div className="terminal-panel p-4 border-glow overflow-x-auto">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ BURN EVENTS
        </div>
        <table className="terminal-table">
          <thead>
            <tr className="text-[#00ff4150] text-xs">
              <th>TIME</th>
              <th>BLOCK</th>
              <th>ETH SENT</th>
              <th>IMD BURNED</th>
              <th>REWARD</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="fade-in">
                <td className="text-[#00ff4160]">{event.time}</td>
                <td className="text-[#00ff4140]">{event.block}</td>
                <td className="text-[#00ff41]">{event.ethSent} ETH</td>
                <td className="text-[#ff0040]">{event.imdBurned} IMD</td>
                <td className="text-[#00ff41]">{event.rewardClaimed} IMD</td>
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
