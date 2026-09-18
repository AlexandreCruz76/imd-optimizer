import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    // Contract addresses (Sepolia testnet)
    migrationRouter: process.env.MIGRATION_ROUTER_ADDRESS || "",
    hookPool: process.env.HOOK_POOL_ADDRESS || "",
    nativePool: process.env.NATIVE_POOL_ADDRESS || "",
    poolManager: process.env.POOL_MANAGER_ADDRESS || "",
    
    // Token addresses
    imdToken: process.env.IMD_TOKEN_ADDRESS || "",
    standardToken: process.env.STANDARD_TOKEN_ADDRESS || "",
    weth: process.env.WETH_ADDRESS || "",
    
    // Network config
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-rpc.publicnode.com",
    
    // Pool parameters
    hookFeeTier: 10000,
    nativeFeeTier: 10000,
    pair: "ETH/IMD",
  });
}
