# Tokenomics

## $BUILDER Token

The utility and governance token of the Optimizer Protocol.

---

## Token Overview

| Property | Value |
|----------|-------|
| Name | Buildercoin |
| Symbol | $BUILD |
| Total Supply | 1,000,000,000 |
| Type | ERC-20 |
| Utility | Staking, Governance, Fees |

---

## Token Utility

### 1. Staking → Fees
```
Stake $BUILD → Earn 60% of protocol performance fees
```

### 2. Builder Score → Priority
```
Score = Amount × Multiplier × Time
Higher score = More fees + Governance weight
```

### 3. Governance → Control
```
Vote on protocol parameters
Proposal threshold: 1% of supply
Quorum: 10% of supply
```

### 4. Burn → Deflation
```
5% of all fees → Burn
Reduces total supply over time
```

---

## Fee Flow

```
┌─────────────────────────────────────────────────────────┐
│                   FEE DISTRIBUTION                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Swaps → 15% Performance Fee                       │
│                    │                                    │
│                    ├── 60% → $BUILDER Stakers            │
│                    │        (Optimizer Vault)            │
│                    │                                    │
│                    ├── 20% → Treasury                    │
│                    │        (Operations + Audits)        │
│                    │                                    │
│                    ├── 15% → Developers                  │
│                    │        (Maintenance)                │
│                    │                                    │
│                    └── 5% → Burn                         │
│                             (Deflation)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Staking Rewards

| TVL | APY | Annual Fees | Stakers Earn (60%) |
|-----|-----|-------------|-------------------|
| $1M | 37% | $370K | $222K |
| $5M | 37% | $1.85M | $1.11M |
| $10M | 37% | $3.7M | $2.22M |
| $25M | 37% | $9.25M | $5.55M |

---

## Multiplier System

The longer you lock, the higher your Builder Score.

```
30 days  → 1.00x multiplier
90 days  → 1.35x multiplier
180 days → 1.85x multiplier
```

**Example:**
- Stake 1,000 $BUILD for 180 days
- Score = 1,000 × 1.85 = 1,850 points
- If total score = 100,000
- Your share = 1.85% of fees

---

## Deflation Mechanism

Every quarter:
1. 5% of fees used to buy $BUILD from market
2. Bought tokens burned permanently
3. Supply decreases
4. Scarcity increases

**Projected burns (at $10M TVL):**
- Year 1: ~$111K burned
- Year 2: ~$222K burned
- Year 3: ~$444K burned

---

## Token Distribution

```
Total Supply: 1,000,000,000 $BUILD

├── Staking Rewards:     400,000,000 (40%)
│   └── Released over 4 years
│
├── Team & Advisors:     200,000,000 (20%)
│   └── 2-year vesting, 6-month cliff
│
├── Treasury:            150,000,000 (15%)
│   └── Operations, partnerships, grants
│
├── Community:           150,000,000 (15%)
│   └── Airdrops, liquidity incentives
│
└── Seed Investors:      100,000,000 (10%)
    └── 1-year vesting, 3-month cliff
```

---

*Next: [NFT Utility](./06-NFT-UTILITY.md)*
