# OPTIMIZER — Investor Guide

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Testnet-blue)

> *"Protecting retail capital against MEV bots through intelligent Meta-Hooks."*

---

## 📌 Executive Summary

**Optimizer** is a DeFi protocol that implements a **3-Layer Meta-Hook** on **Uniswap V4** to:

- **Protect** retail investors against bot arbitrage
- **Optimize** yield through automatic MEV capture
- **Distribute** fees fairly to $BLD holders

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

### Revenue Sources (DEC-020)

1. **Swap Fees — Identity-Fi (0.00% – 0.50%)**
   - Tier 1 · Alpha (Buildercoin NFT): 0.00%
   - Tier 2 · Partner (Identity md NFT): 0.10%
   - Tier 3 · Holder ($IMD/$BLD > 0): 0.30%
   - Tier 4 · Retail (padrão): 0.50%

2. **Success Fee — arbitragem atômica (5% – 25%)**
   - Cobrada SOMENTE sobre o lucro (Delta Positivo)
   - Por tier: 5% / 10% / 20% / 25%
   - Se lucro ≤ 0, não há taxa (a tx reverte)

3. **MEV Capture**
   - Interceptação via Hook — ETH → Cofre (estimado/escaneado em testnet)
   - 100% da Success Fee → OptimizerVault.receiveYield()

4. **Vault Split (hardcoded 60/20/15/5)**
   - 60% → Stakers
   - 20% → Treasury
   - 15% → Developers
   - 5% → Buy-and-Burn (ETH → $IMD → BurnExecutor)

> `claimYield()` cobra 0% — Diamond Hands recebem yield integral.

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
| **NFTs** | Genesis Keys minted | 501/501 |
| **Stakers** | $BLD staked | 1M+ tokens |
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
- [ ] Genesis Key NFT Launch (501 keys × 0.05 ETH — abre com o BETA mainnet)
- [ ] Full codebase open-source (BETA milestone)
- [ ] $BLD Staking Launch

### Phase 3: Scale (Q1 2027)

- [ ] Multi-chain (Base, Arbitrum)
- [ ] Institutional API
- [ ] Governance (DAO)
- [ ] Cross-chain bridges

---

## 💵 Tokenomics

### $BLD Token

| Allocation | % | Vesting |
|------------|---|---------|
| **Team** | 20% | 2 years (6 months cliff) |
| **Treasury** | 30% | 3 years |
| **Staking Rewards** | 25% | 4 years |
| **Investors** | 15% | 1 year (3 months cliff) |
| **Liquidity** | 10% | Unlocked |

### Buildercoin Genesis Key NFT — Tier Distribution Plan

| Tier | Allocation | Benefits |
|------|-----------|----------|
| **Genesis** | First-come, first-served até 501 | 0.00% swap · 5% success fee · 4x yield |
| **Backer** | Mesma pool — 1 ETH por key | Prioridade + peso 2x na governança |
| **Total supply** | **501** (`MAX_SUPPLY`, test-verified) · 0.05 ETH | Alvo máx. 25.05 ETH |

**Uso dos fundos (40/40/20):** 40% Core Team (Codeming) · 40% Infra &
Security · 20% Growth & Bounties.

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
