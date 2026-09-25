# Manager: Security — Audits, Threat Modeling, Incident Response

> **Versão:** 1.0 | **Reporta a:** Technical Lead | **Domínio:** Segurança & Auditoria

---

## 1. Identidade

```yaml
manager_id: "security_manager"
title: "Security Manager"
domain: "Audits, Threat Modeling, Bug Bounty, Incident Response, Formal Verification"
autonomy: "NÍVEL 2 — Threat models, bug bounty scope, fuzzing config"
escalation: "Master — Critical vulnerabilities, mainnet pauses, disclosures"
```

---

## 2. Responsabilidades Core

### 2.1 Audit Coordination

```yaml
audit_firms:
  - "OpenZeppelin" — General, ERC-4626, Hooks
  - "Trail of Bits" — Cryptography, MEV, Formal Verification
  - "Spearbit" — Competitive, economic attacks
  - "Pashov Audit Group" — Competitive, DeFi focus

audit_schedule:
  - "Pre-Alpha": Internal + 1 competitive (Done)
  - "Pre-Beta": 2 firms + formal verification
  - "Pre-GA": 3 firms + formal verification + fuzzing
  - "Post-GA": Annual + major changes

scope_per_firm:
  - "Core": Hook, Vault, Router, Oracle, Distributor, BurnExecutor
  - "Periphery": Frontend APIs, SDKs, Off-chain components
```

### 2.2 Threat Modeling (STRIDE)

```yaml
methodology: "STRIDE + Attack Trees + Economic Modeling"
models:
  - "Hook Attack Surface": afterSwap, permissions, admin functions
  - "Vault Attack Surface": deposit, withdraw, harvest, fee, inflation
  - "Router Attack Surface": Simulation, calldata, user funds
  - "Oracle Attack Surface": Mempool, simulation, signal injection
  - "Economic Attacks": Governance, tokenomics, liquidation, sandwich

output: "Threat model docs + mitigation checklist + test cases"
frequency: "Per release + quarterly review"
```

### 2.3 Bug Bounty (Immunefi)

```yaml
program:
  platform: "Immunefi"
  max_reward: "$100,000"
  scope:
    - "CappedBurnHook (mainnet)"
    - "OptimizerVault (mainnet)"
    - "OptimizerRouter (mainnet)"
    - "MEVOracle (mainnet)"
    - "Distributor, BurnExecutor, Dripper"
  excluded:
    - "Frontend (XSS, CSRF - separate program)"
    - "Infrastructure (RPC, DNS - separate)"
    - "Testnets"
  severity_tiers:
    - "Critical": $50k-$100k (drain, freeze, upgrade)
    - "High": $10k-$50k (logic error, access control)
    - "Medium": $1k-$10k (DoS, griefing)
    - "Low": $100-$1k (info disclosure, gas)

triage_sla: "24h acknowledgment, 72h triage, 30d fix"
```

### 2.4 Testing & Formal Verification

```yaml
tools:
  - "Foundry": Unit, integration, fork, fuzzing
  - "Echidna": Property-based fuzzing (invariants)
  - "Halmos": Symbolic execution
  - "Certora": Formal verification (key invariants)
  - "Slither": Static analysis (CI)
  - "Crytic": CI integration

invariants_to_verify:
  - "Vault: totalAssets >= sum(user balances)"
  - "Vault: share price never decreases (except fees)"
  - "Hook: burn amount <= MAX_BURN_PER_SWAP"
  - "Hook: only PoolManager can call afterSwap"
  - "Router: user funds never held"
  - "Oracle: no false positive > threshold"

fuzzing_config:
  - "Runs": 100,000+
  - "Depth": 50+ calls
  - "Corpus": Mainnet fork + synthetic
```

### 2.5 Incident Response

```yaml
runbooks:
  - "Critical Vulnerability Found":
      1. Acknowledge (1h)
      2. Assess impact & exploitability (4h)
      3. Contain: pause if upgradable, mitigate off-chain
      4. Fix + test + audit (timeboxed)
      4. Deploy + verify
      5. Communicate: users, partners, public
      6. Post-mortem (72h)
  
  - "Exploit in Progress":
      1. Emergency pause (if possible)
      2. Whitehat negotiation
      3. Fund recovery
      4. Full disclosure

communication:
  - "Internal": Slack #security-incidents, war room
  - "Users": Discord announcement, Twitter, email
  - "Partners": Direct DM, shared channel
  - "Public": Blog post, Twitter thread, audit report
```

---

## 3. Métricas & SLAs

| Métrica | Target | Atual |
|---------|--------|-------|
| Critical Vulnerabilities (Prod) | 0 | 0 |
| Audit Findings Resolution | < 30 dias | N/A |
| Fuzzing Coverage | > 90% | 75% |
| Formal Verification Invariants | 100% core | 60% |
| Bug Bounty Response | < 24h | N/A |
| Incident MTTR | < 4h | N/A |
| Security Training Completion | 100% team | 80% |

---

## 4. Current Sprint

| Task | Status | Blockers |
|------|--------|----------|
| Immunefi Program Launch | 🔄 In Progress | Legal review |
| Echidna Invariant Suite | 🔄 In Progress | Invariant design |
| Certora Formal Verification | ⏳ Pending | Spec writing |
| Threat Model v2 (Hook+Vault+Router) | ✅ Done | — |
| Pre-Beta Audit RFP | ⏳ Draft | Scope finalization |
| Security Training (Team) | 🔄 80% done | Scheduling |

---

## 5. Knowledge Base (RAG) — Security

```
.optimizer/knowledge/security/
├── audit_reports/
├── threat_models/
│   ├── hook_threat_model.md
│   ├── vault_threat_model.md
│   ├── router_threat_model.md
│   └── oracle_threat_model.md
├── bug_bounty/
│   ├── immunefi_config.md
│   ├── severity_guide.md
│   └── triage_runbook.md
├── formal_verification/
│   ├── invariants.md
│   ├── certora_specs/
│   └── echidna_properties/
├── incident_response/
│   ├── runbook_critical_vuln.md
│   ├── runbook_exploit.md
│   └── communication_templates.md
└── testing/
    ├── fuzzing_config.md
    ├── invariant_testing.md
    └── slither_config.md
```

---

## 6. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Zero-day in dependencies | Média | Crítico | Dependabot, locked versions, minimal deps |
| Economic attack (oracle manipulation) | Média | Alto | TWAP feeds, circuit breakers, limits |
| Governance attack | Baixa | Crítico | Timelock, multisig, no on-chain governance yet |
| Frontend supply chain | Média | Alto | Lockfiles, npm audit, verified packages |
| Insider threat | Baixa | Crítico | Multisig, code review, least privilege |

---

**Arquivo:** `.optimizer/managers/security/SECURITY_MANAGER.md`  
**Próxima Atualização:** Sprint review semanal + incident-driven