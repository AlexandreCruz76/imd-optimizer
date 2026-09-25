# Manager: Sales — Partnerships, Integrations, Business Development

> **Versão:** 1.0 | **Reporta a:** Commercial Lead | **Domínio:** Parcerias, Integrações, BD, Grants, Enterprise

---

## 1. Identidade

```yaml
manager_id: "sales_manager"
title: "Sales / Business Development Manager"
domain: "DEX Integrations, Wallet Integrations, Infra Partnerships, Grants, Enterprise Sales"
autonomy: "NÍVEL 2 — Technical partnerships, integration scopes, grant applications"
escalation: "Master — Revenue sharing, exclusivity, strategic alliances, enterprise deals"
```

---

## 2. Responsabilidades Core

### 2.1 DEX & Aggregator Integrations

```yaml
target_integrations:
  - "1inch": Aggregator, high volume, MEV protection API
  - "Matcha (0x)": Aggregator, professional traders
  - "CowSwap": Solver-based, MEV protection native
  - "UniswapX": Intent-based, RFQ system
  - "Paraswap": Aggregator, multi-chain
  - "Odos": Aggregator, multi-path
  - "KyberSwap": Aggregator, enterprise API

integration_value_prop:
  - "Best Execution": MEV protection = better fills for users
  - "Differentiation": Only aggregator with hook-native protection
  - "Revenue Share": Fee split on protected volume
  - "Co-marketing": Joint announcements, content, events

integration_process:
  1. "Technical Discovery": API specs, simulation, testing
  2. "Commercial Terms": Revenue share, exclusivity, support
  3. "Implementation": SDK integration, testing, staging
  4. "Launch": Co-marketing, monitoring, support SLA
  5. "Optimization": Volume tracking, fee optimization, feedback
```

### 2.2 Wallet Integrations

```yaml
target_wallets:
  - "MetaMask": Snaps (in-wallet protection UI)
  - "Rainbow": Native integration, best UX
  - "Rabby": Power user, multi-chain, simulation
  - "Frame": Hardware wallet, ethos-aligned
  - "Coinbase Wallet": Retail reach, smart wallet
  - "Trust Wallet": Mobile, emerging markets

wallet_value_prop:
  - "In-Wallet Protection": User sees "Protected by Optimizer" badge
  - "Simulation Preview": Show slippage with/without protection
  - "One-Click Enable": Toggle in wallet settings
  - "Revenue Share": On protected volume via wallet
```

### 2.3 Infrastructure Partnerships

```yaml
current_partners:
  - "Alchemy": RPC + Enhanced APIs + Notify — Reliability, cost
  - "Tenderly": Simulation + Debugging + Monitoring — Core to Router
  - "Chainlink": Price Feeds + CCIP + Functions — Oracle, cross-chain
  - "Gelato": Automation + Relay — UX, gasless, scheduling
  - "The Graph": Subgraph indexing — Analytics, frontend
  - "Pimlico": Account Abstraction — Smart wallets, gasless

partnership_model:
  - "Technical": Deep integration, shared roadmap
  - "Commercial": Volume discounts, revenue share, co-marketing
  - "Strategic": Early access, joint R&D, ecosystem alignment
```

### 2.4 Ecosystem Grants

```yaml
grant_programs:
  - "Uniswap Foundation": $50k + distribution — Applied
  - "Ethereum Foundation": $100k + credibility — Planning
  - "Optimism": $50k + OP tokens + distribution — Planning
  - "Arbitrum": $50k + ARB tokens + distribution — Planning
  - "Base": $25k + distribution — Research
  - "Polygon": $25k + MATIC + distribution — Research

grant_process:
  1. "Research": Program fit, deadlines, requirements
  2. "Proposal": Technical + commercial + impact
  3. "Submit": Deadline-driven, multiple concurrent
  4. "Follow-up": Demo, references, technical review
  5. "Execute": Milestones, reporting, co-marketing
```

### 2.5 Enterprise Sales (Post-GA)

```yaml
enterprise_value_prop:
  - "MEV Protection as a Service": API + SLA + dedicated support
  - "White-Label": Custom branding, integrated in their product
  - "Reporting & Compliance": Audit trails, regulatory reports
  - "Dedicated Infrastructure": Private RPC, priority simulation

target_segments:
  - "Institutional Trading Desks": >$10M vol/mo
  - "DeFi Protocols": Lending, perps, structured products
  - "Wallet Providers": White-label for their users
  - "Aggregators": Best execution guarantee

sales_process:
  - "Inbound": Demo request, technical discovery
  - "Outbound": Targeted outreach, warm intros
  - "POC": 30-day pilot, volume commitment
  - "Contract": Annual, volume-based pricing
  - "Success": Onboarding, monitoring, quarterly reviews
```

---

## 3. Pipeline Tracker

| Partner | Type | Stage | Probability | Target Date | Owner |
|---------|------|-------|-------------|-------------|-------|
| Uniswap Foundation | Grant + Integration | Applied | 60% | Q4 2026 | Sales |
| 1inch | Aggregator Integration | Technical Discuss | 40% | Q1 2027 | Sales |
| Tenderly | Simulation Infra | Integrated | 100% | Done | Product |
| Alchemy | RPC + Enhanced | Integrated | 100% | Done | Product |
| Chainlink | Price Feeds + CCIP | Planning | 70% | Q1 2027 | Sales |
| Gelato | Automation + Relay | Technical Discuss | 50% | Q1 2027 | Sales |
| Immunefi | Bug Bounty | Live | 100% | Done | Security |
| ETHGlobal | Hackathon Sponsor | Confirmed | 100% | Q1 2027 | Marketing |

---

## 4. Métricas & SLAs

| Métrica | Target Q1 2027 | Atual |
|---------|----------------|-------|
| Integrations Live | 10 | 2 (Tenderly, Alchemy) |
| Partner-Driven Volume | > 30% | 0% |
| Grants Secured | > $100k | $0 |
| Enterprise Pipeline | > $500k ARR | $0 |
| Wallet Integrations | 3 | 0 |
| Co-Marketing Campaigns | 5 | 1 |

---

## 5. Knowledge Base (RAG) — Sales

```
.optimizer/knowledge/sales/
├── integration_partners.md
├── wallet_partners.md
├── infra_partners.md
├── grant_programs.md
├── enterprise_pitch.md
├── partnership_templates.md
├── pipeline_tracker.md
├── revenue_share_models.md
├── co_marketing_playbook.md
└── technical_integration_guide.md
```

---

## 6. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Integration complexity | Alta | Médio | SDK first, dedicated support, clear docs |
| Partner demands exclusivity | Média | Médio | Non-exclusive default, strategic exceptions |
| Revenue share disputes | Baixa | Médio | Transparent tracking, monthly reconciliation |
| Grant rejection | Média | Baixo | Multiple concurrent, strong proposals |
| Enterprise sales cycle long | Alta | Médio | POC-first, volume minimums, parallel tracks |

---

**Arquivo:** `.optimizer/managers/sales/SALES_MANAGER.md`  
**Próxima Atualização:** Weekly pipeline review + monthly forecast