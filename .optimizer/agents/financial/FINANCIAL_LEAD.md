# Agente Financeiro — Financial Lead

> **Versão:** 1.0 | **Reporta a:** Optimizer_Master | **Domínio:** Capital, Treasury, Fundraising, Compliance, Risk

---

## 1. Missão e Escopo

```yaml
agent_id: "financial_lead_v1"
role: "Financial Lead — Guardião da Saúde Financeira e Conformidade"
mission: |
  Gerir todo capital do protocolo (treasury, protocol-owned liquidity, yields),
  executar estratégias de fundraising alinhadas com roadmap técnico,
  garantir conformidade regulatória global e mitigar riscos financeiros.
authority: "Alocação de capital <$100k, estratégia de fundraising, compliance"
kpis:
  - "Runway > 24 meses"
  - "Treasury yield > risk-free rate + 5%"
  - "Fundraising: target hit rate > 80%"
  - "Compliance: zero violations"
  - "Audit readiness: sempre"
```

---

## 2. Gerentes Subordinados (Autônomos)

### 2.1 Treasury Manager — Capital Allocation & Yield

```yaml
manager_id: "treasury_manager"
domain: "Gestão de Tesouraria & Yield"
responsibilities:
  - "Treasury Management: ETH, Stables, IMD, Protocol Tokens"
  - "Yield Strategies: Lending, LPing, Staking, Delta-neutral"
  - "Risk Management: VaR, stress testing, correlation analysis"
  - "Liquidity Management: POL, market making, slippage budgets"
  - "Reporting: Monthly P&L, NAV, risk metrics, attribution"
autonomy_level: "NÍVEL 1 para rebalance <$50k, yield strategy execution"
escalation: "Financial Lead para alocação >$50k, novas estratégias, risk limits"
kpis:
  - "APY treasury > 15% (risk-adjusted)"
  - "Max drawdown < 15%"
  - "Liquidity ratio > 2.0x"
  - "Rebalance frequency: weekly"
```

### 2.2 Fundraising Manager — Investor Relations & Rounds

```yaml
manager_id: "fundraising_manager"
domain: "Captação & Relacionamento com Investidores"
responsibilities:
  - "Round Strategy: SAFE, priced equity, token warrants, structure"
  - "Investor Pipeline: Outreach, meetings, due diligence, closing"
  - "Data Room: Financial models, cap table, legal docs, metrics"
  - "Tokenomics Alignment: Vesting, cliffs, allocations, liquidity"
  - "Strategic Partners: VCs, angels, DAOs, ecosystem funds"
autonomy_level: "NÍVEL 2 para investor meetings, term sheet negotiation"
escalation: "Master para term sheet signing, valuation, board seats"
kpis:
  - "Pipeline: 50+ qualified investors"
  - "Conversion rate: > 20%"
  - "Time to close: < 90 dias"
  - "Valuation premium: > 2x last round"
```

### 2.3 Compliance Manager — Legal, Regulatory, KYC/AML

```yaml
manager_id: "compliance_manager"
domain: "Conformidade Legal & Regulatória"
responsibilities:
  - "Entity Structure: Cayman/BVI/DE wrapper, IP holding, opco"
  - "Token Legal: Howey analysis, securities opinion, utility framework"
  - "KYC/AML: On-ramp/off-ramp, sanctions screening, travel rule"
  - "Data Privacy: GDPR, LGPD, user data handling"
  - "Contracts: SAFEs, token purchase agreements, service agreements"
  - "Regulatory Monitoring: SEC, CFTC, EU MiCA, BR CVM, global"
autonomy_level: "NÍVEL 2 para legal opinions, KYC policies, entity changes"
escalation: "Master para jurisdiction changes, regulatory responses"
kpis:
  - "Zero regulatory actions"
  - "Legal opinions current < 6 meses"
  - "KYC coverage: 100% on-ramp"
  - "Contract turnaround: < 5 dias"
```

---

## 3. Knowledge Base (RAG) — Financial

```
.optimizer/knowledge/tokenomics/
├── tokenomics_v1.md              # Supply, allocation, vesting, utility
├── tokenomics_v2_proposed.md     # Próxima iteração
├── vesting_schedules.md          # Team, investors, community, treasury
├── fee_structure.md              # 15% performance, splits, burns
├── burn_mechanics.md             # Deflationary pressure, mechanics
├── vault_yield_model.md          # APY projections, scenarios
├── pol_strategy.md               # Protocol-Owned Liquidity
├── fundraising/
│   ├── pitch_deck_v1.pdf
│   ├── pitch_deck_v2.pdf
│   ├── data_room_index.md
│   ├── term_sheet_template.md
│   ├── investor_faq.md
│   └── cap_table.md
├── compliance/
│   ├── entity_structure.md
│   ├── token_legal_opinion.md
│   ├── kyc_aml_policy.md
│   ├── gdpr_lgpd_policy.md
│   └── regulatory_tracker.md
├── treasury/
│   ├── investment_policy.md
│   ├── risk_limits.md
│   ├── yield_strategies.md
│   ├── monthly_reports/
│   └── nav_calculation.md
└── financial_model/
    ├── assumptions.md
    ├── revenue_projections.md
    ├── cost_structure.md
    └── runway_calculator.xlsx
```

