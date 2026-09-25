# CappedBurnHook — Technical Specification

> **Uniswap V4 Hook para proteção MEV nativa via queima proporcional de IMD**

---

## 1. Visão Geral

| Propriedade | Valor |
|-------------|-------|
| **Nome** | CappedBurnHook |
| **Rede** | Ethereum Mainnet |
| **Endereço** | `0xc6c965bd164c483e87d0b550671798e9a3602840` |
| **PoolManager** | `0x000000000004444c5dc75cB358380D2e3dE08A90` |
| **Token IMD** | `0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7` |
| **Burn Executor** | `0xe29386719C155B6847aD5a4E97C6674f10ffc750` |
| **Standard Pool ID** | `0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3` |
| **Hook Pool ID** | `0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704` |
| **Bloco de Criação** | 25,887,100 (02 Set 2026) |
| **Compiler** | Solidity 0.8.28 |
| **EVM Target** | Cancun |

---

## 2. Permissões do Hook

```solidity
function getHookPermissions() public pure override returns (HookPermissions memory) {
    return HookPermissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: false,
        afterAddLiquidity: false,
        beforeRemoveLiquidity: false,
        afterRemoveLiquidity: false,
        beforeSwap: false,
        afterSwap: true,           // ← ÚNICA permissão ativa
        beforeDonate: false,
        afterDonate: false,
        beforeSwapReturns: false,
        afterSwapReturns: false,
        afterAddLiquidityReturns: false,
        afterRemoveLiquidityReturns: false
    });
}
```

**Por que apenas `afterSwap`?**
- Proteção MEV deve acontecer **após** o cálculo do swap mas **antes** do settlement
- `beforeSwap` não tem acesso ao `BalanceDelta` (impacto real)
- `afterSwapReturns` é tarde demais (já settled)

---

## 3. Interface Completa

```solidity
interface ICappedBurnHook {
    // Config (immutable após deploy)
    function POOL_MANAGER() external view returns (PoolManager);
    function IMD_TOKEN() external view returns (IERC20);
    function BURN_EXECUTOR() external view returns (IBurnExecutor);
    
    // Parâmetros de proteção
    function PRICE_IMPACT_THRESHOLD() external pure returns (uint256); // 50 bps = 0.5%
    function BURN_FACTOR() external pure returns (uint256);           // 1000 = 0.1%
    function MAX_BURN_PER_SWAP() external pure returns (uint256);     // 10 ETH equiv
    
    // Events
    event ProtectionActivated(
        address indexed trader,
        uint256 priceImpactBps,
        uint256 imdBurned,
        uint256 attackerProfitReduced
    );
    
    event ConfigUpdated(
        uint256 indexed newThreshold,
        uint256 indexed newFactor,
        uint256 indexed newMaxBurn
    );
    
    // Admin (apenas owner)
    function updateProtectionParams(
        uint256 newThreshold,
        uint256 newFactor,
        uint256 newMaxBurn
    ) external;
    
    function setBurnExecutor(address newExecutor) external;
    
    function emergencyWithdraw(IERC20 token, uint256 amount) external;
}
```

---

## 4. Lógica de Proteção (`afterSwap`)

### 4.1 Fluxo Detalhado

```
afterSwap(sender, key, params, delta, hookData)
    │
    ├─▶ 1. Validar: onlyPoolManager
    │
    ├─▶ 2. Calcular Price Impact
    │     │
    │     ├─▶ Obter sqrtPriceX96 ANTES (via StateView)
    │     ├─▶ Obter sqrtPriceX96 DEPOIS (delta)
    │     ├─▶ impact = |sqrtPriceAfter - sqrtPriceBefore| / sqrtPriceBefore
    │     └─▶ Converter para basis points (1% = 100 bps)
    │
    ├─▶ 3. Verificar Threshold
    │     │
    │     ├─▶ Se impact < THRESHOLD (50 bps) → RETURN normal
    │     └─▶ Se impact ≥ THRESHOLD → CONTINUAR
    │
    ├─▶ 4. Calcular Burn Amount
    │     │
    │     ├─▶ burnRaw = (impactBps * BURN_FACTOR) / 10000
    │     ├─▶ burnAmount = min(burnRaw, MAX_BURN_PER_SWAP)
    │     └─▶ Converter para IMD (via oracle price ETH/IMD)
    │
    ├─▶ 5. Executar Burn
    │     │
    │     ├─▶ Transferir IMD do pool/tesouraria para BurnExecutor
    │     ├─▶ Chamar burnExecutor.burn(imdAmount)
    │     └─▶ Emitir ProtectionActivated
    │
    └─▶ 6. RETURN selector (continua settlement normal)
```

