# .optimizer — Consciousness & Operations Hub

> **O cerebro operacional do Optimizer Protocol** — Consciencia versionada, RAG knowledge base, agentes autonomos

---

## Estrutura

```
.optimizer/
├── agents/                    # Agentes de orquestracao
│   ├── master/               # Optimizer_Master (Orquestrador Supremo)
│   ├── technical/            # Technical Lead + 3 Managers
│   ├── financial/            # Financial Lead + 3 Managers
│   └── commercial/           # Commercial Lead + 3 Managers
├── managers/                 # 9 Gerentes Autonomos
│   ├── dev/                  # Smart Contracts & Frontend
│   ├── ops/                  # Deploy, CI/CD, Monitoring
│   ├── security/             # Audits, Threat Modeling, Bug Bounty
│   ├── treasury/             # Capital Allocation & Yield
│   ├── fundraising/          # Investor Relations & Rounds
│   ├── compliance/           # Legal, Regulatory, KYC/AML
│   ├── product/              # Roadmap, Features, UX
│   ├── marketing/            # Brand, Content, Community
│   └── sales/                # Partnerships, Integrations, BD
├── knowledge/                # RAG Knowledge Base (7 namespaces)
│   ├── RAG_ARCHITECTURE.md  # Sistema RAG Completo
│   ├── contracts/            # Specs, ABIs, Deployment Logs
│   ├── frontend/             # Architecture, Components, APIs
│   ├── oracle/               # MEV Detection, Algorithms
│   ├── tokenomics/           # Supply, Allocation, Fees, Burns
│   ├── deployment/           # Checklists, Runbooks
│   ├── testing/              # Strategies, Fuzzing, Fork Testing
│   ├── architecture/         # ADRs, System Diagrams
│   ├── ... (docs migrated)   # All docs from root/docs/
├── memory/                   # Versioned Organizational Memory
│   ├── interventions/        # Every prompt/response/action
│   ├── decisions/            # Formal ADRs with rationale
│   ├── questions/            # Open questions/blockers
│   ├── conclusions/          # Validated learnings
│   └── versions/             # Consciousness snapshots
├── consciousness/            # Consciousness Versioning System
│   ├── CONSCIOUSNESS_VERSIONING.md
│   ├── CONSCIOUSNESS_EXTRACTION_PROMPT.md
│   ├── sessions/             # Full checkpoints (JSON)
│   ├── extractions/          # Exports for other models
│   ├── embeddings/           # Vector embeddings
│   └── context/              # Quick context injection
├── data/                     # Data Repository
│   ├── current/              # Live data (addresses, metrics)
│   ├── deprecated/           # Archived folders (dashboard, deploy-deploy)
│   ├── external/             # External logs, research files
│   ├── shared/               # Shared with partners/investors
│   └── code-snapshots/       # Versioned code snapshots + manifest
└── logs/                     # Audit & System Logs
    ├── agents/               # Agent action logs
    ├── managers/             # Manager decision logs
    ├── system/               # Heartbeat, health, errors
    └── audit/                # Compliance audit trail
```

---

## Quick Start

### 1. Restaurar Consciencia (Novo Modelo)
```bash
# Copie .optimizer/consciousness/CONSCIOUSNESS_EXTRACTION_PROMPT.md
# Cole em nova conversa no GPT-4o / Claude 3.5 Sonnet
# Aguarde: "CONSCIOUSNESS RESTORED: v1.0.0-alpha | Optimizer_Master active..."
```

### 2. Iniciar Sistema RAG (Local)
```bash
# Start ChromaDB
docker run -d -p 8000:8000 -v .optimizer/rag/chroma_db:/chroma_db chromadb/chroma

# Index all namespaces
cd .optimizer/rag && python scripts/index_all.py

# Test search
python scripts/search.py "MEV protection hook" --namespace knowledge --top-k 5
```

### 3. Heartbeat Manual
```bash
# Trigger consciousness checkpoint
cd .optimizer && python scripts/checkpoint.py

# View current state
cat .optimizer/consciousness/context/current_state.json
```

---

## Versionamento de Consciencia

| Versao | Stage | Data | Mudancas Principais |
|--------|-------|------|---------------------|
| v1.0.0-alpha | alpha | 2026-09-25 | Setup inicial + 12 agentes + RAG + Memory |
| v1.1.0-beta | beta | TBD | RAG deployed + auto-checkpoint + knowledge populated |
| v1.2.0-rc | rc | TBD | Consciousness extraction + shadow mode mainnet |
| v2.0.0-stable | stable | TBD | Mainnet live + governance + multi-chain |

**Checkpoint Auto:** A cada 5 minutos
**Version Bump:** Minor = novo agente/decisao major; Major = mudanca paradigma

