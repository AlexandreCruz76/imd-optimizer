import { ethers } from "ethers";

const ABI = ["function tokenLevel(uint256) view returns (uint8)"];

export const LEVELS = [
  { name: "Bronze", color: "#CD7F32" },
  { name: "Prata", color: "#C0C0C0" },
  { name: "Ouro", color: "#FFD700" },
  { name: "Neon", color: "#00F58C" },
];

/** Lê o nível on-chain (Buildercoin.tokenLevel) com fallback em 1 (base). */
export async function readLevel(tokenId: string): Promise<number> {
  const addr = process.env.GENESIS_KEY_ADDRESS || "";
  if (!addr) return 1;
  try {
    const rpcUrl =
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const c = new ethers.Contract(addr, ABI, provider);
    const level = Number(await c.tokenLevel(tokenId));
    return level >= 1 && level <= 4 ? level : 1;
  } catch {
    return 1;
  }
}
