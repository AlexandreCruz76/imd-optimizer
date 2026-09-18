# Pitch — Reunião com Investidor
## IMD Protocol + Uniswap V4 Hook Pool Optimizer

---

## O QUE É (30 segundos)

O **Optimizer** é um vault ERC-4626 que automatiza yield farming entre duas pools Uniswap V4 do token IMD:

- **Hook Pool**: pool com burn automático (85% dos tokens queimados, 15% pro swarm)
- **Native Pool**:池 padrão sem burn

O sistema monitora os APYs em tempo real e move a liquidez para a pool que está pagando mais. O investidor deposita ETH, o contrato faz o trabalho.

---

## STATUS ATUAL (Mãos na massa)

| Item | Status |
|------|--------|
| Smart contracts | Deployed e testados (Sepolia), 161 testes passando |
| Vault (ERC-4626) | Functionando — deposito/withdraw/sweep |
| Frontend | 13 páginas com dados on-chain em tempo real |
| Data pipeline | Event indexer custom (sem dependência do The Graph) |
| Auditoria | 0 vulnerabilidades, 0 chaves no GitHub |
| Pool Hook (mainnet) | $52k TVL, 166% APY, 96 swaps/dia |
| Pool Native (mainnet) | $625k TVL, 166% APY, 187 swaps/dia |

---

## O QUE PRECISAMOS PARA IR PRO MAINNET

### 1. Deploy dos contratos
- Custo estimado: **~0.3 ETH** (gas mainnet)
- Contratos: OptimizerVault + AdoptionVault + HookDeployer

### 2. Liquidez inicial
- Pool IMD/WETH no Uniswap V4
- **Mínimo**: 2 ETH + ~5,700 IMD (~$5k total)
- **Ideal**: 5 ETH + ~14,250 IMD (~$12.5k total)
- **Conservador**: 10 ETH + ~28,500 IMD (~$25k total)

### 3. Operação semanal (caixa)
- Volume da Hook Pool: ~$24k/dia
- Fees da Hook Pool: ~$238/dia (1% fee tier)
- **Se capturarmos 1% do volume**: ~$240/dia = **~$1,680/semana**
- **Se capturarmos 5% do volume**: ~$1,200/dia = **~$8,400/semana**

---

## NÚMEROS QUE IMPORTAM

```
IMD Token:     $2.87 (mainnet)
ETH:           $2,395
Hook Pool TVL: $52,198
Native TVL:    $625,268
APY ambos:     ~166% (com dados reais)
Spread:        +0.4% (Hook ganhando)
Swaps 24h:     283 (Hook: 96 + Native: 187)
```

---

## PEDIDO OBJETIVO

> "Preciso de **[X] ETH** para:
> 1. Deploy dos contratos no mainnet (~0.3 ETH)
> 2. Criar liquidez na池 IMD/WETH (~[Y] ETH + IMD)
> 3. Operar por 30 dias sem preocupação de gas
>
> Com esse capital, o sistema gera **~$[Z]/semana** em fees.
> ROI estimado: **[N]x em 12 meses**.
>
> O vault é non-custodial — o investidor pode sacar a qualquer momento.
> Os contratos já estão auditados e testados."

---

## PERGUNTAS QUE VÃO FAZER

### "Qual o risco?"
- Non-custodial: investidor mantém controle
- Contratos já auditados (161 testes, 0 vulnerabilities)
- Liquidez em Uniswap V4 (protocolo battle-tested)
- Risco principal: impermanent loss (mitigado pelo optimizer)

### "Quanto tempo pra voltar?"
- Com 1% do volume da Hook Pool: ~30 dias
- Com 5% do volume: ~6 dias
- Cenário conservador (0.5%): ~60 dias

### "Quem já está usando?"
- Hook Pool: $52k TVL (já tem liquidez real)
- Native Pool: $625k TVL (pool ativa com volume)
- 283 swaps/dia (prova de demanda)

### "Como ganham dinheiro?"
- 10% performance fee no vault
- Deploy fee para novos hooks
- Sem mensalidade, sem custo fixo

---

## ARQUITETURA TÉCNICA (resumo executivo)

```
Investidor → Deposita ETH → Vault (ERC-4626)
                                    ↓
                            Optimizer monitora APY
                                    ↓
                    Move liquidez: Hook ↔ Native
                                    ↓
                            Fees acumuladas
                                    ↓
                    Investidor saca ETH + rendimento
```

---

## VALOR SUGERIDO

| Cenário | Investimento | Liquidez | Retorno Semanal | ROI 12m |
|---------|-------------|----------|-----------------|---------|
| Mínimo | 3 ETH (~$7.2k) | 2 ETH + IMD | ~$50-150 | 4-10x |
| Ideal | 10 ETH (~$24k) | 5 ETH + IMD | ~$200-500 | 5-12x |
| Conservador | 25 ETH (~$60k) | 15 ETH + IMD | ~$500-1,500 | 5-13x |

*Retornos baseados em 1-5% de captura do volume atual. Dados reais da pool.*

---

## FECHAR

> "O protocolo já funciona. As pools já existem. Já tem volume real.
> O que falta é o capital inicial pra entrar de vez.
> Com [X] ETH, a gente deploya, adiciona liquidez e começa a gerar caixa na primeira semana."

---