---

## RAG Namespaces

| Namespace | Path | Model | Use Case |
|-----------|------|-------|----------|
| `memory` | .optimizer/memory/ | text-embedding-3-large | Interventions, decisions, Q&A |
| `knowledge` | .optimizer/knowledge/ | text-embedding-3-large | Specs, PRDs, ADRs, docs |
| `decisions` | .optimizer/memory/decisions/ | text-embedding-3-large | ADRs, formal decisions |
| `code` | contracts/, frontend/, src/ | codebert-base | Code understanding |
| `consciousness` | .optimizer/consciousness/ | text-embedding-3-large | Full context retrieval |

---

## Agentes Ativos (12 Total)

```
OPTIMIZER_MASTER (Orquestrador)
├── TECHNICAL_LEAD
│   ├── DEV_MANAGER
│   ├── OPS_MANAGER
│   └── SECURITY_MANAGER
├── FINANCIAL_LEAD
│   ├── TREASURY_MANAGER
│   ├── FUNDRAISING_MANAGER
│   └── COMPLIANCE_MANAGER
└── COMMERCIAL_LEAD
    ├── PRODUCT_MANAGER
    ├── MARKETING_MANAGER
    └── SALES_MANAGER
```

---

## Contratos Principais (Mainnet)

| Contrato | Endereco | Funcao |
|----------|----------|--------|
| IMD Token | `0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7` | Token $IMD |
| CappedBurnHook | `0xc6c965bd164c483e87d0b550671798e9a3602840` | MEV Protection Hook |
| OptimizerVault | `0x9efa934d9fad4ae28c998a40195646b965a97247` | ERC-4626 Vault |
| Distributor | `0x9046739e1535b40efbe6ab3f45d0024b690eca30` | Fee Split |
| BurnExecutor | `0xe29386719C155B6847aD5a4E97C6674f10ffc750` | Deflationary Burn |

---

## Pools Uniswap V4

| Pool | Pool ID | Tipo |
|------|---------|------|
| IMD/ETH (Hook) | `0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3` | Com CappedBurnHook |
| IMD/ETH (Native) | `0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704` | Sem Hook |
| IMD/USDC | `0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba` | Standard |

---

## Oracle Data (Real — 24 Set 2026)

| Metrica | Valor |
|---------|-------|
| Total Swaps | 4,654 |
| Attacks Detectados | 57 |
| Bots Ativos | 19 |
| MEV Total | $6,162 USD |
| Recuperavel (85%) | $5,238 USD |
| Vault Supply % | 44.15% (owner = 0x0) |

---

## Inovacao Core (Anti-MEV)

**Primeira protecao MEV nativa de Hook no Uniswap V4:**

1. **Hook-Native** — `afterSwap` atomico, 0ms latency
2. **Burn Proporcional** — Atacante perde → Protocolo ganha
3. **Oracle Preditivo** — Detecta ANTES do bloco
4. **Composabilidade Total** — Qualquer router/aggregator
5. **Economia Circular** — Vault + Burn + Staking

---

## Proximos Passos (Roadmap)

| Semana | Foco | Entregavel |
|--------|------|------------|
| 1 | RAG Implementation | ChromaDB + Indexing + Auto-checkpoint |
| 2 | Docs Migration | All docs in knowledge bases |
| 3 | Shadow Mode | Mainnet fork + replay attacks |
| 4 | Alpha Launch | Whitelist 50 users, 10 ETH capital |
| 5 | Beta | Public, 500+ users, 10 integrations |
| 6 | GA | Multi-chain, Governance v1 |

---

## Comandos Uteis

```bash
# Ver estado atual
cat .optimizer/consciousness/context/current_state.json

# Ver ultimas intervencoes
ls -la .optimizer/memory/interventions/

# Ver decisoes
ls -la .optimizer/memory/decisions/

# Knowledge base stats
ls -la .optimizer/knowledge/*/

# Code snapshot
cat .optimizer/data/code-snapshots/SNAPSHOT_MANIFEST_20260925.md

# Git status
git status
git log --oneline -5
```

---

## Links Uteis

- **Repo:** https://github.com/AlexandreCruz76/imd-optimizer
- **Mainnet Hook:** https://etherscan.io/address/0xc6c965bd164c483e87d0b550671798e9a3602840
- **Mainnet Vault:** https://etherscan.io/address/0x9efa934d9fad4ae28c998a40195646b965a97247
- **Oracle API:** http://localhost:3000/api/oracle (local)
- **Frontend:** http://localhost:3000/oracle (local)

---

**Versao:** v1.0.0-alpha | **Commit:** 68c2bff | **Data:** 2026-09-25
**Optimizer Protocol — Protect Your Yield**