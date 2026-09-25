# Optimizer Protocol — Private Contracts

⚠️ **DO NOT COMMIT TO PUBLIC REPOSITORY** ⚠️

This folder contains the **full implementation** of the Optimizer Protocol smart contracts.

## Contents

| Contract | Description |
|----------|-------------|
| `OptimizerRouter.sol` | Protected sell with atomic MEV capture |
| `OptimizerHook.sol` | 3-Layer Meta-Hook for Uniswap V4 |
| `OptimizerVaultV2.sol` | ERC-4626-style vault for yield distribution |
| `OptimizerGenesisKey.sol` | ERC-721 NFT for protocol access |
| `BuilderStakingVault.sol` | Stake $BUILDER to earn fees |
| `AdoptionVault.sol` | Fundraising for mainnet deployment |
| `MigrationRouter.sol` | Atomic migration between pools |
| `interfaces.sol` | All interface definitions |

## Proprietary Elements

- MEV detection algorithms
- Price impact calculations
- Optimal routing logic
- Fee optimization math
- Elasticity parameters

## Security

- **NEVER** commit to public repositories
- Store in encrypted vault
- Use hardware wallet for deployment
- Rotate keys regularly

## Deployment

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-all.js --network sepolia

# Deploy to Mainnet
npx hardhat run scripts/deploy-all.js --network mainnet
```

## License

Proprietary — IMD Protocol
