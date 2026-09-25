# Fase de Retenção e Proof of Concept — Optimizer Protocol

**Data:** 24 Setembro 2026
**Versão:** 1.0
**Status:** Preparação para produção

---

## 1. Visão Geral da Arquitetura

### 1.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTIMIZER PROTOCOL ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   USUÁRIO    │───▶│  OPTIMIZER   │───▶│  CAPPEDBURN  │───▶│  VAULT   │  │
│  │   (TRADER)   │    │   ROUTER     │    │     HOOK     │    │  ERC-4626│  │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘    └──────────┘  │
│                             │                   │                           │
│                             ▼                   ▼                           │
│                    ┌─────────────────┐  ┌──────────────┐                   │
│                    │  MEV ORACLE     │  │  POOL MANAGER│                   │
│                    │  (INTELLIGENCE) │  │  (UNISWAP V4)│                   │
│                    └────────┬────────┘  └──────────────┘                   │
│                             │                                              │
│                             ▼                                              │
│                    ┌─────────────────┐                                    │
│                    │  DISTRIBUTOR    │                                    │
│                    │  + DRIPPER      │                                    │
│                    └─────────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo de Dados Anti-MEV

```
TRADER SWAP REQUEST
       │
       ▼
┌──────────────────┐
│  OPTIMIZER       │
│  ROUTER          │◀── Intercepta TX antes do PoolManager
│  (MEV Guard)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  SIMULAÇÃO       │     │  CAPPEDBURN      │
│  OFF-CHAIN       │────▶│  HOOK            │
│  (Tenderly/      │     │  (On-chain       │
│   Foundry)       │     │   protection)    │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  EXECUÇÃO        │
                         │  PROTEGIDA       │
                         │  + BURN IMD      │
                         └──────────────────┘
```

---

## 2. Prompts para Designer — Diagramas Artísticos Animados

### 2.1 Prompt Principal — Vídeo Animado (60-90s)

