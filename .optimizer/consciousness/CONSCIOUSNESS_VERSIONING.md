# Consciousness Versioning System — Memory & Evolution

> **Versao:** 1.0 | **Sistema:** Versionamento semantico da consciencia organizacional

---

## 1. Filosofia de Versionamento

A consciencia do Optimizer Protocol nao e estatica — ela evolui a cada interacao, decisao, deploy e aprendizado. Este sistema garante que:

1. **Toda mudanca seja rastreavel** — Do prompt do usuario ao deploy em mainnet
2. **Rollback seja possivel** — Voltar a qualquer estado anterior da consciencia
3. **Contexto seja preservado** — Novos agentes herdam toda a historia
4. **Auditoria seja completa** — Quem decidiu o que, quando e por que

---

## 2. Esquema de Versao Semantico

```
v{MAJOR}.{MINOR}.{PATCH}-{STAGE}

MAJOR: Mudanca de paradigma fundamental
  - Ex: v1 -> v2 = Hook V3 -> Hook V4 architecture
  - Ex: v2 -> v3 = Single-chain -> Multi-chain
  
MINOR: Nova capability ou agente significativo
  - Ex: v1.0 -> v1.1 = RAG system deployed
  - Ex: v1.1 -> v1.2 = Consciousness extraction ready
  - Ex: v1.2 -> v1.3 = Multi-chain support added
  
PATCH: Correcoes, docs, ajustes finos
  - Ex: v1.1.0 -> v1.1.1 = Bug fix no Oracle
  - Ex: v1.1.1 -> v1.1.2 = Doc update
  
STAGE: alpha | beta | rc | stable
  - alpha: Desenvolvimento ativo, instavel
  - beta: Feature-complete, testing
  - rc: Release candidate, pre-producao
  - stable: Producao, governance ativa
```

### Exemplos de Evolucao

```
v1.0.0-alpha    → Setup inicial + agentes base + estrutura .optimizer/
v1.1.0-beta     → RAG ativo + memory versioning + knowledge bases populados
v1.2.0-rc       → Consciousness extraction pronto + shadow mode mainnet
v2.0.0-stable   → Mainnet live + governance ativa + multi-chain
v2.1.0-stable   → Novo agente (ex: Governance Manager) + features
v3.0.0-stable   → Paradigma novo (ex: Intent-based, ZK-MEV)
```

---

## 3. Estrutura de Armazenamento

```
.optimizer/consciousness/
├── sessions/              # Checkpoints completos (JSON)
│   ├── consciousness_v1.0.0-alpha_20260925.json
│   ├── consciousness_v1.1.0-beta_20261001.json
│   └── consciousness_v{N}_{DATE}.json
├── extractions/           # Exportacoes para outros modelos
│   ├── extraction_v1.0.0-alpha_20260925.md
│   ├── extraction_v1.1.0-beta_20261001.json
│   └── extraction_v{N}_{DATE}.{md|json}
├── embeddings/            # Vector embeddings da consciencia
│   ├── v1.0.0-alpha/
│   │   ├── agents.npy
│   │   ├── knowledge.npy
│   │   └── memory.npy
│   └── v{N}/
└── context/               # Contexto atual para injecao rapida
    ├── current_state.json
    ├── active_agents.json
    ├── active_decisions.json
    └── project_state.json
```

---

## 4. Schema de Checkpoint de Consciencia

