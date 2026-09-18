const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptimizerGenesisKey", function () {
  let genesisKey;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const GenesisKey = await ethers.getContractFactory("OptimizerGenesisKey");
    genesisKey = await GenesisKey.deploy();
    await genesisKey.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await genesisKey.name()).to.equal("Optimizer Genesis Key");
      expect(await genesisKey.symbol()).to.equal("OGKEY");
    });

    it("Should have max supply of 100", async function () {
      expect(await genesisKey.MAX_SUPPLY()).to.equal(100);
    });

    it("Should start with mint closed", async function () {
      expect(await genesisKey.mintOpen()).to.equal(false);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await genesisKey.setMintOpen(true);
    });

    it("Should mint Genesis key with correct price", async function () {
      const price = ethers.parseEther("0.5");
      await genesisKey.connect(addr1).mintGenesis({ value: price });
      expect(await genesisKey.totalMinted()).to.equal(1);
      expect(await genesisKey.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should mint Backer key with correct price", async function () {
      const price = ethers.parseEther("1.0");
      await genesisKey.connect(addr1).mintBacker({ value: price });
      expect(await genesisKey.totalMinted()).to.equal(1);
      expect(await genesisKey.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should reject mint when closed", async function () {
      await genesisKey.setMintOpen(false);
      await expect(
        genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(genesisKey, "MintNotOpen");
    });

    it("Should reject insufficient payment", async function () {
      await expect(
        genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(genesisKey, "InsufficientPayment");
    });

    it("Should reject mint after max supply", async function () {
      for (let i = 0; i < 100; i++) {
        await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") });
      }
      await expect(
        genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(genesisKey, "MaxSupplyReached");
    });

    it("Should track owner keys correctly", async function () {
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") });
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") });
      const keys = await genesisKey.getOwnerKeys(addr1.address);
      expect(keys.length).to.equal(2);
    });

    it("Should refund excess payment", async function () {
      const excess = ethers.parseEther("0.6");
      const balanceBefore = await ethers.provider.getBalance(addr1.address);
      const tx = await genesisKey.connect(addr1).mintGenesis({ value: excess });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      expect(balanceBefore - balanceAfter).to.be.lessThan(excess);
    });
  });

  describe("MEV Distribution", function () {
    beforeEach(async function () {
      await genesisKey.setMintOpen(true);
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.5") });
      await genesisKey.connect(addr2).mintGenesis({ value: ethers.parseEther("0.5") });
    });

    it("Should deposit MEV correctly", async function () {
      const contractAddr = await genesisKey.getAddress();
      const contractBalanceBefore = await ethers.provider.getBalance(contractAddr);
      await owner.sendTransaction({
        to: contractAddr,
        value: ethers.parseEther("1.0"),
      });
      const contractBalanceAfter = await ethers.provider.getBalance(contractAddr);
      expect(contractBalanceAfter - contractBalanceBefore).to.equal(ethers.parseEther("1.0"));
    });

    it("Should calculate MEV share correctly", async function () {
      await genesisKey.depositMEV({ value: ethers.parseEther("1.0") });
      const share = await genesisKey.getPendingMEV(addr1.address);
      expect(share).to.equal(ethers.parseEther("0.5"));
    });
  });
});

describe("BuilderStakingVault", function () {
  let stakingVault;
  let mockToken;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MOCK");
    await mockToken.waitForDeployment();

    // Deploy staking vault
    const StakingVault = await ethers.getContractFactory("BuilderStakingVault");
    stakingVault = await StakingVault.deploy(await mockToken.getAddress());
    await stakingVault.waitForDeployment();

    // Mint tokens to addr1
    await mockToken.mint(addr1.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set correct token", async function () {
      expect(await stakingVault.builderToken()).to.equal(await mockToken.getAddress());
    });

    it("Should start with zero total deposited", async function () {
      expect(await stakingVault.totalDeposited()).to.equal(0);
    });
  });

  describe("Staking", function () {
    it("Should stake tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      expect(await stakingVault.totalStaked(addr1.address)).to.equal(amount);
      expect(await stakingVault.totalDeposited()).to.equal(amount);
    });

    it("Should reject zero amount", async function () {
      await expect(
        stakingVault.connect(addr1).stake(0, 30)
      ).to.be.revertedWithCustomError(stakingVault, "InsufficientAmount");
    });

    it("Should reject invalid lock tier", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await expect(
        stakingVault.connect(addr1).stake(amount, 60)
      ).to.be.revertedWithCustomError(stakingVault, "InvalidLockTier");
    });

    it("Should calculate builder score correctly", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      const score = await stakingVault.getBuilderScore(addr1.address);
      expect(score).to.equal(amount);
    });

    it("Should apply correct multiplier for 90 days", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 90);

      const score = await stakingVault.getBuilderScore(addr1.address);
      expect(score).to.equal(ethers.parseEther("135"));
    });

    it("Should apply correct multiplier for 180 days", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 180);

      const score = await stakingVault.getBuilderScore(addr1.address);
      expect(score).to.equal(ethers.parseEther("185"));
    });
  });

  describe("Withdrawal", function () {
    it("Should withdraw after lock expires", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await stakingVault.connect(addr1).withdraw(0);
      expect(await stakingVault.totalStaked(addr1.address)).to.equal(0);
    });

    it("Should apply 2% penalty for early withdrawal", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      const balanceBefore = await mockToken.balanceOf(addr1.address);
      await stakingVault.connect(addr1).withdraw(0);
      const balanceAfter = await mockToken.balanceOf(addr1.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("98"));
    });
  });
});
