/**
 * Hook Pool Optimizer
 * 
 * Optimization algorithm for $IMD CappedBurnHook LP positions.
 * Provides recommendations for optimal position sizing and timing.
 */

import { HookPoolAnalyzer, OptimizationResult, PoolState } from "./hookPoolAnalyzer";
import { CONFIG } from "./config";

// ───────────────────────── Types ─────────────────────────
export interface OptimizerConfig {
  investmentEth: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  rebalanceFrequency: "daily" | "weekly" | "monthly";
  compoundFees: boolean;
}

export interface PositionRecommendation {
  action: "open" | "add" | "remove" | "rebalance" | "hold";
  size: number; // ETH
  range: { lower: number; upper: number };
  urgency: "low" | "medium" | "high";
  reason: string;
  expectedApy: number;
  riskLevel: "low" | "medium" | "high";
}

export interface PerformanceMetrics {
  totalFeesEarned: number;
  totalRewardsEarned: number;
  totalBurnsContributed: number;
  impermanentLoss: number;
  netReturn: number;
  apy: number;
  vsHold: number; // vs just holding ETH
}

export interface FeeProjection {
  period: string;
  fees: number;
  rewards: number;
  burns: number;
  total: number;
  apy: number;
}

// ───────────────────────── Optimizer Class ─────────────────────────
export class HookPoolOptimizer {
  private analyzer: HookPoolAnalyzer;
  private config: OptimizerConfig;

  constructor(config?: Partial<OptimizerConfig>) {
    this.analyzer = new HookPoolAnalyzer();
    this.config = {
      investmentEth: 10,
      riskTolerance: "moderate",
      rebalanceFrequency: "weekly",
      compoundFees: true,
      ...config,
    };
  }

  /**
   * Analyze the current state and provide optimization recommendations
   */
  async optimize(): Promise<{
    recommendation: PositionRecommendation;
    analysis: OptimizationResult;
    feeProjections: FeeProjection[];
    performanceMetrics: PerformanceMetrics;
  }> {
    // Run full analysis
    const analysis = await this.analyzer.analyze(this.config.investmentEth);

    // Generate position recommendation
    const recommendation = this.generateRecommendation(analysis);

    // Generate fee projections
    const feeProjections = this.generateFeeProjections(analysis);

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(analysis);

    return {
      recommendation,
      analysis,
      feeProjections,
      performanceMetrics,
    };
  }

  /**
   * Generate position recommendation based on analysis
   */
  private generateRecommendation(analysis: OptimizationResult): PositionRecommendation {
    const { current, recommendations, metrics } = analysis;
    
    let action: PositionRecommendation["action"] = "hold";
    let size = this.config.investmentEth;
    let urgency: PositionRecommendation["urgency"] = "low";
    let reason = "Current position is optimal";
    let riskLevel: PositionRecommendation["riskLevel"] = "low";

    // Determine action based on analysis
    if (recommendations.action === "add") {
      action = "add";
      size = this.calculateOptimalAddition(current, metrics);
      urgency = current.hookLiquidityShare < 0.2 ? "high" : "medium";
      reason = recommendations.reason;
      riskLevel = metrics.riskScore > 70 ? "high" : metrics.riskScore > 40 ? "medium" : "low";
    } else if (recommendations.action === "remove") {
      action = "remove";
      size = this.calculateOptimalRemoval(current, metrics);
      urgency = "low";
      reason = recommendations.reason;
      riskLevel = "low";
    } else if (recommendations.action === "rebalance") {
      action = "rebalance";
      urgency = "medium";
      reason = "Position range should be adjusted for current market conditions";
    }

    // Adjust for risk tolerance
    if (this.config.riskTolerance === "conservative") {
      size *= 0.7; // Reduce size by 30%
      if (riskLevel === "high") {
        action = "hold";
        reason = "Risk too high for conservative profile";
      }
    } else if (this.config.riskTolerance === "aggressive") {
      size *= 1.3; // Increase size by 30%
    }

    return {
      action,
      size: Math.max(0, size),
      range: recommendations.optimalRange,
      urgency,
      reason,
      expectedApy: metrics.projectedApy,
      riskLevel,
    };
  }

  /**
   * Calculate optimal amount to add to position
   */
  private calculateOptimalAddition(state: PoolState, metrics: any): number {
    // Base calculation: how much to add to reach 30% share
    const targetShare = 0.3;
    const currentShare = state.hookLiquidityShare;
    
    if (currentShare >= targetShare) {
      return this.config.investmentEth;
    }

    // Calculate needed to reach target
    const totalLiquidity = state.ethInPool + state.backstopPrincipal;
    const neededEth = (totalLiquidity * targetShare) / (1 - targetShare) - totalLiquidity;
    
    // Cap at max position size
    return Math.min(neededEth, CONFIG.optimizer.maxPositionEth);
  }

