# Optimizer Oracle - MEV Intelligence for Uniswap V4

## What is the Oracle?

The **Optimizer Oracle** is a real-time blockchain scanner that monitors Ethereum for MEV (Maximal Extractable Value) threats targeting liquidity providers on Uniswap V4 pools.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZER ORACLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SCANS last 500 Ethereum blocks (~1.7 hours)            │
│     ↓                                                        │
│  2. FILTERS swaps from Uniswap V4 PoolManager              │
│     ↓                                                        │
│  3. IDENTIFIES IMD and Standard (ETH/USDC) pools            │
│     ↓                                                        │
│  4. DETECTS attack patterns:                                │
│     • Sandwich: buy before, sell after victim               │
│     • Front-run: higher gas to execute first                │
│     • Cross-pool arbitrage: between IMD and Standard        │
│     ↓                                                        │
│  5. CLASSIFIES bots:                                        │
│     • Market Makers (provide liquidity)                     │
│     • MEV Bots (extract value from LPs)                     │
│     • Retail (regular users)                                │
│     ↓                                                        │
│  6. GENERATES JSON report with metrics and recommendations  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Real Data Collected

### IMD/ETH Pool (CappedBurnHook)
| Metric | Value |
|--------|-------|
| Swaps | 82 |
| Unique Traders | 14 |
| Top Trader | `0x5176...` (22 swaps) |
| MEV Status | CLEAN |

### Standard Pool (ETH/USDC)
| Metric | Value |
|--------|-------|
| Swaps | 361 |
| Unique Traders | 67 |
| Top Trader | `0x80c5...` (56 swaps) |
| MEV Status | CLEAN |

### Cross-Pool Intelligence
| Metric | Value |
|--------|-------|
| **Shared Bots** | **8** |
| Arbitrage Signal | **TRUE** |

---

## Why It Matters

### 1. **Preventive Protection**
The Oracle detects MEV bots **before** they attack. As V4 grows, Optimizer is already monitoring.

### 2. **Market Intelligence**
We know who the market makers are, how many bots operate, and where opportunities exist.

### 3. **Fee Optimization**
With volume and activity data, Optimizer can dynamically adjust fees to maximize LP yields.

### 4. **Investor Dashboard**
The Oracle provides real-time data for investors like Adam to evaluate protocol potential.

---

## How to Use

### Start the API
```bash
node scripts/oracle-api.js
```

### Open Dashboard
```
open dashboard/oracle-dashboard.html
```

### API Endpoint
```
GET http://localhost:3001/
```

### Response
```json
{
  "status": "live",
  "chain": 1,
  "last_block": 26023029,
  "imd": { "swaps": 82, "traders": 14 },
  "standard": { "swaps": 361, "traders": 67 },
  "cross_pool": { "shared_bots": 8 }
}
```

---

## Key Metrics for Investors

| Metric | Value | Meaning |
|--------|-------|---------|
| IMD Swaps | 82/500 blocks | Active pool |
| IMD Traders | 14 | User base |
| Shared Bots | 8 | Cross-pool opportunity |
| MEV Status | CLEAN | Window for preventive deploy |
| IMD Volume | ~10,500 ETH | Potential scale |

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Ethereum   │────▶│  Oracle Node │────▶│   Dashboard  │
│   RPC Node   │     │  (Scanner)   │     │   (Web UI)   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Optimizer   │
                    │  CappedBurn  │
                    │    Hook      │
                    └──────────────┘
```

---

## Next Steps

1. **Deploy CappedBurnHook** on IMD pool
2. **Activate Oracle** as continuous service
3. **Web dashboard** for real-time monitoring
4. **Automatic alerts** when MEV is detected

---

*Optimizer Protocol - Protecting LPs from MEV, one block at a time.*
