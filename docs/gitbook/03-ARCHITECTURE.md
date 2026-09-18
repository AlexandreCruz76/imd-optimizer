# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    OPTIMIZER ARCHITECTURE                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    FRONTEND                           │   │
│  │  Next.js 16 + React 19 + Tailwind v4                 │   │
│  │  ├── Dashboard (real-time pool state)                 │   │
│  │  ├── Arbitrage Engine (live opportunities)            │   │
│  │  ├── NFT Mint (Genesis Key purchase)                  │   │
│  │  ├── Staking ($BUILDER → fees)                        │   │
│  │  └── Migration (pool-to-pool)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    BACKEND                            │   │
│  │  API Routes + The Graph + Event Indexer               │   │
│  │  ├── /api/pool-state (real-time data)                 │   │
│  │  ├── /api/arbitrage (opportunities)                   │   │
│  │  ├── /api/nft/* (mint, status, keys)                  │   │
│  │  └── /api/staking/* (stake, claim, stats)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SMART CONTRACTS (Ethereum)                │   │
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
│  │              UNISWAP V4 (Ethereum Mainnet)             │   │
│  │  ├── Hook Pool (ETH/IMD with Optimizer Hook)          │   │
│  │  ├── Native Pool (ETH/IMD without hooks)              │   │
│  │  └── Singleton Architecture                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User → Frontend → API Routes → Smart Contracts → Uniswap V4
  │                           │
  │                           ├── The Graph (indexing)
  │                           └── Event Indexer (fallback)
  │
  └── Wallet (MetaMask/Rainbow) → Sign Transactions
```

---

## Contract Interactions

```
┌─────────────────────────────────────────────────────────┐
│                  CONTRACT FLOW                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User deposits ETH                                   │
│     └── OptimizerVault.deposit()                        │
│         └── Mints oLP tokens                            │
│                                                         │
│  2. Vault deploys to Hook Pool                          │
│     └── OptimizerHook.beforeSwap() ← Layer 1            │
│         └── Reads NFT, applies fee                      │
│                                                         │
│  3. Swap executes                                       │
│     └── OptimizerHook.afterSwap() ← Layer 2+3           │
│         ├── Elasticity check                            │
│         └── MEV capture if delta > 0.5%                 │
│                                                         │
│  4. Fees distributed                                    │
│     └── BuilderStakingVault.depositFees()               │
│         └── Proportional to Builder Score               │
│                                                         │
│  5. MEV rewards                                         │
│     └── OptimizerGenesisKey.depositMEV()                │
│         └── Distributed to NFT holders                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Security Model

| Component | Protection |
|-----------|------------|
| Vault | ReentrancyGuard, Pausable, AccessControl |
| Hook | Owner-only mutations, Fee caps |
| Staking | Lock periods, Early withdrawal penalty |
| NFT | Max supply enforced, One per wallet optional |
| Fees | Daily yield limits (1% of TVL) |

---

*Next: [Contracts](./04-CONTRACTS.md)*