### 4.2 Cálculo de Price Impact

```solidity
function _calculatePriceImpact(
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    BalanceDelta delta
) internal view returns (uint256 impactBps, bool isHighImpact) {
    
    // 1. Obter estado ANTES do swap via StateView
    (uint160 sqrtPriceBefore, , , , , ) = IStateView(STATE_VIEW)
        .getSlot0(key);
    
    // 2. Calcular estado DEPOIS usando delta
    // delta.amount0/amount1 são os deltas de reserves
    // sqrtPriceAfter = f(reservesAfter)
    
    // Para zeroForOne (vendendo token0 → comprando token1):
    //   reserves0_after = reserves0_before + amount0 (negativo = vendendo)
    //   reserves1_after = reserves1_before + amount1 (positivo = comprando)
    //   sqrtPriceAfter = sqrt(reserves1_after / reserves0_after) * 2^96
    
    // 3. Impact em basis points
    // impactBps = |sqrtPriceAfter - sqrtPriceBefore| * 10000 / sqrtPriceBefore
    
    // 4. Threshold check
    isHighImpact = impactBps >= PRICE_IMPACT_THRESHOLD;
}
```

### 4.3 Cálculo de Burn

```solidity
function _calculateBurnAmount(
    BalanceDelta delta,
    uint256 priceImpactBps
) internal view returns (uint256 imdAmount) {
    
    // 1. Burn proporcional ao impact
    // burnBps = (priceImpactBps * BURN_FACTOR) / 10000
    // Ex: impact 150 bps × 1000 / 10000 = 15 bps burn
    
    uint256 burnBps = (priceImpactBps * BURN_FACTOR) / 10000;
    
    // 2. Converter para valor em ETH (aproximado via amount1)
    // amount1 é o delta em WETH (18 decimais)
    uint256 ethVolume = uint256(int256(delta.amount1) < 0 ? -delta.amount1 : delta.amount1);
    
    // 3. Burn em ETH equiv = ethVolume * burnBps / 10000
    uint256 ethBurn = (ethVolume * burnBps) / 10000;
    
    // 4. Cap de segurança
    if (ethBurn > MAX_BURN_PER_SWAP) {
        ethBurn = MAX_BURN_PER_SWAP;
    }
    
    // 5. Converter ETH → IMD via price oracle
    // imdAmount = ethBurn * ETH_PER_IMD_PRICE
    uint256 ethPerImd = _getEthPerImdPrice(); // Via Chainlink/Uniswap V3
    imdAmount = (ethBurn * 1e18) / ethPerImd; // Ajustar decimais
    
    return imdAmount;
}
```

---

## 5. Parâmetros de Configuração

### 5.1 Valores Padrão (Produção)

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `PRICE_IMPACT_THRESHOLD` | 50 bps (0.5%) | Ativa proteção acima deste impacto |
| `BURN_FACTOR` | 1000 (0.1%) | % do impact que vira burn |
| `MAX_BURN_PER_SWAP` | 10 ETH equiv | Cap de segurança por swap |

### 5.2 Exemplos de Cálculo

| Price Impact | Burn Factor | Burn (bps) | Swap 10 ETH | Burn ETH | Burn IMD (~$2500/ETH) |
|--------------|-------------|------------|-------------|----------|----------------------|
| 50 bps (0.5%) | 1000 | 5 bps | 10 ETH | 0.005 ETH | ~12.5 IMD |
| 150 bps (1.5%) | 1000 | 15 bps | 10 ETH | 0.015 ETH | ~37.5 IMD |
| 500 bps (5%) | 1000 | 50 bps | 10 ETH | 0.05 ETH | ~125 IMD |
| 1000 bps (10%) | 1000 | 100 bps | 10 ETH | **0.1 ETH (cap)** | **~250 IMD** |

