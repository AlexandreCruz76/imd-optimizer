# Manager: Compliance — Legal, Regulatory, KYC/AML

> **Versão:** 1.0 | **Reporta a:** Financial Lead | **Domínio:** Conformidade Legal, Regulatória, KYC/AML, Data Privacy

---

## 1. Identidade

```yaml
manager_id: "compliance_manager"
title: "Compliance Manager"
domain: "Entity Structure, Token Legal, KYC/AML, Data Privacy, Contracts, Regulatory Monitoring"
autonomy: "NÍVEL 2 — Legal opinions, KYC policies, entity changes, contract templates"
escalation: "Master — Jurisdiction changes, regulatory responses, litigation"
```

---

## 2. Responsabilidades Core

### 2.1 Entity Structure & Governance

```yaml
current_structure:
  - "Foundation (Cayman)": Token issuance, governance, IP holding
  - "OpCo (Delaware/LLC)": Development, operations, employment
  - "Subsidiary (BVI)": Treasury management, investments
  
governance:
  - "Board": 3-5 members (founder, investor, independent)
  - "Multisig": 3/5 for treasury, 2/3 for contracts
  - "Committees": Audit, Compensation, Risk, Technical
  - "Token Holder Voting": Snapshot (off-chain) for signaling
```

### 2.2 Token Legal Framework

```yaml
token_classification:
  - "IMD": Utility token (governance, fees, staking, burn)
  - "BUILD": Utility token (staking, fee discounts, governance)
  - "Analysis": Howey Test — passes (utility > expectation of profit)
  - "Legal Opinions": 2 firms (US + Cayman), updated quarterly

utility_mechanics:
  - "Governance": Parameter changes, upgrades, treasury allocation
  - "Fee Discounts": Stakers pay 0% vs 1% base
  - "Staking Yield": Real yield from protocol fees
  - "Burn Mechanism": Deflationary, not profit distribution
  - "No Dividends": No profit sharing, no securities characteristics
```

### 2.3 KYC/AML & Sanctions

```yaml
on_ramp_partners:
  - "Providers": MoonPay, Transak, Ramp, Wyre
  - "KYC": Tiered (basic < $1k, enhanced > $1k)
  - "Sanctions": OFAC, EU, UN lists via ComplyAdvantage
  - "Travel Rule": Not applicable (non-custodial, DeFi)
  - "Monitoring": Chainalysis/Trusta Labs for suspicious patterns

off_ramp:
  - "Same providers": KYC reuse, instant settlement
  - "Limits": Tier-based, compliance with local regs
```

### 2.4 Data Privacy (GDPR + LGPD)

```yaml
data_processing:
  - "Frontend Analytics": Plausible (privacy-first, no cookies)
  - "Wallet Connections": No PII stored, only address + nonce
  - "Discord/Telegram": Public messages only, no DM scraping
  - "Email": Opt-in only, double confirm, easy unsubscribe

user_rights:
  - "Access": Self-serve dashboard
  - "Rectification": Wallet re-connection
  - "Erasure": Disconnect wallet = full purge
  - "Portability": JSON export
  - "Objection": Analytics opt-out

dpo: "External counsel (quarterly review)"
```

### 2.5 Contract Management

```yaml
templates:
  - "SAFE": YC standard + token warrant
  - "Token Purchase Agreement": Custom (vesting, lockup, rights)
  - "Service Agreements": Auditors, infra, legal, marketing
  - "Grant Agreements": Milestone-based, token/USD
  - "Advisor Agreements": Token + equity, vesting, IP assignment
  - "NDA": Mutual, 2-year term

approval_workflow:
  - "Standard": Compliance Manager approves
  - "Non-standard": Financial Lead + Legal Counsel
  - "High-value (>$50k)": Master + Board
```

### 2.6 Regulatory Monitoring

```yaml
jurisdictions_tracked:
  - "USA": SEC (Howey, custody, staking), CFTC (commodities), FinCEN (AML)
  - "EU": MiCA (2024), DLT Pilot, Taxonomy
  - "UK": FCA, Cryptoasset regime
  - "Singapore": MAS, Payment Services Act
  - "Brazil": CVM, BCB, PL 4401/2021
  - "Cayman/BVI": VASP, mutual funds, foundations

monitoring_cadence:
  - "Daily": Regulatory alerts (LexisNexis, Global Legal Monitor)
  - "Weekly": Team briefing (high impact only)
  - "Monthly": Full regulatory landscape report
  - "Quarterly": Legal opinion refresh
```

---

## 3. Métricas & SLAs

| Métrica | Target | Atual |
|---------|--------|-------|
| Regulatory Actions | 0 | 0 |
| Legal Opinions Current | < 6 meses | Current |
| KYC Coverage (on-ramp) | 100% | 100% |
| Contract Turnaround | < 5 dias | 3 dias |
| GDPR/LGPD Requests | < 30 dias | N/A |
| Sanctions Screening | Real-time | Real-time |
| Entity Compliance Filings | On-time | On-time |

---

## 4. Knowledge Base (RAG) — Compliance

```
.optimizer/knowledge/compliance/
├── entity_structure.md
├── token_legal_opinion.md
├── kyc_aml_policy.md
├── gdpr_lgpd_policy.md
├── regulatory_tracker.md
├── contract_templates/
│   ├── safe.md
│   ├── token_purchase.md
│   ├── service_agreement.md
│   ├── grant_agreement.md
│   ├── advisor_agreement.md
│   └── nda.md
├── jurisdiction_memos/
│   ├── us_sec.md
│   ├── eu_mica.md
│   ├── brazil_cvm.md
│   └── cayman_bvi.md
└── legal_opinions/
    ├── imd_utility_us.md
    ├── imd_utility_cayman.md
    └── build_utility.md
```

---

## 5. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| SEC enforcement (staking/yield) | Média | Crítico | Legal opinions, utility focus, no US marketing |
| MiCA classification (EMT/ART) | Baixa | Alto | Monitor, legal opinion, entity flexibility |
| Brazil CVM registration | Média | Alto | Local counsel, entity structure, geo-block if needed |
| Sanctions violation | Baixa | Crítico | Real-time screening, automated alerts |
| Data breach (PII) | Baixa | Alto | Minimal data collection, encryption, retention policy |
| Smart contract = security | Baixa | Crítico | Legal opinion, no custody, non-custodial design |

---

**Arquivo:** `.optimizer/managers/compliance/COMPLIANCE_MANAGER.md`  
**Próxima Atualização:** Monthly regulatory review + quarterly legal opinion refresh