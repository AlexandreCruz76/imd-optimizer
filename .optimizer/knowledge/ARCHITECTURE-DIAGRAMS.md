# Optimizer Protocol — Architecture Diagrams (Mermaid)

> Copy-paste these into GitHub README, docs, or Notion. Render natively on GitHub.

---

## 1. System Architecture

```mermaid
graph TB
    subgraph "USER LAYER"
        U[👤 Trader\nWallet]
        W[🌐 Web App\nNext.js 16]
    end

    subgraph "PROTOCOL LAYER"
        R[🛡️ Optimizer Router\nMEV Guard + Simulation]
        H[🔥 CappedBurnHook\nUniswap V4 Hook]
        O[📡 MEV Oracle\nPredictive Intelligence]
    end

    subgraph "INFRASTRUCTURE LAYER"
        PM[⚙️ PoolManager\nUniswap V4 Singleton]
        SV[👁️ StateView\nOn-chain Reader]
    end

    subgraph "ECONOMIC LAYER"
        V[🏦 Optimizer Vault\nERC-4626 Yield]
        D[📦 Distributor\nFee Split]
        DR[💧 Dripper\nVesting/Streaming]
        B[🔥 Burn Executor\nDeflation]
    end

    subgraph "EXTERNAL"
        UNI[🦄 Uniswap V4\nHook Pools]
        TEN[🔮 Tenderly\nSimulation RPC]
        FL[⚡ Flashbots\nMEV Relay]
    end

    U --> W
    W --> R
    R -->|1. Intercept TX| H
    R -->|2. Simulate| TEN
    H -->|3. afterSwap| PM
    PM --> UNI
    O -->|Mempool Scan| R
    O -->|Attack Patterns| H
    H -->|Burn IMD| B
    PM -->|Fees| D
    D -->|60%| V
    D -->|20%| DR
    D -->|15%| DEV[👨‍💻 Dev Fund]
    D -->|5%| B
    V -->|Yield| U
    V -->|Shares| ST[🥩 Stakers]
```

---

## 2. Anti-MEV Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Trader
    participant Router as Optimizer Router
    participant Oracle as MEV Oracle
    participant Hook as CappedBurnHook
    participant PM as PoolManager
    participant Vault as Vault ERC-4626

    Trader->>Router: Swap Request (ETH→IMD)
    
    par Parallel Detection
        Router->>Oracle: Check mempool for attacks
        Oracle-->>Router: Attack probability: 87%
        Router->>Tenderly: Simulate with/without protection
        Tenderly-->>Router: Protected: -0.02% slippage
    end
    
    alt Attack Detected
        Router->>Hook: Execute with protection flag
        Hook->>Hook: Calculate price impact
        Hook->>Hook: Burn IMD (reduce attacker profit)
        Hook->>PM: Settle protected swap
        PM-->>Trader: Swap executed safely
    else No Attack
        Router->>PM: Normal swap
        PM-->>Trader: Swap executed
    end
    
    PM->>Vault: Protocol fees
    Vault->>Trader: Yield distribution (quarterly)
```

---

## 3. Tokenomics Flow

```mermaid
flowchart LR
    subgraph "REVENUE SOURCES"
        F1[📊 Swap Fees\n1% LP Fee]
        F2[🔥 Burn Fees\nMEV Protection]
        F3[📈 Vault Yield\nDeployed Capital]
    end

    subgraph "DISTRIBUTOR\nSmart Contract"
        D[📦 Distributor\n0x9046...eca30]
    end

    subgraph "ALLOCATION"
        A1[🥩 Stakers\n60% → Vault]
        A2[🏛️ Treasury\n20% → Ops/Audits]
        A3[👨‍💻 Developers\n15% → Maintenance]
        A4[🔥 Burn\n5% → Deflation]
    end

    subgraph "VAULT ERC-4626\n0x9efa...a97247"
        V[💰 Total Assets\n1.66M IMD\n44% Supply]
        S[📊 Share Price\n0.00000793]
    end

    F1 --> D
    F2 --> D
    F3 --> D
    D --> A1
    D --> A2
    D --> A3
    D --> A4
    A1 --> V
    V --> S
```

---

## 4. Hook Protection Mechanism

```mermaid
stateDiagram-v2
    [*] --> SwapInitiated
    SwapInitiated --> CalculateImpact: afterSwap()
    CalculateImpact --> CheckThreshold: priceImpact > 0.5%
    
    CheckThreshold --> NormalSettlement: LOW impact
    CheckThreshold --> ActivateProtection: HIGH impact
    
    ActivateProtection --> CalculateBurn: burnAmount = impact * factor
    CalculateBurn --> ExecuteBurn: BurnExecutor.burn(IMD)
    ExecuteBurn --> ReduceAttackerProfit: Attacker sees reduced gain
    ReduceAttackerProfit --> DeterAttack: MEV unprofitable
    DeterAttack --> ProtectedSettlement
    
    NormalSettlement --> [*]
    ProtectedSettlement --> [*]
