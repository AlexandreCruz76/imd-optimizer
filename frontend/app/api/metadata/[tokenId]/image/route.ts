import { NextRequest, NextResponse } from "next/server";
import { LEVELS, readLevel } from "../../shared";

export const dynamic = "force-dynamic";

/** SVG básico gerado por level (arte de teste — Bronze/Prata/Ouro/Neon). */
function svg(tokenId: string, level: number): string {
  const frame = LEVELS[level - 1] ?? LEVELS[0];
  const c = frame.color;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#070A0F"/>
  <rect x="18" y="18" width="476" height="476" fill="none" stroke="${c}" stroke-width="3" opacity="0.55"/>
  <rect x="30" y="30" width="452" height="452" fill="none" stroke="${c}" stroke-width="1" opacity="0.25"/>
  <circle cx="256" cy="240" r="150" fill="${c}" opacity="0.10"/>
  <circle cx="256" cy="240" r="150" fill="none" stroke="${c}" stroke-width="12"/>
  <circle cx="256" cy="240" r="122" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>
  <text x="256" y="212" text-anchor="middle" font-family="monospace" font-size="44" font-weight="bold" fill="${c}">BLD</text>
  <text x="256" y="262" text-anchor="middle" font-family="monospace" font-size="30" fill="#E2E8F0">#${tokenId}</text>
  <text x="256" y="304" text-anchor="middle" font-family="monospace" font-size="18" fill="${c}">LEVEL ${level}</text>
  <text x="256" y="404" text-anchor="middle" font-family="monospace" font-size="26" font-weight="bold" letter-spacing="6" fill="${c}">BUILDERCOIN</text>
  <text x="256" y="440" text-anchor="middle" font-family="monospace" font-size="15" letter-spacing="4" fill="#64748B">FRAME ${frame.name.toUpperCase()} · T1 ALPHA</text>
  <text x="256" y="70" text-anchor="middle" font-family="monospace" font-size="13" letter-spacing="3" fill="#64748B">IMD OPTIMIZER · dNFT</text>
  <text x="256" y="486" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2" fill="#475569">SEPOLIA TESTNET</text>
</svg>`;
}

/**
 * GET /api/metadata/[tokenId]/image — imagem SVG do nível atual do dNFT.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await ctx.params;
  if (!/^\d+$/.test(tokenId) || tokenId === "0") {
    return new NextResponse("tokenId invalido", { status: 400 });
  }
  const level = await readLevel(tokenId);
  return new NextResponse(svg(tokenId, level), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
