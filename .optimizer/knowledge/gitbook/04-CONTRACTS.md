# Contracts

## Overview

All contracts are compiled with Solidity 0.8.28 and tested on Hardhat.

---

## OptimizerVault (ERC-4626)

**The single entry point for all capital.**

```solidity
// Core functions
deposit(uint256 assets) → uint256 shares
withdraw(uint256 assets) → uint256 shares
swap(uint256 amountIn, bool zeroForOne) → uint256 amountOut
claimYield() → uint256 yield
```

**Features:**
- ERC-4626 compliant vault
- Tier-based fee structure
- Daily yield limits (max 1% of TVL)
- Pausable for emergencies
- 2-step ownership transfer

**Test Coverage:** 55 tests passing

---

## OptimizerGenesisKey (ERC-721)

**Your passport to zero fees and MEV revenue.**

```solidity
// Minting
mintGenesis() payable  // 0.5 ETH — 50 supply
mintBacker() payable   // 1.0 ETH — 50 supply

// MEV Distribution
depositMEV() payable   // Owner deposits captured MEV
claimMEV()             // Holder claims share
```

**Utility:**
- 0% swap fees FOREVER
- MEV revenue share (proportional to holdings)
- Priority access to B2B pools
- Governance voting rights

**Max Supply:** 100 keys
**Test Coverage:** 12 tests passing

---

## BuilderStakingVault (ERC-20)

**Stake $BUILDER → Earn 60% of protocol fees.**

```solidity
// Staking
stake(uint256 amount, uint256 lockTier)
withdraw(uint256 positionIndex)
claimRewards()
```

**Lock Tiers:**
| Days | Multiplier | APY |
|------|------------|-----|
| 30 | 1.00x | 37% |
| 90 | 1.35x | 50% |
| 180 | 1.85x | 68.5% |

**Fee Distribution:**
- 60% → $BUILDER Stakers
- 20% → Treasury
- 15% → Developers
- 5% → Burn

**Test Coverage:** 10 tests passing

---

## OptimizerHook (V4 Singleton)

**The 3-Layer Meta-Hook Engine.**

```solidity
// Hook callbacks
beforeSwap()  // Layer 1: Identity-Fi
afterSwap()   // Layer 2: Elasticity + Layer 3: MEV

// Admin
setB2BPartner(address, bool)
executeBurn(uint256 amount)
collectFees() → uint256
withdrawMEV()
```

**Hook Flags:**
- beforeInitialize
- beforeSwap
- afterSwap

**Test Coverage:** Unit tests pending (integration tests)

---

## MigrationRouter

**Atomic migration between pools.**

```solidity
migrateFromNativeToHook(uint256 amount)
migrateFromHookToNative(uint256 amount)
```

**Test Coverage:** 55 tests (existing)

---

## Test Summary

```
OptimizerGenesisKey:     12 passing ✅
BuilderStakingVault:     10 passing ✅
OptimizerVaultTest:      55 passing ✅
────────────────────────────────────
Total:                   77 passing ✅
```

---

*Next: [Tokenomics](./05-TOKENOMICS.md)*
