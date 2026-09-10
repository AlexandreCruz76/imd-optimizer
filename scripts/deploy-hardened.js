const { ethers } = require("ethers");

const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E";
const W2_KEY = "0x79c5ed6bbb982fa3009b0a61dcb90582a8219555f2264383ff68275f9315f2e8";

// Load compiled artifact
const fs = require("fs");
const path = require("path");

function loadArtifact(name) {
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", name + ".sol", name + ".json");
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const wallet = new ethers.Wallet(W2_KEY, provider);

  console.log("Deployer:", wallet.address);
  const bal = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(bal), "ETH");

  if (bal < ethers.parseEther("0.01")) {
    console.error("Insufficient gas! Need at least 0.01 ETH");
    process.exit(1);
  }

  // ── Deploy OptimizerVaultTest (Hardened) ──
  console.log("\n--- Deploying OptimizerVaultTest (Hardened) ---");
  const artifact = loadArtifact("OptimizerVaultTest");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const vault = await factory.deploy();
  const tx = vault.deploymentTransaction();
  console.log("TX:", tx.hash);
  const receipt = await tx.wait();
  console.log("Deployed at:", await vault.getAddress());
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Block:", receipt.blockNumber);

  // ── Verify initial state ──
  const address = await vault.getAddress();
  const ownerAddr = await vault.owner();
  const paused = await vault.paused();
  const maxDep = await vault.maxDepositPerUser();
  const balance = await vault.getContractBalance();

  console.log("\n--- Verification ---");
  console.log("Owner:", ownerAddr);
  console.log("Paused:", paused);
  console.log("MaxDeposit:", ethers.formatEther(maxDep), "ETH");
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // ── Deploy AdoptionVault (Hardened) ──
  console.log("\n--- Deploying AdoptionVault (Hardened) ---");
  const adoptArtifact = loadArtifact("AdoptionVault");
  const adoptFactory = new ethers.ContractFactory(adoptArtifact.abi, adoptArtifact.bytecode, wallet);
  const adoption = await adoptFactory.deploy();
  const adoptTx = adoption.deploymentTransaction();
  console.log("TX:", adoptTx.hash);
  const adoptReceipt = await adoptTx.wait();
  console.log("Deployed at:", await adoption.getAddress());
  console.log("Gas used:", adoptReceipt.gasUsed.toString());

  console.log("\n=== DEPLOY COMPLETE ===");
  console.log("OptimizerVaultTest (Hardened):", await vault.getAddress());
  console.log("AdoptionVault (Hardened):", await adoption.getAddress());
}

main().catch(console.error);
