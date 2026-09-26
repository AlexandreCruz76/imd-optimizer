# OPTIMIZER — Investor Guide

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Testnet-blue)

> *"Protecting retail capital against MEV bots through intelligent Meta-Hooks."*

---

## 📌 Executive Summary

**Optimizer** is a DeFi protocol that implements a **3-Layer Meta-Hook** on **Uniswap V4** to:

- **Protect** retail investors against bot arbitrage
- **Optimize** yield through automatic MEV capture
- **Distribute** fees fairly to $BUILDER holders

---

## 🎯 Problem We Solve

| Problem | Impact | Optimizer Solution |
|---------|--------|-------------------|
| **MEV Bots** | $600M+ stolen/year from retail | MEV internalization via Hook |
| **Fair Fees** | Retail pays more than institutions | Dynamic fees based on NFT |
| **Suboptimal Yield** | LPs miss opportunities | Automatic Hook vs Native arbitrage |
| **Complexity** | Hard to access advanced DeFi | Simple and intuitive interface |

---

## 💰 Business Model

### Revenue Sources

1. **Swap Fees** (0.5% - 1%)
   - Retail pays higher fees
   - Genesis Key holders pay 0%
   - Identity MD holders pay 0.1%

2. **MEV Capture**
   - Internal arbitrage via Hook
   - 100% of profit returns to LPs

3. **Performance Fee** (15% of yield)
   - 60% → $BUILDER Stakers
   - 20% → Treasury
   - 15% → Developers
   - 5% → Burn

### Revenue Projections

| Scenario | TVL | Monthly Volume | Annual Revenue |
|----------|-----|----------------|----------------|
| **Conservative** | $1M | $10M | $120K |
| **Moderate** | $10M | $100M | $1.2M |
| **Optimistic** | $100M | $1B | $12M |

---

## 🏗️ Technology

### Technical Stack

| Component | Technology | Status |
|-----------|------------|--------|
| **Smart Contracts** | Solidity 0.8.28 | ✅ Audited |
| **Blockchain** | Ethereum Mainnet | ✅ |
| **DEX** | Uniswap V4 | ✅ |
| **Frontend** | Next.js 16 | ✅ |
| **Graph** | The Graph | ✅ |

### Technical Differentiators

1. **3-Layer Meta-Hook**
   - Layer 1: Identity-Fi (dynamic fees)
   - Layer 2: Elasticity (automatic burns)
   - Layer 3: MEV Internalization

2. **The Standard Integration**
   - Deterministic burns
   - Active value reserve

3. **Security**
   - ReentrancyGuard
   - Slippage Protection
   - Block Delay between operations

---

## 📊 Key Metrics

### Performance Indicators

| Metric | Description | Target |
|--------|-------------|--------|
| **TVL** | Total Value Locked | $10M+ |
| **Volume** | Monthly swap volume | $100M+ |
| **APY** | Annual yield for LPs | 30%+ |
| **Utilization** | % of volume via Hook | 50%+ |

### Growth KPIs

| Metric | Description | 6-Month Target |
|--------|-------------|----------------|
| **Users** | Unique wallets | 10,000+ |
| **NFTs** | Genesis Keys minted | 100/100 |
| **Stakers** | $BUILDER staked | 1M+ tokens |
| **Pools** | Active pools | 5+ |

---

## 🗓️ Roadmap

### Phase 1: Foundation (Q3 2026) ✅

- [x] Deploy OptimizerHook (Sepolia)
- [x] Deploy OptimizerRouter (Sepolia)
- [x] Frontend with Dashboard
- [x] Pool State API
- [x] On-chain Burn Mechanics
- [x] Arbitrage Engine

### Phase 2: Growth (Q4 2026)

- [ ] Mainnet Deploy
- [ ] Formal audit (Trail of Bits / OpenZeppelin)
- [ ] The Graph Integration
- [ ] Genesis Key NFT Launch (opens with BETA on mainnet — price/date announced then)
- [ ] Full codebase open-source (BETA milestone)
- [ ] $BUILDER Staking Launch

### Phase 3: Scale (Q1 2027)

- [ ] Multi-chain (Base, Arbitrum)
- [ ] Institutional API
- [ ] Governance (DAO)
- [ ] Cross-chain bridges

---

## 💵 Tokenomics

### $BUILDER Token

| Allocation | % | Vesting |
|------------|---|---------|
| **Team** | 20% | 2 years (6 months cliff) |
| **Treasury** | 30% | 3 years |
| **Staking Rewards** | 25% | 4 years |
| **Investors** | 15% | 1 year (3 months cliff) |
| **Liquidity** | 10% | Unlocked |

### Genesis Key NFT — Tier Distribution Plan

| Tier | Allocation | Benefits |
|------|-----------|----------|
| **Genesis** | First-come, first-served | 0% fees + MEV share + governance |
| **Backer** | First-come, first-served | Priority access + 2× governance |
| **Total supply** | **100** (`MAX_SUPPLY`, test-verified) | — |

> Price and mint date are intentionally not published — announced together with
> the BETA mainnet release, when the full codebase opens
> (see [README — Open Source at BETA](README.md#-open-source-at-beta-mainnet)).

---

## 🏆 Team

**Alexandre Cruz da Cunha** — Founder & Lead Developer

- Solidity and DeFi experience
- Previous projects: FrenPet ($100M+ MC)
- Focus: Uniswap V4 Hooks and MEV

---

## 📞 Contact

| Channel | Link |
|---------|------|
| **Twitter** | [@your-handle](https://twitter.com/your-handle) |
| **Discord** | [discord.gg/your-server](https://discord.gg/your-server) |
| **Telegram** | [t.me/your-group](https://t.me/your-group) |
| **Email** | invest@optimizer.imd |

---

## 📚 Technical Documentation

For investors seeking technical depth:

1. [README.md](README.md) — Architecture, tests, tier distribution & open-source plan
2. [PITCH_INVESTIDOR.md](PITCH_INVESTIDOR.md) — Executive pitch
3. [README-HOOKS.md](README-HOOKS.md) — Hooks overview
4. [contracts/public/](contracts/public/) — Public interfaces

> Full architecture & strategy documentation ships with the open-source BETA release.

---

## ⚠️ Disclaimer

This document is for informational purposes only and does not constitute financial advice. Cryptocurrency investments are high risk. Do your own research (DYOR).

---

**Last updated:** September 2026

**Version:** 1.0.0
