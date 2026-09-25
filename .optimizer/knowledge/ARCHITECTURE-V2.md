# Optimizer Protocol — Architecture V2

**Version:** 2.0 | **Stack:** Solidity ^0.8.24, Foundry, Uniswap V4

---

## Overview

Optimizer is a **Deterministic Routing Layer & Meta-Hook Factory** built on Uniswap V4's Singleton architecture. It operates through three primary execution layers, bridging Identity-Fi, Elastic Monetary Policies, and MEV Internalization.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZER PROTOCOL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Smart       │    │  Meta-Hook  │    │  Hook       │     │
│  │  Router      │───▶│  Factory    │───▶│  Registry   │     │
│  │  (ERC-4626)  │    │  (B2B)     │    │  (V4 Core)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              UNISWAP V4 SINGLETON                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ beforeSwap│  │  swap()  │  │ afterSwap│          │   │
│  │  │ (Identity)│  │  (Core)  │  │ (MEV/    │          │   │
│  │  │          │  │          │  │  Burn)   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Identity-Fi (beforeSwap)

### Purpose
Dynamic fee tiers based on on-chain identity (ERC-721).

### Flow
```
User initiates Swap
        ↓
OptimizerHook.beforeSwap(sender)
        ↓
┌─────────────────────────────────┐
│ Check NFT balances:             │
│                                 │
│ if (genesisNFT > 0)             │
│   → fee = 0 (VIP/Pre-Seed)     │
│                                 │
│ if (identityMD > 0)             │
│   → fee = LOW_FEE (0.1%)       │
│                                 │
│ else                            │
│   → fee = PREMIUM_FEE (0.5%)   │
└─────────────────────────────────┘
        ↓
Fee tier applied to swap
```

### Contract Interface
```solidity
interface IOptimizerIdentity {
    function beforeSwap(
        address sender,
        address recipient,
        int256 amountSpecified,
        bytes calldata data
    ) external returns (bytes4 selector, int256 amountActual);

    function setDynamicFee(uint24 fee) internal;
}
```

### Integration
- **Identity MD NFT** (ERC-721): Adam's access passport
- **Optimizer Genesis NFT** (ERC-721): Pre-seed investor key
- **Standard Charter NFT** (Soulbound): B2B partner access

---

## Layer 2: Elasticity (afterSwap)

### Purpose
Sync with elastic monetary policies (The Standard Reserve).

### Flow
```
Swap completed
        ↓
OptimizerHook.afterSwap(sender, amount0, amount1)
        ↓
┌─────────────────────────────────┐
│ Analyze block-level flow:       │
│                                 │
│ netFlow = ethIn - ethOut        │
│                                 │
│ if (netFlow > 0)                │
│   → EXPANSION mode              │
│   → Route fees to incentives    │
│                                 │
│ if (netFlow < 0)                │
│   → CONTRACTION mode            │
│   → Trigger autoBurn()          │
│   → Deflationary pressure       │
└─────────────────────────────────┘
        ↓
Economic policy executed on-chain
```

### Contract Interface
```solidity
interface IOptimizerElasticity {
    function afterSwap(
        address sender,
        address recipient,
        int256 amount0,
        int256 amount1,
        bytes calldata data
    ) external;

    function getNetBlockFlow() external view returns (int256);
    function triggerAutoBurn(uint256 amount) external;
}
```

### Integration
- **The Standard Reserve**: Elastic monetary policy
- **$IMD Burn Mechanics**: Deflationary tokenomics
- **Optimizer Vault**: Yield aggregation

---

## Layer 3: MEV Internalization (Zero-Leakage)

### Purpose
Capture MEV from burn events before external bots extract it.

### Flow
```
Burn event detected (price delta)
        ↓
OptimizerHook.afterSwap()
        ↓
┌─────────────────────────────────┐
│ Detect price inefficiency:      │
│                                 │
│ priceDelta = |postBurn - preBurn│
│                                 │
│ if (priceDelta > threshold)     │
│   → Execute internal arbitrage  │
│   → Buy undervalued asset       │
│   → Inject profit to LP pool    │
│   → NO external bot extraction  │
└─────────────────────────────────┘
        ↓
LP yield protected (LVR mitigation)
```