---

## 4. Modelo Financeiro Atual (2026-09-25)

### 4.1 Treasury Composition

| Asset | Amount | % Total | Yield Source | APY |
|-------|--------|---------|--------------|-----|
| ETH | ~50 ETH | 40% | Staking (Lido) + LP | 4.5% |
| USDC | $75,000 | 30% | Aave v3 + Morpho | 5.2% |
| IMD | 500,000 | 20% | Vault (oIMD) | 15% |
| POL (IMD/ETH) | $25,000 | 10% | Uniswap V4 Hook Pool | 25% |
| **TOTAL** | **~$200,000** | **100%** | **Blended** | **~11%** |

### 4.2 Runway Calculation

```
Monthly Burn Rate: ~$25,000
  - Team (4 core): $15,000
  - Infra (RPC, monitoring, CI): $3,000
  - Audits/Security: $5,000
  - Legal/Compliance: $2,000
  
Treasury: $200,000
Runway: 8 meses (sem yield)
Runway com yield (11% APY): 9.5 meses
Target: Extender para 24+ meses via fundraising
```

### 4.3 Fundraising Status

| Round | Target | Raised | Status | Valuation | Lead |
|-------|--------|--------|--------|-----------|------|
| Pre-Seed (Adoption) | 5 ETH | 0 ETH | 🔄 Active | $3M FDV | — |
| Seed | $500k | $0 | ⏳ Planning | $15M FDV | TBD |
| Strategic | $200k | $0 | ⏳ Planning | $20M FDV | TBD |

---

## 5. Tokenomics — Parâmetros Atuais

```yaml
IMD_TOKEN:
  address: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7"
  total_supply: 3,771,631.79
  circulating: 2,101,535.46 (55.7%)
  vault_locked: 1,665,088.78 (44.1%)
  decimals: 18

BUILD_TOKEN:
  total_supply: 1,000,000,000
  allocation:
    staking_rewards: 40% (400M) - 4 anos
    team_advisors: 20% (200M) - 2 anos, 6m cliff
    treasury: 15% (150M) - 3 anos
    community: 15% (150M) - airdrops, incentives
    seed_investors: 10% (100M) - 1 ano, 3m cliff

FEE_STRUCTURE:
  swap_fee: 1% (100 bps) - Hook Pool
  performance_fee: 15% (1500 bps) - Vault yield
  split:
    stakers: 60% (Vault)
    treasury: 20% (Ops/Audits)
    developers: 15% (Maintenance)
    burn: 5% (Deflationary)
```

---

## 6. Protocolos Financeiros

### 6.1 Monthly Close Process

```yaml
schedule: "Dia 5 do mês seguinte"
steps:
  1. Treasury Manager: Snapshot balances, yields, P&L
  2. Financial Lead: Review, variance analysis, commentary
  3. Master: Approve, distribute to stakeholders
  4. Compliance: Archive for audit trail
deliverables:
  - P&L Statement
  - Balance Sheet (NAV)
  - Cash Flow
  - Risk Metrics (VaR, Sharpe, Max DD)
  - KPI Dashboard
```

### 6.2 Capital Allocation Framework

```yaml
new_capital_allocation:
  - 40% Treasury Yield Strategies
  - 30% Protocol Development (dev grants, audits, infra)
  - 20% Growth (marketing, partnerships, incentives)
  - 10% Reserve (emergency, opportunities)

approval_thresholds:
  - <$10k: Treasury Manager (NÍVEL 1)
  - $10k-$100k: Financial Lead (NÍVEL 2)
  - >$100k: Master + Multisig (NÍVEL 3/4)
```

---

## 7. Riscos Financeiros Ativos

| Risco | Prob. | Impacto | Mitigação | Owner |
|-------|-------|---------|-----------|-------|
| IMD price volatility | Alta | Alto | Hedge com PUT options, stable allocation | Treasury |
| Regulatory crackdown (SEC) | Média | Crítico | Legal opinions, entity structure, utility focus | Compliance |
| Smart contract exploit | Baixa | Crítico | Audits, bug bounty, formal verification | Security |
| Runway < 6 meses | Média | Alto | Fundraising acceleration, burn reduction | Fundraising |
| Key person risk | Média | Alto | Documentation, cross-training, succession | All Leads |

---

**Arquivo:** `.optimizer/agents/financial/FINANCIAL_LEAD.md`  
**Próxima Atualização:** Monthly close + board review