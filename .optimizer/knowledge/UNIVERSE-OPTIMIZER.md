# OPTIMIZER PROTOCOL — UNIVERSO COMPLETO

**Version:** 3.0 | **Date:** September 2026 | **Codename:** The Agentic Meta-Hook

---

## 1. OS 3 PRINCÍPIOS FUNDADORES

### Princípio 1: Determinismo > Escolha Humana
O capital sempre será roteado matematicamente para a rota de maior eficiência. Não há opção manual que vença o código.

### Princípio 2: Identidade como Portão
NFTs são passaportes on-chain. Quem tem o NFT recebe desconto. Quem não tem paga premium. O varejo subsidia o holder.

### Princípio 3: Internalização de MEV
Lucros que seriam roubados por robôs de arbitragem são capturados internamente e devolvidos aos provedores de liquidez.

---

## 2. OS PRODUTOS

| Produto | Tipo | Status | Função |
|---------|------|--------|--------|
| **OptimizerVault** | Smart Contract | ✅ Deployed (Sepolia) | ERC-4626 vault — único entry point para Hook Pool |
| **MigrationRouter** | Smart Contract | ✅ Compiled | Migração atômica entre pools (Hook ↔ Native) |
| **Arbitrage Engine** | API Backend | ✅ Live | Calcula spread, recomenda ação, simula yield |
| **Event Indexer** | Library | ✅ Live | Lê Swap events on-chain (fallback para The Graph) |
| **OptimizerGenesisKey** | NFT (ERC-721) | ⏳ Phase 1 | Licença utility — taxa zero + MEV share |
| **BuilderStakingVault** | Smart Contract | ⏳ Phase 1 | Stake $BUILDER → 60% das performance fees |
| **OptimizerHook** | Smart Contract | ⏳ Phase 2 | Meta-Hook de 3 camadas (V4 Singleton) |
| **Hook Factory** | Smart Contract | ⏳ Phase 3 | B2B: protocolos criam pools via Optimizer |
| **IMD Explorer** | Frontend | ⏳ Phase 1 | Dashboard + Execução integrada |

---

## 3. PÚBLICO-ALVO

### Camada 1: Holders de NFT (VIP)
- **Perfil:** Detentores de Identity MD NFTs
- **Necessidade:** Acesso a yield máximo sem complexidade
- **Solução:** Taxa zero + prioridade no roteamento
- **Quantidade estimada:** 500–2,000 wallets

### Camada 2: Investidores DeFi (Varejo)
- **Perfil:** LPs que perdem rendimento em pools nativas
- **Necessidade:** Maximizar APY sem monitoramento
- **Solução:** OptimizerVault — deposita, esquece, ganha 5x mais
- **Quantidade estimada:** 5,000–50,000 wallets

### Camada 3: Protocolos B2B (Tesourarias)
- **Perfil:** The Standard Reserve, novos projetos V4
- **Necessidade:** Proteção MEV + Identity-Fi + Elasticidade
- **Solução:** Hook Factory — plug-and-play
- **Quantidade estimada:** 10–50 protocolos

### Camada 4: Desenvolvedores (Builders)
- **Perfil:** Devs que constroem sobre V4
- **Necessidade:** Infraestrutura para indexar e rotear
- **Solução:** APIs + Hook Factory + Grants
- **Quantidade estimada:** 100–500 devs

---

## 4. ATIVOS INICIAIS

### Tokens
| Token | Símbolo | Supply | Tipo | Utilidade |
|-------|---------|--------|------|-----------|
| Identity MD | $IMD | Variável | ERC-20 | Token base do ecossistema |
| Buildercoin | $BUILD | 1B fixo | ERC-20 | Fuel do Optimizer + Governance |
| Optimizer LP | oLP | Variável | ERC-20 | Recibo de depósito no vault |

### NFTs
| NFT | Supply | Preço | Utilidade |
|-----|--------|-------|-----------|
| Identity MD | 2,000 | Variável | Passaporte de acesso |
| Optimizer Genesis Key | 100 | 0.5–1 ETH | Taxa zero + MEV share |
| IMD Vault Position | Ilimitado | 0.3% fee | Wrapper de NFT locked |

### Pools Uniswap V4
| Pool | Tipo | TVL Atual | APY |
|------|------|-----------|-----|
| ETH/IMD (Hook) | CappedBurnHook | $50K | 308% |
| ETH/IMD (Native) | Sem hooks | $602K | 129% |
| ETH/$STANDARD | Elastic Hook | TBA | TBA |