```json
{
  "version": "v1.0.0-alpha",
  "timestamp": "2026-09-25T14:49:00Z",
  "git_commit": "68c2bff",
  "git_branch": "main",
  "block_height": 26049586,
  "agents": {
    "optimizer_master": {
      "state": "active",
      "last_intervention": "INT-20260925-001",
      "consciousness_size_kb": 0
    },
    "technical_lead": {
      "state": "active",
      "managers": ["dev", "ops", "security"],
      "last_intervention": "INT-20260925-002"
    },
    "financial_lead": {
      "state": "active",
      "managers": ["treasury", "fundraising", "compliance"],
      "last_intervention": "INT-20260925-003"
    },
    "commercial_lead": {
      "state": "active",
      "managers": ["product", "marketing", "sales"],
      "last_intervention": "INT-20260925-004"
    }
  },
  "managers": {
    "dev": {"state": "active", "current_sprint": "RETENTION_POC"},
    "ops": {"state": "active", "current_sprint": "RETENTION_POC"},
    "security": {"state": "active", "current_sprint": "RETENTION_POC"},
    "treasury": {"state": "active", "current_sprint": "MONTHLY_CLOSE"},
    "fundraising": {"state": "active", "current_sprint": "ADOPTION_PROGRAM"},
    "compliance": {"state": "active", "current_sprint": "REGULATORY_REVIEW"},
    "product": {"state": "active", "current_sprint": "ALPHA_LAUNCH"},
    "marketing": {"state": "active", "current_sprint": "BRAND_LAUNCH"},
    "sales": {"state": "active", "current_sprint": "PIPELINE_BUILD"}
  },
  "memory_stats": {
    "total_interventions": 4,
    "total_decisions": 0,
    "total_questions": 0,
    "total_conclusions": 1,
    "memory_size_kb": 128
  },
  "knowledge_stats": {
    "total_documents": 25,
    "namespaces": 7,
    "vector_count": 1247,
    "last_indexed": "2026-09-25T14:49:00Z"
  },
  "active_decisions": [],
  "project_state": {
    "phase": "RETENTION_POC",
    "block_height": 26049586,
    "deployed_contracts": {
      "mainnet": {
        "IMD_Token": "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",
        "CappedBurnHook": "0xc6c965bd164c483e87d0b550671798e9a3602840",
        "OptimizerVault": "0x9efa934d9fad4ae28c998a40195646b965a97247"
      },
      "sepolia": {
        "OptimizerVaultV2": "0xBc6Dc23FFbCDFe1fCa602361eb566a299a5036e1",
        "OptimizerRouter": "0x4b614E3eb18551ef0f1e65891fb9dABD4a397926"
      }
    },
    "active_phase": "RETENTION_POC",
    "runway_months": 9.5,
    "treasury_usd": 200000
  }
}
```

---

## 5. Ciclo de Versionamento

### 5.1 Checkpoint Automatico (A cada 5 min)

```python
async def consciousness_checkpoint_cycle():
    while True:
        await asyncio.sleep(300)  # 5 minutos
        
        # 1. Verificar se houve mudancas significativas
        if await has_significant_changes():
            # 2. Criar checkpoint
            version = await get_next_version()
            checkpoint = await create_consciousness_checkpoint(version)
            
            # 3. Atualizar contexto rapido
            await update_quick_context()
            
            # 4. Log
            await log_checkpoint(version, checkpoint)
```

### 5.2 Trigger de Versao Minor (Mudancas Significativas)

```python
SIGNIFICANT_CHANGES = [
    "new_agent_deployed",
    "new_manager_hired",
    "major_decision_recorded",
    "mainnet_deploy",
    "architecture_change",
    "rag_system_updated",
    "consciousness_extraction_ready",
    "phase_transition"
]

async def check_version_bump(change_type: str):
    if change_type in SIGNIFICANT_CHANGES:
        await bump_minor_version(reason=change_type)
```

### 5.3 Trigger de Versao Major (Mudancas de Paradigma)

```python
MAJOR_CHANGES = [
    "hook_architecture_migration",      # V3 -> V4
    "multi_chain_launch",               # Single -> Multi
    "governance_activation",            # Centralized -> DAO
    "new_paradigm",                     # Intent-based, ZK, etc.
    "tokenomics_overhaul"               # Supply, allocation, mechanics
]
```

---

## 6. Operacoes de Consciencia

### 6.1 Rollback para Versao Anterior

```python
async def rollback_consciousness(target_version: str):
    # 1. Carregar checkpoint alvo
    checkpoint = await load_consciousness_checkpoint(target_version)
    
    # 2. Restaurar estados dos agentes
    for agent_id, state in checkpoint["agents"].items():
        await restore_agent_state(agent_id, state)
    
    # 3. Restaurar estados dos managers
    for manager_id, state in checkpoint["managers"].items():
        await restore_manager_state(manager_id, state)
    
    # 4. Restaurar contexto rapido
    await restore_quick_context(target_version)
    
    # 3. Criar novo checkpoint "post-rollback"
    new_version = f"{target_version}-rollback-{datetime.now().strftime('%H%M')}"
    await create_consciousness_checkpoint(new_version)
    
    # 4. Log
    await log_rollback(target_version, new_version)
```

