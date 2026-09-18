# NFT Utility

## Optimizer Genesis Key

Your passport to zero fees and MEV revenue.

---

## Overview

| Property | Value |
|----------|-------|
| Type | ERC-721 |
| Max Supply | 100 |
| Genesis Price | 0.5 ETH |
| Backer Price | 1.0 ETH |
| Target Raise | 50-100 ETH |

---

## Utility Breakdown

### 1. Zero Fees Forever

```
Without NFT:  0.5% fee on every swap
With NFT:     0% fee on every swap

Example (1 ETH swap daily):
  Without: 0.5% × 365 = 1.825 ETH/year in fees
  With:    0% × 365 = 0 ETH/year in fees
  
  Savings: 1.825 ETH/year
```

### 2. MEV Revenue Share

```
Optimizer captures MEV from arbitrage
Distributed to Genesis Key holders

Example (10 ETH MEV captured):
  100 holders → 0.1 ETH each
  10 holders → 1.0 ETH each
  1 holder → 10.0 ETH
```

### 3. Priority B2B Access

```
First access to new pools
Higher allocation in launches
Priority support
```

### 4. Governance

```
Vote on protocol parameters
Weight: 10x vs regular holders
Proposal rights
```

---

## Genesis vs Backer

| Feature | Genesis (0.5 ETH) | Backer (1 ETH) |
|---------|-------------------|----------------|
| Supply | 50 | 50 |
| Zero Fees | ✓ | ✓ |
| MEV Share | ✓ | ✓ |
| Priority Access | ✓ | ✓ (higher) |
| Governance | ✓ | ✓ (2x weight) |
| Badge | Genesis | Backer |

---

## How to Mint

1. Connect wallet (Ethereum Mainnet)
2. Go to [app.optimizer.finance/nft-mint](https://app.optimizer.finance/nft-mint)
3. Choose Genesis (0.5 ETH) or Backer (1 ETH)
4. Sign transaction
5. Receive NFT in wallet
6. Use on Optimizer router for ZERO fees

---

## MEV Distribution

```solidity
// MEV flows into the system
OptimizerHook captures arbitrage profits
    │
    ▼
OptimizerGenesisKey.depositMEV()
    │
    ▼
Holders call claimMEV()
    │
    ▼
ETH transferred to holder's wallet
```

---

## FAQ

**Q: Can I sell my Genesis Key?**
A: Yes, it's an ERC-721 NFT. Trade on OpenSea or any marketplace.

**Q: Do I lose utility if I sell?**
A: Yes, the new owner gets the utility.

**Q: How often is MEV distributed?**
A: MEV is deposited by the protocol and can be claimed anytime.

**Q: Is there a minimum hold period?**
A: No, but selling means losing zero fees and MEV share.

---

*Next: [Roadmap](./07-ROADMAP.md)*
