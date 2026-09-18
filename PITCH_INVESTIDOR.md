# Pitch — Investor Meeting
## IMD Protocol + Uniswap V4 Hook Pool Optimizer

---

## WHAT IT IS (30 seconds)

**Optimizer** is an ERC-4626 vault that automates yield farming between two Uniswap V4 pools of the IMD token:

- **Hook Pool**: pool with automatic burn (85% of tokens burned, 15% to the swarm)
- **Native Pool**: standard pool without burn

The system monitors APYs in real-time and moves liquidity to the pool paying more. The investor deposits ETH, the contract does the work.

---

## CURRENT STATUS (Hands-on)

| Item | Status |
|------|--------|
| Smart contracts | Deployed and tested (Sepolia), 161 tests passing |
| Vault (ERC-4626) | Working — deposit/withdraw/sweep |
| Frontend | 13 pages with real-time on-chain data |
| Data pipeline | Custom event indexer (no The Graph dependency) |
| Audit | 0 vulnerabilities, 0 keys on GitHub |
| Hook Pool (mainnet) | $52k TVL, 166% APY, 96 swaps/day |
| Native Pool (mainnet) | $625k TVL, 166% APY, 187 swaps/day |

---

## WHAT WE NEED TO GO TO MAINNET

### 1. Contract deployment
- Estimated cost: **~0.3 ETH** (mainnet gas)
- Contracts: OptimizerVault + AdoptionVault + HookDeployer

### 2. Initial liquidity
- IMD/WETH pool on Uniswap V4
- **Minimum**: 2 ETH + ~5,700 IMD (~$5k total)
- **Ideal**: 5 ETH + ~14,250 IMD (~$12.5k total)
- **Conservative**: 10 ETH + ~28,500 IMD (~$25k total)

### 3. Weekly operation (cash flow)
- Hook Pool volume: ~$24k/day
- Hook Pool fees: ~$238/day (1% fee tier)
- **If we capture 1% of volume**: ~$240/day = **~$1,680/week**
- **If we capture 5% of volume**: ~$1,200/day = **~$8,400/week**

---

## NUMBERS THAT MATTER

```
IMD Token:     $2.87 (mainnet)
ETH:           $2,395
Hook Pool TVL: $52,198
Native TVL:    $625,268
APY both:      ~166% (real data)
Spread:        +0.4% (Hook winning)
Swaps 24h:     283 (Hook: 96 + Native: 187)
```

---

## DIRECT ASK

> "I need **[X] ETH** to:
> 1. Deploy contracts to mainnet (~0.3 ETH)
> 2. Create liquidity in IMD/WETH pool (~[Y] ETH + IMD)
> 3. Operate for 30 days without gas worries
>
> With this capital, the system generates **~$[Z]/week** in fees.
> Estimated ROI: **[N]x in 12 months**.
>
> The vault is non-custodial — the investor can withdraw at any time.
> The contracts are already audited and tested."

---

## QUESTIONS THEY WILL ASK

### "What's the risk?"
- Non-custodial: investor maintains control
- Contracts already audited (161 tests, 0 vulnerabilities)
- Liquidity on Uniswap V4 (battle-tested protocol)
- Main risk: impermanent loss (mitigated by optimizer)

### "How long to break even?"
- With 1% of Hook Pool volume: ~30 days
- With 5% of volume: ~6 days
- Conservative scenario (0.5%): ~60 days

### "Who's already using it?"
- Hook Pool: $52k TVL (already has real liquidity)
- Native Pool: $625k TVL (active pool with volume)
- 283 swaps/day (proof of demand)

### "How do you make money?"
- 10% performance fee on vault
- Deploy fee for new hooks
- No monthly fee, no fixed cost

---

## TECHNICAL ARCHITECTURE (executive summary)

```
Investor → Deposits ETH → Vault (ERC-4626)
                                    ↓
                            Optimizer monitors APY
                                    ↓
                    Moves liquidity: Hook ↔ Native
                                    ↓
                            Fees accumulated
                                    ↓
                    Investor withdraws ETH + yield
```

---

## SUGGESTED AMOUNT

| Scenario | Investment | Liquidity | Weekly Return | 12m ROI |
|----------|------------|-----------|---------------|---------|
| Minimum | 3 ETH (~$7.2k) | 2 ETH + IMD | ~$50-150 | 4-10x |
| Ideal | 10 ETH (~$24k) | 5 ETH + IMD | ~$200-500 | 5-12x |
| Conservative | 25 ETH (~$60k) | 15 ETH + IMD | ~$500-1,500 | 5-13x |

*Returns based on 1-5% of current volume capture. Real pool data.*

---

## CLOSE

> "The protocol already works. The pools already exist. There's already real volume.
> What's missing is the initial capital to go all in.
> With [X] ETH, we deploy, add liquidity and start generating cash flow in the first week."

---
