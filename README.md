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
| `OptimizerHook` | `0xc6c965bd164c483e87d0b550671798e9a3602840` | 3-Layer Meta-Hook |
| `OptimizerRouter` | `0x4fAfa38104A1c61250B5EC2e1F0cC24C90F99240` | Router with MEV protection |
| `OptimizerGenesisKey` | `0x...` | NFT ERC-721 (200 supply) |
| `BuilderStakingVault` | `0x...` | Stake $BUILDER → 60% fees |
| `MigrationRouter` | `0x...` | Atomic migration between pools |

> **Note:** This repository contains only **interfaces** for the smart contracts. The full implementation is proprietary and kept in a private repository. See [contracts/public/](contracts/public/) for interface definitions.

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

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [UNIVERSE-OPTIMIZER.md](docs/UNIVERSE-OPTIMIZER.md) | Full ecosystem view |
| [PRODUCTION-ROADMAP.md](docs/PRODUCTION-ROADMAP.md) | 3-phase roadmap |
| [PITCH-DECK.md](docs/PITCH-DECK.md) | Investor summary |
| [ARCHITECTURE-V2.md](docs/ARCHITECTURE-V2.md) | Technical architecture |
| [IDENTITY-BRANDING.md](docs/IDENTITY-BRANDING.md) | Agentic Frog identity |

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
