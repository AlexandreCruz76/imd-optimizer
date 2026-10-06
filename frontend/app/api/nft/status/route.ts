import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const dynamic = "force-dynamic";

const ABI = [
  "function mintOpen() view returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function MINT_PRICE() view returns (uint256)",
  // legado (OptimizerGenesisKey antigo, enquanto GENESIS_KEY_ADDRESS não migrar)
  "function priceETH() view returns (uint256)",
  "function priceETHBacker() view returns (uint256)",
];

/**
 * GET /api/nft/status — estado real do Buildercoin (dNFT) na Sepolia.
 * Detecção automática: tenta MINT_PRICE() (Buildercoin novo) e cai para
 * priceETH()/priceETHBacker() (OptimizerGenesisKey legado).
 * Sem GENESIS_KEY_ADDRESS → defaults honestos (501 / 0.05 ETH / deployed: false).
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
    mintPrice: "0.05",
    genesisPrice: "0.05",
    backerPrice: "1.0",
    contract: "",
    targetRaise: "25.05 ETH",
  };

  if (!addr) return NextResponse.json(base);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const c = new ethers.Contract(addr, ABI, provider);
    const [open, minted, max] = await Promise.all([
      c.mintOpen(),
      c.totalSupply(),
      c.MAX_SUPPLY(),
    ]);
    const maxNum = Number(max);

    let mintPrice: string;
    let genesisPrice: string;
    let backerPrice = "";
    let kind = "buildercoin";
    try {
      const p = (await c.MINT_PRICE()) as bigint;
      mintPrice = ethers.formatEther(p);
      genesisPrice = mintPrice;
    } catch {
      kind = "genesiskey";
      const [p, b] = await Promise.all([c.priceETH(), c.priceETHBacker()]);
      genesisPrice = ethers.formatEther(p as bigint);
      backerPrice = ethers.formatEther(b as bigint);
      mintPrice = genesisPrice;
    }

    return NextResponse.json({
      deployed: true,
      mintOpen: Boolean(open),
      totalMinted: Number(minted),
      maxSupply: maxNum,
      mintPrice,
      genesisPrice,
      backerPrice,
      contract: kind,
      targetRaise: `${(maxNum * Number(mintPrice)).toFixed(2)} ETH`,
    });
  } catch {
    return NextResponse.json(base);
  }
}
