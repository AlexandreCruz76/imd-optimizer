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

    it("Should have max supply of 501 (DEC-020 — Tier 1 Buildercoin)", async function () {
      expect(await genesisKey.MAX_SUPPLY()).to.equal(501);
    });

    it("Should start with mint closed", async function () {
      expect(await genesisKey.mintOpen()).to.equal(false);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await genesisKey.setMintOpen(true);
    });

    it("Should mint Genesis key with correct price (0,05 ETH — DEC-020)", async function () {
      const price = ethers.parseEther("0.05");
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
        genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(genesisKey, "MintNotOpen");
    });

    it("Should reject insufficient payment", async function () {
      await expect(
        genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWithCustomError(genesisKey, "InsufficientPayment");
    });

    it("Should reject mint after max supply (501)", async function () {
      // preço zerado para o loop não depender de saldo de ETH
      await genesisKey.setPrice(0);
      for (let i = 0; i < 501; i++) {
        await genesisKey.connect(addr1).mintGenesis({ value: 0 });
      }
      await expect(
        genesisKey.connect(addr1).mintGenesis({ value: 0 })
      ).to.be.revertedWithCustomError(genesisKey, "MaxSupplyReached");
    });

    it("Should track owner keys correctly", async function () {
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.05") });
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.05") });
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
      await genesisKey.connect(addr1).mintGenesis({ value: ethers.parseEther("0.05") });
      await genesisKey.connect(addr2).mintGenesis({ value: ethers.parseEther("0.05") });
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
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

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

  describe("Withdrawal (DEC-020 — Diamond Hands)", function () {
    it("Should withdraw after lock expires (0% fee)", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const balanceBefore = await mockToken.balanceOf(addr1.address);
      await stakingVault.connect(addr1).withdraw(0);
      const balanceAfter = await mockToken.balanceOf(addr1.address);

      expect(balanceAfter - balanceBefore).to.equal(amount); // 0% de taxa
      expect(await stakingVault.totalStaked(addr1.address)).to.equal(0);
    });

    it("Should reject early withdraw while locked (exige unbond ou emergência)", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      await expect(
        stakingVault.connect(addr1).withdraw(0)
      ).to.be.revertedWith(
        "Lock active: beginUnbond or emergencyInstantWithdraw"
      );
    });

    it("beginUnbond → completeUnbond após 7 dias: 0% de taxa", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      await expect(stakingVault.connect(addr1).beginUnbond(0)).to.emit(
        stakingVault,
        "UnbondInitiated"
      );

      // concluir antes dos 7 dias → revert
      await expect(
        stakingVault.connect(addr1).completeUnbond(0)
      ).to.be.revertedWith("Unbonding period not met");

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const balanceBefore = await mockToken.balanceOf(addr1.address);
      await stakingVault.connect(addr1).completeUnbond(0);
      const balanceAfter = await mockToken.balanceOf(addr1.address);

      expect(balanceAfter - balanceBefore).to.equal(amount); // 0% de taxa
      expect(await stakingVault.totalStaked(addr1.address)).to.equal(0);
    });

    it("emergencyInstantWithdraw: 2% → 50% Buy-and-Burn / 25% Treasury / 25% yield", async function () {
      // Venue $BLD→ETH (mock 1:1, com ETH semeado)
      const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
      const venue = await Pool.deploy(await mockToken.getAddress());
      await owner.sendTransaction({
        to: await venue.getAddress(),
        value: ethers.parseEther("10"),
      });

      // Cofre real: 50% da penalidade → burnAccrued (fatia Buy-and-Burn)
      const Vault = await ethers.getContractFactory("OptimizerVaultV2");
      const vault = await Vault.deploy(owner.address);
      await vault.setSplitRecipients(
        await stakingVault.getAddress(),
        addr2.address, // treasury
        owner.address,
        owner.address
      );

      await stakingVault.setPenaltyConfig(
        await vault.getAddress(),
        addr2.address,
        await venue.getAddress(),
        200 // 2%
      );

      const amount = ethers.parseEther("100");
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);

      const treasuryBefore = await ethers.provider.getBalance(addr2.address);

      await expect(
        stakingVault.connect(addr1).emergencyInstantWithdraw(0)
      ).to.emit(stakingVault, "EmergencyWithdrawn");

      // Penalidade: 2% de 100 = 2 $BLD → venue converte 1:1 → 2 ETH
      // Staker recebeu 98 $BLD de volta (líquido do saque imediato)
      expect(await mockToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("9998")
      );
      expect(await stakingVault.totalStaked(addr1.address)).to.equal(0);

      // 50% (1 ETH) → Cofre (fatia Buy-and-Burn)
      expect(await vault.burnAccrued()).to.equal(ethers.parseEther("1"));

      // 25% (0,5 ETH) → Treasury
      expect(
        (await ethers.provider.getBalance(addr2.address)) - treasuryBefore
      ).to.equal(ethers.parseEther("0.5"));

      // 25% (0,5 ETH) → yield ponderado do staker — claim com 0% de taxa
      await expect(stakingVault.connect(addr1).claimYield()).to.changeEtherBalance(
        addr1,
        ethers.parseEther("0.5")
      );
    });

    it("yield ponderado: NFT Tier 1 rende 4x — stake 0 ⇒ peso 0 (DEC-020)", async function () {
      // Buildercoin NFT = OptimizerGenesisKey (Tier 1, 4x)
      const Genesis = await ethers.getContractFactory("OptimizerGenesisKey");
      const genesis = await Genesis.deploy();
      await genesis.setMintOpen(true);
      await stakingVault.setIdentityConfig(
        await genesis.getAddress(),
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );

      const amount = ethers.parseEther("100");
      await mockToken.mint(addr2.address, ethers.parseEther("10000"));
      await mockToken.connect(addr1).approve(await stakingVault.getAddress(), amount);
      await mockToken.connect(addr2).approve(await stakingVault.getAddress(), amount);
      await stakingVault.connect(addr1).stake(amount, 30);
      await stakingVault.connect(addr2).stake(amount, 30);

      // NFT mintado depois do stake → checkpoint atualiza o peso gravado
      await genesis.connect(addr2).mintGenesis({ value: ethers.parseEther("0.05") });
      await stakingVault.checkpoint(addr2.address);

      // Peso vivo: addr1 = 100 × 1x; addr2 = 100 × 4x
      expect(await stakingVault.yieldWeightOf(addr1.address)).to.equal(amount);
      expect(await stakingVault.yieldWeightOf(addr2.address)).to.equal(amount * 4n);

      // Stake 0 ⇒ peso 0 mesmo com NFT Tier 1 (multiplicador não é combustível)
      await genesis.connect(owner).mintGenesis({ value: ethers.parseEther("0.05") });
      expect(await stakingVault._yieldMultiplierBps(owner.address)).to.equal(40000);
      expect(await stakingVault.yieldWeightOf(owner.address)).to.equal(0);

      // 5 ETH de yield → 80% para addr2 (4x), 20% para addr1 (1x)
      await owner.sendTransaction({
        to: await stakingVault.getAddress(),
        value: ethers.parseEther("5"),
      });

      await expect(
        stakingVault.connect(addr1).claimYield()
      ).to.changeEtherBalance(addr1, ethers.parseEther("1"));
      await expect(
        stakingVault.connect(addr2).claimYield()
      ).to.changeEtherBalance(addr2, ethers.parseEther("4"));
    });
  });
});
