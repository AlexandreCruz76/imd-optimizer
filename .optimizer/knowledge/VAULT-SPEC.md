# Optimizer Vault — ERC-4626 Specification

> **Vault de yield para stakers IMD — Recebe 60% das fees do protocolo + burn deflacionário**

---

## 1. Visão Geral

| Propriedade | Valor |
|-------------|-------|
| **Nome** | Optimizer Vault |
| **Símbolo** | oIMD |
| **Endereço** | `0x9efa934d9fad4ae28c998a40195646b965a97247` |
| **Asset** | IMD (`0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7`) |
| **Decimals** | 18 |
| **Standard** | ERC-4626 + ERC-20 (shares) |
| **Owner** | `0x0000000000000000000000000000000000000000` (RENOUNCED) |
| **Fee Collector** | Distributor (`0x9046739e1535b40efbe6ab3f45d0024b690eca30`) |

---

## 2. Estado Atual (24 Set 2026)

| Métrica | Valor |
|---------|-------|
| **Total Assets** | 1,665,088.78 IMD |
| **Total Shares** | 210,038,875,722.88 |
| **Share Price** | 0.00000792753 IMD/share |
| **% Supply Total** | 44.15% |
| **Depósitos (24h)** | +11,765 IMD (16 txs) |
| **Saques (24h)** | -1,625 IMD (5 txs) |
| **Fluxo Líquido** | +10,140 IMD |

---

## 3. Interface ERC-4626

```solidity
interface IOptimizerVault is IERC4626, IERC20 {
    // ERC-4626 Core
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256 shares);
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
    function maxDeposit(address receiver) external view returns (uint256);
    function maxMint(address receiver) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256);
    function maxRedeem(address owner) external view returns (uint256);
    function previewDeposit(uint256 assets) external view returns (uint256 shares);
    function previewMint(uint256 shares) external view returns (uint256 assets);
    function previewWithdraw(uint256 assets) external view returns (uint256 shares);
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function mint(uint256 shares, address receiver) external returns (uint256 assets);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    
    // Optimizer Extensions
    function performanceFee() external view returns (uint256); // 1500 bps = 15%
    function feeCollector() external view returns (address);
    function setFeeCollector(address newCollector) external;
    function setPerformanceFee(uint256 newFee) external;
    function harvest() external; // Called by Distributor
    function emergencyWithdraw(IERC20 token, uint256 amount) external;
    
    // Events
    event Deposit(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event Harvested(uint256 assetsAdded, uint256 performanceFee);
}
```

---

## 4. Fluxo de Yield

### 4.1 Fontes de Receita

```
┌─────────────────────────────────────────────────────────────────┐
│                      REVENUE STREAMS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SWAP FEES (Uniswap V4 Hook Pool)                           │
│     ├─ 1% LP fee em cada swap                                  │
│     ├─ 15% performance fee → Vault                             │
│     └─ 85% → LPs                                               │
│                                                                 │
│  2. BURN MECHANISM (CappedBurnHook)                            │
│     ├─ IMD queimado quando price impact > 0.5%                 │
│     ├─ Reduz supply → pressão deflacionária                    │
│     └─ Beneficia indiretamente holders (incl. Vault)           │
│                                                                 │
│  3. DEPLOYED CAPITAL (Opcional)                                │
│     ├─ Vault pode deployar assets em strategies                │
│     └─ Atualmente: HODL only (conservador)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Distribuição de Fees (Distributor)

```
Distributor recebe 100% das fees do protocolo
    │
    ├─ 60% (6000 bps) → Optimizer Vault (stakers)
    ├─ 20% (2000 bps) → Treasury (ops, audits, grants)
    ├─ 15% (1500 bps) → Dev Fund (maintenance, R&D)
    └─ 5%  (500 bps)  → Burn Executor (deflação adicional)
```

---

## 5. Operações Principais

### 5.1 Deposit (Usuário → Vault)

```solidity
function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
    // 1. Validar assets > 0
    // 2. Preview shares
    uint256 shares = previewDeposit(assets);
    
    // 3. Transfer IMD do usuário para Vault
    IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
    
    // 4. Mint shares para receiver
    _mint(receiver, shares);
    
    // 5. Emit event
    emit Deposit(msg.sender, receiver, assets, shares);
    
    return shares;
}

// Preview
function previewDeposit(uint256 assets) external view returns (uint256) {
    return convertToShares(assets);
}

