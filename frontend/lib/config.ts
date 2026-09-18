/**
 * Otimizador de Pool Hook - Configuração
 * 
 * Configuração central do otimizador $IMD CappedBurnHook.
 * Todos os endereços de contratos e parâmetros são definidos aqui.
 */

export const CONFIG = {
  // ───────────────────────── Contratos (Ethereum Mainnet) ─────────────────────────
  contracts: {
    hook: "0xc6c965bd164c483e87d0b550671798e9a3602840",
    poolManager: "0x000000000004444c5dc75cB358380D2e3dE08A90",
    stateView: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
    imd: "0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",
    distributor: "0x9046739e1535b40efbe6ab3f45d0024b690eca30",
    dripper: "0xe6d3de6daeaf327fca42745f1998fcd989e00884",
    vault: "0x9efa934d9fad4ae28c998a40195646b965a97247",
    burnExecutor: "0xe29386719C155B6847aD5a4E97C6674f10ffc750",
    referencePoolId: "0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3",
    ethUsdcV3: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
  },

  // ───────────────────────── Parâmetros da Pool ─────────────────────────
  pool: {
    openBlock: 25887180,
    blocksPerHour: 300, // blocos de 12s
    lpFeeBps: 100, // taxa LP de 1%
    rewardShareBps: 1500, // 15% dos trims para recompensas
  },

  // ───────────────────────── Configurações do Otimizador ─────────────────────────
  optimizer: {
    // Taxa de performance do otimizador (15% do yield extra)
    performanceFeeBps: 1500,
    
    // Tamanho mínimo da posição LP (em ETH)
    minPositionEth: 1,
    
    // Tamanho máximo recomendado da posição (em ETH)
    maxPositionEth: 100,
    
    // Limite de rebalanceamento (mudança percentual no APY para acionar rebalanceamento)
    rebalanceThresholdBps: 500, // 5%
    
    // Janela de análise (horas)
    analysisWindowHours: 168, // 7 dias
    
    // Períodos de projeção (dias)
    projectionDays: [7, 30, 90, 365],
  },

  // ───────────────────────── Configuração RPC ─────────────────────────
  rpc: {
    publicEndpoints: [
      "https://ethereum-rpc.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://1rpc.io/eth",
      "https://eth.drpc.org",
      "https://cloudflare-eth.com",
      "https://rpc.flashbots.net",
      "https://ethereum.blockpi.network/v1/rpc/public",
      "https://rpc.mevblocker.io",
    ],
    timeoutMs: 45000,
    maxRetries: 3,
  },

  // ───────────────────────── Configurações de Exibição ─────────────────────────
  display: {
    decimals: {
      eth: 4,
      imd: 2,
      percent: 2,
      price: 2,
    },
    currency: "USD",
  },
} as const;

export type Config = typeof CONFIG;