```

---

## 5. MEV Oracle Detection Pipeline

```mermaid
flowchart TD
    subgraph "INGESTION"
        M1[📥 Mempool Listener\nWebSocket / RPC]
        M2[📊 Block Subscriber\nNew Block Events]
    end

    subgraph "PROCESSING"
        P1[🔍 Swap Decoder\nV4 Swap Event Parser]
        P2[👥 Trader Profiler\nAddress Clustering]
        P3[🎯 Pattern Matcher\nSandwich / JIT / Arb]
    end

    subgraph "DETECTION"
        D1[🥪 Sandwich Detector\nBuy-Victim-Sell\nSame Block]
        D2[🔄 Cross-Block Detector\nBuy→Sell ≤3 blocks\nSame Trader]
        D3[💰 Profit Estimator\nmin(buy,sell) × 0.1%\nCap: 10 ETH]
    end

    subgraph "OUTPUT"
        O1[🚨 Alert API\n/alerts endpoint]
        O2[📈 Dashboard\nReal-time UI]
        O3[🛡️ Router Signal\nProtection Flag]
        O4[📊 Analytics\nHistorical DB]
    end

    M1 --> P1
    M2 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> D1
    P3 --> D2
    D1 --> D3
    D2 --> D3
    D3 --> O1
    D3 --> O2
    D3 --> O3
    D3 --> O4
```

---

## 6. Comparative Landscape

```mermaid
quadrantChart
    title Anti-MEV Solutions: Composability vs Protection
    x-axis Low Composability --> High Composability
    y-axis Low Protection --> High Protection
    
    quadrant-1 "🏆 OPTIMIZER PROTOCOL"
    quadrant-2 "Flashbots MEV-Share"
    quadrant-3 "Basic RPC Privacy"
    quadrant-4 "Commit-Reveal Schemes"
    
    "Optimizer Protocol": [0.9, 0.95]
    "Flashbots MEV-Share": [0.6, 0.7]
    "MEV Blocker": [0.5, 0.5]
    "UniswapX": [0.7, 0.6]
    "CoW Swap": [0.7, 0.65]
    "Commit-Reveal": [0.2, 0.8]
    "Threshold Encryption": [0.3, 0.75]
    "JIT Liquidity": [0.8, 0.4]
    "Private RPC": [0.4, 0.3]
    "Standard DEX": [0.9, 0.1]
```

---

## 7. Deployment Topology

```mermaid
graph LR
    subgraph "SEPOLIA TESTNET"
        SD[🚀 Deployer\n0x067f...BA0B0]
        SV2[🏦 OptimizerVaultV2\n0xBc6D...36e1]
        SR[🛣️ OptimizerRouter\n0x4b61...7926]
        SO[📡 MEV Oracle\n0x70a4...180d]
        SA[💰 AdoptionVault\n0xf2BA...91Bc]
    end

    subgraph "ETHEREUM MAINNET"
        MH[🔥 CappedBurnHook\n0xc6c9...2840]
        MV[🏦 Optimizer Vault\n0x9efa...a97247]
        MD[📦 Distributor\n0x9046...eca30]
        MDR[💧 Dripper\n0xe6d3...0884]
        MB[🔥 Burn Executor\n0xe293...c750]
        MCL[🚀 CappedBurnLauncher\n0x8058...C40d]
        MP[⚙️ PoolManager\n0x0000...08A90]
        MS[👁️ StateView\n0x7ffe...7227]
    end

    SD -.->|Deploy| SV2
    SD -.->|Deploy| SR
    SD -.->|Deploy| SO
    SD -.->|Deploy| SA
    
    MCL -.->|Created| MH
    MH -.->|Registered| MP
    MV -.->|Receives| MD
    MD -.->|Streams| MDR
    MB -.->|Burns| IMD[💎 IMD Token]
```

---

## 8. User Journey

```mermaid
journey
    title Trader Journey: Protected Swap
    section Discovery
      Visit Optimizer App: 5: Trader
      Connect Wallet: 5: Trader
    section Execution
      Select Pair IMD/ETH: 5: Trader
      Enter Amount: 5: Trader
      See Protection Badge: 5: Trader
      Submit Transaction: 5: Trader
    section Protection (Invisible)
      Router Intercepts: 5: System
      Oracle Scans Mempool: 5: System
      Hook Activates if Needed: 5: System
      Burn Protects Price: 5: System
    section Settlement
      Swap Confirmed: 5: Trader
      Receive Tokens: 5: Trader
      Earn Yield Auto: 5: Trader
    section Retention
      Check Vault APY: 4: Trader
      Stake Shares: 4: Trader
      Refer Friends: 4: Trader
```

---

## Usage

### GitHub README
```markdown
## Architecture

```mermaid
graph TB
    # ... paste diagram here ...
```
```

### Notion/Obsidian
- Paste directly — renders natively

### Mermaid Live Editor
- https://mermaid.live — paste for PNG/SVG export

### Custom Styling (CSS)
```css
.mermaid {
    background: #0a0a0a;
    color: #00ff41;
    font-family: 'JetBrains Mono', monospace;
}
```

---

**Generated:** 2026-09-24 | **Version:** 1.0 | **Repo:** github.com/AlexandreCruz76/imd-optimizer