function convertToShares(uint256 assets) external view returns (uint256) {
    uint256 totalAssets_ = totalAssets();
    uint256 totalSupply_ = totalSupply();
    
    if (totalSupply_ == 0) return assets; // 1:1 inicial
    
    // shares = assets * totalSupply / totalAssets
    return (assets * totalSupply_) / totalAssets_;
}
```

### 5.2 Withdraw (Vault → Usuário)

```solidity
function withdraw(
    uint256 assets, 
    address receiver, 
    address owner
) external returns (uint256 shares) {
    // 1. Validar owner approval
    // 2. Preview shares to burn
    uint256 shares = previewWithdraw(assets);
    
    // 3. Burn shares
    _burn(owner, shares);
    
    // 4. Transfer assets to receiver
    IERC20(asset()).safeTransfer(receiver, assets);
    
    // 5. Emit event
    emit Withdraw(msg.sender, receiver, owner, assets, shares);
    
    return shares;
}

function previewWithdraw(uint256 assets) external view returns (uint256) {
    return convertToShares(assets);
}
```

### 5.3 Harvest (Distributor → Vault)

```solidity
// Chamado pelo Distributor periodicamente
function harvest() external {
    require(msg.sender == feeCollector, "Only fee collector");
    
    uint256 assetsBefore = totalAssets();
    
    // Fees já estão no vault (transferidos pelo Distributor)
    // Apenas contabiliza e aplica performance fee
    
    uint256 assetsAfter = totalAssets();
    uint256 profit = assetsAfter - assetsBefore;
    
    if (profit > 0) {
        // Performance fee: 15% do lucro
        uint256 fee = (profit * performanceFee) / 10000; // 1500 bps = 15%
        uint256 netProfit = profit - fee;
        
        // Fee vai para feeCollector (Distributor redistribui)
        // Net profit fica no vault → share price sobe
        
        emit Harvested(netProfit, fee);
    }
}
```

---

## 6. Share Price Mechanics

### 6.1 Cálculo

```
sharePrice = totalAssets / totalShares

Exemplo atual:
totalAssets = 1,665,088.78 IMD
totalShares = 210,038,875,722.88
sharePrice = 1,665,088.78 / 210,038,875,722.88 = 0.00000792753 IMD/share
```

### 6.2 Evolução do Share Price

| Evento | Efeito no Share Price |
|--------|----------------------|
| Deposit | Neutro (assets ↑, shares ↑ proporcionalmente) |
| Withdraw | Neutro |
| Harvest (profit) | **AUMENTA** (assets ↑, shares constante) |
| Performance Fee | Reduz ligeiramente o aumento |
| Loss (raro) | Diminui |

### 6.3 Exemplo Prático

```
Alice deposita 10,000 IMD
→ Recebe: 10,000 / 0.00000792753 = 1,261,435,820 shares

Após 30 dias, share price = 0.00000850000
Alice saca: 1,261,435,820 × 0.00000850000 = 10,722 IMD
Lucro: 722 IMD (7.22% em 30 dias ≈ 88% APY)
```

---

## 7. Performance Fee

### 7.1 Parâmetros

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `performanceFee` | 1500 bps (15%) | Fee sobre lucro líquido |
| `feeCollector` | Distributor | Recebe a fee |

### 7.2 Cálculo

```solidity
// No harvest()
profit = assetsAfter - assetsBefore;
fee = profit * 1500 / 10000; // 15%
netProfit = profit - fee;    // 85% fica no vault

// Exemplo:
// Profit = 10,000 IMD
// Fee = 1,500 IMD → Distributor
// Net = 8,500 IMD → Vault (share price sobe)
```

---

## 8. Limites e Segurança

### 8.1 Limites de Operação

| Função | Limite | Justificativa |
|--------|--------|---------------|
| `maxDeposit` | `type(uint256).max` | Sem limite prático |
| `maxMint` | `type(uint256).max` | Sem limite prático |
| `maxWithdraw` | `balanceOf(owner)` | Não pode sacar mais que tem |
| `maxRedeem` | `balanceOf(owner)` | Não pode queimar mais shares que tem |

### 8.2 Proteções de Segurança

| Vetor | Mitigação |
|-------|-----------|
| **Reentrancy** | `nonReentrant` em deposit/withdraw/harvest |
| **Inflation Attack** | First depositor gets 1:1; mínimo 1000 shares para primeiro depósito |
| **Rounding** | `convertToShares` arredonda para baixo (favorável ao vault) |
| **Owner Renunciado** | `owner = address(0)` — nenhuma admin function funciona |
| **Emergency Withdraw** | Apenas para tokens errados enviados ao vault |

### 8.3 Inflation Attack Prevention

```solidity
function _mint(address to, uint256 shares) internal override {
    // Primeiro depositante: exige mínimo 1000 shares
    if (totalSupply() == 0) {
        require(shares >= 1000, "Min shares for first deposit");
    }
    super._mint(to, shares);
}
```

---

## 9. Integração com Ecossistema

### 9.1 Fluxo Completo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   TRADER    │────▶│  HOOK POOL  │────▶│ DISTRIBUTOR │
│  (Swaps)    │     │  (1% fee)   │     │  (Split)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
             ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
             │   VAULT     │            │  TREASURY   │            │   DEV FUND  │
             │  (60%)      │            │  (20%)      │            │  (15%)      │
             │  oIMD       │            │  Ops/Audits │            │  Maintenance│
             └──────┬──────┘            └─────────────┘            └─────────────┘
                    │
                    ▼
             ┌─────────────┐
             │   STAKERS   │
             │  (Yield)    │
             └─────────────┘
```