---

## 5. AS REGRAS DO PROTOCOLO

### Regras de Taxas
```
 PERFORMANCE FEE (sobre yield gerado):
 ├── Holders NFT Genesis: 0% (zero)
 ├── Holders Identity MD: 10% (desconto)
 ├── Tier BASIC: 15%
 ├── Tier PRO: 10%
 ├── Tier WHALE: 5%
 └── Default (sem NFT): 20%

 DEPOSIT FEE:
 └── 0.3% (todos os depósitos)

 EARLY WITHDRAWAL FEE:
 └── 2% (saque antes do lock period)

 FEE DISTRIBUTION:
 ├── 60% → $BUILDER Stakers (Optimizer Vault)
 ├── 20% → Treasury (operação + auditorias)
 ├── 15% → Developers (manutenção)
 └──  5% → Burn (deflação de $BUILDER)
```

### Regras de Lock
```
 LOCK TIERS:
 ├── 30 dias  → Multiplicador 1.00x
 ├── 90 dias  → Multiplicador 1.35x
 └── 180 dias → Multiplicador 1.85x

 BUILDER SCORE:
 └── Score = Depósito × Multiplicador × Tempo

 FEE SHARE:
 └── Share = BuilderScore / TotalBuilderScore × 60% Fees
```

### Regras de Governança
```
 VOTAÇÃO:
 ├── Quórum: 10% do supply circulante
 ├── Duração: 7 dias
 ├── Timelock: 48h após aprovação
 └── Poder de voto: Proporcional ao Builder Score

 PARÂMETROS GOVERNÁVEIS:
 ├── Fee tiers (min/max)
 ├── Hook Factory parameters
 ├── Grant allocations
 ├── Novos vaults aprovados
 └── Integrações B2B
```

---

## 6. O UNIVERSO OPTIMIZER — PERSONAGENS

### Protagonistas
| Personagem | Papel | Conexão |
|------------|-------|---------|
| **O Sapo Agêntico** | Mascote do protocolo | Pepe em armadura cyberpunk, captura MEV |
| **Adam (@surfcoderepeat)** | Fundador do $IMD | Cria identidade (NFT) + burn mechanics |
| **The Standard Reserve** | Banco central on-chain | Política monetária elástica via hooks |
| **Nagato** | Analista/Colaborador | Análises técnicas + conteúdo |

### Infraestrutura
| Componente | Papel | Local |
|------------|-------|-------|
| **OptimizerHook** | Motor de execução | V4 Singleton |
| **Smart Router** | Roteador determinístico | ERC-4626 Vault |
| **Event Indexer** | Leitor de dados on-chain | Backend |
| **The Graph** | Indexador de dados | Subgraph |

### Comunidade
| Grupo | Papel | Quantidade |
|-------|-------|------------|
| **Genesis Holders** | Investidores anjo | 100 wallets |
| **$BUILD Stakers** | Provedores de segurança | Ilimitado |
| **Identity MD Holders** | Comunidade VIP | 2,000 wallets |
| **Builders** | Desenvolvedores | 100–500 |

---

## 7. SEEDS E INVESTIDORES

### Rodada Pre-Seed (Q4 2026)
| Fonte | Ask | Condição |
|-------|-----|----------|
| **Uniswap Foundation Grant** | $50K–$75K | Não-diluitivo |
| **Adam (@surfcoderepeat)** | $25K–$50K | Angel ticket |
| **Standard Reserve Team** | $25K–$50K | Strategic partner |
| **Comunidade IMD** | $25K–$50K | Via Genesis NFT |

### Rodada Seed (Q1 2027)
| Fonte | Ask | Valuation |
|-------|-----|-----------|
| **VCs DeFi** | $500K–$1M | $10M–$15M |
| **Anjos estruturados** | $250K–$500K | $8M–$12M |

### Rodada Series A (Q2 2027)
| Fonte | Ask | Valuation |
|-------|-----|-----------|
| **a16z / Paradigm / Framework** | $2M–$5M | $25M–$40M |

---

## 8. PRICING

### Optimizer Genesis Key
| Tier | Supply | Preço | Total Raise | Utility |
|------|--------|-------|-------------|---------|
| **GENESIS** | 100 | 0.5 ETH | 50 ETH | Taxa zero + MEV share + Governance |
| **BACKER** | 50 (reserva) | 1 ETH | 50 ETH | Taxa zero + MEV share + Priority |

**Total Target:** 50–100 ETH ($150K–$300K)

