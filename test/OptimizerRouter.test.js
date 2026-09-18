const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptimizerRouter — The Standard Integration", function () {
  let router, vault, mockStandardCore, mockStandardToken, mockWETH, mockPool;
  let owner, user1, user2, feeCollector;

  beforeEach(async function () {
    [owner, user1, user2, feeCollector] = await ethers.getSigners();

    // Deploy mock contracts
    const MockStandardCore = await ethers.getContractFactory("MockStandardCore");
    mockStandardCore = await MockStandardCore.deploy();
    await mockStandardCore.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockStandardToken = await MockERC20.deploy("Standard Token", "STANDARD");
    await mockStandardToken.waitForDeployment();

    mockWETH = await MockERC20.deploy("Wrapped ETH", "WETH");
    await mockWETH.waitForDeployment();

    const MockPool = await ethers.getContractFactory("MockUniswapV4Pool");
    mockPool = await MockPool.deploy();
    await mockPool.waitForDeployment();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address); // router placeholder
    await vault.waitForDeployment();

    // Deploy Router
    const Router = await ethers.getContractFactory("OptimizerRouter");
    router = await Router.deploy(
      await mockStandardCore.getAddress(),
      await mockPool.getAddress(),
      await mockStandardToken.getAddress(),
      await mockWETH.getAddress(),
      await vault.getAddress()
    );
    await router.waitForDeployment();

    // Set router in vault
    await vault.setRouter(await router.getAddress());

    // Fund router with ETH for swaps
    await owner.sendTransaction({
      to: await router.getAddress(),
      value: ethers.parseEther("100"),
    });

    // Setup: mint tokens to user1
    await mockStandardToken.mint(user1.address, ethers.parseEther("10000"));
    await mockWETH.mint(user1.address, ethers.parseEther("100"));
  });

  describe("Deployment", function () {
    it("Should set correct addresses", async function () {
      expect(await router.standardCore()).to.equal(await mockStandardCore.getAddress());
      expect(await router.standardPool()).to.equal(await mockPool.getAddress());
      expect(await router.standardToken()).to.equal(await mockStandardToken.getAddress());
      expect(await router.weth()).to.equal(await mockWETH.getAddress());
      expect(await router.vault()).to.equal(await vault.getAddress());
    });

    it("Should set owner correctly", async function () {
      expect(await router.owner()).to.equal(owner.address);
    });

    it("Should set default fee to 0.5%", async function () {
      expect(await router.feeBps()).to.equal(50);
    });
  });

  describe("Slippage Protection", function () {
    it("Should reject zero amount", async function () {
      await expect(
        router.connect(user1).executeProtectedSellAndBurn(0, 100)
      ).to.be.revertedWith("Invalid amount");
    });

    it("Should reject zero minAmountOut", async function () {
      await expect(
        router.connect(user1).executeProtectedSellAndBurn(1000, 0)
      ).to.be.revertedWith("Min amount must be > 0");
    });
  });

  describe("Fee Management", function () {
    it("Should update fee", async function () {
      await router.setFee(100); // 1%
      expect(await router.feeBps()).to.equal(100);
    });

    it("Should reject fee > 5%", async function () {
      await expect(router.setFee(600)).to.be.revertedWith("Fee too high (max 5%)");
    });

    it("Should update fee collector", async function () {
      await router.setFeeCollector(feeCollector.address);
      expect(await router.feeCollector()).to.equal(feeCollector.address);
    });
  });

  describe("View Functions", function () {
    it("Should return pool state", async function () {
      const state = await router.getPoolState();
      expect(state.sqrtPriceX96).to.be.gte(0);
    });

    it("Should return stats", async function () {
      const stats = await router.getStats();
      expect(stats.sellVolume).to.equal(0);
      expect(stats.mevCaptured).to.equal(0);
      expect(stats.burnsExecuted).to.equal(0);
      expect(stats.yieldDistributed).to.equal(0);
    });
  });
});

describe("OptimizerVaultV2 — Yield Distribution", function () {
  let vault;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address);
    await vault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set router correctly", async function () {
      expect(await vault.router()).to.equal(owner.address);
    });

    it("Should set fee tiers", async function () {
      expect(await vault.tierFeeBps(0)).to.equal(2000); // FREE = 20%
      expect(await vault.tierFeeBps(1)).to.equal(1500); // BASIC = 15%
      expect(await vault.tierFeeBps(2)).to.equal(1000); // PRO = 10%
      expect(await vault.tierFeeBps(3)).to.equal(500);  // WHALE = 5%
    });
  });

  describe("Deposits", function () {
    it("Should deposit ETH", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("1"));
    });

    it("Should issue shares correctly", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      const pos = await vault.positions(user1.address);
      expect(pos.shares).to.equal(ethers.parseEther("1"));
    });

    it("Should reject zero deposit", async function () {
      await expect(
        vault.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("Must deposit ETH");
    });

    it("Should handle multiple deposits", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });

      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("3"));
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("10") });
    });

    it("Should withdraw full amount", async function () {
      await vault.connect(user1).withdraw(0); // 0 = all
      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(0);
    });

    it("Should withdraw partial amount", async function () {
      await vault.connect(user1).withdraw(ethers.parseEther("5"));
      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("5"));
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("10") });
      await vault.connect(user2).deposit({ value: ethers.parseEther("10") });
    });

    it("Should receive yield via receiveYield()", async function () {
      // Call receiveYield (simulating router calling it)
      await vault.connect(owner).receiveYield({ value: ethers.parseEther("1") });

      const stats = await vault.getVaultStats();
      expect(stats.totalYield_).to.equal(ethers.parseEther("1"));
    });

    it("Should calculate yield per share", async function () {
      await vault.connect(owner).receiveYield({ value: ethers.parseEther("1") });

      const stats = await vault.getVaultStats();
      expect(stats.yieldPerShare_).to.be.gt(0);
    });

    it("Should calculate pending yield for users", async function () {
      await vault.connect(owner).receiveYield({ value: ethers.parseEther("2") });

      const pending1 = await vault.getPendingYield(user1.address);
      const pending2 = await vault.getPendingYield(user2.address);

      // Each user should have ~1 ETH pending (50/50 split)
      expect(pending1).to.be.gt(0);
      expect(pending2).to.be.gt(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should update router", async function () {
      await vault.setRouter(user1.address);
      expect(await vault.router()).to.equal(user1.address);
    });

    it("Should update tier fees", async function () {
      await vault.setTierFee(0, 3000); // FREE = 30%
      expect(await vault.tierFeeBps(0)).to.equal(3000);
    });

    it("Should set user tier", async function () {
      await vault.setUserTier(user1.address, 2); // PRO
      expect(await vault.userTier(user1.address)).to.equal(2);
    });
  });
});
