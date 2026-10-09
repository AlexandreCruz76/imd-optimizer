// ============================================================================
// Camada central de deployments + feature flags (prontidão Mainnet)
// ----------------------------------------------------------------------------
// ÚNICA fonte de endereços por rede. No deploy na Mainnet: preencher
// DEPLOYMENTS.mainnet e alternar NEXT_PUBLIC_ACTIVE_NETWORK=mainnet.
// O que não estiver pronto até o Mint fica com mainnetLockedUntilMint=true —
// na Sepolia nada é bloqueado (100% funcional para teste).
// ============================================================================

export type NetworkKey = "sepolia" | "mainnet";

/** Rede-alvo do build. Sepolia por padrão. */
export const ACTIVE_NETWORK: NetworkKey =
  (process.env.NEXT_PUBLIC_ACTIVE_NETWORK as NetworkKey) || "sepolia";

/**
 * Fase do lançamento na Mainnet:
 * - "premint": só Swap + Staking + Dashboard ativos; demais itens do menu
 *   exibem cadeado até os contratos subirem.
 * - "mint": tudo liberado (após deploy mainnet dos demais módulos).
 */
export type MainnetPhase = "premint" | "mint";
export const MAINNET_PHASE: MainnetPhase =
  (process.env.NEXT_PUBLIC_MAINNET_PHASE as MainnetPhase) || "premint";

export interface DeploymentAddresses {
  optimizerRouter: string;
  optimizerVaultV2: string;
  stakingVault: string;
  bldToken: string;
  buildercoinNFT: string;
  treasury: string;
  penaltyVenue: string;
  burnPenaltySink: string;
  swapPools: Record<string, string>;
}

const SEPOLIA: DeploymentAddresses = {
  optimizerRouter: "0xfF3081Cd8442022C8766979FB3392df1C23C8205",
  optimizerVaultV2: "0x39Ecb3990e994538c1D983420e8d4Faf99C2C9BF",
  stakingVault: "0x3A7C178A5467EfB1E4a98C95c6157C13e2E37da9",
  bldToken: "0xc2296194eD329a1024FE801a374d9f7acF0acC4b",
  buildercoinNFT: "0x724A0a04f7b5f67992D4cEB3F859B3FbA8c808e4",
  treasury: "0x067fFf62022B1fF522f0624f4a03E42Fb6cBA0B0",
  penaltyVenue: "0xebb502a6a2aD527c64bdb7a20Ff9535F380789b9",
  burnPenaltySink: "0xBA033bd0F0ddC6767a9ef7F4a84bACD7b0084d9F",
  swapPools: {
    STANDARD: "0x254C8D06Fa9f1d685855E19a172832188ADA567a",
    IMD: "0x9896A9EfF86f85E4a2d94f914E7e1427CB53251D",
    BUILDER: "0xF03cd7a663773A2ec595B68d19bA183054Da9E40",
    WETH: "0x26F40E6f8A262cc32Bb6725310a7f9652C856447",
    "USD-T": "0x060aa7aC2b3F58326E6f9ddC90194E03b722feCd",
  },
};

// Mainnet: preencher no deploy (ENDEREÇOS_REAIS). Enquanto null, o app
// detecta "não implantado" e exibe estado honesto (sem tentar tx).
const MAINNET: DeploymentAddresses | null = null;

export const DEPLOYMENTS: Record<NetworkKey, DeploymentAddresses | null> = {
  sepolia: SEPOLIA,
  mainnet: MAINNET,
};

export function currentDeployment(): DeploymentAddresses | null {
  return DEPLOYMENTS[ACTIVE_NETWORK];
}

export function isNetworkDeployed(): boolean {
  return currentDeployment() !== null;
}

// ============================================================================
// Features do menu — gating central
// ============================================================================

export type FeatureKey =
  | "swap"
  | "staking"
  | "dashboard"
  | "pool"
  | "nftMint"
  | "arbitrage"
  | "docs";

export interface FeatureDef {
  key: FeatureKey;
  href: string;
  label: string;
  icon: string;
  badge?: string;
  /**
   * true = na Mainnet (fase premint) fica bloqueado até o Mint.
   * Na Sepolia nunca bloqueia.
   */
  mainnetLockedUntilMint?: boolean;
}

export const FEATURES: FeatureDef[] = [
  { key: "swap", href: "/swap", label: "Swap", icon: "⇄" },
  { key: "staking", href: "/staking", label: "Staking", icon: "▣" },
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "▦" },
  {
    key: "pool",
    href: "/pool",
    label: "Meta Hook Pool",
    icon: "◈",
    mainnetLockedUntilMint: true,
  },
  {
    key: "nftMint",
    href: "/nft-mint",
    label: "Mint NFT",
    icon: "◆",
    badge: "NFT",
    mainnetLockedUntilMint: true,
  },
  {
    key: "arbitrage",
    href: "/arbitrage",
    label: "Arbitrage",
    icon: "⚡",
    mainnetLockedUntilMint: true,
  },
  { key: "docs", href: "/docs", label: "Docs", icon: "☰" },
];

/** Item do menu bloqueado neste build? (Sepolia: nunca) */
export function isFeatureLocked(feature: FeatureDef): boolean {
  if (ACTIVE_NETWORK !== "mainnet") return false;
  if (MAINNET_PHASE === "mint") return false;
  return !!feature.mainnetLockedUntilMint;
}

export const LOCK_REASON = "Disponível na Mainnet após o Mint";
