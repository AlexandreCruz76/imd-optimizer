import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { currentDeployment, ACTIVE_NETWORK } from "../../../lib/deployments";
import { queryFilterPaged } from "../../../lib/server/pagedLogs";
import { getReadProvider } from "../../../lib/server/provider";

export const dynamic = "force-dynamic";

// Blocos de deploy approx (Sepolia) — janelas de getLogs enxutas
const SEPOLIA_FROM_ROUTER = 11_700_000;
const SEPOLIA_FROM_VAULT = 11_700_000;
const SEPOLIA_FROM_NFT = 11_800_000;
const SEPOLIA_FROM_STAKING = 11_860_000;

const ROUTER_ABI = [
  "function getStats() view returns (uint256,uint256,uint256,uint256,uint256)",
  "function minBlockDelay() view returns (uint256)",
  "event MultiHopExecuted(address indexed user, address[] tokens, uint256 amountIn, uint256 finalOut, uint256 feeTotal, uint256 userOut, uint256 timestamp)",
  "event CustomArbitrageExecuted(address indexed user, address indexed token, uint256 amountIn, uint256 grossProfit, uint256 successFeeBps, uint256 successFee, uint256 userNet, uint256 timestamp)",
];
const VAULT_ABI = [
  // Deploy sepolia é anterior ao repo: sem accrued vars nem totalProtocolFees.
  // getVaultStats é o getter canônico disponível no deploy.
  "function getVaultStats() view returns (uint256 totalDeposits_, uint256 totalYield_, uint256 totalShares_, uint256 yieldPerShare_)",
  "function stakersAccrued() view returns (uint256)",
  "function treasuryAccrued() view returns (uint256)",
  "function devsAccrued() view returns (uint256)",
  "function burnAccrued() view returns (uint256)",
  "function totalProtocolFees() view returns (uint256)",
  "event Deposited(address indexed user, uint256 amount, uint256 shares)",
];
const STAKING_ABI = [
  "function totalDeposited() view returns (uint256)",
  "function totalYieldDistributed() view returns (uint256)",
  "function totalPositions() view returns (uint256)",
  "function totalBuilderScore() view returns (uint256)",
  "function instantPenaltyBps() view returns (uint256)",
  "function UNBOND_PERIOD() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount, uint256 lockTier, uint256 builderScore, uint256 lockEnd)",
];
const NFT_ABI = [
  "function totalSupply() view returns (uint256)",
  "event Minted(address indexed minter, uint256 indexed tokenId, uint256 price)",
];

type Ok<T> = { ok: true; value: T } | { ok: false };
async function settled<T>(p: Promise<T>): Promise<Ok<T>> {
  try {
    return { ok: true, value: await p };
  } catch {
    return { ok: false };
  }
}

function uniqUsers(logs: readonly (ethers.Log | ethers.EventLog)[]): number {
  const s = new Set<string>();
  for (const l of logs) {
    if ("args" in l && l.args) {
      const u = l.args[0];
      if (typeof u === "string") s.add(u.toLowerCase());
    }
  }
  return s.size;
}

