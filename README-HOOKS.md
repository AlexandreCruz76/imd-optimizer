# IMD Optimizer Hooks

Custom Uniswap V4 hooks for the IMD Protocol Optimizer.

## Overview

This package contains three custom hooks for Uniswap V4:

1. **DonationHook** - Collects fees from donations to fund the Optimizer protocol
2. **IMDTWAPHook** - Provides Time-Weighted Average Price (TWAP) oracle
3. **IMDPerpetualHook** - Enables perpetual futures trading on IMD pools

## Contracts

### DonationHook.sol

A hook that collects a fee from donations to fund the Optimizer protocol.

**Features:**
- Collects 10% fee on all donations
- Transfers fees to protocol owner
- Tracks total donations and fees collected
- Emits events for transparency

**Usage:**
```solidity
// Deploy with PoolManager address
DonationHook hook = new DonationHook(poolManager);

// Donate to a pool
hook.donate{value: 0.1 ether}(poolKey, amount0, amount1);
```

### IMDTWAPHook.sol

A hook that provides Time-Weighted Average Price (TWAP) oracle for IMD pools.

**Features:**
- Tracks cumulative prices over time
- Calculates TWAP for any time period (1-24 hours)
- Resistant to flash loan attacks
- Provides accurate price feeds for derivatives

**Usage:**
```solidity
// Deploy with PoolManager address
IMDTWAPHook hook = new IMDTWAPHook(poolManager);

// Get TWAP for a pool
(uint256 twap0, uint256 twap1) = hook.getTWAP(poolId, 1 hours);
```

### IMDPerpetualHook.sol

A hook that enables perpetual futures trading on IMD pools.

**Features:**
- Open long/short positions with up to 10x leverage
- Dynamic funding rates based on long/short ratio
- Automatic liquidation when margin is insufficient
- Position management and PnL calculation

**Usage:**
```solidity
// Deploy with PoolManager address
IMDPerpetualHook hook = new IMDPerpetualHook(poolManager);

// Open a long position with 5x leverage
bytes32 positionId = hook.openPosition{value: 0.1 ether}(poolKey, PositionType.LONG, 5);

// Close position
hook.closePosition(positionId, poolKey);
```

## Installation

```bash
npm install
```

## Compilation

```bash
npx hardhat compile
```

## Deployment

### Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Configuration

Update `hardhat.config.js` with your:
- RPC endpoints
- Private keys
- Etherscan API keys

## Testing

```bash
npx hardhat test
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  IMD OPTIMIZER HOOKS                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DonationHook                                               │
│  ├── beforeDonate() → Calculate fee                         │
│  └── afterDonate()  → Update stats, emit event              │
│                                                             │
│  IMDTWAPHook                                                │
│  ├── beforeSwap()  → Update cumulative prices               │
│  └── afterSwap()   → Recalculate TWAP                       │
│                                                             │
│  IMDPerpetualHook                                           │
│  ├── beforeSwap()  → Update funding rates                   │
│  └── afterSwap()   → Check liquidations                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT
