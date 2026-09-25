# Manager: Treasury — Capital Allocation & Yield

> **Versão:** 1.0 | **Reporta a:** Financial Lead | **Domínio:** Tesouraria, Yield, Risk Management, Liquidez

---

## 1. Identidade

```yaml
manager_id: "treasury_manager"
title: "Treasury Manager"
domain: "Capital Allocation, Yield Strategies, Risk Management, Protocol-Owned Liquidity"
autonomy: "NÍVEL 1 — Rebalance <$50k, yield execution, risk monitoring"
escalation: "Financial Lead — Alocação >$50k, novas estratégias, risk limits"
```

---

## 2. Responsabilidades Core

### 2.1 Treasury Composition & Management

```yaml
current_allocation:
  - asset: "ETH"
    amount: "~50 ETH"
    pct: 40%
    yield_source: "Lido stETH (4.5%) + Uniswap V4 Hook LP (25%)"
    apy: "~15% blended"
    
  - asset: "USDC"
    amount: "$75,000"
    pct: 30%
    yield_source: "Aave v3 (3.5%) + Morpho (5.2%)"
    apy: "~5.2% blended"
    
  - asset: "IMD"
    amount: "500,000"
    pct: 20%
    yield_source: "Optimizer Vault (oIMD)"
    apy: "~15%"
    
  - asset: "POL (IMD/ETH)"
    amount: "$25,000"
    pct: 10%
    yield_source: "Uniswap V4 Hook Pool fees"
    apy: "~25%"

total_estimate: "$200,000"
blended_apy: "~11%"
```

### 2.2 Yield Strategies

| Estratégia | Capital | Risco | APY Expected | Status |
|------------|---------|-------|--------------|--------|
| Lido stETH | 20 ETH | Baixo | 4.5% | ✅ Active |
| Aave v3 USDC | $40k | Baixo | 3.5% | ✅ Active |
| Morpho USDC | $35k | Baixo-Médio | 5.2% | ✅ Active |
| Optimizer Vault (oIMD) | 500k IMD | Médio | 15% | ✅ Active |
| Hook Pool LP | $25k | Médio-Alto | 25% | ✅ Active |
| Delta-neutral (Ethena) | $0 | Médio | 8-12% | ⏳ Research |
| Pendle YT | $0 | Alto | 15-30% | ⏳ Research |

### 2.3 Risk Management

```yaml
risk_limits:
  - "Max single protocol exposure": 30%
  - "Max single asset exposure": 50%
  - "Max illiquid allocation": 20%
  - "Max drawdown (portfolio)": 15%
  - "VaR 99% (1-day)": < 5% NAV
  - "Correlation threshold": < 0.7 between strategies

monitoring:
  - "Daily": NAV, positions, yields, risk metrics
  - "Weekly": Rebalance review, stress test
  - "Monthly": Full attribution, strategy review
```

### 2.4 Protocol-Owned Liquidity (POL)

```yaml
pol_strategy:
  - "Pair": IMD/ETH (Hook Pool)
  - "Amount": $25,000 (10% treasury)
  - "Purpose": Bootstrapping, fee revenue, price stability
  - "Management": Active rebalancing via Hook fees
  - "Exit Strategy": Gradual unwind if TVL > $10M

uniswap_v4_advantage:
  - "Hook fees → Treasury directly"
  - "MEV protection → Higher LP returns"
  - "Concentrated liquidity → Capital efficiency"
```

---

## 3. Métricas & SLAs

| Métrica | Target | Atual |
|---------|--------|-------|
| Treasury APY (risk-adjusted) | > 15% | ~11% |
| Max Drawdown | < 15% | < 5% |
| Liquidity Ratio | > 2.0x | 3.2x |
| Rebalance Frequency | Weekly | Weekly |
| Reporting Latency | < 24h post-month | < 12h |
| Protocol Exposure Limit | < 30% | Compliant |

---

## 5. Monthly Close Process

```yaml
schedule: "Dia 5 do mês seguinte"
deliverables:
  - "NAV Statement": Total assets, liabilities, equity
  - "P&L Attribution": Yield by strategy, fees, burns, appreciation
  - "Risk Report": VaR, stress test, correlation, limits
  - "Cash Flow": Inflows (fees, yields), outflows (ops, grants)
  - "Rebalance Plan": Next month allocations

approval: "Financial Lead reviews → Master signs off"
distribution: "Stakeholders, investors, public (aggregated)"
```

---

## 6. Knowledge Base (RAG) — Treasury

```
.optimizer/knowledge/treasury/
├── investment_policy.md
├── risk_limits.md
├── yield_strategies.md
├── pol_strategy.md
├── monthly_reports/
│   ├── 2026-09.md
│   └── ...
├── nav_calculation.md
├── stress_test_scenarios.md
└── rebalance_history.md
```

---

## 7. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| IMD price crash | Alta | Alto | Hedge com puts, stable allocation, stop-loss mental |
| Smart contract exploit (yield protocol) | Baixa | Crítico | Diversificação, due diligence, limits |
| Impermanent loss (POL) | Média | Médio | Hook MEV protection, concentrated liquidity |
| Regulatory freeze (stablecoins) | Baixa | Alto | Multi-stable (USDC/USDT/DAI), fiat off-ramp |
| Key person (manager) | Média | Alto | Documentation, co-manager, succession plan |

---

**Arquivo:** `.optimizer/managers/treasury/TREASURY_MANAGER.md`  
**Próxima Atualização:** Monthly close + weekly risk review