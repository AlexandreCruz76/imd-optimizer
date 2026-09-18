# How It Works

## The 3-Layer Meta-Hook Engine

Optimizer deploys a **Singleton Hook** on Uniswap V4 that intercepts every swap and executes three layers of logic.

---

## Layer 1: Identity-Fi (beforeSwap)

```
┌─────────────────────────────────────────┐
│         LAYER 1: IDENTITY-FI            │
├─────────────────────────────────────────┤
│                                         │
│  User swaps → Check NFT ownership       │
│                                         │
│  Genesis Key?     → 0% fee              │
│  Identity MD?     → 0.1% fee            │
│  B2B Partner?     → 0% fee              │
│  Retail           → 0.5% fee            │
│                                         │
│  Fee collected → Distributed to $BUILD  │
└─────────────────────────────────────────┘
```

**How it works:**
1. User initiates a swap
2. Hook reads NFT ownership from wallet
3. Dynamic fee applied based on tier
4. Fees distributed to $BUILDER stakers

---

## Layer 2: Elasticity (afterSwap)

```
┌─────────────────────────────────────────┐
│         LAYER 2: ELASTICITY             │
├─────────────────────────────────────────┤
│                                         │
│  Swap completed → Check price impact    │
│                                         │
│  Price too high?  → Trigger burn        │
│  Price too low?   → Trigger mint        │
│                                         │
│  Supply adjusts → Price stabilizes      │
└─────────────────────────────────────────┘
```

**How it works:**
1. After each swap, hook checks price
2. If price deviates too much, triggers supply adjustment
3. Integrates with The Standard Reserve's elastic policy
4. Prevents extreme volatility

---

## Layer 3: MEV Internalization (afterSwap)

```
┌─────────────────────────────────────────┐
│         LAYER 3: MEV CAPTURE            │
├─────────────────────────────────────────┤
│                                         │
│  Swap completed → Detect price delta    │
│                                         │
│  Delta > 0.5%?   → Execute arbitrage    │
│  Buy low on Pool A                      │
│  Sell high on Pool B                    │
│                                         │
│  Profit → Returned to LP pool           │
└─────────────────────────────────────────┘
```

**How it works:**
1. Hook detects price difference between pools
2. Executes atomic arbitrage internally
3. Profit captured instead of going to bots
4. LPs receive the captured MEV

---

## The Result

| Without Optimizer | With Optimizer |
|-------------------|----------------|
| 129% APY | **308% APY** |
| MEV stolen by bots | MEV captured internally |
| Retail pays same fees | NFT holders pay 0% |
| Manual management | Automatic optimization |

---

## Example: 1 ETH Deposit

```
Without Optimizer:
  Deposit: 1 ETH
  APY: 129%
  Annual yield: 1.29 ETH
  MEV lost: ~0.3 ETH
  Net yield: 0.99 ETH

With Optimizer:
  Deposit: 1 ETH
  APY: 308%
  Annual yield: 3.08 ETH
  MEV captured: +0.3 ETH
  Net yield: 3.38 ETH
```

**That's 3.4x more yield.**

---

*Next: [Architecture](./03-ARCHITECTURE.md)*
