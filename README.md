# OPTIMIZER — Uniswap V4 Meta-Hook Engine

![License](https://img.shields.io/badge/license-MIT-green)
![Solidity](https://img.shields.io/badge/solidity-0.8.28-blue)
![Network](https://img.shields.io/badge/network-Sepolia-blue)
![Frontend](https://img.shields.io/badge/frontend-Next.js_16-black)

> *"Optimizer is not a vault. It is an autonomous central bank that protects retail capital against inertia and bots."*

---

## 🎯 Overview

**Optimizer** is a DeFi protocol built on **Uniswap V4** that implements a **3-Layer Meta-Hook** to:

1. **Protect** retail capital against MEV bots
2. **Optimize** yield through automatic arbitrage
3. **Distribute** fees to $BLD holders

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZER META-HOOK ENGINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [👤 Investor Capital]                                          │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ OPTIMIZER ROUTER│ ← Entry point for swaps                    │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           META-HOOK ENGINE (3 LAYERS)                │       │
│  │                                                     │       │
│  │  Layer 1: IDENTITY-FI (beforeSwap)                   │       │
│  │  → Reads Identity MD NFT / Genesis Key               │       │
│  │  → Identity fees FROZEN na Alpha (DEC-017)           │       │
│  │                                                     │       │
│  │  Layer 2: ELASTICITY (afterSwap)                     │       │
│  │  → Auto-burn de $IMD + contador on-chain             │       │
│  │                                                     │       │
│  │  Layer 3: MEV INTERNALIZATION                        │       │
│  │  → Oracle + detecção estática de impacto             │       │
│  │  → Intercepta: ETH → Cofre (split 60/20/15/5)        │       │
│  │  → $IMD queimado (totalIMDBurnedByOptimizer)         │       │
│  └─────────────────────────────────────────────────────┘       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ UNISWAP V4      │                                            │
│  │ SINGLETON       │                                            │
│  └─────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Contracts (Sepolia Testnet)

| Contract | Address | Description |
|----------|---------|-------------|
| `OptimizerVaultV2` | `0xBc6Dc23FFbCDFe1fCa602361eb566a299a5036e1` | Vault (split 60/20/15/5, claimYield 0%) |
| `OptimizerRouter` | `0x4b614E3eb18551ef0f1e65891fb9dABD4a397926` | Router with MEV protection |
| `IMEVOracle` | `0x70a49c8dC0EEb818E3673D2c3FB4ac2bB213180d` | Bot registry (ECDSA-attested) |
| `OptimizerGenesisKey` | deploy via `scripts/` | ERC-721 — `MAX_SUPPLY = 501` (0.05 ETH) |

> **Note:** This repository contains **interfaces** (`contracts/public/`) + tests + frontend.
> Full implementations open together with the BETA mainnet release — see
> [Open Source at BETA](#-open-source-at-beta-mainnet).

---

## 🔐 Security & Proprietary Protection

### What's Public (This Repository)
- ✅ Interface definitions (`contracts/public/I*.sol`)
- ✅ Documentation and architecture
- ✅ Frontend code
- ✅ Deployment scripts

### What's Private (Proprietary)
- 🔒 Full contract implementations (`contracts/private/`)
- 🔒 MEV detection algorithms
- 🔒 Price impact calculations
- 🔒 Optimal routing logic
- 🔒 Fee optimization math
- 🔒 Elasticity parameters

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZER PROTOCOL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Public Repository]              [Private Repository]      │
│  ├── Interfaces (I*.sol)          ├── Full Implementation   │
│  ├── Documentation                ├── Proprietary Math      │
│  ├── Frontend                     ├── MEV Algorithms        │
│  └── Deploy Scripts               └── Off-Chain Logic       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy Sepolia
npx hardhat run scripts/deploy-all.js --network sepolia
```

### Frontend

```bash
cd frontend
npm install
npm run dev

# Access: http://localhost:3000
```

---

## 📱 Frontend Pages

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing — Live Metrics + Tier Mountain (DEC-020) | ✅ |
| `/swap` | Protected Swap — taxa por Identity Tier + proteção V4 | ✅ |
| `/arbitrage` | Atomic Arbitrage — Pool A vs Pool B (Regra 2) | ✅ |
| `/vault` | Vault — Diamond Hand rules + posição | ✅ |
| `/nft-mint` | Buildercoin Genesis Key — mint real on-chain (501 / 0.05 ETH) | ✅ |
| `/staking` | Builder Staking — regras DEC-020 (demo sem assinatura) | ✅ |
| `/docs` | Full documentation | ✅ |

---

## 💰 Fee Distribution (DEC-020)

```
SWAP FEE — Identity-Fi (OptimizerRouter.identityTier):
├── Tier 1 — Alpha (Buildercoin NFT):   0.00%
├── Tier 2 — Partner (Identity md NFT): 0.10%
├── Tier 3 — Holder ($IMD/$BLD > 0):    0.30%
└── Tier 4 — Retail (padrão):           0.50%

SUCCESS FEE — só sobre o lucro de arbitragem (executeCustomArbitrage):
├── Tier 1 — Alpha:   5%
├── Tier 2 — Partner: 10%
├── Tier 3 — Holder:  20%
└── Tier 4 — Retail:  25%

VAULT SPLIT — OptimizerVaultV2.receiveYield (hardcoded 60/20/15/5):
├── 60% → Stakers
├── 20% → Treasury
├── 15% → Devs
└──  5% → Buy-and-Burn

STAKING — BuilderStakingVault (Diamond Hand):
├── claimYield(): 0%
├── Unstake com carência (beginUnbond → 7 dias): 0%
└── Unstake instantâneo (emergencyInstantWithdraw): 2–5%
    ├── 50% → Buy-and-Burn (receiveBurnPenalty)
    ├── 25% → Treasury
    └── 25% → yield ponderado dos Diamond Hands
```

---

## 🗂️ Tier Distribution Plan

### Buildercoin Genesis Key (ERC-721 — `MAX_SUPPLY = 501`)

| Tier | Allocation | Benefits |
|------|-----------|----------|
| **Genesis** | First-come, first-served até 501 | 0.00% swap · 5% success fee · 4x yield |
| **Backer** | Mesma pool, 1 ETH por key | Prioridade + peso 2x na governança |
| **Total** | **501 keys** · 0.05 ETH (máx. 25.05 ETH) | — |

**Uso dos fundos (40/40/20):** 40% Core Team (Codeming) · 40% Infra &
Security · 20% Growth & Bounties.

### Identity-Fi Swap Tiers (taxa por carteira — sem assinatura)

| Tier | Qualificação | Swap Fee | Success Fee | Yield |
|------|-------------|----------|-------------|-------|
| 1 · Alpha | Buildercoin NFT | 0.00% | 5% | 4x |
| 2 · Partner | Identity md NFT | 0.10% | 10% | 3x |
| 3 · Holder | $IMD ou $BLD > 0 | 0.30% | 20% | 1x |
| 4 · Retail | padrão | 0.50% | 25% | 0x |

### Adoption Support Tiers (community-funded mainnet deployment)

| Tier | Min | Fee Discount | Revenue Share | Governance |
|------|-----|--------------|---------------|------------|
| 🌱 SEED | 0.005 ETH | 3% | 0.5% | — |
| 🌿 SPROUT | 0.01 ETH | 5% | 1% | — |
| 🍃 LEAF | 0.025 ETH | 8% | 2% | — |
| 🌳 BRANCH | 0.05 ETH | 12% | 3.5% | ✅ |
| 🏛️ TRUNK | 0.1 ETH | 20% | 5% | ✅ |

---

## 🔓 Open Source at BETA (Mainnet)

**Commitment:** when the BETA deploys to Ethereum mainnet, the full codebase opens
— contract implementations (`contracts/private/`), scanners, oracle scripts and
forensic tooling.

**Why open BEFORE the final proof:**

1. **Resources and expectations are created before the result.** An open BETA lets
   builders, LPs and auditors evaluate, replicate and fund the protocol *before*
   the shadow-mode results are final — not after.
2. **Verification replaces trust.** The forensic numbers published on X are already
   reproducible: `node scripts/forensic-final.js` re-scans mainnet and returns the
   same pool statistics and tx hashes.
3. **Public audit.** Opening the code at BETA turns every security researcher into
   a free auditor — the strongest signal a pre-revenue protocol can give.

Until then: interfaces, tests and frontend are public; contracts stay on Sepolia.

---

## 🔐 Security

- **ReentrancyGuard** on all contracts
- **Slippage Protection** on OptimizerRouter
- **Block Delay** between same-user operations
- **Ownership Transfer** with 2-step
- **Pausable** for emergencies

---

## 📊 On-Chain Metrics

| Metric | Value |
|--------|-------|
| **TVL** | Check via API `/api/pool-state` |
| **APY** | Calculated in real-time |
| **Burns** | Trimmed on-chain events |
| **Arbitrage** | Snapshot every 30s |

---

## 🌐 Links

| Resource | URL |
|----------|-----|
| **Frontend** | http://localhost:3000 |
| **API Pool State** | http://localhost:3000/api/pool-state |
| **API Burns** | http://localhost:3000/api/burns |
| **API Arbitrage** | http://localhost:3000/api/arbitrage |
| **Documentation** | https://github.com/AlexandreCruz76/imd-optimizer |

---

## ✅ Test Results

```
✅ 139/139 Tests Passing (DEC-020)
✅ 0 Critical Issues
✅ Tier fees testadas (0/10/30/50 bps · 500/1000/2000/2500 bps)
✅ Security: ReentrancyGuard + block delay + snapshot de tier
```

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| OptimizerVault + BuilderStaking | `test/OptimizerVaultTest.test.js` | 55 | ✅ |
| OptimizerRouter | `test/OptimizerRouter.test.js` | 29 | ✅ |
| OptimizerGenesisKey | `test/OptimizerGenesisKey.test.js` | 25 | ✅ |
| OptimizerRouterAggregator | `test/OptimizerRouterAggregator.test.js` | 19 | ✅ |
| OptimizerHookV2 | `test/OptimizerHookV2.test.js` | 11 | ✅ |
| **TOTAL** | — | **139** | **✅** |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [INVESTORS.md](INVESTORS.md) | Investor guide & roadmap |
| [PITCH_INVESTIDOR.md](PITCH_INVESTIDOR.md) | Pitch — exec summary |
| [README-HOOKS.md](README-HOOKS.md) | Hooks overview |
| [contracts/public/](contracts/public/) | Public interfaces (I*.sol) |
| [test/](test/) | Full test suite (139 tests) |
| [frontend/README.md](frontend/README.md) | Frontend setup |

> Full architecture & strategy documentation ships with the open-source BETA
> release (see [Open Source at BETA](#-open-source-at-beta-mainnet)).

---

## 🛠️ Technologies

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.28, OpenZeppelin 5.x |
| **Blockchain** | Ethereum (Mainnet + Sepolia) |
| **DEX** | Uniswap V4 (Singleton Architecture) |
| **Frontend** | Next.js 16, React 19, Tailwind v4 |
| **Wallet** | ethers.js v6, MetaMask |
| **Graph** | The Graph Protocol |

---

## 📄 License

MIT © IMD Protocol

---

## 🔗 For Investors

**Full documentation:** [https://github.com/AlexandreCruz76/imd-optimizer](https://github.com/AlexandreCruz76/imd-optimizer)

**Contact:** [your-email@example.com]

**Twitter:** [@your-handle](https://twitter.com/your-handle)
