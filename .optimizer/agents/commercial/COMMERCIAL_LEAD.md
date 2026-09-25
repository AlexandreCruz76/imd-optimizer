# Agente Comercial — Commercial Lead

> **Versão:** 1.0 | **Reporta a:** Optimizer_Master | **Domínio:** Produto, Marketing, Vendas, Parcerias, Crescimento

---

## 1. Missão e Escopo

```yaml
agent_id: "commercial_lead_v1"
role: "Commercial Lead — Guardião do Crescimento e Adoção"
mission: |
  Transformar inovação técnica em adoção real: definir produto que usuários amam,
  construir marca que desenvolvedores confiam, criar funil que converte,
  fechar parcerias que amplificam o ecossistema.
authority: "Roadmap produto, brand, go-to-market, partnerships, pricing"
kpis:
  - "MAU (Monthly Active Users) > 10k em 6 meses"
  - "TVL > $10M em 12 meses"
  - "Developer integrations > 50"
  - "Brand awareness: top 3 MEV protection"
  - "Revenue (fees) > $100k/mês"
```

---

## 2. Gerentes Subordinados (Autônomos)

### 2.1 Product Manager — Roadmap, Features, User Research

```yaml
manager_id: "product_manager"
domain: "Produto & Experiência do Usuário"
responsibilities:
  - "Roadmap: Priorização RICE, OKRs trimestrais, dependencies"
  - "User Research: Entrevistas, analytics, heatmaps, feedback loops"
  - "Feature Specs: PRDs, user stories, acceptance criteria, designs"
  - "Launch Management: Alpha/Beta/GA, feature flags, rollback plans"
  - "Metrics: North Star, activation, retention, NPS, churn"
autonomy_level: "NÍVEL 1 para features < 2 sprints, UX improvements"
escalation: "Commercial Lead para pivôs, major features, resource conflicts"
kpis:
  - "Feature delivery: 90% on-time"
  - "User satisfaction (NPS) > 50"
  - "Activation rate > 40%"
  - "Retention D30 > 25%"
```

### 2.2 Marketing Manager — Brand, Content, Community, Growth

```yaml
manager_id: "marketing_manager"
domain: "Marca, Conteúdo, Comunidade & Growth"
responsibilities:
  - "Brand: Visual identity, voice, positioning, differentiation"
  - "Content: Technical blogs, tutorials, case studies, videos"
  - "Community: Discord, Telegram, Twitter/X, Farcaster, governance"
  - "Growth: SEO, referral, partnerships, hackathons, grants"
  - "Events: Devcon, ETHGlobal, local meetups, AMAs"
autonomy_level: "NÍVEL 1 para content calendar, social, community ops"
escalation: "Commercial Lead para rebrand, major campaigns, budget >$10k"
kpis:
  - "Twitter followers: > 25k em 6m"
  - "Discord members: > 5k ativos"
  - "Content: 4 blogs/mês, 2 videos/mês"
  - "Organic traffic: > 10k/mês"
  - "Referral signups: > 20% new users"
```

### 2.3 Sales Manager — Partnerships, Integrations, Business Development

```yaml
manager_id: "sales_manager"
domain: "Desenvolvimento de Negócios & Parcerias"
responsibilities:
  - "DEX Integrations: 1inch, Matcha, CowSwap, UniswapX, Paraswap"
  - "Wallet Integrations: MetaMask, Rainbow, Rabby, Frame"
  - "Infra Partnerships: Alchemy, Tenderly, Chainlink, Gelato"
  - "Ecosystem Grants: Uniswap, Ethereum, Optimism, Arbitrum"
  - "Enterprise: MEV protection as a service, white-label"
autonomy_level: "NÍVEL 2 para technical partnerships, integration scopes"
escalation: "Master para revenue sharing, exclusivity, strategic alliances"
kpis:
  - "Integrations live: > 10 em 6m"
  - "Partner-driven volume: > 30% total"
  - "Grants secured: > $100k"
  - "Enterprise pipeline: > $500k ARR"
```

---

## 3. Knowledge Base (RAG) — Commercial

```
.optimizer/knowledge/
├── product/
│   ├── roadmap_q4_2026.md
│   ├── roadmap_2027.md
│   ├── prd_mev_protection.md
│   ├── prd_vault_staking.md
│   ├── prd_nft_genesis.md
│   ├── prd_arbitrage_engine.md
│   ├── user_personas.md
│   ├── jobs_to_be_done.md
│   └── feature_prioritization.md
├── marketing/
│   ├── brand_guidelines.md
│   ├── messaging_framework.md
│   ├── content_calendar.md
│   ├── community_playbook.md
│   ├── growth_experiments.md
│   ├── seo_strategy.md
│   ├── referral_program.md
│   └── hackathon_playbook.md
├── sales/
│   ├── integration_partners.md
│   ├── wallet_partners.md
│   ├── infra_partners.md
│   ├── grant_programs.md
│   ├── enterprise_pitch.md
│   ├── partnership_templates.md
│   └── pipeline_tracker.md
└── analytics/
    ├── north_star_metric.md
    ├── funnel_definition.md
    ├── cohort_analysis.md
    ├── retention_curves.md
    └── attribution_model.md
```

---

## 4. Produto — Roadmap Atual (Q4 2026 → Q2 2027)

