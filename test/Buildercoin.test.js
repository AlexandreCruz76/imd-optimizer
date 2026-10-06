const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Buildercoin", function () {
  let buildercoin;
  let owner, minter, core, infra, marketing;

  const PRICE = ethers.parseEther("0.05");
  const MAX_SUPPLY = 501;

  async function deployRaw() {
    [owner, minter, core, infra, marketing] = await ethers.getSigners();
    const Buildercoin = await ethers.getContractFactory("Buildercoin");
    buildercoin = await Buildercoin.deploy();
    await buildercoin.waitForDeployment();
  }

  async function deployConfigured() {
    await deployRaw();
    await buildercoin.setSplitWallets(core.address, infra.address, marketing.address);
    await buildercoin.setMintOpen(true);
  }

  describe("Deployment", function () {
    beforeEach(deployRaw);

    it("Should set name Buildercoin and symbol BLD (especificação)", async function () {
      expect(await buildercoin.name()).to.equal("Buildercoin");
      expect(await buildercoin.symbol()).to.equal("BLD");
    });

    it("Should lock max supply at 501 and mint price at 0.05 ETH", async function () {
      expect(await buildercoin.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await buildercoin.MINT_PRICE()).to.equal(PRICE);
    });

    it("Should start with mint closed and zero supply", async function () {
      expect(await buildercoin.mintOpen()).to.equal(false);
      expect(await buildercoin.totalSupply()).to.equal(0);
    });

    it("Should authorize the owner (admin) at deploy", async function () {
      expect(await buildercoin.isAuthorized(owner.address)).to.equal(true);
      expect(await buildercoin.isAuthorized(minter.address)).to.equal(false);
    });
  });

  describe("Minting + Split de Gênese", function () {
    beforeEach(deployConfigured);

    it("Should mint at exactly 0.05 ETH with tokenLevel starting at 1", async function () {
      await buildercoin.connect(minter).mint({ value: PRICE });
      expect(await buildercoin.totalSupply()).to.equal(1);
      expect(await buildercoin.ownerOf(1)).to.equal(minter.address);
      expect(await buildercoin.tokenLevel(1)).to.equal(1);
      expect(await buildercoin.balanceOf(minter.address)).to.equal(1);
    });

    it("Should reject wrong payment (0.01 ETH)", async function () {
      await expect(
        buildercoin.connect(minter).mint({ value: ethers.parseEther("0.01") })
      )
        .to.be.revertedWithCustomError(buildercoin, "WrongPayment")
        .withArgs(ethers.parseEther("0.01"), PRICE);
    });

    it("Should reject excess payment (0.06 ETH) — sem troco, sem ETH preso", async function () {
      await expect(
        buildercoin.connect(minter).mint({ value: ethers.parseEther("0.06") })
      ).to.be.revertedWithCustomError(buildercoin, "WrongPayment");
    });

    it("Should reject mint when closed", async function () {
      await buildercoin.setMintOpen(false);
      await expect(
        buildercoin.connect(minter).mint({ value: PRICE })
      ).to.be.revertedWithCustomError(buildercoin, "MintNotOpen");
    });

    it("Should reject mint while split wallets are placeholders", async function () {
      await deployRaw();
      await buildercoin.setMintOpen(true);
      await expect(
        buildercoin.connect(minter).mint({ value: PRICE })
      ).to.be.revertedWithCustomError(buildercoin, "SplitNotConfigured");
    });

    it("Should split 40/40/20 atomically and keep ZERO ETH in the contract", async function () {
      const coreBefore = await ethers.provider.getBalance(core.address);
      const infraBefore = await ethers.provider.getBalance(infra.address);
      const marketingBefore = await ethers.provider.getBalance(marketing.address);

      await buildercoin.connect(minter).mint({ value: PRICE });

      expect(await ethers.provider.getBalance(core.address)).to.equal(
        coreBefore + (PRICE * 40n) / 100n
      );
      expect(await ethers.provider.getBalance(infra.address)).to.equal(
        infraBefore + (PRICE * 40n) / 100n
      );
      expect(await ethers.provider.getBalance(marketing.address)).to.equal(
        marketingBefore + (PRICE * 20n) / 100n
      );
      expect(await ethers.provider.getBalance(await buildercoin.getAddress())).to.equal(0);
    });

    it("Should emit Minted + GenesisSplit on every mint", async function () {
      await expect(buildercoin.connect(minter).mint({ value: PRICE }))
        .to.emit(buildercoin, "Minted")
        .withArgs(minter.address, 1, PRICE)
        .and.to.emit(buildercoin, "GenesisSplit")
        .withArgs((PRICE * 40n) / 100n, (PRICE * 40n) / 100n, (PRICE * 20n) / 100n);
    });

    it("Should enforce hard cap of 501 mints", async function () {
      for (let i = 0; i < MAX_SUPPLY; i++) {
        await buildercoin.connect(minter).mint({ value: PRICE });
      }
      expect(await buildercoin.totalSupply()).to.equal(MAX_SUPPLY);
      await expect(
        buildercoin.connect(minter).mint({ value: PRICE })
      ).to.be.revertedWithCustomError(buildercoin, "MaxSupplyReached");
    });

    it("Should support ERC721Enumerable listing (tokenOfOwnerByIndex)", async function () {
      await buildercoin.connect(minter).mint({ value: PRICE });
      await buildercoin.connect(minter).mint({ value: PRICE });
      expect(await buildercoin.tokenOfOwnerByIndex(minter.address, 0)).to.equal(1);
      expect(await buildercoin.tokenOfOwnerByIndex(minter.address, 1)).to.equal(2);
      expect(await buildercoin.remainingSupply()).to.equal(MAX_SUPPLY - 2);
    });
  });

  describe("dNFT Levels (tokenLevel / updateTokenLevel)", function () {
    beforeEach(async function () {
      await deployConfigured();
      await buildercoin.connect(minter).mint({ value: PRICE });
    });

    it("Should start every token at level 1", async function () {
      expect(await buildercoin.tokenLevel(1)).to.equal(1);
    });

    it("Should reject update from non-authorized caller", async function () {
      await expect(
        buildercoin.connect(minter).updateTokenLevel(1, 2)
      ).to.be.revertedWithCustomError(buildercoin, "NotAuthorized");
    });

    it("Should allow owner (admin) to update level and emit event", async function () {
      await expect(buildercoin.updateTokenLevel(1, 3))
        .to.emit(buildercoin, "TokenLevelUpdated")
        .withArgs(1, 1, 3, owner.address);
      expect(await buildercoin.tokenLevel(1)).to.equal(3);
    });

    it("Should reject levels outside 1..4 (Bronze..Neon)", async function () {
      await expect(
        buildercoin.updateTokenLevel(1, 0)
      ).to.be.revertedWithCustomError(buildercoin, "LevelOutOfRange");
      await expect(
        buildercoin.updateTokenLevel(1, 5)
      ).to.be.revertedWithCustomError(buildercoin, "LevelOutOfRange");
    });

    it("Should revert update for nonexistent token", async function () {
      await expect(
        buildercoin.updateTokenLevel(999, 2)
      ).to.be.revertedWithCustomError(buildercoin, "ERC721NonexistentToken");
    });

    it("Should grant update rights via setAuthorized (relayer / protocol contracts)", async function () {
      await buildercoin.setAuthorized(minter.address, true);
      expect(await buildercoin.isAuthorized(minter.address)).to.equal(true);
      await buildercoin.connect(minter).updateTokenLevel(1, 4);
      expect(await buildercoin.tokenLevel(1)).to.equal(4);

      await buildercoin.setAuthorized(minter.address, false);
      await expect(
        buildercoin.connect(minter).updateTokenLevel(1, 2)
      ).to.be.revertedWithCustomError(buildercoin, "NotAuthorized");
    });

    it("Should protect admin functions with onlyOwner", async function () {
      await expect(
        buildercoin.connect(minter).setAuthorized(minter.address, true)
      ).to.be.revertedWithCustomError(buildercoin, "OwnableUnauthorizedAccount");
      await expect(
        buildercoin.connect(minter).setMintOpen(false)
      ).to.be.revertedWithCustomError(buildercoin, "OwnableUnauthorizedAccount");
      await expect(
        buildercoin.connect(minter).setBaseURI("https://evil.example/")
      ).to.be.revertedWithCustomError(buildercoin, "OwnableUnauthorizedAccount");
      await expect(
        buildercoin
          .connect(minter)
          .setSplitWallets(minter.address, minter.address, minter.address)
      ).to.be.revertedWithCustomError(buildercoin, "OwnableUnauthorizedAccount");
    });
  });

  describe("tokenURI (espelho do backend)", function () {
    beforeEach(deployConfigured);

    it("Should serve default baseURI + tokenId", async function () {
      await buildercoin.connect(minter).mint({ value: PRICE });
      expect(await buildercoin.tokenURI(1)).to.equal("https://api.imd.fun/metadata/1");
    });

    it("Should honor setBaseURI migration", async function () {
      await buildercoin.connect(minter).mint({ value: PRICE });
      await buildercoin.setBaseURI("https://api.imd.fun/v2/");
      expect(await buildercoin.tokenURI(1)).to.equal("https://api.imd.fun/v2/1");
    });

    it("Should revert tokenURI for nonexistent token", async function () {
      await expect(buildercoin.tokenURI(42)).to.be.revertedWithCustomError(
        buildercoin,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Identity-Fi interop (gate Tier 1)", function () {
    beforeEach(deployConfigured);

    it("balanceOf > 0 only for holders — gate usado por Router/Vault/Hook", async function () {
      expect(await buildercoin.balanceOf(minter.address)).to.equal(0);
      await buildercoin.connect(minter).mint({ value: PRICE });
      expect(await buildercoin.balanceOf(minter.address)).to.equal(1);
      expect(await buildercoin.balanceOf(core.address)).to.equal(0);
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
      // Buildercoin NFT = contrato Tier 1 (4x)
      const Buildercoin = await ethers.getContractFactory("Buildercoin");
      const genesis = await Buildercoin.deploy();
      await genesis.setSplitWallets(owner.address, owner.address, owner.address);
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
      await genesis.connect(addr2).mint({ value: ethers.parseEther("0.05") });
      await stakingVault.checkpoint(addr2.address);

      // Peso vivo: addr1 = 100 × 1x; addr2 = 100 × 4x
      expect(await stakingVault.yieldWeightOf(addr1.address)).to.equal(amount);
      expect(await stakingVault.yieldWeightOf(addr2.address)).to.equal(amount * 4n);

      // Stake 0 ⇒ peso 0 mesmo com NFT Tier 1 (multiplicador não é combustível)
      await genesis.connect(owner).mint({ value: ethers.parseEther("0.05") });
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
