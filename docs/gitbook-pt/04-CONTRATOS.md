# Contratos

## Visão Geral

Todos os contratos são compilados com Solidity 0.8.28 e testados no Hardhat.

---

## OptimizerVault (ERC-4626)

**O único ponto de entrada para todo o capital.**

```solidity
// Funções principais
deposit(uint256 assets) → uint256 shares
withdraw(uint256 assets) → uint256 shares
swap(uint256 amountIn, bool zeroForOne) → uint256 amountOut
claimYield() → uint256 yield
```

**Características:**
- Vault compatível com ERC-4626
- Estrutura de taxas baseada em tier
- Limites de yield diário (máx 1% do TVL)
- Pausável para emergências
- Transferência de propriedade em 2 etapas

**Cobertura de Testes:** 55 testes passando

---

## OptimizerGenesisKey (ERC-721)

**Seu passaporte para taxas zero e receita de MEV.**

```solidity
// Minting
mintGenesis() payable  // 0.5 ETH — 50 supply
mintBacker() payable   // 1.0 ETH — 50 supply

// Distribuição de MEV
depositMEV() payable   // Owner deposita MEV capturado
claimMEV()             // Holder reivindica sua parte
```

**Utilidade:**
- 0% de taxas de troca PARA SEMPRE
- Participação na receita de MEV (proporcional à posse)
- Acesso prioritário a pools B2B
- Direitos de governança

**Supply Máximo:** 100 keys
**Cobertura de Testes:** 12 testes passando

---

## BuilderStakingVault (ERC-20)

**Stake $BUILDER → Ganhe 60% das taxas do protocolo.**

```solidity
// Staking
stake(uint256 amount, uint256 lockTier)
withdraw(uint256 positionIndex)
claimRewards()
```

**Tiers de Lock:**
| Dias | Multiplicador | APY |
|------|---------------|-----|
| 30 | 1.00x | 37% |
| 90 | 1.35x | 50% |
| 180 | 1.85x | 68.5% |

**Distribuição de Taxas:**
- 60% → Stakers de $BUILDER
- 20% → Tesouraria
- 15% → Desenvolvedores
- 5% → Burn

**Cobertura de Testes:** 10 testes passando

---

## OptimizerHook (V4 Singleton)

**O Meta-Hook Engine de 3 Camadas.**

```solidity
// Callbacks do hook
beforeSwap()  // Camada 1: Identity-Fi
afterSwap()   // Camada 2: Elasticidade + Camada 3: MEV

// Admin
setB2BPartner(address, bool)
executeBurn(uint256 amount)
collectFees() → uint256
withdrawMEV()
```

**Flags do Hook:**
- beforeInitialize
- beforeSwap
- afterSwap

**Cobertura de Testes:** Testes unitários pendentes (testes de integração)

---

## MigrationRouter

**Migração atômica entre pools.**

```solidity
migrateFromNativeToHook(uint256 amount)
migrateFromHookToNative(uint256 amount)
```

**Cobertura de Testes:** 55 testes (existentes)

---

## Resumo dos Testes

```
OptimizerGenesisKey:     12 passando ✅
BuilderStakingVault:     10 passando ✅
OptimizerVaultTest:      55 passando ✅
────────────────────────────────────
Total:                   77 passando ✅
```

---

*Próximo: [Tokenomics](./05-TOKENOMICS.md)*
