# Code Snapshots Manifest — 2026-09-25

> **Snapshot:** v1.0.0-alpha | **Commit:** 68c2bff | **Date:** 2026-09-25

---

## Estrutura de Snapshots

```
.optimizer/data/code-snapshots/
├── contracts_20260925/          # Smart Contracts (Solidity)
├── frontend_20260925/           # Next.js 16 Frontend
├── hooks-contracts_20260925/    # Hook Contracts
├── src_20260925/                # Optimizer Engine (TypeScript)
├── test_20260925/               # Test Suite
├── scripts_20260925/            # Deployment & Utility Scripts
└── deploy_20260925/             # Deploy Configurations
```

---

## Contratos (contracts/)

### Public Interfaces (contracts/public/)
- `IOptimizerVault.sol` — ERC-4626 Vault Interface
- `IOptimizerRouter.sol` — Protected Swap Router Interface
- `IOptimizerHook.sol` — 3-Layer Meta-Hook Interface
- `IOptimizerGenesisKey.sol` — ERC-721 Genesis Key Interface
- `IMEVOracle.sol` — MEV Oracle Interface
- `IMigrationRouter.sol` — Migration Router Interface
- `IAdoptionVault.sol` — Adoption Vault Interface
- `IBuilderStakingVault.sol` — Builder Staking Vault Interface

### Hook Contracts (hooks-contracts/)
- `IMDTWAPHook.sol` — TWAP Oracle Hook
- `IMDPerpetualHook.sol` — Perpetual Futures Hook
- `DonationHook.sol` — Fee Collection Hook

### Archive (archive/)
- `OptimizerVault.sol` — Vault Implementation (465 lines, hardened)
- `OptimizerVaultTest.sol` — Simplified Vault for Sepolia Testing
- `MockERC20.sol` — Mock Token for Testing

---

## Frontend (frontend/)

### App Router (Next.js 16)
- `app/oracle/page.tsx` — Oracle Dashboard (2/3 + 1/3 tabs)
- `app/arbitrage/page.tsx` — Yield Arbitrage Engine
- `app/vault/page.tsx` — Vault Staking Interface
- `app/swap/page.tsx` — Protected Swap
- `app/burns/page.tsx` — Burn Statistics
- `app/staking/page.tsx` — BUILD Staking
- `app/nft-mint/page.tsx` — Genesis Key Mint
- `app/docs/page.tsx` — Documentation Hub

### API Routes
- `app/api/oracle/route.ts` — MEV Oracle (dual pool, correct decimals)
- `app/api/arbitrage/route.ts` — Yield Arbitrage Comparison
- `app/api/pool-state/route.ts` — Pool State (Graph + EventIndexer + StateView)
- `app/api/config/route.ts` — Contract Addresses for Frontend
- `app/api/swap/route.ts` — Protected Swap Endpoint
- `app/api/migration/route.ts` — Pool Migration
- `app/api/user-lp/route.ts` — User LP Positions
- `app/api/burns/route.ts` — Burn Statistics
- `app/api/fees/route.ts` — Fee Data

### Components & Lib
- `components/TerminalNav.tsx` — Navigation (ORACLE [F5])
- `lib/config.ts` — Central Configuration (mirrors src/config.ts)
- `lib/hookPoolAnalyzer.ts` — Pool Analysis Engine (676 lines)
- `lib/onChainFetcher.ts` — StateView Direct Reads
- `lib/eventIndexer.ts` — Custom Swap Event Indexer
- `lib/graphClient.ts` — The Graph Client
- `lib/contract-config.ts` — Sepolia Addresses, ABIs, Tiers

---

## Source Engine (src/)

- `config.ts` — Central Config (identical to frontend/lib/config.ts)
- `hookPoolAnalyzer.ts` — Core Analysis Engine (673 lines)
- `optimizer.ts` — Optimization Algorithm (328 lines)
- `index.ts` — CLI Entry Point (analyze, monitor, compare, state, fees, burns, volume)

---

## Test Suite (test/)

