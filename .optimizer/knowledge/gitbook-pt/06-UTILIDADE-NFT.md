# Utilidade NFT

## Optimizer Genesis Key

Seu passaporte para taxas zero e receita de MEV.

---

## Visão Geral

| Propriedade | Valor |
|-------------|-------|
| Tipo | ERC-721 |
| Supply Máximo | 100 |
| Preço Genesis | 0.5 ETH |
| Preço Backer | 1.0 ETH |
| Target de Captação | 50-100 ETH |

---

## Detalhamento da Utilidade

### 1. Taxas Zero Para Sempre

```
Sem NFT:  0.5% de taxa em cada troca
Com NFT:  0% de taxa em cada troca

Exemplo (1 troca de 1 ETH por dia):
  Sem: 0.5% × 365 = 1.825 ETH/ano em taxas
  Com: 0% × 365 = 0 ETH/ano em taxas
  
  Economia: 1.825 ETH/ano
```

### 2. Participação na Receita de MEV

```
Optimizer captura MEV de arbitragem
Distribuído aos holders da Genesis Key

Exemplo (10 ETH de MEV capturado):
  100 holders → 0.1 ETH cada
  10 holders → 1.0 ETH cada
  1 holder → 10.0 ETH
```

### 3. Acesso Prioritário B2B

```
Primeiro acesso a novas pools
Alocação maior em launches
Suporte prioritário
```

### 4. Governança

```
Vote nos parâmetros do protocolo
Peso: 10x vs holders regulares
Direito a propostas
```

---

## Genesis vs Backer

| Funcionalidade | Genesis (0.5 ETH) | Backer (1 ETH) |
|----------------|-------------------|----------------|
| Supply | 50 | 50 |
| Taxas Zero | ✓ | ✓ |
| Receita MEV | ✓ | ✓ |
| Acesso Prioritário | ✓ | ✓ (maior) |
| Governança | ✓ | ✓ (2x peso) |
| Badge | Genesis | Backer |

---

## Como Fazer Mint

1. Conecte a carteira (Ethereum Mainnet)
2. Acesse [app.optimizer.finance/nft-mint](https://app.optimizer.finance/nft-mint)
3. Escolha Genesis (0.5 ETH) ou Backer (1 ETH)
4. Assine a transação
5. Receba o NFT na carteira
6. Use no Optimizer router para taxas ZERO

---

## Distribuição de MEV

```solidity
// MEV entra no sistema
OptimizerHook captura lucros de arbitragem
    │
    ▼
OptimizerGenesisKey.depositMEV()
    │
    ▼
Holders chamam claimMEV()
    │
    ▼
ETH transferido para a carteira do holder
```

---

## Perguntas Frequentes

**P: Posso vender minha Genesis Key?**
R: Sim, é um NFT ERC-721. Negocie na OpenSea ou qualquer marketplace.

**P: Perco a utilidade se vender?**
R: Sim, o novo proprietário recebe a utilidade.

**P: Com que frequência o MEV é distribuído?**
R: O MEV é depositado pelo protocolo e pode ser reivindicado a qualquer momento.

**P: Há período mínimo de posse?**
R: Não, mas vender significa perder taxas zero e receita de MEV.

---

*Próximo: [Roadmap](./07-ROADMAP.md)*