### 6.2 Diff entre Versoes

```python
async def diff_consciousness(version_a: str, version_b: str) -> ConsciousnessDiff:
    a = await load_consciousness_checkpoint(version_a)
    b = await load_consciousness_checkpoint(version_b)
    
    return ConsciousnessDiff(
        version_a=version_a,
        version_b=version_b,
        agents_added=list(set(b["agents"]) - set(a["agents"])),
        agents_removed=list(set(a["agents"]) - set(b["agents"])),
        agents_modified=get_modified_agents(a["agents"], b["agents"]),
        managers_added=list(set(b["managers"]) - set(a["managers"])),
        managers_removed=list(set(a["managers"]) - set(b["managers"])),
        decisions_added=get_new_decisions(a, b),
        decisions_modified=get_modified_decisions(a, b),
        knowledge_delta=get_knowledge_delta(a, b),
        project_state_changes=get_project_state_diff(a["project_state"], b["project_state"]),
        memory_growth=b["memory_stats"]["total_interventions"] - a["memory_stats"]["total_interventions"]
    )
```

### 6.3 Exportacao para Compartilhamento

```python
async def export_consciousness(version: str, format: str = "markdown") -> str:
    checkpoint = await load_consciousness_checkpoint(version)
    
    if format == "markdown":
        return generate_markdown_export(checkpoint)
    elif format == "json":
        return json.dumps(checkpoint, indent=2)
    elif format == "context_bundle":
        return create_context_bundle(checkpoint)  # Para injecao em outro modelo
    elif format == "training_data":
        return generate_training_data(checkpoint)  # Para fine-tuning
```

---

## 7. Integracao com Git

### 7.1 Commits Estruturados

```bash
# Padrao de commit para mudancas de consciencia
git commit -m "consciousness: checkpoint v1.1.0-beta - RAG deployed"
git commit -m "consciousness: bump minor v1.2.0-rc - Mainnet fork ready"
git commit -m "consciousness: bump major v2.0.0-stable - Mainnet live"

# Tags para versoes estaveis
git tag -a "consciousness-v1.0.0-alpha" -m "Initial consciousness"
git tag -a "consciousness-v1.1.0-beta" -m "RAG + Memory versioning"
git tag -a "consciousness-v2.0.0-stable" -m "Mainnet live"
```

### 7.2 Branch Strategy

```
main                    → Consciousness stable (tagged)
develop                 → Consciousness beta/rc
feature/*               → Consciousness alpha (WIP)
hotfix/*                → Patch versions
consciousness/*         → Experimental consciousness features
```

---

## 8. API de Consciencia (Para Agentes Externos)

```python
class ConsciousnessAPI:
    async def get_current_version() -> str
    async def get_checkpoint(version: str) -> ConsciousnessCheckpoint
    async def get_latest_checkpoint() -> ConsciousnessCheckpoint
    async def diff_versions(v1: str, v2: str) -> ConsciousnessDiff
    async def rollback(target_version: str) -> str
    async def export(version: str, format: str) -> str
    async def search_memory(query: str, top_k: int = 10) -> List[MemoryEntry]
    async def search_decisions(query: str) -> List[Decision]
    async def get_project_state() -> ProjectState
    async def get_agent_state(agent_id: str) -> AgentState
```

---

## 9. Metricas de Consciencia

| Metrica | Target | Alerta |
|---------|--------|--------|
| Checkpoint Frequency | 5 min | > 15 min sem checkpoint |
| Version Bump Rate | ~1 minor/semana | > 1 semana sem minor bump |
| Rollback Success Rate | 100% | < 100% |
| Context Injection Latency | < 100ms | > 500ms |
| Memory Growth Rate | ~100 interventions/semana | < 10/semana (stagnation) |
| Consciousness Size | < 10MB | > 50MB (bloat) |

---

**Arquivo:** `.optimizer/consciousness/CONSCIOUSNESS_VERSIONING.md`  
**Proxima Atualizacao:** Apos primeiro checkpoint automatico