- `OptimizerVaultTest.test.js` — Vault Tests
- `OptimizerRouter.test.js` — Router Tests
- `OptimizerGenesisKey.test.js` — Genesis Key Tests

**Status:** 101 testes passing (Hardhat)

---

## Scripts (scripts/)

### Oracle & Analysis
- `mev-oracle-scan.js` — Standalone MEV Scanner
- `network-intelligence.js` — Network Analytics
- `pool-analysis.js` — Pool Deep Analysis
- `adam-oracle.js` — Adam Oracle Implementation

### Deployment
- `deploy-hooks.js` — Hook Deployment Script

---

## Deployments

### Sepolia (deployments/sepolia.json)
- OptimizerVaultV2: `0xBc6Dc23FFbCDFe1fCa602361eb566a299a5036e1`
- OptimizerRouter: `0x4b614E3eb18551ef0f1e65891fb9dABD4a397926`
- MockStandardCore: `0xf82C114B725D2ADBaaFA3316C3Ef02963760c6DC`
- MockPool: `0x0F935FAc80A329ac92DFB8f5a617f831c23Bc4ef`
- Deployer: `0x067fFf62022B1fF522f0624f4a03E42Fb6cBA0B0`
- Timestamp: 2026-09-17T23:21:07Z

### Oracle Sepolia (deployments/oracle-sepolia.json)
- MEV Oracle: `0x70a49c8dC0EEb818E3673D2c3FB4ac2bB213180d`
- Timestamp: 2026-09-21T07:03:36Z

---

## Config Files

- `hardhat.config.js` — Hardhat Config (Solidity 0.8.28, Cancun)
- `tsconfig.json` — TypeScript Config
- `package.json` — Dependencies
- `.env.example` — Environment Template

---

## Documentation (Migrated to .optimizer/knowledge/)

### Architecture & Specs
- `ARCHITECTURE-DIAGRAMS.md` — 8 Mermaid Diagrams
- `BRAND-GUIDELINES.md` — Designer Handoff (Animation, Brand, Assets)
- `ANTI-MEV-INNOVATION.md` — Technical Deep Dive (Why We're Innovative)
- `MEV-TESTING-GUIDE.md` — Sepolia, Fork, Shadow Mode, Alpha
- `HOOK-SPEC.md` — CappedBurnHook Technical Spec
- `VAULT-SPEC.md` — ERC-4626 Vault Spec
- `FASE-RETENCAO-POC.md` — Retention Phase Master Plan

### Tokenomics & Business
- `INVESTIGACAO-DISTRIBUICAO-IMD.md` — Vault Investigation (44% supply, not custody)
- `INVESTORS.md` — Investor Materials
- `PITCH_INVESTIDOR.md` — Investor Pitch
- `ADOPTION-PROGRAM.md` — Adoption Program Tiers
- `README-HOOKS.md` — Hooks Documentation

### Diagrams & Visual
- `ORACLE-DIAGRAMS.md` — ASCII Architecture
- `ORACLE-DIAGRAMS.html` — Interactive Mermaid

---

## Git History (Recent)

```
68c2bff — docs: complete retention phase + POC package
b9550b4 — fix: corrected token decimals - USDC pool uses 6 decimals
bc3c767 — feat: IMD dual-pool monitor - scan from creation, 58 attacks
28678eb — Previous state
de72c86 — Previous state
c4592c7 — Previous state
```

---

## Verification Commands

```bash
# Verify contract compilation
cd D:\imd\Optimizer && npx hardhat compile

# Run tests
cd D:\imd\Optimizer && npx hardhat test

# Check frontend build
cd D:\imd\Optimizer\frontend && pnpm build

# Verify TypeScript
cd D:\imd\Optimizer\frontend && pnpm tsc --noEmit

# Lint
cd D:\imd\Optimizer\frontend && pnpm lint
```

---

**Arquivo:** `.optimizer/data/code-snapshots/SNAPSHOT_MANIFEST_20260925.md`  
**Proximo Snapshot:** Apos Alpha Launch (v1.2.0-rc)