### Contract Interface
```solidity
interface IOptimizerMEV {
    function detectPriceDelta(
        uint160 sqrtPriceBefore,
        uint160 sqrtPriceAfter
    ) external view returns (uint256 delta);

    function internalizeArbitrage(
        uint256 amountIn,
        address tokenIn
    ) external returns (uint256 profit);
}
```

### Protection Against
- Sandwich attacks
- Front-running on burn events
- Loss-Versus-Rebalancing (LVR)

---

## Smart Router (ERC-4626 Extension)

### Purpose
Single-entry vault that routes capital to optimal pools.

### Architecture
```
┌─────────────────────────────────┐
│      OptimizerVault.sol         │
│  (ERC-4626 Tokenized Vault)    │
│                                 │
│  deposit() → Vault Shares      │
│  withdraw() → ETH + Yield      │
│                                 │
│  Internal Routing:              │
│  ├─ Pool A (Legacy V3)         │
│  ├─ Pool B (Hook V4)           │
│  └─ Arbitrage Engine           │
└─────────────────────────────────┘
```

### Current Status
- ✅ 55/55 tests passing
- ✅ OptimizerVault.sol deployed (Sepolia)
- ✅ MigrationRouter.sol compiled
- ⏳ Meta-Hook Factory (Phase 2)

---

## Hook Factory (B2B)

### Purpose
Protocols deploy V4 pools using Optimizer's pre-built hooks.

### Available Hooks
| Hook | Function | Trigger |
|------|----------|---------|
| IdentityFiHook | Dynamic fee gating | beforeSwap |
| ElasticityHook | Monetary policy sync | afterSwap |
| MEVHook | Internalize arbitrage | afterSwap |
| BurnHook | Auto-burn integration | afterSwap |

### Integration Flow
```
Protocol approaches Optimizer
        ↓
Select hook configuration
        ↓
Deploy via Hook Factory
        ↓
Inherits: MEV protection + Identity-Fi + Elasticity
        ↓
Protocol pays: Performance fee on yield generated
```

---

## Data Pipeline

### Data Sources
1. **The Graph** — Uniswap V4 subgraph (primary)
2. **Event Indexer** — On-chain RPC (fallback)
3. **StateView Contract** — Pool TVL + liquidity

### Monitoring
- `/api/arbitrage` — Real-time spread calculation
- `/api/pool-state` — Pool metrics aggregation
- `/api/migration` — Migration execution

### Current Performance
- Graph API: ~30s response (needs optimization)
- Event Indexer: ~5s response
- Pool State API: ~2s response

---

## Security Considerations

### Audit Requirements
1. **OptimizerHook.sol** — beforeSwap/afterSwap logic
2. **MigrationRouter.sol** — Atomic migration between pools
3. **OptimizerVault.sol** — ERC-4626 compliance
4. **Hook Factory** — Deployment authorization

### Threat Model
| Vector | Mitigation |
|--------|------------|
| Reentrancy | Checks-Effects-Interactions pattern |
| Integer overflow | Solidity 0.8.20 built-in |
| MEV sandwich | Internal arbitrage execution |
| Access control | Owner-only admin functions |
| Pause mechanism | Emergency stop capability |

---

## Deployment Targets

| Network | Status | Contract |
|---------|--------|----------|
| Sepolia | ✅ Live | OptimizerVault, MigrationRouter |
| Mainnet | ⏳ Phase 1 | Smart Router |
| Mainnet | ⏳ Phase 2 | OptimizerHook |
| Base | ⏳ Phase 3 | Cross-chain |

---

*"The Optimizer doesn't just 'explore' the data; it uses deterministic routing to automate arbitrage and force max efficiency on Hook Pools."* ⬛️🟩
