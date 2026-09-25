# Optimizer Oracle — Architecture & Process Diagrams

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ETHEREUM MAINNET (Chain ID: 1)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│   │  Public RPC   │───▶│ PoolManager  │───▶│ Swap Events  │                │
│   │ publicnode.com│    │ 0x0000000... │    │ Topic: 0x40e9│                │
│   └──────────────┘    └──────────────┘    └──────┬───────┘                │
│                                                   │                        │
│                                    ┌──────────────┴──────────────┐         │
│                                    │                             │         │
│                               ┌────▼────┐                 ┌─────▼────┐    │
│                               │ IMD/ETH │                 │ ETH/USDC │    │
│                               │  Pool   │                 │ Standard │    │
│                               └─────────┘                 └──────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORACLE SCRIPTS (Node.js)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ mev-oracle-     │  │ network-        │  │ pool-           │            │
│  │ scan.js         │  │ intelligence.js │  │ analysis.js     │            │
│  │                 │  │                 │  │                 │            │
│  │ • 50 blocks     │  │ • 200 blocks    │  │ • IMD deep-dive │            │
│  │ • Sandwich det. │  │ • Pool analytics│  │ • Cross-pool    │            │
│  │ • Bot leaderboard│  │ • Trader class. │  │ • Arbitrage     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                                  │
│  │ uniswap-v4-     │  │ oracle-api.js   │                                  │
│  │ mapping.js      │  │                 │                                  │
│  │                 │  │ • HTTP :3001    │                                  │
│  │ • 5000 blocks   │  │ • 60s cache     │                                  │
│  │ • All V4 pools  │  │ • CORS enabled  │                                  │
│  └─────────────────┘  └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │ oracle-api.js                   │  │ /api/oracle/route.ts            │ │
│  │ Standalone Server :3001         │  │ Next.js API Route               │ │
│  │                                 │  │                                 │ │
│  │ GET /          → Dashboard      │  │ GET /api/oracle → JSON data     │ │
│  │ GET /health    → Status check   │  │ Cache: 60s TTL                  │ │
│  └─────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                             │
│                              ┌──────────────┐                               │
│                              │ Cache Layer  │                               │
│                              │ TTL: 60s     │                               │
│                              └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ /oracle         │  │ /swap           │  │ Other Pages     │            │
│  │ MEV Dashboard   │  │ Token Swap      │  │ /burns          │            │
│  │                 │  │                 │  │ /arbitrage      │            │
│  │ • Terminal UI   │  │ • IMD selector  │  │ /staking        │            │
│  │ • Auto-refresh  │  │ • Fee tiers     │  │ /nft-mint       │            │
│  │ • Cross-pool    │  │ • Slippage      │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Data Pipeline Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  RPC Request │───▶│  Raw Event   │───▶│ Parse Events │───▶│   Filter     │
│  getLogs()   │    │    Logs      │    │ Decode Data  │    │  Contracts   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ API Response │◀───│Recommendation│◀───│ Cross-Pool   │◀───│    Pool      │
│   JSON       │    │   Deploy     │    │  Intel       │    │  Grouping    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Display    │◀───│    JSON      │◀───│MEV Detection │◀───│   Trader     │
│ Terminal UI  │    │   Output     │    │  Sandwich    │    │  Analytics   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## 3. MEV Detection Process

### Sandwich Attack Detection

```
                    ┌─────────────────┐
                    │ Sort by Block + │
                    │    LogIndex     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Find BUY →     │
                    │  SELL Pairs     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Same Sender?   │──── No ────▶ Skip
                    │  Same Pool?     │
                    └────────┬────────┘
                             │ Yes
                             ▼
                    ┌─────────────────┐
                    │  Identify       │
                    │  Victims        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Victims Found?  │──── No ────▶ Cross-block Check
                    │ Within 3 Blocks?│
                    └────────┬────────┘
                             │ Yes
                             ▼
                    ┌─────────────────┐
                    │ Calculate Profit│
                    │ Estimate Loss   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Record Attack  │
                    │  Classify Bot   │
                    └─────────────────┘
```

### Bot Classification Logic

```
                    ┌─────────────────┐
                    │ Analyze Sender  │
                    │ Swap History    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Swap Frequency  │──── No ────▶ RETAIL TRADER
                    │    > 10?        │             (Low risk, protect)
                    └────────┬────────┘
                             │ Yes
                             ▼
                    ┌─────────────────┐
                    │ Pools Traded    │──── No ────▶ SINGLE-POOL BOT
                    │    > 5?         │             (Watch closely)
                    └────────┬────────┘
                             │ Yes
                             ▼
                    ┌─────────────────┐
                    │ BUY→SELL Pairs  │──── Yes ───▶ SANDWICH BOT
                    │    > 0?         │             (BLOCK immediately)
                    └────────┬────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │ Pools > 5 AND   │──── Yes ───▶ MARKET MAKER
                    │ No Pairs?       │             (Monitor)
                    └────────┬────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │  HIGH-FREQ BOT  │
                    │  (Analyze)      │
                    └─────────────────┘
```

### Cross-Pool Arbitrage Detection

```
┌─────────────────┐
│ Group Swaps by  │
│      Block      │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐    ┌─────────────────┐
│ Filter IMD Pool │    │ Filter Standard │
│     Swaps       │    │    Pool Swaps   │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Same Sender?   │──── No ────▶ Not Arbitrage
           │  Opposite Dir?  │
           └────────┬────────┘
                    │ Yes
                    ▼
           ┌─────────────────┐
           │ Record Arbitrage│
           │ Calculate Value │
           └─────────────────┘
```

## 4. API Response Structure

```json
{
  "status": "live",
  "chain": 1,
  "last_block": 21000000,
  "timestamp": "2026-09-21T...",
  "imd": {
    "swaps": 82,
    "traders": 14,
    "top5": [...]
  },
  "standard": {
    "swaps": 361,
    "traders": 67,
    "top5": [...]
  },
  "cross_pool": {
    "shared_bots": 8,
    "addresses": [...]
  }
}
```

## 5. File Responsibilities

| File | Purpose | Scan Range | Output |
|------|---------|------------|--------|
| `mev-oracle-scan.js` | MEV Scanner | 50 blocks | JSON |
| `network-intelligence.js` | Network Analytics | 200 blocks | JSON |
| `pool-analysis.js` | Pool Intelligence | 200 blocks | JSON |
| `uniswap-v4-mapping.js` | Ecosystem Mapping | 5000 blocks | JSON |
| `oracle-api.js` | Standalone API | 500 blocks | HTTP |
| `/api/oracle/route.ts` | Next.js API | 500 blocks | JSON |

## 6. Key Addresses

| Component | Address | Chain |
|-----------|---------|-------|
| PoolManager | `0x000000000004444c5dc75cB358380D2e3dE08A90` | Mainnet |
| CappedBurnHook | `0xc6c965bd164c483e87d0b550671798e9a3602840` | Mainnet |
| OptimizerRouter | `0x4fAfa38104A1c61250B5EC2e1f0cC24C90F99240` | Sepolia |
| IMD Token | `0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7` | Mainnet |
| IMD Pool ID | `0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3` | Mainnet |
| Standard Pool ID | `0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba` | Mainnet |
| V4 Settled (filter) | `0x0000000aa232009084bd71a5797d089aa4edfad4` | Mainnet |
