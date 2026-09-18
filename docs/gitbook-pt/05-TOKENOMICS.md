# Tokenomics

## Token $BUILDER

O token de utilidade e governança do Optimizer Protocol.

---

## Visão Geral do Token

| Propriedade | Valor |
|-------------|-------|
| Nome | Buildercoin |
| Símbolo | $BUILD |
| Supply Total | 1.000.000.000 |
| Tipo | ERC-20 |
| Utilidade | Staking, Governança, Taxas |

---

## Utilidade do Token

### 1. Staking → Taxas
```
Stake $BUILD → Ganhe 60% das taxas de performance do protocolo
```

### 2. Builder Score → Prioridade
```
Score = Valor × Multiplicador × Tempo
Score maior = Mais taxas + Peso na governança
```

### 3. Governança → Controle
```
Vote nos parâmetros do protocolo
Limite para proposta: 1% do supply
Quórum: 10% do supply
```

### 4. Burn → Deflação
```
5% de todas as taxas → Burn
Reduz supply total ao longo do tempo
```

---

## Fluxo de Taxas

```
┌─────────────────────────────────────────────────────────┐
│              DISTRIBUIÇÃO DE TAXAS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Usuários Trocam → 15% Taxa de Performance              │
│                    │                                    │
│                    ├── 60% → Stakers de $BUILD           │
│                    │        (Optimizer Vault)            │
│                    │                                    │
│                    ├── 20% → Tesouraria                  │
│                    │        (Operações + Auditorias)     │
│                    │                                    │
│                    ├── 15% → Desenvolvedores             │
│                    │        (Manutenção)                 │
│                    │                                    │
│                    └── 5% → Burn                         │
│                             (Deflação)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Recompensas de Staking

| TVL | APY | Taxas Anuais | Stakers Ganham (60%) |
|-----|-----|--------------|---------------------|
| $1M | 37% | $370K | $222K |
| $5M | 37% | $1.85M | $1.11M |
| $10M | 37% | $3.7M | $2.22M |
| $25M | 37% | $9.25M | $5.55M |

---

## Sistema de Multiplicadores

Quanto mais tempo travar, maior seu Builder Score.

```
30 dias  → Multiplicador 1.00x
90 dias  → Multiplicador 1.35x
180 dias → Multiplicador 1.85x
```

**Exemplo:**
- Stake 1.000 $BUILD por 180 dias
- Score = 1.000 × 1.85 = 1.850 pontos
- Se score total = 100.000
- Sua parte = 1.85% das taxas

---

## Mecanismo de Deflação

A cada trimestre:
1. 5% das taxas são usadas para comprar $BUILD do mercado
2. Tokens comprados são queimados permanentemente
3. Supply diminui
4. Escassez aumenta

**Burns projetados (com TVL de $10M):**
- Ano 1: ~$111K queimados
- Ano 2: ~$222K queimados
- Ano 3: ~$444K queimados

---

## Distribuição do Token

```
Supply Total: 1.000.000.000 $BUILD

├── Recompensas de Staking:  400.000.000 (40%)
│   └── Liberado ao longo de 4 anos
│
├── Equipe & Assessores:     200.000.000 (20%)
│   └── Vesting de 2 anos, cliff de 6 meses
│
├── Tesouraria:              150.000.000 (15%)
│   └── Operações, parcerias, grants
│
├── Comunidade:              150.000.000 (15%)
│   └── Airdrops, incentivos de liquidez
│
└── Investidores Seed:       100.000.000 (10%)
    └── Vesting de 1 ano, cliff de 3 meses
```

---

*Próximo: [Utilidade NFT](./06-UTILIDADE-NFT.md)*
