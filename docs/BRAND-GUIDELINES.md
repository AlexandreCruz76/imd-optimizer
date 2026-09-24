# Optimizer Protocol — Brand Guidelines & Animation Brief

> For Designer: Transform technical diagrams into artistic animated visuals

---

## 1. Brand Identity

### 1.1 Logo
- **Primary:** Coração geométrico + seta ascendente (simboliza proteção + yield)
- **Cores:** Verde #00FF41 (sucesso/proteção), Vermelho #FF0040 (ameaça/MEV), Dourado #FFB000 (yield/valor)
- **Variantes:** Light mode, Dark mode, Animated (pulse), Mono

### 1.2 Tipografia
- **Principal:** JetBrains Mono (technical, monospace)
- **Display:** Space Grotesk / Inter Tight (headlines)
- **UI:** IBM Plex Sans (body text)

### 1.3 Paleta de Cores

| Uso | Hex | RGB | Aplicação |
|-----|-----|-----|-----------|
| Primary Green | #00FF41 | 0, 255, 65 | Sucesso, proteção, CTAs, Guardian |
| Primary Red | #FF0040 | 255, 0, 64 | Ameaça, MEV Bot, alertas |
| Gold/Amber | #FFB000 | 255, 176, 0 | Yield, valor, métricas |
| Dark BG | #0A0A0A | 10, 10, 10 | Background principal |
| Dark Card | #111111 | 17, 17, 17 | Cards, painéis |
| Border | #00FF4140 | 0, 255, 65, 0.25 | Bordas sutis |
| Text Primary | #FFFFFF | 255, 255, 255 | Texto principal |
| Text Muted | #888888 | 136, 136, 136 | Labels, secondary |
| Terminal Green | #00FF4160 | 0, 255, 65, 0.38 | Terminal output |

### 1.4 Estilo Visual
- **Referências:** Stripe Motion, Linear.app, Vercel, Apple WWDC
- **Vibe:** "Terminal moderno" — técnico mas acessível
- **Animação:** 60fps, easing `cubic-bezier(0.4, 0, 0.2, 1)`, micro-interactions
- **Partículas:** Streams de dados, não "poeira" — direcionais, com propósito

---

## 2. Personagens & Assets

### 2.1 Personagens Principais

