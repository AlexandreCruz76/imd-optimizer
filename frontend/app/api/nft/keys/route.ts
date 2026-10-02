import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ABI = [
  "function getOwnerKeys(address) view returns (uint256[])",
  "function getKeyInfo(uint256) view returns (uint8 tier, uint256 mintedAt, uint256 totalMEVReceived, uint256 lastClaimAt, bool active)",
  "function getPendingMEV(address) view returns (uint256)",
];

const TIER_NAMES = ["NONE", "GENESIS", "BACKER"];

/**
 * GET /api/nft/keys — chaves reais do usuário (getOwnerKeys + getKeyInfo).
 * Sem contrato configurado → lista vazia (front esconde a seção).
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
    const tokenIds: bigint[] = await c.getOwnerKeys(address);
    const keys = await Promise.all(
      tokenIds.map(async (id) => {
        const info = await c.getKeyInfo(id);
        return {
          tokenId: Number(id),
          tier: TIER_NAMES[Number(info[0])] ?? "GENESIS",
          mintedAt: Number(info[1]),
          totalMEVReceived: ethers.formatEther(info[2] as bigint),
          active: Boolean(info[4]),
        };
      })
    );
    const pending: bigint = await c.getPendingMEV(address);
    return NextResponse.json({
      address,
      keys,
      totalMEV: ethers.formatEther(pending),
      deployed: true,
    });
  } catch {
    return NextResponse.json({ address, keys: [], totalMEV: "0", deployed: true });
  }
}