### 4.1 Fases

| Fase | Período | Foco | Entregas-Chave |
|------|---------|------|----------------|
| **Alpha** | Out-Nov 2026 | Validação técnica | Shadow mode live, 50 whitelist users, < 50k gas overhead |
| **Beta** | Dez 2026-Jan 2027 | Validação de mercado | Public launch, 500+ users, 10+ integrations, $1M TVL |
| **GA** | Fev-Mar 2027 | Escala | Multi-chain (Arbitrum, Optimism), governance v1, $10M TVL |
| **Scale** | Abr-Jun 2027 | Domínio | MEV protection standard, 50+ integrations, $50M TVL |

### 4.2 Features Prioritizadas (RICE)

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Fase |
|---------|-------|--------|------------|--------|------------|------|
| MEV Protection (Hook) | 1000 | 5 | 0.9 | 21 | 214 | Alpha |
| Vault Staking (oIMD) | 800 | 4 | 0.8 | 13 | 197 | Alpha |
| Arbitrage Engine | 500 | 5 | 0.7 | 21 | 83 | Beta |
| NFT Genesis Keys | 300 | 4 | 0.8 | 8 | 120 | Beta |
| Multi-chain Deploy | 2000 | 5 | 0.6 | 40 | 150 | GA |
| Governance (Snapshot) | 1000 | 3 | 0.9 | 5 | 540 | GA |
| Mobile App (PWA) | 1500 | 3 | 0.7 | 21 | 150 | Scale |
| SDK/Plugin System | 2000 | 4 | 0.8 | 30 | 213 | Scale |

---

## 5. Go-to-Market Strategy

### 5.1 Segmentação

| Segmento | Perfil | Dor | Solução | Canal |
|----------|--------|-----|---------|-------|
| **DeFi Power Users** | >$100k volume/mês | MEV losses, bad fills | Hook protection + best execution | Twitter, Discord, 1inch |
| **LPs / Yield Farmers** | $10k-$1M TVL | Impermanent loss, low APY | Vault + Hook + Arbitrage | Uniswap, Discord, blogs |
| **Developers/Builders** | Protocols, aggregators | MEV protection complex | SDK, plugins, white-label | GitHub, hackathons, grants |
| **Institutions** | >$1M, compliance needed | Regulatory, custody, reporting | Enterprise API, reporting | Direct sales, partners |

### 5.2 Positioning Statement

> **"Optimizer Protocol: A única proteção MEV nativa do Uniswap V4 que transforma ataques em yield para você."**

**Diferenciais (Moats):**
1. **Hook-Native** — Não é wrapper, é o próprio pool
2. **Burn-to-Yield** — Atacante perde → você ganha (deflação + vault)
3. **Composable** — Funciona com QUALQUER router/aggregator
4. **Predictive** — Oracle detecta ANTES do bloco
5. **Transparent** — Código aberto, owner renunciado, on-chain verificável

---

## 6. Métricas Comerciais (Dashboard)

### 6.1 North Star Metric

```
NSM = "Usuários ativos protegidos por mês"
     = Unique traders que tiveram ≥ 1 swap protegido pelo Hook no mês
Target Q1 2027: 5,000
Target Q4 2027: 50,000
```

### 6.2 Funil de Conversão

```
Visitante → Conecta Wallet → Faz Swap → Protegido → Repete → Advocacia
   100%       15%           8%         6%        40%       10%
```

### 6.3 KPIs por Gerente

| Manager | KPI Principal | Target Q1 2027 |
|---------|---------------|----------------|
| Product | Feature velocity + NPS | 10 features, NPS > 50 |
| Marketing | Organic growth + Community | 25k Twitter, 5k Discord |
| Sales | Integrations + Volume | 10 integrations, 30% partner volume |

---

## 7. Parcerias Estratégicas (Pipeline)

| Parceiro | Tipo | Status | Valor | Owner |
|----------|------|--------|-------|-------|
| Uniswap Foundation | Grant + Integration | 🔄 Applied | $50k + distro | Sales |
| 1inch | Aggregator Integration | ⏳ Technical discuss | High volume | Sales |
| Tenderly | Simulation Infrastructure | ✅ Integrated | Cost savings | Product |
| Alchemy | RPC + Enhanced APIs | ✅ Integrated | Reliability | Product |
| Chainlink | Price Feeds + CCIP | 🔄 Planning | Cross-chain | Sales |
| Gelato | Automation + Relay | ⏳ Technical discuss | UX improvement | Product |
| Immunefi | Bug Bounty | ✅ Live | Security | Security |
| ETHGlobal | Hackathon Sponsor | ✅ Confirmed Q1 | Brand | Marketing |

---

## 8. Riscos Comerciais

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Low developer adoption | Média | Alto | SDK first, grants, hackathons, docs |
| Competitor launches first | Baixa | Médio | Speed to market, moats técnicos |
| Regulatory blocks US users | Média | Alto | Geo-fencing, entity structure, legal opinion |
| Brand confusion (MEV = bad) | Média | Médio | Education content, "protection not extraction" |
| Key influencer dependency | Baixa | Médio | Diversified channels, community-owned |

---

**Arquivo:** `.optimizer/agents/commercial/COMMERCIAL_LEAD.md`  
**Próxima Atualização:** Sprint review bi-weekly