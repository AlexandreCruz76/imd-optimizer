# Arquitetura

## Visão Geral do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                 ARQUITETURA DO OPTIMIZER                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    FRONTEND                           │   │
│  │  Next.js 16 + React 19 + Tailwind v4                 │   │
│  │  ├── Dashboard (estado da pool em tempo real)         │   │
│  │  ├── Motor de Arbitragem (oportunidades live)         │   │
│  │  ├── Mint NFT (compra da Genesis Key)                 │   │
│  │  ├── Staking ($BUILDER → fees)                        │   │
│  │  └── Migração (pool-to-pool)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    BACKEND                            │   │
│  │  Rotas API + The Graph + Indexador de Eventos         │   │
│  │  ├── /api/pool-state (dados em tempo real)            │   │
│  │  ├── /api/arbitrage (oportunidades)                   │   │
│  │  ├── /api/nft/* (mint, status, keys)                  │   │
│  │  └── /api/staking/* (stake, claim, stats)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          SMART CONTRACTS (Ethereum)                    │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ Optimizer   │  │ Optimizer   │  │ Builder     │  │   │
│  │  │ Vault       │  │ Hook        │  │ Staking     │  │   │
│  │  │ (ERC-4626)  │  │ (V4 Hook)   │  │ Vault       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐                    │   │
│  │  │ Genesis     │  │ Migration   │                    │   │
│  │  │ Key (NFT)   │  │ Router      │                    │   │
│  │  └─────────────┘  └─────────────┘                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        UNISWAP V4 (Ethereum Mainnet)                   │   │
│  │  ├── Pool com Hook (ETH/IMD com Optimizer Hook)       │   │
│  │  ├── Pool Nativa (ETH/IMD sem hooks)                  │   │
│  │  └── Arquitetura Singleton                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

```
Usuário → Frontend → Rotas API → Smart Contracts → Uniswap V4
  │                        │
  │                        ├── The Graph (indexação)
  │                        └── Indexador de Eventos (fallback)
  │
  └── Carteira (MetaMask/Rainbow) → Assinar Transações
```

---

## Interações entre Contratos

```
┌─────────────────────────────────────────────────────────┐
│              FLUXO DE CONTRATOS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Usuário deposita ETH                                │
│     └── OptimizerVault.deposit()                        │
│         └── Minta tokens oLP                           │
│                                                         │
│  2. Vault implanta na Pool com Hook                     │
│     └── OptimizerHook.beforeSwap() ← Camada 1           │
│         └── Lê NFT, aplica taxa                         │
│                                                         │
│  3. Troca executa                                       │
│     └── OptimizerHook.afterSwap() ← Camada 2+3          │
│         ├── Verificação de elasticidade                 │
│         └── Captura de MEV se delta > 0.5%              │
│                                                         │
│  4. Taxas distribuídas                                  │
│     └── BuilderStakingVault.depositFees()               │
│         └── Proporcional ao Builder Score               │
│                                                         │
│  5. Recompensas de MEV                                  │
│     └── OptimizerGenesisKey.depositMEV()                │
│         └── Distribuída aos holders de NFT              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Modelo de Segurança

| Componente | Proteção |
|------------|----------|
| Vault | ReentrancyGuard, Pausable, AccessControl |
| Hook | Mutations apenas owner, Limite de taxas |
| Staking | Períodos de lock, Multa por saída antecipada |
| NFT | Supply máximo forçado, Um por carteira opcional |
| Taxas | Limites de yield diário (1% do TVL) |

---

*Próximo: [Contratos](./04-CONTRATOS.md)*
