# Comparação: ANTES vs DEPOIS

## Resumo das Mudanças

| Aspecto | ANTES (OptimizerHook) | DEPOIS (OptimizerRouter + VaultV2) |
|---------|----------------------|-------------------------------------|
| Arquitetura | Hook genérico | Router atômico + Vault ERC-4626 |
| Integração The Standard | ❌ Não existia | ✅ `IStandardCore.burn()` |
| Sequência atômica | ❌ Lógica separada | ✅ 5 passos indivisíveis |
| Captura de MEV | Simplificada | Back-swap real na pool |
| Burn de tokens | `IERC20Burnable` genérico | `IStandardCore.burn()` nativo |
| Proteção sandwich | ❌ Não existia | ✅ Block delay + slippage check |
| Distribuição de yield | Manual | Automática via yieldPerShare |
| Comentários Flashbots | ❌ Não existia | ✅ Instruído no código |

---

## ANTES: OptimizerHook.sol

### Lógica

```
beforeSwap() → Lê NFT, cobra taxa
afterSwap()  → Verifica elasticidade (só conta eventos)
             → Verifica MEV (só incrementa contador)
```

### Problemas

1. **Elasticidade fake** — `_checkElasticity()` só incrementa `totalBurnsExecuted`
2. **MEV fake** — `_executeInternalArbitrage()` só incrementa contador
3. **Burn genérico** — Usa `IERC20Burnable.burn()`, não `IStandardCore.burn()`
4. **Sem integração** — Não interage com The Standard de verdade
5. **Sem proteção** — Não verifica sandwich attacks
6. **Sem atomicidade** — Passos são executados separadamente

### Código (simplificado)

```solidity
// ANTES: Elasticidade simplificada
function _checkElasticity(uint256 currentPrice) internal {
    if (block.timestamp - lastBurnTimestamp < burnCooldown) return;
    totalBurnsExecuted++; // Só conta, não queima de verdade
    lastBurnTimestamp = block.timestamp;
}

// ANTES: MEV simplificado
function _executeInternalArbitrage(bool zeroForOne, uint256 priceImpact) internal {
    totalMEVCaptured += priceImpact; // Só conta
    totalArbitragesExecuted++; // Só conta
}

// ANTES: Burn genérico
function executeBurn(uint256 amount) external onlyOwner {
    IERC20Burnable(targetToken).burn(amount); // Não é The Standard
}
```

---

## DEPOIS: OptimizerRouter.sol + OptimizerVaultV2.sol

### Lógica

```
executeProtectedSellAndBurn(standardAmount, minAmountOut)
  │
  ├── Passo 1: Validação e Proteção de Slippage
  │   ├── Verifica block delay
  │   ├── Verifica liquidez
  │   └── Calcula slippage máximo
  │
  ├── Passo 2: Execução do Choque (Venda)
  │   ├── Aprova $STANDARD
  │   ├── Executa swap na pool V4
  │   └── Transfere ETH para usuário
  │
  ├── Passo 3: Captura do MEV (Arbitragem Interna)
  │   ├── Calcula distorção de preço
  │   ├── Executa back-swap ETH → $STANDARD
  │   └── Captura tokens na baixa
  │
  ├── Passo 4: Acionamento da Contração (Burn)
  │   └── Chama IStandardCore.burn(mevCaptured)
  │
  └── Passo 5: Distribuição do Lucro (Yield)
      ├── Calcula lucro restante
      └── Deposita no Vault para LPs
```

### Vantagens

1. **Integração real** — Chama `IStandardCore.burn()` do The Standard
2. **Atomicidade** — 5 passos na mesma transação, indivisíveis
3. **Proteção** — Block delay + slippage check anti-sandwich
4. **Captura real** — Back-swap na pool para comprar $STANDARD na baixa
5. **Yield automático** — Vault distribui proporcionalmente
6. **Comentários** — Instrui uso de Flashbots/MEV-Share

### Código (simplificado)

```solidity
// DEPOIS: Sequência atômica real
function executeProtectedSellAndBurn(
    uint256 standardAmount,
    uint256 minAmountOut
) external nonReentrant {
    // Passo 1: Validação
    require(block.number > lastOperationBlock[msg.sender] + minBlockDelay, "Block delay");
    
    // Passo 2: Venda
    standardPool.swap(true, -int256(standardAmount), sqrtPriceX96, "");
    
    // Passo 3: Captura MEV
    if (priceImpact > 50) {
        standardPool.swap(false, int256(ethReceived / 2), sqrtPriceX96, "");
    }
    
    // Passo 4: Burn via The Standard
    if (mevCaptured > 0) {
        standardCore.burn(mevCaptured); // ✅ Integração real
    }
    
    // Passo 5: Distribui yield
    vault.call{value: yieldAmount}("");
}
```

---

## Tabela Comparativa Detalhada

| Feature | OptimizerHook (ANTES) | OptimizerRouter (DEPOIS) |
|---------|----------------------|--------------------------|
| **Elasticidade** | Conta eventos | Chama `IStandardCore.burn()` |
| **MEV** | Incrementa contador | Back-swap na pool |
| **Proteção** | Nenhuma | Block delay + slippage |
| **Atomicidade** | Passos separados | 5 passos indivisíveis |
| **Burn** | `IERC20Burnable` | `IStandardCore` |
| **Yield** | Manual | Automático via Vault |
| **Flashbots** | Não mencionado | Comentários no código |
| **ReentrancyGuard** | ❌ | ✅ |
| **Comentários** | Básicos | Detalhados |

---

## Conclusão

O **OptimizerRouter** implementa fielmente a especificação do `optmizer_standart.txt`:

1. ✅ Função `executeProtectedSellAndBurn`
2. ✅ Sequência atômica de 5 passos
3. ✅ Integração com `IStandardCore.burn()`
4. ✅ Proteção contra sandwich attacks
5. ✅ Captura de MEV via back-swap
6. ✅ Distribuição de yield para LPs
7. ✅ Comentários sobre Flashbots/MEV-Share
8. ✅ ReentrancyGuard

O **OptimizerHook** existente pode ser mantido para outras funções (Identity-Fi, fees), mas a lógica principal de elasticidade e captura de MEV agora está no **OptimizerRouter**.