### 9.2 Staking BUILD (Opcional)

```solidity
// BuilderStakingVault — separa do Optimizer Vault
// Stakers de BUILD recebem % adicional das fees

interface IBuilderStakingVault {
    function stake(uint256 amount, uint256 lockDuration) external; // 30/90/180 dias
    function unstake(uint256 shares) external;
    function claimRewards() external;
    function getMultiplier(uint256 lockDuration) external view returns (uint256); // 1.0x/1.35x/1.85x
}
```

---

## 10. Métricas de Performance

### 10.1 APY Histórico (Estimado)

| Período | APY Estimado | Base |
|---------|--------------|------|
| 7 dias | ~15-20% | Fees recentes |
| 30 dias | ~12-18% | Média mensal |
| 90 dias | ~10-15% | Projeção |
| 365 dias | ~8-12% | Conservador |

### 10.2 Cálculo APY

```solidity
// APY baseado em share price growth
function calculateAPY(uint256 days) external view returns (uint256) {
    // sharePriceNow / sharePriceDaysAgo
    // (ratio ^ (365/days) - 1) * 10000 (bps)
}

// Frontend calculation (off-chain)
apy = (sharePriceNow / sharePrice30dAgo) ** (365/30) - 1
```

---

## 11. Eventos para Indexação

```solidity
event Deposit(
    address indexed caller,
    address indexed receiver,
    uint256 assets,
    uint256 shares
);

event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
);

event Harvested(
    uint256 assetsAdded,
    uint256 performanceFee
);

event FeeUpdated(
    uint256 oldFee,
    uint256 newFee
);
```

### 11.1 Subgraph Query

```graphql
# Depósitos últimos 30 dias
query VaultDeposits {
  deposits(
    where: { timestamp_gte: 1727000000 }
    orderBy: timestamp
    orderDirection: desc
    first: 1000
  ) {
    id
    caller
    receiver
    assets
    shares
    timestamp
    blockNumber
  }
}

# Share price history
query SharePrice {
  vaultDailySnapshots(
    first: 90
    orderBy: date
    orderDirection: desc
  ) {
    date
    totalAssets
    totalShares
    sharePrice
    apy
  }
}
```

---

## 12. Gas Estimates

| Operação | Gas | Notes |
|----------|-----|-------|
| `deposit` | ~85,000 | Transfer + mint |
| `mint` | ~85,000 | Same as deposit |
| `withdraw` | ~75,000 | Burn + transfer |
| `redeem` | ~75,000 | Same as withdraw |
| `harvest` | ~45,000 | Called by Distributor |
| `previewDeposit` | ~3,000 | View only |
| `convertToShares` | ~2,500 | View only |

---

## 13. Endereços Relacionados

| Contrato | Endereço | Função |
|----------|----------|--------|
| **Vault** | `0x9efa934d9fad4ae28c998a40195646b965a97247` | ERC-4626 Vault |
| **IMD Token** | `0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7` | Asset |
| **Distributor** | `0x9046739e1535b40efbe6ab3f45d0024b690eca30` | Fee Collector |
| **Hook Pool** | `0xc6c965bd164c483e87d0b550671798e9a3602840` | Revenue Source |
| **Burn Executor** | `0xe29386719C155B6847aD5a4E97C6674f10ffc750` | Deflação |

---

## 14. Verificação Etherscan

```bash
forge verify-contract \
  --chain-id 1 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,string,string,address,address,address)" \
    0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7 \
    "Optimizer IMD Vault" \
    "oIMD" \
    0xc6c965bd164c483e87d0b550671798e9a3602840 \
    0x9046739e1535b40efbe6ab3f45d0024b690eca30 \
    0x9046739e1535b40efbe6ab3f45d0024b690eca30) \
  0x9efa934d9fad4ae28c998a40195646b965a97247 \
  contracts/vault/OptimizerVault.sol:OptimizerVault \
  $ETHERSCAN_API_KEY
```

---

## 15. Changelog

| Versão | Data | Bloco | Mudanças |
|--------|------|-------|----------|
| 1.0.0 | 17 Set 2026 | Sepolia | Deploy inicial testnet |
| 1.0.1 | TBD | Mainnet | Deploy mainnet (pending) |

---

**Endereço:** `0x9efa934d9fad4ae28c998a40195646b965a97247`  
**Etherscan:** https://etherscan.io/address/0x9efa934d9fad4ae28c998a40195646b965a97247  
**Spec Version:** 1.0 | **Data:** 24 Set 2026