| Personagem | Descrição | Visual | Animação |
|------------|-----------|--------|----------|
| **Trader** | Usuário genérico, neutro | Avatar minimalista, cor neutra (#888) | Idle breathing, hover glow verde ao conectar |
| **MEV Bot** | Ameaça, predatório | Robô angular, vermelho #FF0040, olhos brilhantes | Scan pulsing, tentáculos de dados, glitch ao ser bloqueado |
| **Optimizer Guardian** | Protetor, herói | Escudo hexagonal verde #00FF41, logo no centro | Pulse rítmico, expansão ao interceptar, partículas de proteção |

### 2.2 Logos de Protocolos (Usar Oficiais)

| Protocolo | Asset | Estilo na Animação |
|-----------|-------|-------------------|
| **Optimizer** | Logo próprio | Protagonista, sempre visível |
| **Uniswap V4** | Unicórnio oficial | Portal de entrada, brilho sutil |
| **Ethereum** | Diamante oficial | Base/foundation, pulso lento |
| **Chainlink** | Hexágono oficial | Oracle feed, data streams |
| **Tenderly** | Onda oficial | Simulação, raio de verificação |
| **Flashbots** | Logo oficial | Mempool, relay visual |

### 2.3 Tokens

| Token | Visual | Comportamento |
|-------|--------|---------------|
| **IMD** | Logo token, verde | Flui para Vault, queima = dissolve em partículas |
| **BUILD** | Logo token, dourado | Staking glow, yield particles |
| **ETH** | Diamante Ethereum | Stream principal, alta velocidade |

---

## 3. Animação — Especificação Técnica

### 3.1 Formato de Entrega

| Entregável | Formato | Especificação |
|------------|---------|---------------|
| **Hero Animation** | Rive (.riv) + Lottie (.json) | < 500KB, loop seamless |
| **Marketing Video** | MP4 (H.264) + WebM | 1920×1080, 60fps, 90s |
| **Micro-interactions** | Lottie (.json) | < 50KB cada |
| **Static Diagrams** | SVG + PNG 4K | Dark + Light variants |
| **Source Files** | Figma / After Effects | Organized layers, named |

### 3.2 Hero Animation — 90s Storyboard

| Tempo | Cena | Visual | Áudio/SFX |
|-------|------|--------|-----------|
| **0-3s** | **Logo Reveal** | Logo Optimizer forma-se de partículas IMD → pulse verde → "PROTECT YOUR YIELD" | Low hum → crisp chime |
| **3-13s** | **The Threat** | Trader envia stream ETH → MEV Bot emerge do mempool (vermelho) → tentáculos envolvem TX → tela treme vermelho | Tensão crescente, glitch sounds |
| **13-28s** | **The Intervention** | Guardian escudo expande do logo Optimizer → bloqueia Bot → raio Tenderly simula → Bot glitcha e recua | "Shield up" sound, simulation whoosh |
| **28-43s** | **Hook Action** | CappedBurnHook ativa → ícones de fogo queimam IMD → price impact reduz → Bot vê lucro zero → desiste | Burn sizzle, cash register reverse |
| **43-58s** | **Vault Yield** | Fees fluem → Distributor → 60% Vault → share price sobe → Trader recebe yield → smile | Coins dropping, satisfying pop |
| **58-73s** | **Live Metrics** | Contadores animados: $5.2K recuperados, 57 ataques, 44% supply, 15% APY | Counter tick sounds |
| **73-90s** | **Outro** | Logo Optimizer + "PROTECT YOUR YIELD" → CTA: "optimize.imd.xyz" | Resolve to brand chord |

### 3.3 Micro-Interactions (Lottie)

| Componente | Trigger | Animação |
|------------|---------|----------|
| **Connect Wallet** | Hover → Click | Wallet icon → pulse verde → check |
| **Protection Badge** | Page load | Escudo forma-se → "PROTECTED" fade in |
| **Swap Button** | Hover | Background sweep verde → loading spinner |
| **MEV Alert** | Real-time | Badge vermelho pulse → slide in → auto-dismiss |
| **Yield Counter** | Scroll into view | Numbers count up 0 → target |
| **Token Stream** | Continuous | Partículas IMD/ETH fluindo Vault → Trader |

---

## 4. Diagramas Estáticos — Estilo Artístico

### 4.1 Princípios de Transformação

| Técnico → Artístico | Como Fazer |
|---------------------|------------|
| Caixas retangulares → **Nós orgânicos** | Formas arredondadas, glow, profundidade |
| Setas retas → **Streams de partículas** | Curvas de Bézier, velocidade variável |
| Texto pequeno → **Labels flutuantes** | Tooltip on hover, animação de entrada |
| Cores flat → **Gradientes + glow** | Inner shadow, outer glow, emissive |
| Estático → **Vivo** | Micro-movimento constante (breathing) |

### 4.2 Diagrama 1: Arquitetura — "Living System"

```
┌─────────────────────────────────────────────────────────────┐
│  BACKGROUND: Grid sutil animado (terminal aesthetic)        │
│                                                             │
│  CENTRO: Optimizer Router (hexágono pulsante, logo)         │
│         │                                                    │
│    ┌────┼────┐                                              │
│    ▼    ▼    ▼                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐                                    │
│  │Hook │ │Oracle│ │Vault │  ← Nós com logos animados        │
│  │🔥   │ │📡   │ │🏦   │                                    │
│  └──┬──┘ └──┬──┘ └──┬──┘                                    │
│     │       │       │                                        │
│     ▼       ▼       ▼                                        │
│  ┌─────────────────────────┐                                 │
│  │   Uniswap V4 PoolManager │  ← Portal unicórnio            │
│  └─────────────────────────┘                                 │
│                                                             │
│  PARTÍCULAS: ETH (diamante) → Router → Hook → Pool           │
│              IMD (verde) ← Vault ← Distributor               │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Diagrama 2: Anti-MEV Flow — "Battle Scene"

```
┌─────────────────────────────────────────────────────────────┐
│  LEFT: Trader (avatar) → stream ETH partículas              │
│                                                             │
│  CENTER: MEV Bot (vermelho, ameaçador) TENTA interceptar    │
│          │                                                   │
│          ▼                                                   │
│       ┌─────────┐                                           │
│       │ SHIELD  │  ← Guardian expande (verde, hexagonal)    │
│       │ 🛡️     │     Bot ricocheteia, glitch, desaparece    │
│       └────┬────┘                                           │
│            │                                                │
│            ▼                                                │
│       ┌─────────┐                                           │
│       │  HOOK   │  ← Fogo queima IMD, price impact ↓        │
│       │  🔥     │                                           │
│       └────┬────┘                                           │
│            │                                                │
│  RIGHT:    ▼                                                │
│  ┌─────────────────┐                                        │
│  │   SETTLEMENT    │  ← Check verde, confete sutil         │
│  │   ✅ PROTECTED  │                                        │
│  └─────────────────┘                                        │
│                                                             │
│  BELOW: Vault recebe yield → partículas douradas → Trader   │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Diagrama 3: Tokenomics — "Economic Heart"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│        ┌─────────────────┐                                  │
│        │   VAULT CENTER  │  ← Coração pulsante (44% supply)│
│        │   1.66M IMD     │                                  │
│        │   💚💚💚💚💚💚   │                                  │
│        └────────┬────────┘                                  │
│                 │                                           │
│      ┌──────────┼──────────┐                                │
│      ▼          ▼          ▼                                │
│   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐                    │
│   │STAKE│   │TREAS│   │ DEV │   │BURN │                    │
│   │ 60% │   │ 20% │   │ 15% │   │ 5%  │                    │
│   │🥩   │   │🏛️   │   │👨‍💻 │   │🔥   │                    │
│   └──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘                    │
│      │         │         │         │                        │
│      ▼         ▼         ▼         ▼                        │
│   Trader    Ops/      Code      Deflation                   │
│   Yield     Audits    Quality   Pressure                    │
│                                                             │
│  FEEDERS: Uniswap Pools → Fees → Distributor → Vault        │
│           (animated streams from top)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Motion Specs

### 5.1 Easing Curves

```css
/* Primary - smooth, confident */
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-out-circ: cubic-bezier(0.075, 0.82, 0.165, 1);

/* Micro-interactions - snappy */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Data streams - continuous */
--ease-linear: linear;
```

### 5.2 Timing

| Elemento | Duração | Delay | Loop |
|----------|---------|-------|------|
| Logo pulse | 2s | 0s | ∞ |
| Guardian shield expand | 0.6s | 0.1s | Once |
| Token stream | 3s | Staggered | ∞ |
| Counter animate | 1.5s | On scroll | Once |
| Particle burst | 0.8s | On trigger | Once |
| Page transition | 0.4s | 0s | Once |

### 5.3 Particle Systems

```javascript
// Token Stream Config
const streamConfig = {
  count: 50,
  speed: { min: 100, max: 300 }, // px/s
  size: { min: 4, max: 12 },
  opacity: { start: 1, end: 0 },
  color: ['#00FF41', '#FFB000', '#FFFFFF'],
  path: 'bezier', // curved paths
  emitRate: 20 // per second
};

// Burn Effect
const burnConfig = {
  particles: 30,
  colors: ['#FF0040', '#FF4000', '#FF8000'],
  physics: 'gravity', // fall and fade
  duration: 1.5
};
```

---

## 6. Technical Integration

### 6.1 Web Implementation (Next.js)

```tsx
// components/HeroAnimation.tsx
import { Rive } from '@rive-app/react-canvas';

export function HeroAnimation() {
  return (
    <div className="relative w-full h-[600px] bg-[#0A0A0A]">
      <Rive
        src="/animations/hero.riv"
        stateMachines="Hero"
        autoPlay
        onLoad={() => console.log('Rive loaded')}
        className="w-full h-full"
      />
      {/* Overlay metrics - real data from API */}
      <LiveMetricsOverlay />
    </div>
  );
}
```

### 6.2 Real Data Binding

```typescript
// Hook data from API
interface LiveMetrics {
  totalRecoveredUSD: number;    // $5,237.92
  attacksDetected: number;      // 57
  vaultSupplyPct: number;       // 44.15
  currentAPY: number;           // 15.2
}

// Animate counters
function animateCounter(target: number, duration: 1500) {
  // use spring animation
}
```

---

## 7. Entregáveis Checklist

### Para GitHub (Esta Semana)
- [ ] `docs/ARCHITECTURE-DIAGRAMS.md` — Mermaid diagrams
- [ ] `docs/ANTI-MEV-INNOVATION.md` — Technical deep dive
- [ ] `docs/BRAND-GUIDELINES.md` — Este arquivo
- [ ] README.md updated com hero animation embed

### Para Designer (Próximos 5 dias)
- [ ] Logo Optimizer (SVG + animated variants)
- [ ] 3 Personagens (Trader, MEV Bot, Guardian) — SVG + PNG sequences
- [ ] 12 Frame Storyboard (PDF)
- [ ] Hero Animation Rive file
- [ ] 5 Micro-interactions Lottie
- [ ] 3 Static Diagram SVGs (Arch, Flow, Tokenomics)

### Para Marketing (Semana 2)
- [ ] 90s Video MP4/WebM
- [ ] 15s/30s/60s Cuts para Twitter/LinkedIn
- [ ] Thumbnail variants
- [ ] GIF loops para docs

---

## 8. Referências Visuais

| Referência | O que Pegar | Link |
|------------|-------------|------|
| **Stripe Motion** | Particle systems, grid bg | stripe.com/motion |
| **Linear.app** | Clean dark UI, micro-interactions | linear.app |
| **Vercel** | Technical aesthetic, code blocks | vercel.com |
| **Uniswap Brand** | Logo usage, color palette | brand.uniswap.org |
| **Ethereum Foundation** | Diamond logo, guidelines | ethereum.org/en/brand |
| **Chainlink** | Hexagon, data streams | chain.link/brand |
| **Rive Examples** | State machine patterns | rive.app/community |

---

## 9. Aprovação & Iteração

| Etapa | Responsável | Prazo | Critério |
|-------|-------------|-------|----------|
| Storyboard | Designer + Founder | Dia 2 | Narrativa clara, 12 frames |
| Styleframes (3) | Designer | Dia 3 | Visual direction locked |
| Hero Animation v1 | Designer | Dia 5 | 90s, <500KB Rive |
| Micro-interactions | Designer | Dia 6 | 5 Lottie files |
| Integration Test | Dev | Dia 7 | Works in Next.js |
| Final Polish | All | Dia 8 | Approved for launch |

---

## 10. Contato

**Tech Lead:** Alexandre Cruz (@Codeming_web3)
**Repo:** github.com/AlexandreCruz76/imd-optimizer
**Figma:** [Link a ser compartilhado]
**Slack/Discord:** [Convite interno]

---

**Versão:** 1.0 | **Data:** 24 Set 2026 | **Status:** Ready for Designer Handoff