import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// MigrationRouter ABI (key functions)
const MIGRATION_ROUTER_ABI = [
  "function depositToHook() external payable",
  "function depositToNative() external payable",
  "function withdrawFromHook(uint256 amount) external",
  "function withdrawFromNative(uint256 amount) external",
  "function migrateToNative(uint256 spreadAtMigration) external",
  "function migrateToHook(uint256 spreadAtMigration) external",
  "function getUserBalance(address user) external view returns (uint256 hook, uint256 native, uint256 total)",
  "function getMigrationHistory(address user) external view returns (tuple(address user, address fromPool, address toPool, uint256 amount, uint256 timestamp, uint256 spreadAtMigration)[])",
  "function totalMigrations() external view returns (uint256)",
  "function totalVolumeMigrated() external view returns (uint256)",
  "function hookBalance(address) external view returns (uint256)",
  "function nativeBalance(address) external view returns (uint256)",
];

// Contract address (will be deployed)
const MIGRATION_ROUTER_ADDRESS = process.env.MIGRATION_ROUTER_ADDRESS || "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const user = searchParams.get("user");

    if (!MIGRATION_ROUTER_ADDRESS) {
      return NextResponse.json({
        status: "not_deployed",
        message: "MigrationRouter not deployed yet",
        abi: MIGRATION_ROUTER_ABI,
        contractAddress: null,
      });
    }

    if (action === "status") {
      return NextResponse.json({
        status: "active",
        contractAddress: MIGRATION_ROUTER_ADDRESS,
        abi: MIGRATION_ROUTER_ABI,
        message: "MigrationRouter is deployed and ready",
      });
    }

    if (action === "balance" && user) {
      // In production, call contract via ethers.js
      return NextResponse.json({
        hook: "0",
        native: "0",
        total: "0",
        contractAddress: MIGRATION_ROUTER_ADDRESS,
      });
    }

    if (action === "history" && user) {
      return NextResponse.json({
        migrations: [],
        contractAddress: MIGRATION_ROUTER_ADDRESS,
      });
    }

    return NextResponse.json({
      status: "ready",
      contractAddress: MIGRATION_ROUTER_ADDRESS,
      abi: MIGRATION_ROUTER_ABI,
      actions: [
        "depositToHook - Deposit ETH to Hook Pool",
        "depositToNative - Deposit ETH to Native Pool",
        "withdrawFromHook - Withdraw from Hook Pool",
        "withdrawFromNative - Withdraw from Native Pool",
        "migrateToNative - Atomic migrate Hook → Native",
        "migrateToHook - Atomic migrate Native → Hook",
        "getUserBalance - Get user balances",
        "getMigrationHistory - Get migration history",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Migration API error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, user, amount, spreadAtMigration } = body;

    if (!MIGRATION_ROUTER_ADDRESS) {
      return NextResponse.json(
        { error: "MigrationRouter not deployed" },
        { status: 500 }
      );
    }

    // Return transaction data for MetaMask to sign
    let txData = null;

    switch (action) {
      case "depositToHook":
        txData = {
          to: MIGRATION_ROUTER_ADDRESS,
          value: amount,
          data: "0x", // depositToHook() selector
          description: `Deposit ${amount} ETH to Hook Pool`,
        };
        break;

      case "depositToNative":
        txData = {
          to: MIGRATION_ROUTER_ADDRESS,
          value: amount,
          data: "0x", // depositToNative() selector
          description: `Deposit ${amount} ETH to Native Pool`,
        };
        break;

      case "migrateToNative":
        txData = {
          to: MIGRATION_ROUTER_ADDRESS,
          value: "0",
          data: "0x", // migrateToNative(spreadAtMigration) selector
          description: `Migrate ALL funds: Hook → Native (spread: ${spreadAtMigration}%)`,
        };
        break;

      case "migrateToHook":
        txData = {
          to: MIGRATION_ROUTER_ADDRESS,
          value: "0",
          data: "0x", // migrateToHook(spreadAtMigration) selector
          description: `Migrate ALL funds: Native → Hook (spread: ${spreadAtMigration}%)`,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      txData,
      contractAddress: MIGRATION_ROUTER_ADDRESS,
      message: "Send this transaction data to MetaMask for signing",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Migration API error", details: String(error) },
      { status: 500 }
    );
  }
}