// Cache em memória (60s) — evita martelar o RPC a cada render
let cache: { at: number; body: unknown } | null = null;
const TTL_MS = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  const dep = currentDeployment();
  if (!dep) {
    const body = {
      network: ACTIVE_NETWORK,
      deployed: false,
      note: "Contratos ainda não implantados nesta rede — dashboard honesto, sem dados.",
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  }

  const provider = getReadProvider();
  const latest = await provider.getBlockNumber();

  const router = new ethers.Contract(dep.optimizerRouter, ROUTER_ABI, provider);
  const vault = new ethers.Contract(dep.optimizerVaultV2, VAULT_ABI, provider);
  const staking = new ethers.Contract(dep.stakingVault, STAKING_ABI, provider);
  const nft = new ethers.Contract(dep.buildercoinNFT, NFT_ABI, provider);

  const [
    statsR,
    minDelayR,
    routerBalR,
    vaultStatsR,
    vaultAccruedR,
    stakingR,
    stakingBalR,
    nftSupplyR,
    swapEventsR,
    arbEventsR,
    vaultDepositsR,
    stakedEventsR,
    nftMintsR,
    poolBalsR,
  ] = await Promise.all([
    settled(router.getStats()),
    settled(router.minBlockDelay()),
    settled(provider.getBalance(dep.optimizerRouter)),
    settled(vault.getVaultStats()),
    settled(
      Promise.allSettled([
        vault.stakersAccrued(),
        vault.treasuryAccrued(),
        vault.devsAccrued(),
        vault.burnAccrued(),
        vault.totalProtocolFees(),
      ])
    ),
    settled(
      Promise.all([
        staking.totalDeposited(),
        staking.totalYieldDistributed(),
        staking.totalPositions(),
        staking.totalBuilderScore(),
        staking.instantPenaltyBps(),
        staking.UNBOND_PERIOD(),
      ])
    ),
    settled(provider.getBalance(dep.stakingVault)),
    settled(nft.totalSupply()),
    settled(
      queryFilterPaged(router, "MultiHopExecuted", SEPOLIA_FROM_ROUTER, latest)
    ),
    settled(
      queryFilterPaged(
        router,
        "CustomArbitrageExecuted",
        SEPOLIA_FROM_ROUTER,
        latest
      )
    ),
    settled(
      queryFilterPaged(vault, "Deposited", SEPOLIA_FROM_VAULT, latest)
    ),
    settled(
      queryFilterPaged(staking, "Staked", SEPOLIA_FROM_STAKING, latest)
    ),
    settled(queryFilterPaged(nft, "Minted", SEPOLIA_FROM_NFT, latest)),
    settled(
      Promise.all(
        Object.entries(dep.swapPools).map(async ([sym, addr]) => ({
          symbol: sym,
          address: addr,
          eth: await provider.getBalance(addr),
        }))
      )
    ),
  ]);

  const w = (v: bigint | undefined) => (v === undefined ? null : v.toString());

  const stats = statsR.ok ? (statsR.value as unknown as bigint[]) : null;
  const st = stakingR.ok ? (stakingR.value as unknown as bigint[]) : null;
  const vt = vaultStatsR.ok ? (vaultStatsR.value as unknown as bigint[]) : null;
  // Deploy sepolia anterior ao repo: accrued/totalProtocolFees podem reverter
  // individualmente — cada um vira null honesto.
  const acc = (
    vaultAccruedR.ok
      ? (vaultAccruedR.value as PromiseSettledResult<bigint>[])
      : []
  ).map((r) =>
    r.status === "fulfilled" ? (r.value as bigint).toString() : null
  );

  const poolBals = poolBalsR.ok ? poolBalsR.value : null;
  const poolTotalEth = poolBals
    ? poolBals.reduce((a: bigint, p: { eth: bigint }) => a + p.eth, 0n)
    : null;

  const body = {
    network: ACTIVE_NETWORK,
    deployed: true,
    blockNumber: latest,
    addresses: {
      router: dep.optimizerRouter,
      vaultV2: dep.optimizerVaultV2,
      stakingVault: dep.stakingVault,
      bldToken: dep.bldToken,
      buildercoinNFT: dep.buildercoinNFT,
    },
    cofre: {
      ethBalance: w(routerBalR.ok ? routerBalR.value : undefined),
      totalDeposits: w(vt?.[0]),
      totalYieldAccumulated: w(vt?.[1]),
      totalSharesIssued: w(vt?.[2]),
      yieldPerShare: w(vt?.[3]),
      totalProtocolFees: acc[4],
      stakersAccrued: acc[0],
      treasuryAccrued: acc[1],
      devsAccrued: acc[2],
      burnAccrued: acc[3],
    },
    swap: {
      sellVolumeEth: w(stats?.[0]),
      mevCapturedEth: w(stats?.[1]),
      burnsExecuted: w(stats?.[2]),
      yieldDistributedEth: w(stats?.[3]),
      feesCollectedEth: w(stats?.[4]),
      minBlockDelay: minDelayR.ok
        ? (minDelayR.value as bigint).toString()
        : null,
    },
    staking: {
      totalDepositedBld: w(st?.[0]),
      totalYieldDistributedEth: w(st?.[1]),
      totalPositions: w(st?.[2]),
      totalBuilderScore: w(st?.[3]),
      instantPenaltyBps: w(st?.[4]),
      unbondPeriodSec: w(st?.[5]),
      contractEthBalance: w(stakingBalR.ok ? stakingBalR.value : undefined),
    },
    nft: {
      totalSupply: w(nftSupplyR.ok ? nftSupplyR.value : undefined),
    },
    users: {
      swap: swapEventsR.ok ? uniqUsers(swapEventsR.value) : null,
      arbitrage: arbEventsR.ok ? uniqUsers(arbEventsR.value) : null,
      staking: stakedEventsR.ok ? uniqUsers(stakedEventsR.value) : null,
      cofreLp: vaultDepositsR.ok ? uniqUsers(vaultDepositsR.value) : null,
      nftMinters: nftMintsR.ok ? uniqUsers(nftMintsR.value) : null,
      eventsFound: {
        multiHop: swapEventsR.ok ? swapEventsR.value.length : null,
        arbitrage: arbEventsR.ok ? arbEventsR.value.length : null,
        staked: stakedEventsR.ok ? stakedEventsR.value.length : null,
        vaultDeposits: vaultDepositsR.ok ? vaultDepositsR.value.length : null,
        nftMints: nftMintsR.ok ? nftMintsR.value.length : null,
      },
    },
    pools: poolBals
      ? {
          totalEth: poolTotalEth!.toString(),
          items: poolBals.map(
            (p: { symbol: string; address: string; eth: bigint }) => ({
              symbol: p.symbol,
              address: p.address,
              eth: p.eth.toString(),
            })
          ),
        }
      : null,
    partial: !(
      statsR.ok &&
      vaultStatsR.ok &&
      stakingR.ok &&
      swapEventsR.ok &&
      poolBalsR.ok
    ),
    fetchedAt: new Date().toISOString(),
  };

  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
