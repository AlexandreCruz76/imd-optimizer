import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getReadProvider } from "@/lib/server/provider";

export const dynamic = "force-dynamic";

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const ZERO_TOPIC = "0x" + "0".repeat(64);
const CHUNK = 20_000;
const MAX_CHUNKS = 15;

const ABI = [
  "function ownerOf(uint256) view returns (address)",
  "function tokenLevel(uint256) view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

interface RecentMint {
  tokenId: number;
  owner: string;
  level: number | null;
  blockNumber: number;
  txHash: string;
}

let cache: { items: RecentMint[]; totalSupply: number | null; scannedBlocks: number } | null = null;
let cacheAt = 0;
const CACHE_TTL = 60_000;

/**
 * GET /api/nft/recent — últimos mints do Buildercoin (Transfer from 0x0).
 * Varre getLogs reverso em chunks de 20k até achar 5 mints ou 300k blocos.
 * Cache 60s. Sem contrato → lista vazia (deployed: false).
 */
export async function GET() {
  if (cache && Date.now() - cacheAt < CACHE_TTL) {
    return NextResponse.json({ ...cache, deployed: true, cached: true });
  }

  const addr = process.env.GENESIS_KEY_ADDRESS || "";
  if (!addr) {
    return NextResponse.json({ items: [], totalSupply: null, deployed: false });
  }

  try {
    const provider = getReadProvider();
    const c = new ethers.Contract(addr, ABI, provider);

    let totalSupply: number | null = null;
    try {
      totalSupply = Number(await c.totalSupply());
    } catch {
      totalSupply = null;
    }

    const latest = await provider.getBlockNumber();
    const items: RecentMint[] = [];
    let scanned = 0;

    for (let i = 0; i < MAX_CHUNKS && items.length < 5; i++) {
      const toBlock = latest - i * CHUNK;
      if (toBlock < 0) break;
      const fromBlock = Math.max(0, toBlock - CHUNK + 1);
      scanned = latest - fromBlock + 1;

      const logs = await provider.getLogs({
        address: addr,
        topics: [TRANSFER_TOPIC, ZERO_TOPIC],
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const tokenId = Number(BigInt(log.topics[3]).toString());
        let owner = "";
        let level: number | null = null;
        try {
          owner = String(await c.ownerOf(tokenId));
        } catch {
          owner = log.topics[2] ? ethers.getAddress("0x" + log.topics[2].slice(26)) : "";
        }
        try {
          const lv = Number(await c.tokenLevel(tokenId));
          level = lv >= 1 && lv <= 4 ? lv : 1;
        } catch {
          level = null;
        }
        items.push({
          tokenId,
          owner,
          level,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
        });
        if (items.length >= 5) break;
      }
    }

    items.sort((a, b) => b.tokenId - a.tokenId);
    cache = { items, totalSupply, scannedBlocks: scanned };
    cacheAt = Date.now();
    return NextResponse.json({ ...cache, deployed: true, cached: false });
  } catch (e) {
    return NextResponse.json(
      { items: [], totalSupply: null, deployed: true, error: String(e) },
      { status: 200 }
    );
  }
}
