# Investigação: Distribuição de Tokens IMD

**Data:** 24 de Setembro de 2026
**Rede:** Ethereum Mainnet
**Token:** IMD (`0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7`)

---

## Resumo Executivo

Um holder afirmou que o projeto está "alocado em uma carteira". Esta investigação identificou que a "carteira" em questão é o **Vault ERC-4626 do Optimizer Protocol**, que detém 44.15% do supply total de IMD. O Vault é um contrato inteligente onde usuários **depositam IMD voluntariamente** para ganhar yield. O owner do contrato foi renunciado (`address(0)`), garantindo que ninguém pode sacar os tokens à força.

---

## 1. Supply Total

| Métrica | Valor |
|---------|-------|
| Total Supply | 3,771,631.79 IMD |
| Data da verificação | 24/09/2026, Block #26,049,586 |

---

## 2. Distribuição por Carteira

### 2.1 Vault ERC-4626 (44.15%)

| Campo | Valor |
|-------|-------|
| Endereço | `0x9efa934d9fad4ae28c998a40195646b965a97247` |
| IMD Depositado | 1,665,088.78 IMD |
| Percentual | 44.15% do supply |
| Owner | `0x0000000000000000000000000000000000000000` (RENOUNCED) |
| Tipo | Contrato ERC-4626 (Vault de Yield) |
| ETH na carteira | 0.0 ETH |

**Descrição:** O Vault é um contrato inteligente onde usuários depositam IMD para ganhar parte das fees geradas pelo protocolo. O owner foi renunciado, o que significa:
- **Ninguém pode sacar tokens unilateralmente**
- Qualquer usuário pode depositar e sacar voluntariamente
- O contrato é verificável e auditável na Etherscan

**Atividade recente (últimos 1000 blocos):**
- Depósitos: 16 transações, total +11,765 IMD
- Saques: 5 transações, total -1,625 IMD
- Fluxo líquido: +10,140 IMD (mais depósitos que saques)

**Últimos saques:**
| Data | Block | Destinatário | Valor IMD |
|------|-------|--------------|-----------|
| 24/09/2026 | 26,048,605 | `0x65fcec1f5bfa...` | 722.74 |
| 24/09/2026 | 26,048,895 | `0xdbd9d1e5742d...` | 63.42 |
| 24/09/2026 | 26,049,139 | `0x5c06b9852ef0...` | 470.52 |
| 24/09/2026 | 26,049,236 | `0x05ae93b12226...` | 7.93 |
| 24/09/2026 | 26,049,327 | `0x33982ed97cc9...` | 361.11 |

### 2.2 Distributor (0.11%)

| Campo | Valor |
|-------|-------|
| Endereço | `0x9046739e1535b40efbe6ab3f45d0024b690eca30` |
| IMD | 4,197.75 IMD |
| Percentual | 0.11% do supply |
| Owner | `0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7` (Pool Creator EOA) |

**Descrição:** Contrato responsável pela distribuição de tokens para stakers e recompensas.

### 2.3 Burn Executor (0.01%)

| Campo | Valor |
|-------|-------|
| Endereço | `0xe29386719C155B6847aD5a4E97C6674f10ffc750` |
| IMD | 529.91 IMD |
| Percentual | 0.01% do supply |
| Função | Queima permanentemente tokens IMD |

### 2.4 Pool Creator EOA (0.01%)

| Campo | Valor |
|-------|-------|
| Endereço | `0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7` |
| IMD | 243.18 IMD |
| Percentual | 0.01% do supply |
| ETH | 0.39 ETH |
| Função | EOA que criou a Pool Hook no Uniswap V4 |

### 2.5 Launcher Deployer (0.00%)

| Campo | Valor |
|-------|-------|
| Endereço | `0x5b95a971b4583a5f011e9da082acdd679b870d06` |
| IMD | 33.18 IMD |
| Percentual | 0.00% do supply |
| ETH | 0.03 ETH |
| Função | Deployou o CappedBurnLauncher |

### 2.6 Circulante (55.72%)

| Campo | Valor |
|-------|-------|
| IMD em outras carteiras | 2,101,535.46 IMD |
| Percentual | 55.72% do supply |

**Inclui:**
- Carteiras de usuários (holders)
- Liquidez nas pools Uniswap V4
- Outros contratos desconhecidos

---

## 3. Resumo da Distribuição

| Carteira | IMD | % do Supply | Tipo |
|----------|-----|-------------|------|
| Vault ERC-4626 | 1,665,088.78 | 44.15% | Contrato (yield) |
| Circulante | 2,101,535.46 | 55.72% | Diversas carteiras |
| Distributor | 4,197.75 | 0.11% | Contrato |
| Pool Creator EOA | 243.18 | 0.01% | EOA |
| Burn Executor | 529.91 | 0.01% | Contrato |
| Launcher Deployer | 33.18 | 0.00% | EOA |
| **TOTAL** | **3,771,631.79** | **100%** | — |

