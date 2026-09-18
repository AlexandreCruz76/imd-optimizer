# Optimizer Protocol — Public Contracts

This folder contains **interfaces only** for the Optimizer Protocol smart contracts.

## ⚠️ Important Notice

The **full implementation** of these contracts is **proprietary** and kept in a private repository. This public repository contains only:

- Interface definitions (`I*.sol`)
- Documentation
- Frontend code
- Deployment scripts

## Contract Interfaces

| Interface | Description |
|-----------|-------------|
| `IOptimizerRouter.sol` | Protected sell with atomic MEV capture |
| `IOptimizerHook.sol` | 3-Layer Meta-Hook for Uniswap V4 |
| `IOptimizerVault.sol` | ERC-4626-style vault for yield distribution |
| `IBuilderStakingVault.sol` | Stake $BUILDER to earn fees |
| `IOptimizerGenesisKey.sol` | ERC-721 NFT for protocol access |
| `IAdoptionVault.sol` | Fundraising for mainnet deployment |
| `IMigrationRouter.sol` | Atomic migration between pools |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZER PROTOCOL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Public Repository]              [Private Repository]      │
│  ├── Interfaces (I*.sol)          ├── Full Implementation   │
│  ├── Documentation                ├── Proprietary Math      │
│  ├── Frontend                     ├── MEV Algorithms        │
│  └── Deploy Scripts               └── Off-Chain Logic       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security

- **On-chain:** Interfaces are public for verification
- **Off-chain:** Proprietary algorithms are kept private
- **Upgrades:** Parameters can be updated without contract upgrades

## License

MIT © IMD Protocol
