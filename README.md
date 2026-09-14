# IMD Protocol - Optimizer Beta

> Yield optimization for Uniswap V4 Hook Pools

## Overview

IMD Protocol Optimizer is a system that optimizes liquidity positions on Uniswap V4 Hook Pools, specifically designed for the $IMD CappedBurnHook pool.

### Key Features

- **Vault System** - ERC-4626 compliant vault for yield optimization
- **Analytics Dashboard** - Real-time pool analytics and monitoring
- **Burn Tracking** - Monitor token burns and rewards
- **LP Simulation** - Simulate liquidity positions before execution
- **Adoption Program** - Community-driven funding with tiered benefits

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  IMD OPTIMIZER ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │───▶│   Backend   │───▶│  Uniswap V4 │     │
│  │  (Next.js)  │    │  (Node.js)  │    │   Hooks     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Dashboard │    │   Analytics │    │   Yield     │     │
│  │   Wallet    │    │   Burns     │    │   Optimizer │     │
│  │   Adoption  │    │   Fees      │    │   LP Mgmt   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or other Web3 wallet

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/imd-optimizer.git
cd imd-optimizer

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - SEPOLIA_RPC_URL: Your Alchemy/Infura RPC URL for Sepolia
# - MAINNET_RPC_URL: Your Alchemy/Infura RPC URL for Mainnet
# - DEPLOYER_PRIVATE_KEY: Your deployer wallet private key (WITHOUT 0x prefix)
# - ETHERSCAN_API_KEY: For contract verification
```

### Development

```bash
# Start frontend
cd frontend
npm run dev

# Access at http://localhost:3001
```

### Build

```bash
cd frontend
npm run build
npm start
```

## Features

### Dashboard
- Real-time pool analytics
- LP position tracking
- Yield projections
- Burn statistics

### Adoption Program
- Tiered support system (SEED, SPROUT, LEAF, BRANCH, TRUNK)
- Fee discounts and revenue share
- Early access to features
- Governance rights

### Analytics
- Burn tracking
- Fee analysis
- Volume monitoring
- Price TWAP

## Roadmap

### Phase 1: Beta (Current)
- [x] Core vault system
- [x] Analytics dashboard
- [x] Adoption program
- [ ] Sepolia deployment

### Phase 2: Mainnet
- [ ] Yield distribution
- [ ] Hook integration
- [ ] Perpetual trading
- [ ] Oracle system

### Phase 3: Growth
- [ ] Cross-chain deployment
- [ ] Additional pools
- [ ] Advanced derivatives
- [ ] Mobile app

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Community

- Twitter: [@surfcoderepeat](https://x.com/surfcoderepeat)
- Website: [imd.fun](https://imd.fun)

## Disclaimer

This is experimental software. Use at your own risk. The IMD Protocol team is not responsible for any losses incurred from using this software.
