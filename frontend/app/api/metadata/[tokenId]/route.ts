import { NextRequest, NextResponse } from "next/server";
import { LEVELS, readLevel } from "../shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/metadata/[tokenId] — JSON espelho do dNFT.
 * O backend lê tokenLevel no contrato e serve o JSON do level correto
 * (mesmo mecanismo descrito na especificação do Buildercoin).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await ctx.params;
  if (!/^\d+$/.test(tokenId) || tokenId === "0") {
    return NextResponse.json({ error: "tokenId inválido" }, { status: 400 });
  }

  const level = await readLevel(tokenId);
  const frame = LEVELS[level - 1] ?? LEVELS[0];
  const origin = new URL(req.url).origin;

  return NextResponse.json({
    name: `Buildercoin #${tokenId}`,
    description:
      `Buildercoin dNFT — Tier 1 Alpha do IMD Optimizer. ` +
      `Nível ${level} (${frame.name}) lido on-chain via tokenLevel(). ` +
      `Utility: swap 0,00% · Success Fee 5% · yield 4x (Sepolia testnet).`,
    image: `${origin}/api/metadata/${tokenId}/image`,
    external_url: `${origin}/nft-mint`,
    attributes: [
      { trait_type: "Level", value: level },
      { trait_type: "Frame", value: frame.name },
      { trait_type: "Tier", value: "T1 · Buildercoin (Alpha)" },
      { trait_type: "Max Supply", value: 501 },
    ],
  });
}