### 5.3 Parâmetros Alpha (Mais Conservadores)

| Parâmetro | Alpha | Produção |
|-----------|-------|----------|
| Threshold | 100 bps (1%) | 50 bps (0.5%) |
| Burn Factor | 500 (0.05%) | 1000 (0.1%) |
| Max Burn | 5 ETH | 10 ETH |

---

## 6. Eventos

```solidity
// Emitido quando proteção é ativada
event ProtectionActivated(
    address indexed trader,           // Quem fez o swap
    uint256 priceImpactBps,           // Impacto detectado
    uint256 imdBurned,                // IMD queimado
    uint256 attackerProfitReduced     // Estimativa de lucro do atacante reduzido
);

// Emitido quando admin atualiza parâmetros
event ConfigUpdated(
    uint256 indexed newThreshold,
    uint256 indexed newFactor,
    uint256 indexed newMaxBurn
);
```

### 6.1 Indexação para Analytics

```sql
-- Query típico para dashboard
SELECT 
    block_number,
    trader,
    priceImpactBps,
    imdBurned,
    attackerProfitReduced
FROM ProtectionActivated
WHERE block_number > 25887100
ORDER BY block_number DESC;
```

---

## 7. Integração com Contratos

### 7.1 Burn Executor

```solidity
interface IBurnExecutor {
    function burn(uint256 amount) external;
    function totalBurned() external view returns (uint256);
    function lastBurnBlock() external view returns (uint256);
}
```

**Endereço:** `0xe29386719C155B6847aD5a4E97C6674f10ffc750`

### 7.2 Distributor (Recebe Fees)

```solidity
interface IDistributor {
    function distribute() external;
    function setFeeSplit(
        uint16 stakersBps,    // 6000 = 60%
        uint16 treasuryBps,   // 2000 = 20%
        uint16 devsBps,       // 1500 = 15%
        uint16 burnBps        // 500 = 5%
    ) external;
}
```

**Endereço:** `0x9046739e1535b40efbe6ab3f45d0024b690eca30`

### 7.3 Vault ERC-4626

```solidity
interface IOptimizerVault {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function totalAssets() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
}
```

**Endereço:** `0x9efa934d9fad4ae28c998a40195646b965a97247`

---

## 8. Gas Estimates

| Operação | Gas Estimado | Notas |
|----------|--------------|-------|
| Swap normal (sem proteção) | ~180,000 | Baseline Uniswap V4 |
| Swap com proteção (burn) | ~210,000 | +30,000 (16% overhead) |
| Swap com proteção (sem burn) | ~195,000 | +15,000 (threshold check only) |
| Update params (admin) | ~45,000 | Single storage writes |
| Emergency withdraw | ~35,000 | Token transfer only |

### 8.1 Breakdown do Overhead

```
CHECK threshold:        ~5,000 gas
CALCULATE impact:       ~8,000 gas (StateView calls)
CALCULATE burn:         ~3,000 gas
EXECUTE burn:           ~12,000 gas (transfer + call)
EMIT event:             ~2,000 gas
─────────────────────────────
TOTAL OVERHEAD:         ~30,000 gas
```

---

## 9. Segurança

### 9.1 Proteções Inclusas

| Vetor | Mitigação |
|-------|-----------|
| **Reentrancy** | `nonReentrant` no BurnExecutor; `afterSwap` é callback do PoolManager |
| **Overflow** | Solidity 0.8.28 built-in checks |
| **Manipulação de preço** | Threshold mínimo 0.5%; cap 10 ETH |
| **Front-running config** | Apenas owner (2-step ownership) |
| **Drain do contrato** | BurnExecutor só queima, não guarda |
| **Oracle manipulation** | Preço ETH/IMD via TWAP V3 (não spot) |

### 9.2 Ownership

```solidity
// 2-step ownership transfer
function transferOwnership(address newOwner) external onlyOwner {
    pendingOwner = newOwner;
    emit OwnershipTransferStarted(owner, newOwner);
}

function acceptOwnership() external {
    require(msg.sender == pendingOwner);
    owner = pendingOwner;
    pendingOwner = address(0);
    emit OwnershipTransferred(owner, newOwner);
}
```

