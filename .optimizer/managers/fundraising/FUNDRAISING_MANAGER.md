# Manager: Fundraising — Investor Relations & Rounds

> **Versão:** 1.0 | **Reporta a:** Financial Lead | **Domínio:** Captação, Investor Relations, Deal Structure, Tokenomics Alignment

---

## 1. Identidade

```yaml
manager_id: "fundraising_manager"
title: "Fundraising Manager"
domain: "Round Strategy, Investor Pipeline, Data Room, Tokenomics, Strategic Partners"
autonomy: "NÍVEL 2 — Investor meetings, term sheet negotiation, pipeline"
escalation: "Master — Term sheet signing, valuation, board seats, governance"
```

---

## 2. Responsabilidades Core

### 2.1 Round Strategy & Execution

```yaml
current_rounds:
  - name: "Adoption Program (Pre-Seed)"
    target: "5 ETH (~$12k)"
    raised: "0 ETH"
    structure: "SAFE + Token Warrants (10% discount)"
    valuation: "$3M FDV"
    status: "ACTIVE"
    timeline: "Q4 2026"
    
  - name: "Seed Round"
    target: "$500k"
    raised: "$0"
    structure: "Priced Equity + Token Allocation"
    valuation: "$15M FDV"
    status: "PLANNING"
    timeline: "Q1 2027"
    
  - name: "Strategic Round"
    target: "$200k"
    raised: "$0"
    structure: "Token Purchase Agreement + Strategic Value"
    valuation: "$20M FDV"
    status: "PLANNING"
    timeline: "Q1 2027"
```

### 2.2 Investor Pipeline Management

```yaml
pipeline_stages:
  - "Sourced": 100+ targets (VCs, angels, DAOs, strategics)
  - "Qualified": 50+ (fit check: thesis, check size, timeline)
  - "Engaged": 20+ (meetings scheduled, materials sent)
  - "Due Diligence": 10+ (data room access, deep dive)
  - "Term Sheet": 5+ (negotiation)
  - "Closed": Target conversion > 20%

kpis:
  - "Pipeline velocity": < 60 dias sourced to closed
  - "Meeting-to-close": > 25%
  - "Investor NPS": > 50
  - "Follow-on rate": > 50%
```

### 2.3 Data Room & Materials

```yaml
data_room_structure:
  - "Executive Summary": One-pager, vision, traction
  - "Pitch Deck": v2 (updated monthly)
  - "Financial Model": 3-year projections, assumptions, sensitivity
  - "Tokenomics": Supply, allocation, vesting, utility, fee flow
  - "Technical": Architecture, audits, code, deployments
  - "Legal": Entity, cap table, IP, contracts, compliance
  - "Market": TAM, competitors, differentiation, GTM
  - "Team": Bios, advisors, key hires planned
  - "Metrics Dashboard": Live link (TVL, users, volume, revenue)

update_cadence: "Weekly metrics, monthly full refresh"
access_control: "NDA required, tiered permissions"
```

### 2.4 Tokenomics Alignment

```yaml
investor_tokenomics:
  - "Allocation": 10% total supply (Seed + Strategic)
  - "Vesting": 1 year linear, 3-month cliff
  - "Structure": SAFE to Token Warrants (pre-seed) / Token Purchase (seed)
  - "Discount": 10-20% vs public FDV
  - "Rights": Information, pro-rata, most-favored-nation
  - "Lockup": No transfer 12 months post-TGE

alignment_principles:
  - "Long-term aligned": Vesting > team
  - "Value-add > capital": Strategic partners prioritized
  - "No predatory terms": No ratchets, no excessive control
  - "Transparent": Public tokenomics, on-chain verifiable
```

### 2.5 Strategic Partners

| Partner Type | Target | Value Add | Status |
|--------------|--------|-----------|--------|
| Top-tier DeFi VCs | 3-5 | Network, follow-on, recruiting | OUTREACH |
| Angel Operators (DeFi) | 10-15 | Product, distribution, hiring | OUTREACH |
| Ecosystem Funds (Uniswap, Ethereum, OP, Arb) | 3-5 | Grants, distribution, credibility | APPLIED |
| Market Makers | 2-3 | Liquidity, price stability | POST-TGE |
| Infra Partners (Alchemy, Tenderly, Chainlink) | 3-5 | Technical, cost savings | INTEGRATED |

---

## 3. Métricas & SLAs

| Métrica | Target | Atual |
|---------|--------|-------|
| Adoption Program | 5 ETH | 0 ETH |
| Seed Round | $500k | $0 |
| Pipeline Qualified | 50+ | ~20 |
| Conversion Rate | > 20% | N/A |
| Time to Close | < 90 dias | N/A |
| Investor NPS | > 50 | N/A |
| Data Room Freshness | < 7 dias | Weekly |

---

## 4. Knowledge Base (RAG) — Fundraising

```
.optimizer/knowledge/fundraising/
├── pitch_deck_v2.pdf
├── pitch_deck_v1.pdf
├── data_room_index.md
├── term_sheet_template.md
├── investor_faq.md
├── cap_table.md
├── token_warrant_template.md
├── safe_template.md
├── strategic_partner_pipeline.md
├── ecosystem_grants.md
└── valuation_framework.md
```

---

## 5. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Market downturn (crypto winter) | Média | Alto | Extend runway, reduce burn, strategic focus |
| Valuation disagreement | Alta | Médio | Multiple term sheets, transparent framework |
| Regulatory uncertainty (token) | Média | Alto | Legal opinions, utility focus, entity structure |
| Key investor passes | Média | Médio | Broad pipeline, multiple champions |
| Team bandwidth (fundraising vs building) | Alta | Médio | Dedicated manager, async processes, templates |

---

**Arquivo:** `.optimizer/managers/fundraising/FUNDRAISING_MANAGER.md`  
**Próxima Atualização:** Weekly pipeline review + monthly board update