### $BUILDER Staking
| Lock | APY Base | Multiplier | APY Efetivo |
|------|----------|------------|-------------|
| 30 dias | 37% | 1.00x | 37% |
| 90 dias | 37% | 1.35x | 50% |
| 180 dias | 37% | 1.85x | 68.5% |

### Performance Fees (Revenue)
| TVL | APY | Yield Anual | Fees (15%) | $BUILD Stakers (60%) |
|-----|-----|-------------|------------|----------------------|
| $1M | 37% | $370K | $55.5K | $33.3K |
| $5M | 37% | $1.85M | $277.5K | $166.5K |
| $10M | 37% | $3.7M | $555K | $333K |
| $25M | 37% | $9.25M | $1.39M | $832.5K |

---

## 9. ESTRATÉGIA

### Fase 1: Provar o Motor (Q4 2026)
- Deploy Smart Router em mainnet
- Provar 5x yield delta com dados reais
- Lançar Genesis NFT (50–100 ETH)
- Submeter Grant para Uniswap Foundation

### Fase 2: Construir a Fábrica (Q1 2027)
- Auditar OptimizerHook.sol
- Primeiro B2B: The Standard Reserve
- Campanha "Identity-Fi" global

### Fase 3: Dominar o Mercado (Q2 2027)
- Protocolo aberto para qualquer token
- Cross-chain (Base, Arbitrum, Optimism)
- Series A ($25M–$40M valuation)

---

## 10. O QUE APLICAR AGORA (Implementação Imediata)

### Contratos (Smart Contracts)
1. `OptimizerGenesisKey.sol` — NFT ERC-721 para mint
2. `BuilderStakingVault.sol` — Stake $BUILDER → fees
3. `OptimizerHook.sol` — Meta-Hook de 3 camadas
4. `HookFactory.sol` — Deploy de hooks para B2B

### Frontend (Next.js)
1. `/` — Dashboard principal
2. `/arbitrage` — Motor de arbitragem
3. `/nft-mint` — Mint do Genesis Key
4. `/staking` — Stake $BUILDER
5. `/migration` — Migração entre pools

### Backend (API Routes)
1. `/api/arbitrage` — Dados de arbitragem
2. `/api/nft` — Status do mint
3. `/api/staking` — Dados de staking
4. `/api/pool-state` — Estado das pools

### Infraestrutura
1. Hardhat config — Rede Sepolia + Mainnet
2. Deploy scripts — Todos os contratos
3. Testes — 100% cobertura
4. RPC nodes — Ethereum mainnet

### Documentação
1. EDocs (GitBook) — Estrutura completa
2. Smart Contract docs — NatSpec
3. API docs — OpenAPI/Swagger
4. User guides — Tutoriais

---

## 11. DIAGRAMA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZER META-HOOK ENGINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [👤 Capital]                                                   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ OPTIMIZER VAULT │ ← Único entry point                       │
│  │ (ERC-4626)      │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           OPTIMIZER META-HOOK ENGINE                 │       │
│  │                                                     │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Layer 1: IDENTITY-FI (beforeSwap)            │   │       │
│  │  │ → Lê Identity MD NFT / Genesis Key           │   │       │
│  │  │ → Taxa dinâmica: 0% / 0.1% / 0.5%           │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                     ↓                               │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Layer 2: ELASTICITY (afterSwap)              │   │       │
│  │  │ → Sincroniza $IMD Burns + Standard Reserve   │   │       │
│  │  │ → Aciona auto-burn em contração              │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                     ↓                               │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Layer 3: MEV INTERNALIZATION                 │   │       │
│  │  │ → Detecta delta de preço (burn events)       │   │       │
│  │  │ → Executa arbitragem internamente            │   │       │
│  │  │ → Lucro volta para LP pool                   │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                                                     │       │
│  └─────────────────────────────────────────────────────┘       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ UNISWAP V4      │                                            │
│  │ SINGLETON       │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│     ┌─────┴─────┐                                               │
│     ▼           ▼                                               │
│  [Hook Pool]  [Native Pool]                                     │
│  (308% APY)   (129% APY)                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                $BUILDER FLYWHEEL                     │       │
│  │                                                     │       │
│  │  Stake $BUILD → Earn 60% Fees → Compound → Repeat  │       │
│  │                                                     │       │
│  │  Genesis NFT → Zero Fees → MEV Share → Governance   │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*"O Optimizer não é um cofre. É um banco central autônomo que protege o capital do varejo contra a inércia e os robôs."* ⬛️🟩