**Owner Atual:** `0x0000000000000000000000000000000000000000` (RENOUNCED)

---

## 10. Testes

### 10.1 Casos de Teste Cobertos

```solidity
// test/CappedBurnHook.t.sol
contract CappedBurnHookTest is Test {
    function testNormalSwapNoProtection() public { ... }
    function testHighImpactActivatesBurn() public { ... }
    function testBurnCappedAtMax() public { ... }
    function testSandwichAttackMitigated() public { ... }
    function testCrossBlockNotTriggered() public { ... } // Hook só vê mesmo bloco
    function testMultipleSwapsSameBlock() public { ... }
    function testZeroForOneAndOneForZero() public { ... }
    function testOnlyPoolManagerCanCall() public { ... }
    function testOwnerCanUpdateParams() public { ... }
    function testNonOwnerCannotUpdateParams() public { ... }
    function testEmergencyWithdraw() public { ... }
    function testBurnExecutorReceivesIMD() public { ... }
    function testEventsEmittedCorrectly() public { ... }
}
```

### 10.2 Cobertura Alvo

| Métrica | Target |
|---------|--------|
| Line Coverage | 100% |
| Branch Coverage | 95% |
| Function Coverage | 100% |

---

## 11. Deploy & Verificação

### 11.1 Script de Deploy

```solidity
// script/DeployHook.s.sol
contract DeployHook is Script {
    function run() external returns (CappedBurnHook) {
        vm.startBroadcast(deployerKey);
        
        // 1. Deploy BurnExecutor
        BurnExecutor burnExec = new BurnExecutor(IMD_TOKEN);
        
        // 2. Deploy Hook
        CappedBurnHook hook = new CappedBurnHook(
            POOL_MANAGER,
            IMD_TOKEN,
            address(burnExec)
        );
        
        // 3. Registrar hook no PoolManager (via PoolCreator)
        // PoolKey com hooks = address(hook)
        
        vm.stopBroadcast();
        
        return hook;
    }
}
```

### 11.2 Verificação Etherscan

```bash
forge verify-contract \
  --chain-id 1 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" \
    POOL_MANAGER IMD_TOKEN BURN_EXECUTOR) \
  0xc6c965bd164c483e87d0b550671798e9a3602840 \
  contracts/hooks/CappedBurnHook.sol:CappedBurnHook \
  $ETHERSCAN_API_KEY
```

---

## 12. Monitoramento Produção

### 12.1 Métricas Chave

| Métrica | Alerta | Dashboard |
|---------|--------|-----------|
| Proteções/dia | < 5/dia | Grafana |
| Burn total/dia | > 1000 IMD | Grafana |
| Gas médio | > 250k | Grafana |
| Falhas (reverts) | > 0 | PagerDuty |
| Owner actions | Qualquer | PagerDuty |

### 12.2 Queries Úteis

```sql
-- Proteções por dia
SELECT 
    DATE(block_timestamp) as day,
    COUNT(*) as protections,
    SUM(imdBurned) as total_imd_burned,
    AVG(priceImpactBps) as avg_impact
FROM ProtectionActivated
GROUP BY day
ORDER BY day DESC;

-- Top traders protegidos
SELECT 
    trader,
    COUNT(*) as protections,
    SUM(imdBurned) as total_burned
FROM ProtectionActivated
GROUP BY trader
ORDER BY total_burned DESC
LIMIT 20;
```

---

## 13. Changelog

| Versão | Data | Bloco | Mudanças |
|--------|------|-------|----------|
| 1.0.0 | 02 Set 2026 | 25,887,100 | Deploy inicial |
| 1.0.1 | TBD | TBD | Ajuste parâmetros pós-alpha |

---

**Endereço:** `0xc6c965bd164c483e87d0b550671798e9a3602840`  
**Etherscan:** https://etherscan.io/address/0xc6c965bd164c483e87d0b550671798e9a3602840  
**Spec Version:** 1.0 | **Data:** 24 Set 2026