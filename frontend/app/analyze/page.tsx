"use client";

import { useState } from "react";

interface AnalysisResult {
  recommendation: string;
  confidence: string;
  optimalRange: string;
  projectedAPY: string;
  weeklyFees: string;
  riskScore: string;
  risks: string[];
  entrySignal: string;
  exitSignal: string;
}

export default function Analyze() {
  const [ethAmount, setEthAmount] = useState("10");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function runAnalysis() {
    setAnalyzing(true);
    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 1500));

    const eth = parseFloat(ethAmount);
    const hookShare = 0.105;
    const volume24h = 14.2;
    const fee = 0.01;

    const shareOfPool = eth / (28.47 + eth);
    const dailyFees = volume24h * fee * shareOfPool;
    const weeklyFees = dailyFees * 7;
    const annualFees = dailyFees * 365;
    const apy = (annualFees / eth) * 100;

    setResult({
      recommendation: apy > 5 ? "OPEN POSITION" : "WAIT",
      confidence: apy > 15 ? "HIGH" : apy > 5 ? "MEDIUM" : "LOW",
      optimalRange: `${(eth * 0.5).toFixed(1)} - ${(eth * 2).toFixed(1)} ETH`,
      projectedAPY: apy.toFixed(1),
      weeklyFees: weeklyFees.toFixed(4),
      riskScore: apy > 20 ? "3/10" : apy > 10 ? "2/10" : "1/10",
      risks: [
        "IMD price volatility",
        "Cap headroom depletion",
        "Competition from native pool LPs",
        "Burn decay schedule",
      ],
      entrySignal: shareOfPool < 0.15 ? "SIGNAL ACTIVE" : "OVERSATURATED",
      exitSignal: "Monitor cap utilization > 90%",
    });

    setAnalyzing(false);
  }

  return (
    <div className="space-y-4 fade-in">
      <h1 className="text-lg glow-strong tracking-wider">
        ┌─ ANALYZE ────────────────────────────────────────────────────────────┐
      </h1>

      {/* Input */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ LP POSITION SIMULATOR
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00ff4150]">ETH AMOUNT:</span>
          <input
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="bg-[#0a0a0a] border border-[#00ff4130] text-[#00ff41] px-3 py-1 text-xs w-32 focus:outline-none focus:border-[#00ff41] glow"
            min="0.1"
            step="0.1"
          />
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-[#00ff41] text-[#0a0a0a] px-4 py-1 text-xs font-bold tracking-wider hover:bg-[#00cc33] transition-colors disabled:opacity-50"
          >
            {analyzing ? "ANALYZING..." : "RUN ANALYSIS"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 fade-in">
          {/* Recommendation */}
          <div
            className={`terminal-panel p-4 border-glow ${
              result.recommendation === "OPEN POSITION"
                ? "border-[#00ff41]"
                : "border-[#ffb000]"
            }`}
          >
            <div className="text-xs text-[#00ff4160] mb-2 tracking-widest">
              ▸ RECOMMENDATION
            </div>
            <div
              className={`text-2xl font-bold tracking-wider ${
                result.recommendation === "OPEN POSITION"
                  ? "text-[#00ff41] glow-strong"
                  : "text-[#ffb000]"
              }`}
            >
              {result.recommendation}
            </div>
            <div className="text-xs text-[#00ff4150] mt-1">
              CONFIDENCE: {result.confidence} │ RISK: {result.riskScore}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <MetricCard
              label="PROJECTED APY"
              value={`${result.projectedAPY}%`}
              color={parseFloat(result.projectedAPY) > 10 ? "#00ff41" : "#ffb000"}
            />
            <MetricCard
              label="WEEKLY FEES"
              value={`${result.weeklyFees} ETH`}
              color="#00ff41"
            />
            <MetricCard
              label="OPTIMAL RANGE"
              value={result.optimalRange}
              color="#00ff41"
            />
            <MetricCard
              label="ENTRY SIGNAL"
              value={result.entrySignal}
              color={result.entrySignal === "SIGNAL ACTIVE" ? "#00ff41" : "#ff0040"}
            />
          </div>

          {/* Risks */}
          <div className="terminal-panel p-4 border-glow">
            <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
              ▸ RISK FACTORS
            </div>
            <div className="space-y-1">
              {result.risks.map((risk, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-[#ffb000]">⚠</span>
                  <span className="text-[#00ff4170]">{risk}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-[#00ff4150]">
              EXIT STRATEGY: {result.exitSignal}
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

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="terminal-panel p-3 border-glow">
      <div className="text-xs text-[#00ff4140] mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color, textShadow: `0 0 5px ${color}40` }}>
        {value}
      </div>
    </div>
  );
}