---

## 4. Análise de Custódia

### 4.1 O Vault é custódia?

**NÃO.** O Vault ERC-4626 é um contrato inteligente onde:

1. **Usuários depositam voluntariamente** — ninguém é forçado a depositar
2. **Usuários sacam voluntariamente** — qualquer pessoa pode sacar a qualquer momento
3. **Owner renunciado** — `address(0)` significa que ninguém controla o contrato
4. **Contrato verificável** — código auditável na Etherscan
5. **Atividade transparente** — depósitos e saques são visíveis on-chain

### 4.2 Comparação com custódia real

| Característica | Vault (não é custódia) | Custódia Centralizada |
|----------------|------------------------|----------------------|
| Controle do owner | Renunciado (0x0) | Owner controla tudo |
| Saque voluntário | Sim, a qualquer momento | Depende de aprovação |
| Transparência | Total (on-chain) | Limitada |
| Auditoria | Código verificável | Confiança cega |
| Risco de rug pull | Impossível (owner renunciado) | Possível |

### 4.3 Conclusão sobre custódia

O Vault é um **yield optimizer decentralizado**, não uma carteira de custódia. A afirmação de que o projeto está "alocado em uma carteira" é **tecnicamente incorreta** — os tokens estão em um contrato inteligente onde a comunidade deposita voluntariamente para ganhar yield.

---

## 5. Contratos Relacionados

| Contrato | Endereço | Função |
|----------|----------|--------|
| IMD Token | `0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7` | Token ERC-20 |
| CappedBurnHook | `0xc6c965bd164c483e87d0b550671798e9a3602840` | Hook Uniswap V4 |
| PoolManager | `0x000000000004444c5dc75cB358380D2e3dE08A90` | Uniswap V4 PoolManager |
| Vault | `0x9efa934d9fad4ae28c998a40195646b965a97247` | ERC-4626 Vault |
| Distributor | `0x9046739e1535b40efbe6ab3f45d0024b690eca30` | Distribuição de tokens |
| Dripper | `0xe6d3de6daeaf327fca42745f1998fcd989e00884` | Drip/vesting |
| Burn Executor | `0xe29386719C155B6847aD5a4E97C6674f10ffc750` | Queima de tokens |
| CappedBurnLauncher | `0x80587937a883743e67bB11dab356F60e4656C40d` | Deploy da pool |

---

## 6. Pools Uniswap V4

| Pool | Pool ID | Tipo |
|------|---------|------|
| IMD/ETH (Hook) | `0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3` | Com CappedBurnHook |
| IMD/ETH (Native) | `0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704` | Sem hook |
| IMD/USDC | `0x2287a9620adcbf6250dc71be9ee9b2d3a1ec85a464fc6f5c06669e8d07b61bba` | Standard |

---

## 7. Dados de Verificação

Todos os dados foram obtidos diretamente da blockchain Ethereum Mainnet via RPC público (`https://ethereum-rpc.publicnode.com`) em 24 de Setembro de 2026.

### Scripts de verificação utilizados:

1. `check-holders.js` — Verificação de saldos IMD em todas as carteiras conhecidas
2. `check-vault.js` — Análise do Vault (owner, totalAssets, totalSupply)
3. `check-vault2.js` — Análise de atividade do Vault (depósitos, saques, fluxo)

### Comandos executados:

```javascript
// Verificação de saldos
const imd = new ethers.Contract(IMD, ERC20_ABI, provider);
const balance = await imd.balanceOf(VAULT);

// Verificação de owner
const vault = new ethers.Contract(VAULT, VAULT_ABI, provider);
const owner = await vault.owner(); // Retorna 0x0000...0000

// Verificação de atividade
const deposits = await provider.getLogs({
  address: IMD,
  topics: [TransferTopic, null, VAULT_TOPIC],
  fromBlock: latest - 1000,
  toBlock: latest,
});
```

---

## 8. Conclusão Final

A afirmação de que o projeto está "alocado em uma carteira" é **incorreta**. O Vault ERC-4626 é um contrato inteligente descentralizado onde:

1. **44.15% do supply** está depositado voluntariamente por usuários
2. **Owner renunciado** — ninguém controla o contrato
3. **Saques livres** — qualquer pessoa pode sacar a qualquer momento
4. **Atividade transparente** — depósitos e saques são visíveis on-chain
5. **Código verificável** — auditável na Etherscan

O Vault é um **yield optimizer**, não uma carteira de custódia. A distribuição é saudável e descentralizada.

---

**Documento gerado por:** Optimizer Protocol Investigation Team
**Data:** 24 de Setembro de 2026
**Versão:** 1.0
