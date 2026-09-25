# CUSTO DE DEPLOY - OptimizerVault

## Resumo dos Custos

| Item | Custo Estimado | Notas |
|------|----------------|-------|
| Deploy do contrato | ~0.015 ETH | ~$37.50 |
| Verificação Etherscan | Gratuito | Com API key |
| Gas buffer | ~0.005 ETH | ~$12.50 |
| **TOTAL INICIAL** | **~0.02 ETH** | **~$50** |

## Detalhamento por Rede

### Ethereum Mainnet
| Operação | Gas Units | Gas Price | Custo ETH | Custo USD |
|----------|-----------|-----------|-----------|-----------|
| Deploy | ~1,500,000 | 10 gwei | 0.015 ETH | $37.50 |
| Verify | 0 | 0 | 0 | $0 |
| **Total** | | | **0.015 ETH** | **$37.50** |

### Sepolia (Testnet)
| Operação | Gas Units | Gas Price | Custo ETH | Custo USD |
|----------|-----------|-----------|-----------|-----------|
| Deploy | ~1,500,000 | 10 gwei | 0.015 ETH | $0 (free) |
| Verify | 0 | 0 | 0 | $0 |
| **Total** | | | **0.015 ETH** | **$0** |

## Custos Operacionais (por transação)

### Para o Usuário
| Transação | Gas Units | Gas Price | Custo ETH | Custo USD |
|-----------|-----------|-----------|-----------|-----------|
| Connect Wallet | 0 | 0 | 0 | $0 |
| Subscribe | ~50,000 | 10 gwei | 0.0005 ETH | $1.25 |
| Deposit | ~150,000 | 10 gwei | 0.0015 ETH | $3.75 |
| Withdraw | ~100,000 | 10 gwei | 0.001 ETH | $2.50 |
| Claim Yield | ~80,000 | 10 gwei | 0.0008 ETH | $2.00 |

### Para o Protocolo (Admin)
| Transação | Gas Units | Gas Price | Custo ETH | Custo USD |
|-----------|-----------|-----------|-----------|-----------|
| Withdraw Fees | ~50,000 | 10 gwei | 0.0005 ETH | $1.25 |
| Pause/Resume | ~30,000 | 10 gwei | 0.0003 ETH | $0.75 |
| Update Fees | ~30,000 | 10 gwei | 0.0003 ETH | $0.75 |

## Custos Mensais Estimados

### Com 100 Usuários Ativos
| Item | Custo Mensal | Notas |
|------|--------------|-------|
| Deposits (~300) | 0.45 ETH | ~$1,125 |
| Withdrawals (~200) | 0.20 ETH | ~$500 |
| Claims (~500) | 0.40 ETH | ~$1,000 |
| Admin operations | 0.01 ETH | ~$25 |
| **Total** | **1.06 ETH** | **~$2,650** |

### Com 1000 Usuários Ativos
| Item | Custo Mensal | Notas |
|------|--------------|-------|
| Deposits (~3000) | 4.5 ETH | ~$11,250 |
| Withdrawals (~2000) | 2.0 ETH | ~$5,000 |
| Claims (~5000) | 4.0 ETH | ~$10,000 |
| Admin operations | 0.05 ETH | ~$125 |
| **Total** | **10.55 ETH** | **~$26,375** |

## Retorno sobre Investimento (ROI)

### Com 100 ETH no Vault
| Métrica | Valor |
|---------|-------|
| TVL | 100 ETH |
| APY médio | 37% |
| Yield anual | 37 ETH |
| Performance fee (15%) | 5.55 ETH |
| Custo operacional anual | ~0.12 ETH |
| **Lucro líquido** | **~5.43 ETH** |
| **ROI** | **~45x** |

### Com 1000 ETH no Vault
| Métrica | Valor |
|---------|-------|
| TVL | 1,000 ETH |
| APY médio | 37% |
| Yield anual | 370 ETH |
| Performance fee (15%) | 55.5 ETH |
| Custo operacional anual | ~1.2 ETH |
| **Lucro líquido** | **~54.3 ETH** |
| **ROI** | **~45x** |

## Custos de Desenvolvimento

### Pré-deploy
| Item | Custo | Notas |
|------|-------|-------|
| Desenvolvimento do contrato | $0 | Próprio |
| Testes | $0 | Sepolia (grátis) |
| Auditoria (recomendado) | $5,000-15,000 | Opcional mas recomendado |

### Pós-deploy
| Item | Custo | Notas |
|------|-------|-------|
| Monitoramento | $0-100/mês | Infura/Alchemy free tier |
| Frontend hosting | $0-20/mês | Vercel free tier |
| Domain | $10/ano | Opcional |

## Recomendação

1. **Comece com Sepolia** (grátis) para testar
2. **Faça deploy na mainnet** quando tiver 10+ usuários interessados
3. **Considere auditoria** quando TVL > 100 ETH
4. **Use gasless transactions** quando possível (meta-transactions)

## Custos Totais para Começar

| Fase | Custo | Retorno Esperado |
|------|-------|------------------|
| Desenvolvimento | $0 | - |
| Deploy (mainnet) | ~$50 | - |
| Primeiro mês | ~$200 | - |
| **Total para começar** | **~$250** | 10 ETH no vault = $3,750/year |
