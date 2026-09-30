import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ABI = [
  "function mintOpen() view returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function priceETH() view returns (uint256)",
  "function priceETHBacker() view returns (uint256)",
];

/**
 * GET /api/nft/status — estado real do OptimizerGenesisKey (DEC-020).
 * Sem GENESIS_KEY_ADDRESS configurado → defaults honestos do contrato
 * (501 / 0.05 ETH / mint fechado / deployed: false).
 */
export async function GET() {
  const addr = process.env.GENESIS_KEY_ADDRESS || "";
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  const base = {
    deployed: false,
    mintOpen: false,
    totalMinted: 0,
    maxSupply: 501,
    genesisPrice: "0.05",
    backerPrice: "1.0",
    targetRaise: "25.05 ETH",
  };

  if (!addr) return NextResponse.json(base);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const c = new ethers.Contract(addr, ABI, provider);
    const [open, minted, max, price, backer] = await Promise.all([
      c.mintOpen(),
      c.totalSupply(),
      c.MAX_SUPPLY(),
      c.priceETH(),
      c.priceETHBacker(),
    ]);
    const maxNum = Number(max);
    const priceEth = Number(ethers.formatEther(price));
    return NextResponse.json({
      deployed: true,
      mintOpen: Boolean(open),
      totalMinted: Number(minted),
      maxSupply: maxNum,
      genesisPrice: ethers.formatEther(price),
      backerPrice: ethers.formatEther(backer),
      targetRaise: `${(maxNum * priceEth).toFixed(2)} ETH`,
    });
  } catch {
    return NextResponse.json(base);
  }
}
