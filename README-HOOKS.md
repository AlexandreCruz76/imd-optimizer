# IMD Optimizer Hooks

Hooks customizados do Uniswap V4 para o protocolo Optimizer IMD.

## Visão Geral

Este pacote contém três hooks customizados para o Uniswap V4:

1. **DonationHook** - Coleta taxas de doações para financiar o protocolo Optimizer
2. **IMDTWAPHook** - Fornece oráculo de Preço Médio Ponderado no Tempo (TWAP)
3. **IMDPerpetualHook** - Habilita negociação de futuros perpetuos em pools IMD

## Contratos

### DonationHook.sol

Um hook que coleta uma taxa de doações para financiar o protocolo Optimizer.

**Funcionalidades:**
- Coleta 10% de taxa em todas as doações
- Transfere taxas para o proprietário do protocolo
- Rastreia doações totais e taxas coletadas
- Emite eventos para transparência

**Uso:**
```solidity
// Deploy com endereço do PoolManager
DonationHook hook = new DonationHook(poolManager);

// Doar para uma pool
hook.donate{value: 0.1 ether}(poolKey, amount0, amount1);
```

### IMDTWAPHook.sol

Um hook que fornece oráculo de Preço Médio Ponderado no Tempo (TWAP) para pools IMD.

**Funcionalidades:**
- Rastreia preços cumulativos ao longo do tempo
- Calcula TWAP para qualquer período de tempo (1-24 horas)
- Resistente a ataques de flash loan
- Fornece feeds de preços precisos para derivados

**Uso:**
```solidity
// Deploy com endereço do PoolManager
IMDTWAPHook hook = new IMDTWAPHook(poolManager);

// Obter TWAP para uma pool
(uint256 twap0, uint256 twap1) = hook.getTWAP(poolId, 1 hours);
```

### IMDPerpetualHook.sol

Um hook que habilita negociação de futuros perpetuos em pools IMD.

**Funcionalidades:**
- Abrir posições long/short com alavancagem de até 10x
- Taxas de financiamento dinâmicas baseadas na proporção long/short
- Liquidação automática quando a margem é insuficiente
- Gerenciamento de posições e cálculo de PnL

**Uso:**
```solidity
// Deploy com endereço do PoolManager
IMDPerpetualHook hook = new IMDPerpetualHook(poolManager);

// Abrir posição long com alavancagem 5x
bytes32 positionId = hook.openPosition{value: 0.1 ether}(poolKey, PositionType.LONG, 5);

// Fechar posição
hook.closePosition(positionId, poolKey);
```

## Instalação

```bash
npm install
```

## Compilação

```bash
npx hardhat compile
```

## Deploy

### Testnet Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Configuração

Atualize `hardhat.config.js` com seus:
- Endpoints RPC
- Chaves privadas
- Chaves API do Etherscan

## Testes

```bash
npx hardhat test
```

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  IMD OPTIMIZER HOOKS                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DonationHook                                               │
│  ├── beforeDonate() → Calcular taxa                         │
│  └── afterDonate()  → Atualizar estatísticas, emitir evento │
│                                                             │
│  IMDTWAPHook                                                │
│  ├── beforeSwap()  → Atualizar preços cumulativos           │
│  └── afterSwap()   → Recalcular TWAP                        │
│                                                             │
│  IMDPerpetualHook                                           │
│  ├── beforeSwap()  → Atualizar taxas de financiamento       │
│  └── afterSwap()   → Verificar liquidações                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Licença

MIT
