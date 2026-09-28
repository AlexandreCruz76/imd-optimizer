# 🔬 Optimizer Forensics — Provas On-Chain Reprodutíveis

Scripts de **leitura** (archive RPC) que geram os números publicados nas threads do
X.com e no laudo forense de 26/09/2026. Nenhuma transação é enviada — apenas logs
de blocos são lidos e decodificados.

> ⚠️ **Detecção, não interceptação.** Estes scripts **não** executam MEV, **não**
> interceptam swaps e **não** recuperam fundos. Eles detectam padrões de ataque
> (sandwich / cross-block) em blocos já minados e imprimem hashes verificáveis no
> Etherscan. Nossos contratos de proteção estão em **Sepolia**, não na mainnet.

---

## Números verificados (janela: blocos 25.800.000 → 26.062.452)

| Pool | Swaps | Traders | Padrões | Bots |
|------|-------|---------|---------|------|
| ETH/USDT `0x2287a962…` (referência) | 155.687 | 469 | 4.427 (695 sandwiches) | 102 |
| IMD/ETH Hook `0xb07d640f…` | 4.536 | 106 | 76 (12 sandwiches) | 11 |
| IMD/ETH Native `0x415829f7…` | 4.953 | 110 | 27 | 8 |

- Cross-pool: **49** bots nas duas pools IMD/ETH · **42** endereços nas três pools
- Par da pool `0x2287a962…` provado como **ETH/USDT** via receipts (USDT em 100% das
  amostras, IMD nunca; preço implícito ~2.440 USDT/ETH)
- Amostra de sandwich: bloco 25.800.326 — front `0xca69e286…`, vítima `0x7ff32e4c…`,
  back `0xbcac169e…`

---

## Requisitos

```bash
# na raiz do repositório
npm install   # já instala ethers (devDependency do Hardhat)
```

Node 18+. Sem chaves de API — usamos RPCs públicos (BlockPI para archive;
Flashbots apenas para cross-check, pois retorna vazio em blocos antigos).

---

## Scripts

| Arquivo | O que faz | Saída |
|---------|-----------|-------|
| `forensic-final.js` | **Script principal.** Varre as 3 pools, conta swaps/traders/padrões/bots, detecta sandwiches, extrai amostras com hashes | `results/forensic-final-result.json` |
| `final-numbers.js` | Recalcula os números-resumo das pools (imprime no console) | stdout |
| `verify-std-pool.js` | Prova que a pool `0x2287a962…` tem volume real e identifica o par por receipts de tx | `results/verify-std-pool-result.json` |
| `verify-crosscheck.js` | Cross-check entre 2 RPCs no mesmo range (valida consistência dos counts) | stdout |
| `topic-forensics.js` | Valida os event topics usados (Swap do PoolManager, ModifyLiquidity) | stdout |

### Execução

```bash
node forensics/forensic-final.js     # ~2-5 min (varre ~262k blocos)
node forensics/final-numbers.js
node forensics/verify-std-pool.js
node forensics/verify-crosscheck.js
node forensics/topic-forensics.js
```

`results/example-forensic-final-result.json` é a saída de referência da execução de
26/09/2026 — compare com a sua execução.

---

## Metodologia (resumo)

1. **Leitura de logs** `Swap` do PoolManager (`topics[1]` = poolId) via `eth_getLogs`
2. **Detecção de sandwich (forte):** mesmo `sender` faz buy → swaps de vítimas → sell
   no mesmo bloco, mesma pool, ordem de `logIndex` verificável
3. **Detecção cross-block (fraca):** buy/sell em ≤3 blocos — reportada separadamente
   por poder inflar
4. **Identidade de par:** sempre via `receipt` de tx real (transfers ERC-20), nunca
   por rótulo em código — lição do erro corrigido em 26/09/2026
5. **Lucro estimado:** heurística `min(perna) × 0.1%` — estimativa, nunca valor
   "recuperado"

**RPCs:** `ethereum.public.blockpi.network` (archive) · `rpc.flashbots.net`
(cross-check apenas — retorna vazio silenciosamente para blocos antigos)
