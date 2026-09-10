"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../components/WalletProvider";
import { ethers } from "ethers";
import { SEPOLIA_CONFIG, VAULT_ABI } from "@/lib/contract-config";

interface LPSimulation {
  ethDeposit: number;
  imdRequired: number;
  totalValue: number;
  shareOfPool: number;
  dailyFees: number;
  weeklyFees: number;
  monthlyFees: number;
  annualFees: number;
  apy: number;
  impermanentLoss: number;
  breakEvenDays: number;
  burnReward: number;
}

interface PoolData {
  ethInPool: number;
  imdInPool: number;
  price: number;
  volume24h: number;
  nativeLiqETH: number;
  hookShare: number;
}

export default function LPSim() {
  const { connected, connect, chainId, signer } = useWallet();
  const [ethAmount, setEthAmount] = useState("0.1");
  const [duration, setDuration] = useState("30");
  const [sim, setSim] = useState<LPSimulation | null>(null);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real pool data
  useEffect(() => {
    async function fetchPoolData() {
      try {
        const res = await fetch("/api/pool-state");
        const data = await res.json();
        setPoolData({
          ethInPool: parseFloat(data.hookLiqETH) || 28.47,
          imdInPool: parseFloat(data.imdBalance) || 25662,
          price: parseFloat(data.price) || 984,
          volume24h: parseFloat(data.volume24h) || 14.2,
          nativeLiqETH: parseFloat(data.nativeLiqETH) || 230,
          hookShare: parseFloat(data.hookShare) || 9.9,
        });
      } catch (err) {
        // Fallback to defaults
        setPoolData({
          ethInPool: 28.47,
          imdInPool: 25662,
          price: 984,
          volume24h: 14.2,
          nativeLiqETH: 230,
          hookShare: 9.9,
        });
      }
    }
    fetchPoolData();
  }, []);

  function calculate() {
    const eth = parseFloat(ethAmount);
    const days = parseInt(duration);
    if (!poolData || isNaN(eth) || isNaN(days) || eth <= 0 || days <= 0) return;

    const { ethInPool, imdInPool, price, volume24h } = poolData;

    // Calculate IMD required for the pair (50/50 value)
    const imdRequired = eth * price;
    const totalValue = eth + (imdRequired / price); // Total in ETH terms

    // Share of pool
    const newPoolEth = ethInPool + eth;
    const share = eth / newPoolEth;

    // Daily fees from Hook Pool volume (1% fee)
    const hookVolumeDaily = volume24h * 0.10; // 10% goes to hook pool
    const dailyFees = hookVolumeDaily * 0.01 * share;

    // Burn rewards (extra yield from burning mechanism)
    const burnReward = dailyFees * 0.15; // ~15% extra from burn rewards

    const weeklyFees = dailyFees * 7;
    const monthlyFees = dailyFees * 30;
    const annualFees = (dailyFees + burnReward) * 365;
    const apy = (annualFees / eth) * 100;

    // Impermanent loss estimate
    const priceMove = 0.1;
    const il = (2 * Math.sqrt(1 + priceMove) / (1 + 1 + priceMove) - 1) * 100;

    const breakEven = eth / dailyFees;

    setSim({
      ethDeposit: eth,
      imdRequired,
      totalValue,
      shareOfPool: share * 100,
      dailyFees,
      weeklyFees,
      monthlyFees,
      annualFees,
      apy,
      impermanentLoss: Math.abs(il),
      breakEvenDays: breakEven,
      burnReward,
    });
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ LP SIMULATION ──────────────────────────────────────────────────────┐
      </h1>

      {/* Pool Info */}
      {poolData && (
        <div className="terminal-panel p-3 border border-[#00ff41]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#00ff4160]">HOOK POOL LIQ</div>
              <div className="text-[#00ff41]">{poolData.ethInPool.toFixed(2)} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">NATIVE POOL LIQ</div>
              <div className="text-[#ffb000]">{poolData.nativeLiqETH.toFixed(0)} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">VOLUME 24H</div>
              <div className="text-[#00ff41]">{poolData.volume24h.toFixed(2)} ETH</div>
            </div>
            <div>
              <div className="text-[#00ff4160]">IMD PRICE</div>
              <div className="text-[#00ff41]">{poolData.price.toFixed(0)} IMD/ETH</div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="terminal-panel p-3 border border-[#ffb000]">
        <div className="text-xs text-[#ffb000] text-center">
          ℹ️ LP requires BOTH tokens (ETH + IMD). Your stake goes to the <span className="text-[#00ff41]">Hook Pool</span>, not the Native Pool.
        </div>
      </div>

      {/* Input */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ POSITION PARAMETERS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#00ff4150] block mb-1">ETH DEPOSIT</label>
            <input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-1 text-xs w-full focus:outline-none focus:border-[#00ff41] glow"
              min="0.001"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-[#00ff4150] block mb-1">DURATION (DAYS)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-1 text-xs w-full focus:outline-none focus:border-[#00ff41] glow"
              min="1"
              max="365"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calculate}
              className="bg-[#00ff41] text-[#0a0a0a] px-6 py-1 text-xs font-bold tracking-wider hover:bg-[#00cc33] transition-colors w-full"
            >
              SIMULATE
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {sim && (
        <div className="space-y-4 fade-in">
          {/* Pair Required */}
          <div className="terminal-panel p-4 border-glow border-[#00d4ff]">
            <div className="text-xs text-[#00d4ff] mb-3 tracking-widest">
              ▸ REQUIRED PAIR (ETH + IMD)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[#00ff4140]">ETH SIDE</div>
                <div className="text-lg text-[#00ff41] glow">{sim.ethDeposit.toFixed(4)} ETH</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">IMD SIDE</div>
                <div className="text-lg text-[#ffb000] glow">{sim.imdRequired.toFixed(0)} IMD</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">TOTAL VALUE</div>
                <div className="text-lg text-[#00ff41] glow">{sim.totalValue.toFixed(4)} ETH</div>
              </div>
              <div>
                <div className="text-[#00ff4140]">POOL SHARE</div>
                <div className="text-lg text-[#00ff41] glow">{sim.shareOfPool.toFixed(4)}%</div>
              </div>
            </div>
          </div>

          {/* Where Stake Goes */}
          <div className="terminal-panel p-4 border-glow border-[#00d4ff]">
            <div className="text-xs text-[#00d4ff] mb-3 tracking-widest">
              ▸ WHERE YOUR STAKE GOES
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-[#00d4ff]">1.</span>
                <span>You provide ETH + IMD as liquidity</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00d4ff]">2.</span>
                <span>Liquidity enters the <span className="text-[#00ff41]">Hook Pool</span> (not Native Pool)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00d4ff]">3.</span>
                <span>You earn 1% fee on all Hook Pool swaps</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00d4ff]">4.</span>
                <span>You earn extra from token burns (burn rewards)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00d4ff]">5.</span>
                <span>Volume split: ~10% Hook Pool / ~90% Native Pool</span>
              </div>
            </div>
          </div>

          {/* Fee projections */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ FEE PROJECTIONS
            </div>
            <table className="terminal-table">
              <thead>
                <tr className="text-[#00ff4150] text-xs">
                  <th>PERIOD</th>
                  <th>LP FEES (ETH)</th>
                  <th>BURN REWARDS</th>
                  <th>TOTAL</th>
                  <th>USD (@$2500)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>DAILY</td>
                  <td className="text-[#00ff41]">{sim.dailyFees.toFixed(6)}</td>
                  <td className="text-[#ffb000]">{sim.burnReward.toFixed(6)}</td>
                  <td className="text-[#00ff41]">{(sim.dailyFees + sim.burnReward).toFixed(6)}</td>
                  <td className="text-[#00ff41]">${((sim.dailyFees + sim.burnReward) * 2500).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>WEEKLY</td>
                  <td className="text-[#00ff41]">{sim.weeklyFees.toFixed(6)}</td>
                  <td className="text-[#ffb000]">{(sim.burnReward * 7).toFixed(6)}</td>
                  <td className="text-[#00ff41]">{(sim.weeklyFees + sim.burnReward * 7).toFixed(6)}</td>
                  <td className="text-[#00ff41]">${((sim.weeklyFees + sim.burnReward * 7) * 2500).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>MONTHLY</td>
                  <td className="text-[#00ff41]">{sim.monthlyFees.toFixed(6)}</td>
                  <td className="text-[#ffb000]">{(sim.burnReward * 30).toFixed(6)}</td>
                  <td className="text-[#00ff41]">{(sim.monthlyFees + sim.burnReward * 30).toFixed(6)}</td>
                  <td className="text-[#00ff41]">${((sim.monthlyFees + sim.burnReward * 30) * 2500).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>ANNUAL</td>
                  <td className="text-[#00ff41] glow">{(sim.dailyFees * 365).toFixed(4)}</td>
                  <td className="text-[#ffb000] glow">{(sim.burnReward * 365).toFixed(4)}</td>
                  <td className="text-[#00ff41] glow">{sim.annualFees.toFixed(4)}</td>
                  <td className="text-[#00ff41] glow">${(sim.annualFees * 2500).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Risk assessment */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ RISK ASSESSMENT
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[#00ff4140] mb-1">PROJECTED APY</div>
                <div className={`text-lg ${sim.apy > 100 ? "text-[#00ff41] glow" : "text-[#ffb000]"}`}>
                  {sim.apy.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[#00ff4140] mb-1">IMPERMANENT LOSS (10% MOVE)</div>
                <div className="text-[#ffb000]">{sim.impermanentLoss.toFixed(2)}%</div>
                <div className="progress-bar mt-1">
                  <div
                    className="progress-bar-fill bg-[#ffb000]"
                    style={{ width: `${Math.min(sim.impermanentLoss * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[#00ff4140] mb-1">BREAK EVEN</div>
                <div className="text-lg text-[#00ff41] glow">
                  {sim.breakEvenDays.toFixed(0)} days
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
