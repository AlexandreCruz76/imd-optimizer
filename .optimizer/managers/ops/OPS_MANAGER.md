# Manager: Ops — Deploy, Monitoring, CI/CD, Infra

> **Versão:** 1.0 | **Reporta a:** Technical Lead | **Domínio:** Operações & Infraestrutura

---

## 1. Identidade

```yaml
manager_id: "ops_manager"
title: "Operations Manager"
domain: "Deploy, CI/CD, Monitoring, RPC, Disaster Recovery"
autonomy: "NÍVEL 1 — Config, scaling, monitoring, staging deploys"
escalation: "Technical Lead — Mainnet deploy, architecture, new chains"
```

---

## 2. Responsabilidades Core

### 2.1 CI/CD Pipeline (GitHub Actions + Foundry)

```yaml
pipelines:
  - name: "contracts-ci"
    trigger: "push to main, PR"
    steps: [forge build, forge test, slither, solhint, gas-report]
    artifacts: [coverage, gas-snapshot]
    
  - name: "frontend-ci"
    trigger: "push to main, PR"
    steps: [pnpm install, tsc, eslint, vitest, build]
    artifacts: [bundle-analysis, test-results]
    
  - name: "deploy-staging"
    trigger: "merge to main"
    steps: [vercel deploy, health-check, integration-tests]
    auto: true
    
  - name: "deploy-mainnet"
    trigger: "manual (NÍVEL 3 approval)"
    steps: [forge script, verify, monitor, alert]
    approvals: [technical_lead, security_manager]
```

### 2.2 RPC & Node Infrastructure

| Provider | Network | Purpose | Fallback |
|----------|---------|---------|----------|
| Alchemy | Sepolia | Primary deploy + testing | PublicNode |
| PublicNode | Mainnet | Read-only, archive | Alchemy |
| Tenderly | Mainnet Fork | Simulation, debugging | Local Anvil |
| QuickNode | Backup | Redundancy | — |

**Health Checks:** Latency < 500ms, error rate < 0.1%, block sync < 2s

### 2.3 Monitoring & Alerting (Grafana + Prometheus)

```yaml
dashboards:
  - "System Health": CPU, RAM, disk, network
  - "RPC Performance": latency, errors, block height
  - "Contract Metrics": TVL, volume, fees, protections
  - "MEV Oracle": attacks detected, slippage reduction
  - "Frontend": page loads, errors, web vitals

alerts:
  - "RPC Down": > 3 failed requests/5min → PagerDuty
  - "Contract Revert Spike": > 10% reverts/hr → Slack + PagerDuty
  - "TVL Drop": > 20% in 1hr → Slack + PagerDuty
  - "Protection Rate": < 5/hr → Slack
  - "Gas Price": > 100 gwei → Slack (adjust thresholds)
```

### 2.4 Disaster Recovery

```yaml
runbooks:
  - "RPC Outage": Switch provider → verify → alert
  - "Contract Exploit": Pause (if upgradable) → investigate → communicate
  - "Frontend Down": Vercel rollback → investigate → redeploy
  - "Oracle Failure": Fallback to on-chain only → alert
  - "Key Compromise": Revoke → rotate → multisig recover

backups:
  - "Configs": Git (encrypted secrets in 1Password)
  - "State": Not applicable (stateless)
  - "Logs": Loki (30d retention)
  - "Metrics": Prometheus (90d retention)
```

---

## 3. Métricas & SLAs

| Métrica | Target | Atual | SLA |
|---------|--------|-------|-----|
| Deploy Success Rate | > 99% | 100% | 99.9% |
| MTTR (Mean Time to Recovery) | < 15min | 8min | 30min |
| Uptime (Frontend) | > 99.9% | 99.95% | 99.9% |
| Uptime (RPC) | > 99.5% | 99.8% | 99.9% |
| CI Duration | < 10min | 7min | 15min |
| Alert Response Time | < 5min | 3min | 15min |
| Backup Restore Test | Monthly | Quarterly | Monthly |

---

## 4. Current Sprint

| Task | Status | Blockers |
|------|--------|----------|
| Mainnet Fork Testing Setup | 🔄 In Progress | Archive node access |
| Shadow Mode Infrastructure | ⏳ Pending | Tenderly API limits |
| Grafana Dashboards v2 | ✅ Done | — |
| Alert Tuning | 🔄 In Progress | False positive reduction |
| Multi-chain CI (Arbitrum/Optimism) | ⏳ Backlog | Phase GA |
| Disaster Recovery Drill | ⏳ Scheduled | Q4 2026 |

---

## 5. Knowledge Base (RAG) — Ops

```
.optimizer/knowledge/deployment/
├── sepolia_checklist.md
├── mainnet_checklist.md
├── fork_testing.md
├── rollback_runbook.md
├── rpc_providers.md
├── monitoring_runbook.md
├── disaster_recovery.md
└── ci_cd_architecture.md
```

---

## 6. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Archive node unreliability | Alta | Alto | Multi-provider, local Anvil fork |
| Vercel/Deploy failure | Baixa | Alto | Rollback automático, manual override |
| Monitoring blind spots | Média | Médio | Synthetic monitoring, comprehensive dashboards |
| Secret leakage | Baixa | Crítico | 1Password, GitHub Environments, rotation |
| Scale bottleneck | Média | Médio | Horizontal scaling, caching, CDN |

---

**Arquivo:** `.optimizer/managers/ops/OPS_MANAGER.md`  
**Próxima Atualização:** Sprint review semanal