# MEV Oracle Integration

## Overview

The MEV Oracle is a threat intelligence system that feeds real-time MEV (Maximal Extractable Value) data into the OptimizerHook contract. It enables the hook to detect and internalize MEV attacks using on-chain bot detection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  OFF-CHAIN (Scripts)                                            │
│                                                                 │
│  mev-oracle-scan.js  →  Detects MEV attacks on Mainnet          │
│  oracle-feeder.js    →  Signs & submits reports to Oracle       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ECDSA signature
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ON-CHAIN (Sepolia Testnet)                                     │
│                                                                 │
│  IMEVOracle.sol  →  Stores bot data, verifies signatures        │
│       │                                                         │
│       │ isMEVBot() view call                                    │
│       ▼                                                         │
│  OptimizerHookV2.sol  →  Queries oracle in afterSwap            │
│       │                                                         │
│       │ if bot detected:                                        │
│       ▼                                                         │
│  _executeInternalArbitrage()  →  Captures MEV, deposits to LP   │
└─────────────────────────────────────────────────────────────────┘
```

## Contracts

### IMEVOracle.sol

**Purpose:** Stores MEV bot data and verifies oracle signatures.

**Key Functions:**
- `submitMEVReport(botAddress, blockNumber, profit, signature)` - Submit signed MEV report
- `isMEVBot(addr)` - Check if address is a known MEV bot
- `getMEVData(blockNumber)` - Get MEV data for a specific block

**State:**
- `bots[address]` - MEVBot struct with confidence, profit, attack count
- `reports[]` - Array of all submitted reports
- `oracleSigner` - Address authorized to sign reports

### OptimizerHookV2.sol

**Purpose:** Modified OptimizerHook that queries the MEV Oracle.

**Changes from V1:**
- Added `mevOracle` immutable reference
- Modified `_checkMEVOpportunity()` to query oracle first
- Added `oracleQueries` and `oracleBotHits` metrics
- Added `getOracleStats()` view function

**Flow:**
1. `afterSwap()` called
2. Query `mevOracle.isMEVBot(sender)`
3. If bot detected with confidence >= 70:
   - Execute internal arbitrage
   - Deposit captured MEV to staking vault
4. Else: fallback to static price impact detection

## Scripts

### mev-oracle-scan.js (existing)

Scans Ethereum Mainnet for MEV attacks. Outputs JSON with bot leaderboard.

### oracle-feeder.js (new)

Feeds MEV data to the oracle contract:
1. Scans for MEV attacks
2. Signs reports with oracle private key
3. Submits to IMEVOracle contract

**Usage:**
```bash
# Set environment variables
export MEV_ORACLE_ADDRESS=0x...
export ORACLE_PRIVATE_KEY=0x...

# Run feeder
node scripts/oracle-feeder.js
```

### deploy-oracle.js (new)

Deploys IMEVOracle to Sepolia testnet.

**Usage:**
```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY=0x...
export ORACLE_SIGNER_ADDRESS=0x...

# Deploy
npx hardhat run scripts/deploy-oracle.js --network sepolia
```

### test-oracle-integration.js (new)

Tests the oracle integration end-to-end.

**Usage:**
```bash
# Set environment variables
export MEV_ORACLE_ADDRESS=0x...
export ORACLE_PRIVATE_KEY=0x...

# Run test
node scripts/test-oracle-integration.js
```

## Setup

### 1. Deploy Oracle

```bash
# Generate oracle signer key
openssl ecparam -genkey -name secp256k1 -out oracle_signer.key

# Get public address
npx hardhat console --network sepolia
> const wallet = new ethers.Wallet("0x...")
> console.log(wallet.address)

# Deploy
npx hardhat run scripts/deploy-oracle.js --network sepolia
```

### 2. Configure Environment

```bash
# Copy example
cp .env.example .env

# Edit .env
MEV_ORACLE_ADDRESS=0x...  # From deployment output
ORACLE_PRIVATE_KEY=0x...  # Oracle signer private key
ORACLE_SIGNER_ADDRESS=0x...  # Oracle signer public address
```

### 3. Run Oracle Feeder

```bash
# Run once
node scripts/oracle-feeder.js

# Or run continuously (every 5 minutes)
while true; do
    node scripts/oracle-feeder.js
    sleep 300
done
```

## Integration with OptimizerHook

### Option A: Deploy New Hook (Recommended)

1. Deploy `OptimizerHookV2.sol` with oracle reference
2. Update pool to use new hook
3. Old hook can be deprecated

### Option B: Upgrade Existing Hook

If hook is upgradeable:
1. Call `setMEVOracle(newOracleAddress)` on existing hook
2. No pool migration needed

## Metrics

The oracle tracks:
- `oracleQueries` - Total queries to oracle
- `oracleBotHits` - Queries that detected bots
- `hitRate` - Percentage of queries detecting bots

```solidity
function getOracleStats() external view returns (
    uint256 queries,
    uint256 botHits,
    uint256 hitRate
);
```

## Security

### Signature Verification

Reports must be signed by the oracle signer:
```solidity
bytes32 message = keccak256(abi.encodePacked(
    block.chainid,
    address(this),
    botAddress,
    blockNumber,
    profit
));
bytes32 ethSignedHash = message.toEthSignedMessageHash();
address signer = ethSignedHash.recover(signature);
require(signer == oracleSigner, "Invalid oracle signature");
```

### Replay Protection

Reports expire after 100 blocks:
```solidity
require(block.number <= blockNumber + REPORT_EXPIRY, "Report expired");
```

### Access Control

- `submitMEVReport()` - Anyone with valid signature
- `batchUpdateBots()` - Owner only
- `removeBot()` - Owner only
- `setOracleSigner()` - Owner only

## Testing

### Unit Tests

```bash
npx hardhat test test/IMEVOracle.test.js
```

### Integration Test

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-oracle.js --network sepolia

# Run test
node scripts/test-oracle-integration.js
```

### Live Test

```bash
# Run feeder on Mainnet data, submit to Sepolia oracle
node scripts/oracle-feeder.js
```

## Next Steps

1. **Deploy oracle to Sepolia**
2. **Run feeder for 24 hours** to collect bot data
3. **Analyze hit rate** and adjust confidence threshold
4. **Deploy OptimizerHookV2** with oracle integration
5. **Monitor MEV capture** on testnet
6. **Prepare for mainnet deployment**

## Files

```
contracts/
├── private/
│   ├── IMEVOracle.sol          # Oracle contract (full implementation)
│   └── OptimizerHookV2.sol     # Hook with oracle integration
├── public/
│   └── IMEVOracle.sol          # Oracle interface

scripts/
├── mev-oracle-scan.js          # MEV detection (existing)
├── oracle-feeder.js            # Feed data to oracle (new)
├── deploy-oracle.js            # Deploy oracle (new)
└── test-oracle-integration.js  # Integration test (new)
```
