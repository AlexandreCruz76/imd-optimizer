# Optimizer Oracle - MEV Threat Intelligence Node

## O que é o Oracle?

O **Optimizer Oracle** é um sistema de monitoramento em tempo real que escaneia a blockchain Ethereum procurando ameaças MEV (Maximal Extractable Value) que afetam os provedores de liquidez (LPs) nas pools da Uniswap V4.

---

## Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZER ORACLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ESCANEA blocos da Ethereum (últimos 500 blocos)         │
│     ↓                                                        │
│  2. FILTRA swaps da Uniswap V4 PoolManager                  │
│     ↓                                                        │
│  3. IDENTIFICA pools IMD e Standard (ETH/USDC)              │
│     ↓                                                        │
│  4. DETECTA padrões de ataque:                              │
│     • Sandwich: compra antes, venda depois da vítima        │
│     • Front-run: gas mais alto para executar antes          │
│     • Arbitragem cross-pool: entre IMD e Standard           │
│     ↓                                                        │
│  5. CLASSIFICA bots:                                        │
│     • Market Makers (fornecem liquidez)                     │
│     • MEV Bots (extraem valor dos LPs)                      │
│     • Retail (usuários comuns)                              │
│     ↓                                                        │
│  6. GERA relatório JSON com métricas e recomendações        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Dados Coletados

### Pool IMD/ETH (CappedBurnHook)
| Métrica | Descrição |
|---------|-----------|
| `total_swaps` | Total de swaps na pool no período |
| `unique_traders` | Número de traders únicos |
| `volume_estimate_eth` | Volume estimado em ETH |
| `top_traders` | Maiores traders da pool |
| `mev_status` |>Status da detecção MEV (CLEAN/ATTACKS) |

### Pool Standard (ETH/USDC)
| Métrica | Descrição |
|---------|-----------|
| `total_swaps` | Total de swaps na pool referência |
| `unique_traders` | Traders únicos na Standard |
| `volume_estimate_eth` | Volume de referência |

### Cross-Pool Intelligence
| Métrica | Descrição |
|---------|-----------|
| `shared_bots` | Bots operando em AMBAS as pools |
| `addresses` | Endereços dos bots compartilhados |
| `arbitrage_signal` | Sinal de oportunidade de arbitragem |

---

## Resultados Recentes (ao vivo)

```json
{
  "imd": {
    "swaps": 82,
    "traders": 14,
    "top_trader": "0x51768f5da32ba2008304cc81674da51acb802888 (22 swaps)"
  },
  "standard": {
    "swaps": 361,
    "traders": 67
  },
  "cross_pool": {
    "shared_bots": 8,
    "arbitrage_signal": true
  }
}
```

---

## Por que é Importante?

### 1. **Proteção Preventiva**
O Oracle detecta bots MEV **antes** que eles atacam. Enquanto a V4 está crescendo, o Optimizer já está monitorando.

### 2. **Inteligência de Mercado**
Sabemos quem são os market makers, quantos bots operam, e onde estão as oportunidades.

### 3. **Otimização de Fees**
Com dados de volume e atividade, o Optimizer pode ajustar taxas dinamicamente para maximizar rendimento dos LPs.

### 4. **Dashboard para Investidores**
O Oracle fornece dados reais em tempo real para investidores como Adam avaliarem o potencial do protocolo.

---

## Como Usar

### API Endpoint
```
GET http://localhost:3001/
```

### Resposta
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

### Executar
```bash
node scripts/oracle-api.js
```

---

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Ethereum   │────▶│  Oracle Node │────▶│   Dashboard  │
│   RPC Node   │     │  (Scanner)   │     │   (API)      │
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

## Métricas Chave para Adam

| Métrica | Valor | Significado |
|---------|-------|-------------|
| Swaps IMD | 82/500 blocos | Pool ativa |
| Traders IMD | 14 | Base de usuários |
| Bots compartilhados | 8 | Oportunidade cross-pool |
| Status MEV | CLEAN | Janela para deploy preventivo |
| Volume IMD | ~10,500 ETH | Escala potencial |

---

## Próximos Passos

1. **Deploy do CappedBurnHook** na pool IMD
2. **Ativação do Oracle** como serviço contínuo
3. **Dashboard web** para monitoramento em tempo real
4. **Alertas automáticos** quando MEV for detectado

---

*Optimizer Protocol - Protecting LPs from MEV, one block at a time.*
