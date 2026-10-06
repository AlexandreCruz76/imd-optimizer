import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ABI = [
  // Buildercoin (dNFT) — ERC721Enumerable + tokenLevel
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
  "function tokenLevel(uint256) view returns (uint8)",
  // legado (OptimizerGenesisKey antigo)
  "function getOwnerKeys(address) view returns (uint256[])",
  "function getKeyInfo(uint256) view returns (uint8 tier, uint256 mintedAt, uint256 totalMEVReceived, uint256 lastClaimAt, bool active)",
  "function getPendingMEV(address) view returns (uint256)",
];

const TIER_NAMES = ["NONE", "GENESIS", "BACKER"];

/**
 * GET /api/nft/keys — tokens reais do usuário.
 * Buildercoin novo: balanceOf + tokenOfOwnerByIndex + tokenLevel (Enumerable).
 * Legado: getOwnerKeys + getKeyInfo. Sem contrato → lista vazia.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const addr = process.env.GENESIS_KEY_ADDRESS || "";
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  if (!addr) {
    return NextResponse.json({ address, keys: [], totalMEV: "0", deployed: false });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const c = new ethers.Contract(addr, ABI, provider);

    // 1) Lista de tokenIds: legado primeiro, senão Enumerable
    let tokenIds: bigint[] = [];
    let legacy = true;
    try {
      tokenIds = ((await c.getOwnerKeys(address)) as bigint[]) ?? [];
    } catch {
      legacy = false;
      const bal = (await c.balanceOf(address)) as bigint;
      for (let i = 0n; i < bal; i++) {
        tokenIds.push((await c.tokenOfOwnerByIndex(address, i)) as bigint);
      }
    }

    // 2) Detalhe por token (level do dNFT novo quando existir)
    const keys = await Promise.all(
      tokenIds.map(async (id) => {
        let level = 0;
        try {
          level = Number(await c.tokenLevel(id));
        } catch {
          /* contrato legado sem tokenLevel */
        }

        if (legacy) {
          try {
            const info = await c.getKeyInfo(id);
            return {
              tokenId: Number(id),
              tier: TIER_NAMES[Number(info[0])] ?? "GENESIS",
              level,
              mintedAt: Number(info[1]),
              totalMEVReceived: ethers.formatEther(info[2] as bigint),
              active: Boolean(info[4]),
            };
          } catch {
            /* cai para o formato Buildercoin */
          }
        }

        return {
          tokenId: Number(id),
          tier: "Buildercoin",
          level,
          mintedAt: 0,
          totalMEVReceived: "0",
          active: true,
        };
      })
    );

    let totalMEV = "0";
    if (legacy) {
      try {
        const pending = (await c.getPendingMEV(address)) as bigint;
        totalMEV = ethers.formatEther(pending);
      } catch {
        /* sem MEV pendente */
      }
    }

    return NextResponse.json({ address, keys, totalMEV, deployed: true });
  } catch {
    return NextResponse.json({ address, keys: [], totalMEV: "0", deployed: true });
  }
}
