# OPTIMIZER — Uniswap V4 Meta-Hook Engine

![License](https://img.shields.io/badge/license-MIT-green)
![Solidity](https://img.shields.io/badge/solidity-0.8.28-blue)
![Network](https://img.shields.io/badge/network-Sepolia-blue)
![Frontend](https://img.shields.io/badge/frontend-Next.js_16-black)

> *"O Optimizer não é um cofre. É um banco central autônomo que protege o capital do varejo contra a inércia e os robôs."*

---

## 🎯 Visão Geral

O **Optimizer** é um protocolo DeFi construído sobre **Uniswap V4** que implementa um **Meta-Hook de 3 camadas** para:

1. **Proteger** o capital do varejo contra MEV bots
2. **Otimizar** yield através de arbitragem automática
3. **Distribuir** taxas para holders de $BUILDER

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZER META-HOOK ENGINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [👤 Capital do Investidor]                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ OPTIMIZER ROUTER│ ← Entry point para swaps                   │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           META-HOOK ENGINE (3 CAMADAS)               │       │
│  │                                                     │       │
│  │  Layer 1: IDENTITY-FI (beforeSwap)                   │       │
│  │  → Lê NFT Identity MD / Genesis Key                  │       │
│  │  → Taxa dinâmica: 0% / 0.1% / 0.5%                  │       │
│  │                                                     │       │
│  │  Layer 2: ELASTICITY (afterSwap)                     │       │
│  │  → Sincroniza $IMD Burns + Standard Reserve          │       │
│  │                                                     │       │
│  │  Layer 3: MEV INTERNALIZATION                        │       │
│  │  → Detecta delta de preço                            │       │
│  │  → Executa arbitragem internamente                   │       │
│  │  → Lucro volta para LP pool                          │       │
│  └─────────────────────────────────────────────────────┘       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ UNISWAP V4      │                                            │
│  │ SINGLETON       │                                            │
│  └─────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Contratos (Sepolia Testnet)

| Contrato | Endereço | Descrição |
|----------|----------|-----------|
| `OptimizerHook` | `0xc6c965bd164c483e87d0b550671798e9a3602840` | Meta-Hook de 3 camadas |
| `OptimizerRouter` | `0x4fAfa38104A1c61250B5EC2e1F0cC24C90F99240` | Router com proteção MEV |
| `OptimizerGenesisKey` | `0x...` | NFT ERC-721 (200 supply) |
| `BuilderStakingVault` | `0x...` | Stake $BUILDER → 60% fees |
| `MigrationRouter` | `0x...` | Migração atômica entre pools |

---

## 🚀 Quick Start

### Contratos

```bash
# Instalar dependências
npm install

# Compilar contratos
npx hardhat compile

# Rodar testes
npx hardhat test

# Deploy Sepolia
npx hardhat run scripts/deploy-all.js --network sepolia
```

### Frontend

```bash
cd frontend
npm install
npm run dev

# Acessar: http://localhost:3000
```

---

## 📱 Páginas do Frontend

| Rota | Descrição | Status |
|------|-----------|--------|
| `/` | Dashboard — visão geral das pools | ✅ |
| `/swap` | Protected Swap — swap com proteção MEV | ✅ |
| `/burns` | Burn Mechanics — eventos de burn on-chain | ✅ |
| `/arbitrage` | Yield Arbitrage — comparação Hook vs Native | ✅ |
| `/nft-mint` | Genesis Key — mint do NFT ERC-721 | ✅ |
| `/staking` | $BUILDER Staking — stake para earn fees | ✅ |
| `/docs` | Documentação completa | ✅ |

---

## 💰 Distribuição de Taxas

```
PERFORMANCE FEE (15% do yield):
├── 60% → $BUILDER Stakers
├── 20% → Treasury (operação + audits)
├── 15% → Developers (manutenção)
└──  5% → Burn (deflação)

FEE TIERS:
├── Genesis Key holders: 0%
├── Identity MD holders: 0.1%
├── Tier BASIC: 15%
├── Tier PRO: 10%
├── Tier WHALE: 5%
└── Default: 20%
```

---

## 🔐 Segurança

- **ReentrancyGuard** em todos os contratos
- **Slippage Protection** no OptimizerRouter
- **Block Delay** entre operações do mesmo usuário
- **Ownership Transfer** com 2-step
- **Pausable** para emergências

---

## 📊 Métricas On-Chain

| Métrica | Valor |
|---------|-------|
| **TVL** | Verificar via API `/api/pool-state` |
| **APY** | Calculado em tempo real |
| **Burns** | Eventos Trimmed on-chain |
| **Arbitrage** | Snapshot a cada 30s |

---

## 🌐 Links

| Recurso | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Pool State** | http://localhost:3000/api/pool-state |
| **API Burns** | http://localhost:3000/api/burns |
| **API Arbitrage** | http://localhost:3000/api/arbitrage |
| **Documentação** | https://github.com/your-org/optimizer |

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [UNIVERSE-OPTIMIZER.md](docs/UNIVERSE-OPTIMIZER.md) | Visão completa do ecossistema |
| [PRODUCTION-ROADMAP.md](docs/PRODUCTION-ROADMAP.md) | Roadmap de 3 fases |
| [PITCH-DECK.md](docs/PITCH-DECK.md) | Resumo para investidores |
| [ARCHITECTURE-V2.md](docs/ARCHITECTURE-V2.md) | Arquitetura técnica |
| [IDENTITY-BRANDING.md](docs/IDENTITY-BRANDING.md) | Identidade Agentic Frog |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| **Smart Contracts** | Solidity 0.8.28, OpenZeppelin 5.x |
| **Blockchain** | Ethereum (Mainnet + Sepolia) |
| **DEX** | Uniswap V4 (Singleton Architecture) |
| **Frontend** | Next.js 16, React 19, Tailwind v4 |
| **Wallet** | ethers.js v6, MetaMask |
| **Graph** | The Graph Protocol |

---

## 📄 Licença

MIT © IMD Protocol

---

## 🔗 Para Investidores

**Documentação completa:** [https://github.com/your-org/optimizer](https://github.com/your-org/optimizer)

**Contato:** [seu-email@exemplo.com]

**Twitter:** [@seu-handle](https://twitter.com/seu-handle)
