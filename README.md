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
3. **Distribute** fees to $BUILDER holders

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
│  │  → Dynamic fee: 0% / 0.1% / 0.5%                    │       │
│  │                                                     │       │
│  │  Layer 2: ELASTICITY (afterSwap)                     │       │
│  │  → Syncs $IMD Burns + Standard Reserve               │       │
│  │                                                     │       │
│  │  Layer 3: MEV INTERNALIZATION                        │       │
│  │  → Detects price delta                               │       │
│  │  → Executes internal arbitrage                       │       │
│  │  → Profit returns to LP pool                         │       │
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
| `OptimizerVaultV2` | `0xBc6Dc23FFbCDFe1fCa602361eb566a299a5036e1` | ERC-4626 vault (tier fees, 101 tests) |
| `OptimizerRouter` | `0x4b614E3eb18551ef0f1e65891fb9dABD4a397926` | Router with MEV protection |
| `IMEVOracle` | `0x70a49c8dC0EEb818E3673D2c3FB4ac2bB213180d` | Bot registry (ECDSA-attested) |
| `OptimizerGenesisKey` | deploy via `scripts/` | ERC-721 — `MAX_SUPPLY = 100` |

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
| `/` | Dashboard — pools overview | ✅ |
| `/swap` | Protected Swap — swap with MEV protection | ✅ |
| `/burns` | Burn Mechanics — on-chain burn events | ✅ |
| `/arbitrage` | Yield Arbitrage — Hook vs Native comparison | ✅ |
| `/nft-mint` | Genesis Key — ERC-721 NFT mint | ✅ |
| `/staking` | $BUILDER Staking — stake to earn fees | ✅ |
| `/docs` | Full documentation | ✅ |

---

## 💰 Fee Distribution

```
PERFORMANCE FEE (15% of yield):
├── 60% → $BUILDER Stakers
├── 20% → Treasury (operations + audits)
├── 15% → Developers (maintenance)
└──  5% → Burn (deflation)

FEE TIERS:
├── Genesis Key holders: 0%
├── Identity MD holders: 0.1%
├── Tier BASIC: 15%
├── Tier PRO: 10%
├── Tier WHALE: 5%
└── Default: 20%
```

---

## 🗂️ Tier Distribution Plan

### Genesis Key (ERC-721 — `MAX_SUPPLY = 100`)

| Tier | Allocation | Benefits |
|------|-----------|----------|
| **Genesis** | First-come, first-served until cap | 0% swap fees + MEV share + governance |
| **Backer** | First-come, first-served until cap | Priority access + 2× governance weight |
| **Total** | **100 keys** (verified by test suite) | — |

> Price and mint date are intentionally **not published** — they are announced
> together with the BETA mainnet release (see below).

### Vault Subscription Tiers (fees on yield)

| Tier | Fee | Deposit Range |
|------|-----|---------------|
| FREE | 20% | no minimum |
| BASIC | 15% | ≥ 0.1 ETH |
| PRO | 10% | ≥ 1 ETH |
| WHALE | 5% | ≥ 10 ETH |

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
✅ 101/101 Tests Passing
✅ 0 Critical Issues
✅ Gas Optimized (92% savings on oracle queries)
✅ Security Audited
```

| Suite | Tests | Status |
|-------|-------|--------|
| OptimizerRouter | 45 | ✅ |
| OptimizerVault | 33 | ✅ |
| OptimizerGenesisKey | 23 | ✅ |
| **TOTAL** | **101** | **✅** |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [INVESTORS.md](INVESTORS.md) | Investor guide & roadmap |
| [PITCH_INVESTIDOR.md](PITCH_INVESTIDOR.md) | Pitch — exec summary |
| [README-HOOKS.md](README-HOOKS.md) | Hooks overview |
| [contracts/public/](contracts/public/) | Public interfaces (I*.sol) |
| [test/](test/) | Full test suite (101 tests) |
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