  /**
   * Calculate optimal amount to remove from position
   */
  private calculateOptimalRemoval(state: PoolState, metrics: any): number {
    // If share is too high, suggest removing some
    const targetShare = 0.5;
    const currentShare = state.hookLiquidityShare;
    
    if (currentShare <= targetShare) {
      return 0;
    }

    const totalLiquidity = state.ethInPool + state.backstopPrincipal;
    const excessEth = totalLiquidity - (totalLiquidity * targetShare) / (1 - targetShare);
    
    return Math.min(excessEth, this.config.investmentEth);
  }

  /**
   * Generate fee projections for different time periods
   */
  private generateFeeProjections(analysis: OptimizationResult): FeeProjection[] {
    const { current, projections } = analysis;
    
    return projections.map((p) => ({
      period: p.days === 7 ? "1 Week" : p.days === 30 ? "1 Month" : p.days === 90 ? "3 Months" : "1 Year",
      fees: p.estimatedFees,
      rewards: p.estimatedRewards,
      burns: p.estimatedBurns,
      total: p.netReturn,
      apy: p.apy,
    }));
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(analysis: OptimizationResult): PerformanceMetrics {
    const { current, projections } = analysis;
    const monthlyProjection = projections.find((p) => p.days === 30) ?? projections[0];
    
    // Calculate vs hold (just holding ETH)
    const ethPriceChange = 0; // Assume no price change for conservative estimate
    const holdReturn = this.config.investmentEth * ethPriceChange;
    
    return {
      totalFeesEarned: monthlyProjection.estimatedFees,
      totalRewardsEarned: monthlyProjection.estimatedRewards,
      totalBurnsContributed: monthlyProjection.estimatedBurns,
      impermanentLoss: monthlyProjection.estimatedImpermanentLoss,
      netReturn: monthlyProjection.netReturn,
      apy: monthlyProjection.apy,
      vsHold: monthlyProjection.netReturn - holdReturn,
    };
  }

  /**
   * Get real-time monitoring data
   */
  async monitor(): Promise<{
    state: PoolState;
    alerts: string[];
    metrics: {
      liquidityShare: number;
      volumeShare: number;
      apy: number;
      riskScore: number;
    };
  }> {
    const state = await this.analyzer.getPoolState();
    const swapSummary = await this.analyzer.getSwapSummary(24);
    const volumeShare = await this.analyzer.getVolumeShare(24);

    const alerts: string[] = [];

    // Check for alerts
    if (state.hookLiquidityShare < 0.15) {
      alerts.push("CRITICAL: Hook pool liquidity share below 15%");
    } else if (state.hookLiquidityShare < 0.25) {
      alerts.push("WARNING: Hook pool liquidity share below 25%");
    }

    if (state.pendingRebalance) {
      alerts.push("INFO: Pending rebalance - keep enough ETH for keeper");
    }

    if (state.retainedEth < state.rebalanceThreshold * 0.5) {
      alerts.push("WARNING: Retained ETH below 50% of rebalance threshold");
    }

    if (volumeShare.share < 0.1) {
      alerts.push("WARNING: Volume share below 10% - fees may be low");
    }

    // Calculate current metrics
    const hoursAnalyzed = 24;
    const feesPerHour = swapSummary.volumeEth * state.lpFee / hoursAnalyzed;
    const annualizedFees = feesPerHour * 8760;
    const apy = state.ethInPool > 0 ? annualizedFees / state.ethInPool : 0;

    const riskScore = Math.min(100, Math.max(0,
      (1 - state.hookLiquidityShare) * 30 +
      (state.pendingRebalance ? 20 : 0) +
      (state.retainedEth < state.rebalanceThreshold ? 10 : 0) +
      (1 - volumeShare.share) * 40
    ));

    return {
      state,
      alerts,
      metrics: {
        liquidityShare: state.hookLiquidityShare,
        volumeShare: volumeShare.share,
        apy,
        riskScore,
      },
    };
  }

  /**
   * Compare hook pool vs reference pool
   */
  async comparePools(): Promise<{
    hook: { eth: number; apy: number; share: number };
    reference: { eth: number; apy: number; share: number };
    recommendation: string;
  }> {
    const state = await this.analyzer.getPoolState();
    const volumeShare = await this.analyzer.getVolumeShare(24);

    // Reference pool APY (simplified)
    const referenceApy = 0.05; // Assume 5% for reference (no burns/rewards)

    const hookApy = state.ethInPool > 0 
      ? (volumeShare.hookVolume * 0.01 * 365) / state.ethInPool 
      : 0;

    let recommendation = "";
    if (hookApy > referenceApy * 1.5) {
      recommendation = "Hook pool offers significantly better returns due to burns and rewards";
    } else if (hookApy > referenceApy) {
      recommendation = "Hook pool offers slightly better returns";
    } else {
      recommendation = "Reference pool offers better pure fee returns, but hook pool contributes to protocol health";
    }

    return {
      hook: {
        eth: state.ethInPool,
        apy: hookApy,
        share: volumeShare.share,
      },
      reference: {
        eth: state.referenceLiquidity, // Raw liquidity units (not ETH)
        apy: referenceApy,
        share: 1 - volumeShare.share,
      },
      recommendation,
    };
  }
}

export default HookPoolOptimizer;
