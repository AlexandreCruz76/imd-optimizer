# Como Funciona

## O Meta-Hook Engine de 3 Camadas

O Optimizer implanta um **Singleton Hook** no Uniswap V4 que intercepta cada troca e executa três camadas de lógica.

---

## Camada 1: Identity-Fi (beforeSwap)

```
┌─────────────────────────────────────────┐
│         CAMADA 1: IDENTITY-FI           │
├─────────────────────────────────────────┤
│                                         │
│  Usuário troca → Verifica posse de NFT  │
│                                         │
│  Genesis Key?     → 0% de taxa          │
│  Identity MD?     → 0.1% de taxa        │
│  Parceiro B2B?    → 0% de taxa          │
│  Varejo           → 0.5% de taxa        │
│                                         │
│  Taxa coletada → Distribuída ao $BUILD  │
└─────────────────────────────────────────┘
```

**Como funciona:**
1. Usuário inicia uma troca
2. Hook lê a posse de NFT da carteira
3. Taxa dinâmica aplicada baseada no tier
4. Taxas distribuídas aos stakers de $BUILDER

---

## Camada 2: Elasticidade (afterSwap)

```
┌─────────────────────────────────────────┐
│         CAMADA 2: ELASTICIDADE          │
├─────────────────────────────────────────┤
│                                         │
│  Troca concluída → Verifica impacto     │
│                                         │
│  Preço alto demais?  → Aciona burn      │
│  Preço baixo demais? → Aciona mint      │
│                                         │
│  Oferta se ajusta → Preço estabiliza    │
└─────────────────────────────────────────┘
```

**Como funciona:**
1. Após cada troca, hook verifica o preço
2. Se preço desvia muito, aciona ajuste de oferta
3. Integra com política elástica do Standard Reserve
4. Previne volatilidade extrema

---

## Camada 3: Internalização de MEV (afterSwap)

```
┌─────────────────────────────────────────┐
│         CAMADA 3: CAPTURA DE MEV        │
├─────────────────────────────────────────┤
│                                         │
│  Troca concluída → Detecta delta preço  │
│                                         │
│  Delta > 0.5%?   → Executa arbitragem   │
│  Compra baixo na Pool A                 │
│  Vende alto na Pool B                   │
│                                         │
│  Lucro → Retornado ao pool de LP        │
└─────────────────────────────────────────┘
```

**Como funciona:**
1. Hook detecta diferença de preço entre pools
2. Executa arbitragem atomicamente
3. Lucro capturado ao invés de ir para bots
4. LPs recebem o MEV capturado

---

## O Resultado

| Sem Optimizer | Com Optimizer |
|---------------|---------------|
| 129% APY | **308% APY** |
| MEV roubado por bots | MEV capturado internamente |
| Varejo paga mesma taxa | Holders de NFT pagam 0% |
| Gestão manual | Otimização automática |

---

## Exemplo: Depósito de 1 ETH

```
Sem Optimizer:
  Depósito: 1 ETH
  APY: 129%
  Yield anual: 1.29 ETH
  MEV perdido: ~0.3 ETH
  Yield líquido: 0.99 ETH

Com Optimizer:
  Depósito: 1 ETH
  APY: 308%
  Yield anual: 3.08 ETH
  MEV capturado: +0.3 ETH
  Yield líquido: 3.38 ETH
```

**Isso é 3.4x mais yield.**

---

*Próximo: [Arquitetura](./03-ARQUITETURA.md)*
