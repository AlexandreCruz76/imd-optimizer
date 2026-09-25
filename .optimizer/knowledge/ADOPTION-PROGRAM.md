# IMD Protocol - Adoption Program

## Overview

The IMD Protocol Adoption Program is a fundraising mechanism to support the mainnet deployment of the Optimizer system. Early supporters receive benefits including fee discounts, revenue share, early access to features, and governance rights.

## Why Adopt?

### The Problem
- Mainnet deployment requires ~0.02 ETH for gas + deployment costs
- Additional funds needed for liquidity provisioning
- Development and maintenance costs

### The Solution
- Community-funded deployment
- Supporters get early access and benefits
- Shared success through revenue sharing

## Support Tiers

### 🌱 SEED (0.005 ETH minimum) - ~$12
- **Fee Discount:** 3%
- **Revenue Share:** 0.5%
- **Max Positions:** 1
- **Early Access:** No
- **Governance:** No

### 🌿 SPROUT (0.01 ETH minimum) - ~$25
- **Fee Discount:** 5%
- **Revenue Share:** 1%
- **Max Positions:** 2
- **Early Access:** No
- **Governance:** No

### 🍃 LEAF (0.025 ETH minimum) - ~$60
- **Fee Discount:** 8%
- **Revenue Share:** 2%
- **Max Positions:** 3
- **Early Access:** Yes
- **Governance:** No

### 🌳 BRANCH (0.05 ETH minimum) - ~$120
- **Fee Discount:** 12%
- **Revenue Share:** 3.5%
- **Max Positions:** 5
- **Early Access:** Yes
- **Governance:** Yes

### 🏛️ TRUNK (0.1 ETH minimum) - ~$240
- **Fee Discount:** 20%
- **Revenue Share:** 5%
- **Max Positions:** 10
- **Early Access:** Yes
- **Governance:** Yes

## How It Works

1. **Choose a Tier:** Select a support tier based on your contribution level
2. **Contribute ETH:** Send ETH to the adoption contract
3. **Receive Benefits:** Get fee discounts and revenue share based on your tier
4. **Claim Benefits:** Withdraw accumulated benefits anytime

## Benefits Distribution

Benefits are distributed based on the protocol's revenue:
- **Performance Fees:** From vault deposits
- **Trading Fees:** From perpetual futures
- **Donation Fees:** From the donation hook
- **Oracle Fees:** From TWAP oracle usage

## Fundraising Goal

- **Target:** 5.0 ETH
- **Minimum Contribution:** 0.005 ETH
- **Current Progress:** 0.0 ETH (0%)

### Volume Projections

| Scenario | SEED (0.005) | SPROUT (0.01) | LEAF (0.025) | BRANCH (0.05) | TRUNK (0.1) | Total |
|----------|--------------|---------------|--------------|---------------|-------------|-------|
| Conservative | 100 people | 50 people | 20 people | 10 people | 5 people | 2.325 ETH |
| Moderate | 200 people | 100 people | 40 people | 20 people | 10 people | 4.65 ETH |
| Optimistic | 300 people | 150 people | 60 people | 30 people | 15 people | 6.975 ETH |

**Key Insight:** Focus on VOLUME (many small supporters) over large contributions!

## Use of Funds

| Category | Percentage | Description |
|----------|------------|-------------|
| Deployment | 20% | Mainnet contract deployment |
| Liquidity | 40% | Initial LP positions |
| Development | 20% | Ongoing development |
| Marketing | 10% | Community growth |
| Reserve | 10% | Emergency fund |

## Technical Details

### Contract Address (Sepolia)
- **AdoptionVault:** `0x0000000000000000000000000000000000000000` (To be deployed)

### Functions
- `joinTier(tier, message)` - Join a support tier
- `upgradeTier(newTier)` - Upgrade to a higher tier
- `claimBenefits()` - Claim accumulated benefits
- `getSupporterBenefits(address)` - Get supporter's benefits
- `getTierConfig(tier)` - Get tier configuration

## Roadmap

### Phase 1: Fundraising (Current)
- [ ] Deploy AdoptionVault to Sepolia
- [ ] Launch adoption program
- [ ] Reach 5.0 ETH goal

### Phase 2: Mainnet Deployment
- [ ] Deploy OptimizerVault to mainnet
- [ ] Deploy DonationHook
- [ ] Deploy IMDTWAPHook
- [ ] Deploy IMDPerpetualHook

### Phase 3: Launch
- [ ] Open vault deposits
- [ ] Start yield distribution
- [ ] Enable perpetual trading

### Phase 4: Growth
- [ ] Expand to other pools
- [ ] Add more derivatives
- [ ] Cross-chain deployment

## FAQ

### Q: What happens if the goal isn't reached?
A: Funds remain in the contract until the goal is reached. Supporters can withdraw at any time.

### Q: How are benefits calculated?
A: Benefits are calculated as a percentage of protocol revenue based on your tier's revenue share.

### Q: Can I upgrade my tier?
A: Yes, you can upgrade by paying the difference between tiers.

### Q: When can I claim benefits?
A: Benefits can be claimed anytime after they are distributed.

### Q: What governance rights do I get?
A: Higher tiers (SHARK, WHALE, FOUNDER) get voting rights on protocol changes.

## Contact

- **Twitter:** [@surfcoderepeat](https://x.com/surfcoderepeat)
- **Discord:** IMD Protocol Community
- **Website:** [imd.fun](https://imd.fun)

## License

MIT