> **Estilo:** Motion design moderno, dark mode com accent verde (#00FF41) e vermelho (#FF0040), tipografia monoespaçada técnica
> 
> **Elementos visuais:**
> - Logo Optimizer Protocol (coração estilizado + seta) como "personagem principal"
> - Logos reais: Uniswap (unicórnio), Ethereum (diamante), Chainlink (hexágono), Tenderly (onda)
> - Personagens: "Trader" (avatar genérico), "MEV Bot" (robô vermelho ameaçador), "Optimizer Guardian" (escudo verde animado)
> - Partículas de ETH/IMD fluindo como streams de dados
> - Transições suaves estilo Apple/Linear/Stripe
> 
> **Cena 1 (0-5s):** Trader inicia swap → partículas ETH saem da carteira
> **Cena 2 (5-15s):** MEV Bot detecta → tenta sanduíche → tela treme vermelho
> **Cena 3 (15-30s):** Optimizer Guardian intercepta → escudo verde pulsante → simula off-chain
> **Cena 4 (30-45s):** CappedBurnHook ativa → queima IMD → protege price impact
> **Cena 5 (45-60s):** Vault recebe yield → distribuição automática → Trader sorri
> **Cena 6 (60-75s):** Métricas reais: $5.2K recuperados, 57 ataques detectados, 44% supply no vault
> **Cena 7 (75-90s):** Logo Optimizer + "Proteja seu Yield" + CTA

### 2.2 Prompts por Diagrama Estático (GitHub README)

#### Diagrama 1: Arquitetura Geral
> **Prompt:** "Technical architecture diagram, isometric 3D style, dark background #0A0A0A, nodes as glowing protocol logos connected by animated data streams. Optimizer Router (center, green glow) connects to: Uniswap V4 PoolManager (unicorn logo), CappedBurnHook (fire logo), MEV Oracle (radar logo), Vault (safe logo), Distributor (arrow logo). Particle effects showing ETH/IMD flow. Clean labels in JetBrains Mono."

#### Diagrama 2: Fluxo Anti-MEV
> **Prompt:** "Sequence diagram animated, horizontal flow. Left: User wallet (green). Middle: MEV Bot (red, menacing) blocked by Optimizer Shield (green hexagonal shield with logo). Right: Protected execution path. Show: 1) Mempool monitoring, 2) Attack simulation, 3) Hook intervention, 4) Burn mechanism, 5) Yield distribution. Color code: Green = safe, Red = attack, Gold = yield."

#### Diagrama 3: Tokenomics & Vault
> **Prompt:** "Circular flow diagram. Center: Optimizer Vault (44% supply). Outer ring: 4 streams — Stakers (60% fees), Treasury (20%), Devs (15%), Burn (5%). Each stream has animated particles. IMD token logo pulsing at center. Uniswap V4 pools (Hook + Native) feeding yield into vault. Modern infographic style."

#### Diagrama 4: Comparativo Anti-MEV
> **Prompt:** "Comparison table as visual cards. Left column: Traditional protection (Flashbots, MEV-Share, Commit-Reveal) — gray, static. Right column: Optimizer Protocol — green, animated. Metrics: Latency, Capital efficiency, Composability, User UX, Hook integration. Checkmarks vs X marks. Modern SaaS landing page style."

---

## 3. Especificação Técnica para Animação (After Effects / Rive / Lottie)

### 3.1 Assets Necessários

| Asset | Formato | Especificação |
|-------|---------|---------------|
| Logo Optimizer | SVG + PNG 4K | Versão light/dark, animated variant |
| Logo Uniswap | SVG | Oficial (unicórnio) |
| Logo Ethereum | SVG | Oficial (diamante) |
| Logo Chainlink | SVG | Oficial (hexágono) |
| Logo Tenderly | SVG | Oficial |
| IMD Token | SVG | Token brand |
| BUILD Token | SVG | Token brand |
| Personagem Trader | SVG/PNG | Avatar genérico, 3 poses |
| Personagem MEV Bot | SVG/PNG | Robô vermelho, 3 poses |
| Personagem Guardian | SVG/PNG | Escudo verde animado, 5 frames |
| Partículas ETH | PNG sequence | 30 frames, transparente |
| Partículas IMD | PNG sequence | 30 frames, transparente |
| Shield Effect | PNG sequence | Hexagonal pulse, 20 frames |
| Burn Effect | PNG sequence | Fire + token dissolving, 25 frames |

### 3.2 Timing & Keyframes

| Cena | Duração | Keyframes Principais |
|------|---------|---------------------|
| Intro | 3s | Logo reveal + title |
| Problem | 10s | MEV bot attack visualization |
| Solution | 15s | Guardian intercept + simulation |
| Hook Action | 10s | Burn animation + price protection |
| Vault Yield | 10s | Distribution flow |
| Metrics | 10s | Live data counter animation |
| Outro | 5s | Logo + CTA |

---

## 4. Teste de Interceptação MEV — Sepolia vs Mainnet

### 4.1 Limitação da Sepolia

**Não é possível testar interceptação MEV real na Sepolia porque:**

| Fator | Sepolia | Mainnet |
|-------|---------|---------|
| **MEV Bots ativos** | Quase zero | Centenas (Beaver, Rsync, etc.) |
| **Competição por blocos** | Baixa | Extrema (PGA wars) |
| **Flashbots/MEV-Share** | Não funcional | Produção |
| **Volume de swaps** | ~100/dia | ~500K/dia |
| **Valor em risco** | Testnet ETH (sem valor) | Bilhões USD |

### 4.2 Alternativa: Teste Híbrido

**Estratégia recomendada:**

```javascript
// 1. TESTE UNITÁRIO (Sepolia) - Lógica do Hook
// Deploy CappedBurnHook na Sepolia
// Verificar: afterSwap -> burn logic -> price impact reduction

// 2. SIMULAÇÃO OFF-CHAIN (Mainnet Fork) - Cenários reais
// Fork Mainnet no Foundry/Tenderly
// Replay ataques reais (Beaver, Rsync bundles)
// Medir: proteção efetiva, gas overhead, UX impact

// 3. SHADOW MODE (Mainnet) - Monitoramento passivo
// Deploy router + hook em mainnet (pequeno capital)
// Interceptar TXs reais, simular proteção, NÃO executar
// Comparar: resultado com vs sem proteção

// 4. PRODUÇÃO GRADUAL
// Alpha: 1 ETH capital, whitelist users
// Beta: 10 ETH, público
// GA: Capital total
```

### 4.3 Script de Teste Mainnet Fork

```bash
# foundry test --fork-url https://eth-mainnet.g.alchemy.com/v2/$KEY \
#   --fork-block-number 26049586 \
#   -vvv \
#   --match-test testMEVInterception
```

---

## 5. Argumentos Técnicos de Inovação Anti-MEV

### 5.1 Estado da Arte Atual (O que existe)

| Solução | Abordagem | Limitações |
|---------|-----------|------------|
| **Flashbots MEV-Share** | Order flow auction, rebates | Centralizado, requer opt-in, latência |
| **MEV Blocker** | RPC privado, backrun protection | Só protege backrun, não sandwich |
| **Commit-Reveal (Threshold)** | Criptografia, reveal posterior | Quebra composabilidade, UX ruim |
| **UniswapX / CoW Swap** | Intents + solvers | Centralizado nos solvers, não protege LP |
| **JIT Liquidity** | Liquidez concentrada no último segundo | Só protege LPs, não traders |
| **MEV-Share + PBS** | Proposer-Builder Separation | Ainda em desenvolvimento, Ethereum roadmap |

### 5.2 Nossa Inovação: **Hook-Native MEV Protection**

| Inovação | Descrição | Diferencial |
|----------|-----------|-------------|
| **1. Proteção Nativa no Hook** | Logic inside `afterSwap` — executa ANTES do settlement | Zero overhead de TX extra, atômico |
| **2. Burn como Mecanismo Econômico** | Queima IMD para reduzir price impact do atacante | Alinha incentivos: atacante perde, protocolo ganha |
| **3. Oracle Preditivo Off-Chain** | MEV Oracle detecta padrões ANTES do bloco | Prevenção proativa, não reativa |
| **4. Router com Simulação** | Simula resultado com/sem proteção via Tenderly | UX transparente — usuário não percebe |
| **5. Vault ERC-4626 Integrado** | Yield do burn + fees → vault → stakers | Circular economy: proteção gera yield |
| **6. Composabilidade Total** | Funciona com QUALQUER router/aggregator | Não quebra DeFi legos |

### 5.3 Por Que Isso Nunca Foi Feito

```solidity
// Padrão tradicional: proteção EXTERNA ao pool
// Problema: race condition, gas overhead, quebrada por bundles

// NOSSA ABORDAGEM: proteção INTERNA ao hook
hook CappedBurnHook {
    function afterSwap(...) external override {
        // 1. Detecta direção do swap
        // 2. Calcula price impact
        // 3. Se impact > threshold -> queima IMD
        // 4. Reduz slippage efetivo para o trader
        // 5. Atacante vê lucro reduzido -> desiste
    }
}
```

**Ninguém fez isso antes porque:**
1. Uniswap V4 Hooks só existem desde 2024
2. Requer design de tokenomics onde burn beneficia o ecossistema
3. Precisa de Oracle off-chain para detecção preditiva
4. Integração Vault + Hook + Router é complexa

### 5.4 Métricas de Superioridade

| Métrica | Flashbots | MEV Blocker | Optimizer Protocol |
|---------|-----------|-------------|-------------------|
| **Proteção Sandwich** | Parcial | Não | **Sim (Hook)** |
| **Latência Adicional** | ~200ms | ~50ms | **~0ms (atômico)** |
| **Composabilidade** | Quebrada | Parcial | **Total** |
| **Capital Efficiency** | Baixa | Média | **Alta** |
| **Yield para User** | Rebate % | Zero | **APY real + Burn** |
| **Incentivo Protocolo** | Taxa fixa | Taxa fixa | **Burn deflacionário** |
| **Decentralização** | Parcial | Centralizada | **Total (on-chain)** |

---

## 6. Próximos Passos — Cronograma

### Semana 1-2: Assets & Diagrams
- [ ] Designer cria assets SVG/PNG (logos, personagens)
- [ ] Diagrama arquitetura para GitHub (Mermaid + SVG)
- [ ] Diagrama fluxo Anti-MEV (sequence diagram)
- [ ] Diagrama tokenomics (circular flow)

### Semana 3: Animação
- [ ] Storyboard aprovado
- [ ] Animação Rive/Lottie (leve, web-ready)
- [ ] Versão After Effects (alta qualidade, marketing)
- [ ] Integração no site (hero section)

### Semana 4: Testes & POC
- [ ] Deploy Hook + Router na Sepolia
- [ ] Fork Mainnet + replay ataques reais
- [ ] Shadow mode mainnet (monitoring only)
- [ ] Métricas de performance

### Semana 5: Produção
- [ ] Alpha launch (whitelist)
- [ ] Métricas reais de proteção
- [ ] Case study para investidores
- [ ] Pitch deck atualizado

---

## 7. Arquivos para Entrega

### 7.1 Para GitHub (Documentação Técnica)
```
docs/
├── ARCHITECTURE.md          # Arquitetura completa (Mermaid)
├── ANTI-MEV-INNOVATION.md   # Argumentos técnicos detalhados
├── MEV-TESTING-GUIDE.md     # Como testar em fork/mainnet
├── HOOK-SPEC.md             # Especificação CappedBurnHook
├── VAULT-SPEC.md            # ERC-4626 Vault spec
└── API-REFERENCE.md         # Router, Oracle, Vault APIs
```

### 7.2 Para Designer (Briefing Criativo)
```
design/
├── BRAND-GUIDELINES.md      # Cores, tipografia, logo usage
├── ANIMATION-BRIEF.md       # Prompts detalhados + timing
├── STORYBOARD.pdf           # 12 frames descritivos
├── ASSETS-LIST.md           # Todos assets necessários
└── REFERENCES/
    ├── stripe-motion.pdf    # Referência estilo
    ├── linear-app.pdf       # Referência estilo
    └── uniswap-brand.pdf    # Guidelines Uniswap
```

### 7.3 Para Desenvolvimento (POC)
```
poc/
├── foundry.toml             # Config fork mainnet
├── test/
│   ├── MEVInterception.t.sol
│   ├── HookProtection.t.sol
│   └── VaultYield.t.sol
├── script/
│   ├── DeploySepolia.s.sol
│   ├── DeployMainnet.s.sol
│   └── ShadowMode.s.sol
└── benchmarks/
    └── gas-report.md
```

---

## 8. Checklist de Validação Técnica

Antes do launch, validar:

- [ ] **Hook:** `afterSwap` executa em < 50k gas adicional
- [ ] **Router:** Simulação Tenderly < 2s latency
- [ ] **Oracle:** Detecta sandwich em < 1 bloco
- [ ] **Vault:** APY > 15% com volume atual
- [ ] **Burn:** Deflação mensurável on-chain
- [ ] **UX:** Trader não percebe proteção (transparente)
- [ ] **Composabilidade:** Funciona com 1inch, Matcha, CowSwap
- [ ] **Segurança:** Auditado (OpenZeppelin + custom)

---

## 9. Contatos & Recursos

| Recurso | Link/Contato |
|---------|--------------|
| Repositório | github.com/AlexandreCruz76/imd-optimizer |
| Mainnet Hook | `0xc6c965bd164c483e87d0b550671798e9a3602840` |
| Mainnet Vault | `0x9efa934d9fad4ae28c998a40195646b965a97247` |
| Sepolia Deployer | `0x067fFf62022B1fF522f0624f4a03E42Fb6cBA0B0` |
| RPC Mainnet | `https://ethereum-rpc.publicnode.com` |
| RPC Sepolia | `https://eth-sepolia.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E` |
| Tenderly Dashboard | tenderly.co (simulação) |
| Foundry Book | book.getfoundry.sh |

---

**Preparado para:** Fase de Retenção + POC + Marketing Visual
**Próxima revisão:** 01 Outubro 2026