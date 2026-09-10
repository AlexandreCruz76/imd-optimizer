#!/usr/bin/env node
/**
 * Hook Pool Optimizer - CLI Entry Point
 * 
 * Usage:
 *   node index.ts analyze [--eth 10] [--risk conservative|moderate|aggressive]
 *   node index.ts monitor
 *   node index.ts compare
 *   node index.ts state
 *   node index.ts fees [--hours 24]
 *   node index.ts burns [--hours 24]
 *   node index.ts volume [--hours 24]
 */

import { HookPoolOptimizer } from "./optimizer";
import { HookPoolAnalyzer } from "./hookPoolAnalyzer";
import { CONFIG } from "./config";

// ───────────────────────── Helpers ─────────────────────────
const n0 = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 0 });
const n2 = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const f = (x: number, d: number) => x.toFixed(d);
const pct = (x: number, d = 1) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(d)}%`;
const eth = (x: number) => `${f(x, 4)} ETH`;
const imd = (x: number) => `${n2(x)} IMD`;
const usd = (x: number, ethUsd: number | null) => ethUsd ? ` ($${n0(x * ethUsd)})` : "";
const ts = (s: number) => new Date(s * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";

const table = (rows: (string | number)[][], headers: string[]) => {
  const w = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (r: (string | number)[]) => "| " + r.map((v, i) => String(v).padEnd(w[i])).join(" | ") + " |";
  return [line(headers), "|" + w.map((x) => "-".repeat(x + 2)).join("|") + "|", ...rows.map(line)].join("\n");
};

const color = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

// ───────────────────────── Commands ─────────────────────────
async function cmdAnalyze(args: string[]) {
  const ethAmount = getArg(args, "--eth", "10");
  const risk = getArg(args, "--risk", "moderate") as "conservative" | "moderate" | "aggressive";
  
  console.log(color.bold("\n Hook Pool Optimizer - Analysis\n"));
  console.log(`Investment: ${ethAmount} ETH`);
  console.log(`Risk Profile: ${risk}\n`);

  const optimizer = new HookPoolOptimizer({
    investmentEth: parseFloat(ethAmount),
    riskTolerance: risk,
  });

  const result = await optimizer.optimize();

  // Display state
  const s = result.analysis.current;
  console.log(color.bold("Current Pool State"));
  console.log(table([
    ["Price", `${n0(s.price)} IMD/ETH`, s.imdUsd ? `$${s.imdUsd.toFixed(3)}/IMD` : ""],
    ["ETH in Pool", eth(s.ethInPool), `${s.hookLiquidityShare * 100}% of combined`],
    ["IMD in Pool", imd(s.imdInPool), `cap ${imd(s.inventoryCap)}`],
    ["Volume Share", `${(s.hookVolumeShare * 100).toFixed(1)}%`, "vs reference pool"],
    ["LP Fee", `${(s.lpFee * 100).toFixed(2)}%`, `reward share ${s.rewardShareBps / 100}%`],
    ["Retained ETH", eth(s.retainedEth), `threshold ${eth(s.rebalanceThreshold)}`],
    ["Total Burned", imd(s.totalBurned), ""],
    ["Total Rewarded", imd(s.totalRewarded), ""],
  ], ["Metric", "Value", "Note"]));

  // Display recommendation
  const r = result.recommendation;
  console.log(color.bold("\nRecommendation"));
  const actionColor = r.action === "add" ? color.green : r.action === "remove" ? color.red : color.yellow;
  console.log(`Action: ${actionColor(r.action.toUpperCase())}`);
  console.log(`Size: ${eth(r.size)}`);
  console.log(`Reason: ${r.reason}`);
  console.log(`Expected APY: ${(r.expectedApy * 100).toFixed(2)}%`);
  console.log(`Risk Level: ${r.riskLevel}`);

  // Display fee projections
  console.log(color.bold("\nFee Projections"));
  console.log(table(
    result.feeProjections.map((p) => [
      p.period,
      eth(p.fees),
      imd(p.rewards),
      eth(p.total),
      `${(p.apy * 100).toFixed(2)}%`,
    ]),
    ["Period", "Fees", "Rewards", "Total", "APY"]
  ));

  // Display performance metrics
  const m = result.performanceMetrics;
  console.log(color.bold("\nPerformance Metrics (30 days)"));
  console.log(table([
    ["Fees Earned", eth(m.totalFeesEarned)],
    ["Rewards Earned", imd(m.totalRewardsEarned)],
    ["Burns Contributed", imd(m.totalBurnsContributed)],
    ["Impermanent Loss", eth(m.impermanentLoss)],
    ["Net Return", eth(m.netReturn)],
    ["APY", `${(m.apy * 100).toFixed(2)}%`],
    ["vs Hold", eth(m.vsHold)],
  ], ["Metric", "Value"]));
}

async function cmdMonitor() {
  console.log(color.bold("\n Hook Pool Optimizer - Real-time Monitor\n"));

  const optimizer = new HookPoolOptimizer();
  const result = await optimizer.monitor();

  // Display alerts
  if (result.alerts.length > 0) {
    console.log(color.yellow("Alerts:"));
    result.alerts.forEach((a) => console.log(`  - ${a}`));
    console.log();
  }

  // Display metrics
  const s = result.state;
  console.log(color.bold("Pool Metrics"));
  console.log(table([
    ["Liquidity Share", `${(result.metrics.liquidityShare * 100).toFixed(1)}%`],
    ["Volume Share", `${(result.metrics.volumeShare * 100).toFixed(1)}%`],
    ["Current APY", `${(result.metrics.apy * 100).toFixed(2)}%`],
    ["Risk Score", `${result.metrics.riskScore.toFixed(0)}/100`],
    ["ETH in Pool", eth(s.ethInPool)],
    ["IMD in Pool", imd(s.imdInPool)],
    ["Retained ETH", eth(s.retainedEth)],
    ["Pending Rebalance", s.pendingRebalance ? "Yes" : "No"],
  ], ["Metric", "Value"]));
}

async function cmdCompare() {
  console.log(color.bold("\n Hook Pool Optimizer - Pool Comparison\n"));

  const optimizer = new HookPoolOptimizer();
  const result = await optimizer.comparePools();

  console.log(table([
    ["ETH Liquidity", eth(result.hook.eth), `~${n0(result.reference.eth)} liquidity`],
    ["Volume Share", `${(result.hook.share * 100).toFixed(1)}%`, `${(result.reference.share * 100).toFixed(1)}%`],
    ["Estimated APY", `${(result.hook.apy * 100).toFixed(2)}%`, `${(result.reference.apy * 100).toFixed(2)}%`],
    ["Burns & Rewards", "Yes", "No"],
    ["Backstop", "Yes", "No"],
  ], ["Metric", "Hook Pool", "Reference Pool"]));

  console.log(`\nRecommendation: ${color.cyan(result.recommendation)}`);
}

async function cmdState() {
  console.log(color.bold("\n Hook Pool Optimizer - Pool State\n"));

  const analyzer = new HookPoolAnalyzer();
  const state = await analyzer.getPoolState();

  console.log(table([
    ["Block", state.block],
    ["Price", `${n0(state.price)} IMD/ETH`],
    ["IMD Price", state.imdUsd ? `$${state.imdUsd.toFixed(3)}` : "N/A"],
    ["ETH Price", state.ethUsd ? `$${n0(state.ethUsd)}` : "N/A"],
    ["ETH in Pool", eth(state.ethInPool)],
    ["IMD in Pool", imd(state.imdInPool)],
    ["Inventory Cap", imd(state.inventoryCap)],
    ["Cap Floor", imd(state.capFloor)],
    ["Cap Decay/Day", imd(state.capDecayPerDay)],
    ["Position Liquidity", state.positionLiquidity.toString()],
    ["Backstop Lower", state.backstopLower],
    ["Backstop Upper", state.backstopUpper],
    ["Backstop Principal", eth(state.backstopPrincipal)],
    ["Backstop Converted", eth(state.backstopConverted)],
    ["LP Fee", `${(state.lpFee * 100).toFixed(2)}%`],
    ["Reward Share", `${state.rewardShareBps / 100}%`],
    ["Fee Token Claims", imd(state.feeTokenClaims)],
    ["Fee ETH Claims", eth(state.feeEthClaims)],
    ["Total Burned", imd(state.totalBurned)],
    ["Total Rewarded", imd(state.totalRewarded)],
    ["Retained ETH", eth(state.retainedEth)],
    ["Rebalance Threshold", eth(state.rebalanceThreshold)],
    ["Pending Rebalance", state.pendingRebalance ? "Yes" : "No"],
    ["Rebalance Enabled", state.rebalanceEnabled ? "Yes" : "No"],
    ["Reference Tick", state.referenceTick],
    ["Hook Liquidity Share", `${(state.hookLiquidityShare * 100).toFixed(1)}%`],
  ], ["Metric", "Value"]));
}

async function cmdFees(args: string[]) {
  const hours = parseInt(getArg(args, "--hours", "24"));
  
  console.log(color.bold(`\n Hook Pool Optimizer - Fees (${hours}h)\n`));

  const analyzer = new HookPoolAnalyzer();
  const swaps = await analyzer.getSwapSummary(hours);

  console.log(table([
    ["Total Swaps", swaps.totalSwaps],
    ["Buys", swaps.buys, `${eth(swaps.buyEthIn)} in -> ${imd(swaps.buyImdOut)} out`],
    ["Sells", swaps.sells, `${imd(swaps.sellImdIn)} in -> ${eth(swaps.sellEthOut)} out`],
    ["Volume", "", eth(swaps.volumeEth)],
    ["Net ETH Flow", eth(swaps.netEthFlow), swaps.netEthFlow >= 0 ? "inflow" : "outflow"],
    ["Avg Swap Size", eth(swaps.avgSwapSizeEth)],
  ], ["Metric", "Count", "Detail"]));
}

async function cmdBurns(args: string[]) {
  const hours = parseInt(getArg(args, "--hours", "24"));
  
  console.log(color.bold(`\n Hook Pool Optimizer - Burns (${hours}h)\n`));

  const analyzer = new HookPoolAnalyzer();
  const trims = await analyzer.getTrimSummary(hours);

  console.log(table([
    ["Total Trims", trims.totalTrims],
    ["Burned", imd(trims.burned)],
    ["Rewarded", imd(trims.rewarded)],
    ["ETH Retained", eth(trims.ethRetained)],
    ["Avg Burn/Trim", imd(trims.avgBurnPerTrim)],
    ["Avg Reward/Trim", imd(trims.avgRewardPerTrim)],
  ], ["Metric", "Value"]));
}

async function cmdVolume(args: string[]) {
  const hours = parseInt(getArg(args, "--hours", "24"));
  
  console.log(color.bold(`\n Hook Pool Optimizer - Volume Share (${hours}h)\n`));

  const analyzer = new HookPoolAnalyzer();
  const share = await analyzer.getVolumeShare(hours);

  console.log(table([
    ["Hook Pool", eth(share.hookVolume), `${(share.share * 100).toFixed(1)}%`],
    ["Reference Pool", eth(share.referenceVolume), `${((1 - share.share) * 100).toFixed(1)}%`],
    ["Total", eth(share.hookVolume + share.referenceVolume), "100%"],
  ], ["Pool", "Volume", "Share"]));
}

// ───────────────────────── Helpers ─────────────────────────
function getArg(args: string[], flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return defaultVal;
  return args[idx + 1];
}

// ───────────────────────── Main ─────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  const commands: Record<string, () => Promise<void>> = {
    analyze: () => cmdAnalyze(args.slice(1)),
    monitor: () => cmdMonitor(),
    compare: () => cmdCompare(),
    state: () => cmdState(),
    fees: () => cmdFees(args.slice(1)),
    burns: () => cmdBurns(args.slice(1)),
    volume: () => cmdVolume(args.slice(1)),
  };

  if (!cmd || !commands[cmd]) {
    console.log(color.bold("\n Hook Pool Optimizer\n"));
    console.log("Usage: node index.ts <command> [options]\n");
    console.log("Commands:");
    console.log("  analyze    Analyze pool and get optimization recommendations");
    console.log("  monitor    Real-time pool monitoring with alerts");
    console.log("  compare    Compare hook pool vs reference pool");
    console.log("  state      Display current pool state");
    console.log("  fees       Show fee summary for a time period");
    console.log("  burns      Show burn summary for a time period");
    console.log("  volume     Show volume share between pools\n");
    console.log("Options:");
    console.log("  --eth <amount>      Investment amount in ETH (default: 10)");
    console.log("  --risk <profile>    Risk tolerance: conservative, moderate, aggressive (default: moderate)");
    console.log("  --hours <hours>     Time window for analysis (default: 24)");
    console.log("");
    process.exit(cmd ? 2 : 0);
  }

  try {
    await commands[cmd]();
  } catch (err) {
    console.error(color.red(`\nError: ${err}`));
    process.exit(1);
  }
}

main();
