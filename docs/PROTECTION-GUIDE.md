# Optimizer Protocol - Code Protection Guide

## Overview

This document explains what code is public vs protected in the Optimizer Protocol.

---

## Public Code (Open Source)

### Location: `contracts/public/`

These files are **safe to share** with developers and investors:

| File | What It Contains |
|------|------------------|
| `IMEVOracle.sol` | Interface for MEV detection |
| `IOptimizerHook.sol` | Interface for hook callbacks |
| `IOptimizerRouter.sol` | Interface for swap execution |
| `IOptimizerVault.sol` | Interface for vault operations |
| `IOptimizerGenesisKey.sol` | Interface for NFT minting |
| `IAdoptionVault.sol` | Interface for staking |
| `IBuilderStakingVault.sol` | Interface for builder staking |

### What Developers Can Do With Public Interfaces

```solidity
// 1. Integrate with IMEVOracle
IMEVOracle oracle = IMEVOracle(oracleAddress);
(bool isBot, uint256 confidence) = oracle.isMEVBot(suspectAddress);

// 2. Query OptimizerHook
IOptimizerHook hook = IOptimizerHook(hookAddress);
uint256 totalMEV = hook.getTotalMEVCaptured();

// 3. Use OptimizerRouter
IOptimizerRouter router = IOptimizerRouter(routerAddress);
router.executeSwap{value: amount}(swapParams);
```

---

## Protected Code (Private)

### Location: `contracts/private/`

These files contain **core IP** and should NOT be shared:

| File | What It Protects |
|------|------------------|
| `OptimizerHookV2.sol` | MEV detection algorithm, oracle caching, fee logic |
| `OptimizerRouter.sol` | Swap execution, MEV capture, slippage protection |
| `OptimizerVaultV2.sol` | Yield optimization, liquidity management |
| `AdoptionVault.sol` | Staking mechanics, reward distribution |
| `BuilderStakingVault.sol` | Fee distribution, APY calculation |
| `OptimizerGenesisKey.sol` | NFT minting, allowlist logic |
| `MigrationRouter.sol` | V1→V2 migration path |

---

## Why This Protection Strategy?

### 1. MEV Detection Algorithm (Protected)
```
❌ PROBLEM: If公开, bots can evade detection
✅ SOLUTION: Keep detection logic private
```

### 2. Fee Tier Logic (Protected)
```
❌ PROBLEM: If公开, users can manipulate fees
✅ SOLUTION: Keep fee calculation private
```

### 3. Oracle Cache System (Protected)
```
❌ PROBLEM: If公开, attackers can poison cache
✅ SOLUTION: Keep cache logic private
```

### 4. Elasticity Mechanics (Protected)
```
❌ PROBLEM: If公开, users can front-run burns
✅ SOLUTION: Keep burn logic private
```

---

## How to Share Safely

### For Developers
```bash
# Share only public interfaces
contracts/public/README.md

# Show integration examples
docs/ORACLE-SHARE.md
```

### For Investors
```bash
# Share test results
docs/PUBLIC-TEST-RESULTS.md

# Share architecture overview
docs/TEST-REPORT.md
```

### For Adam (Oracle Integration)
```bash
# Share oracle interface
contracts/public/IMEVOracle.sol

# Share integration guide
docs/ORACLE-SHARE.md
```

---

## Security Checklist

- [x] Public interfaces documented
- [x] Protected code in `private/` folder
- [x] `.gitignore` excludes private folder
- [x] Test results public
- [x] Architecture documented
- [x] No secrets in code

---

## What's Safe to Show

### ✅ Safe
- Test results (101/101 passing)
- Architecture diagrams
- Public interfaces
- Gas optimization stats
- Security audit summary

### ❌ Not Safe
- MEV detection algorithm
- Fee calculation logic
- Oracle cache implementation
- Burn mechanics
- Internal arbitrage logic

---

*Protection Level: CORE IP Secured*
*Last Updated: 2026-09-21*
