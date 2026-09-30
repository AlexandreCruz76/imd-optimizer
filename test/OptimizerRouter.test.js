const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptimizerRouter — integração The Standard (DEC-017)", function () {
  let router, vault, mockStandardToken, mockWETH, mockPool;
  let owner, user1, user2, feeCollector;

  beforeEach(async function () {
    [owner, user1, user2, feeCollector] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockStandardToken = await MockERC20.deploy("Standard Token", "STANDARD");
    mockWETH = await MockERC20.deploy("Wrapped ETH", "WETH");

    const MockPool = await ethers.getContractFactory("MockUniswapV4Pool");
    mockPool = await MockPool.deploy(await mockStandardToken.getAddress());

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address); // router placeholder

    const Router = await ethers.getContractFactory("OptimizerRouter");
    router = await Router.deploy(
      await mockPool.getAddress(),
      await mockStandardToken.getAddress(),
      await mockWETH.getAddress(),
      await vault.getAddress()
    );

    await vault.setRouter(await router.getAddress());

    await mockStandardToken.mint(user1.address, ethers.parseEther("10000"));
    await mockWETH.mint(user1.address, ethers.parseEther("100"));
  });

  describe("Deployment", function () {
    it("Should set correct addresses", async function () {
      expect(await router.standardPool()).to.equal(await mockPool.getAddress());
      expect(await router.standardToken()).to.equal(
        await mockStandardToken.getAddress()
      );
      expect(await router.weth()).to.equal(await mockWETH.getAddress());
      expect(await router.vault()).to.equal(await vault.getAddress());
    });

    it("Should set owner correctly", async function () {
      expect(await router.owner()).to.equal(owner.address);
    });

    it("Should default to Tier 4 sem NFTs/saldo — 0,50% swap, 25% success (DEC-020)", async function () {
      // user2 não tem NFTs nem saldo de $IMD → Retail (tier index 3)
      expect(await router.identityTier(user2.address)).to.equal(3);
      expect(await router.swapFeeBps(user2.address)).to.equal(50);
      expect(await router.successFeeBps(user2.address)).to.equal(2500);
    });

    it("Should classify holder de $IMD como Tier 3 — 0,30% swap, 20% success (DEC-020)", async function () {
      // user1 tem saldo do standardToken ($IMD) → Holder (tier index 2)
      expect(await router.identityTier(user1.address)).to.equal(2);
      expect(await router.swapFeeBps(user1.address)).to.equal(30);
      expect(await router.successFeeBps(user1.address)).to.equal(2000);
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

  describe("Fee Management (DEC-020)", function () {
    it("Should update swap fee for a tier", async function () {
      await router.setSwapFeeTier(3, 100); // 1% para Retail
      expect(await router.swapFeeBps(user2.address)).to.equal(100);
    });

    it("Should reject swap fee > 5%", async function () {
      await expect(router.setSwapFeeTier(3, 600)).to.be.revertedWith(
        "Fee too high (max 5%)"
      );
    });

    it("Should reject invalid tier (> 3)", async function () {
      await expect(router.setSwapFeeTier(4, 10)).to.be.revertedWith(
        "Invalid tier"
      );
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
      expect(stats.feesCollected).to.equal(0);
    });
  });
});

describe("OptimizerVaultV2 — split oficial DEC-017 (60/20/15/5)", function () {
  let vault;
  let owner, user1, user2, stranger;

  const ONE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, user1, user2, stranger] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address); // owner = router placeholder
    await vault.waitForDeployment();
  });

  // Stack do Buy-and-Burn: venue mock (ETH → $IMD), $IMD de mercado e
  // hook (contador público totalIMDBurnedByOptimizer)
  async function deployBuyAndBurnStack() {
    const [, , , , burnExec] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const imd = await MockERC20.deploy("Standard IMD", "IMD");
    const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
    const venue = await Pool.deploy(await imd.getAddress());
    await imd.mint(await venue.getAddress(), ethers.parseEther("10"));

    const Hook = await ethers.getContractFactory("OptimizerHookV2");
    const hook = await Hook.deploy(
      await vault.getAddress(),
      owner.address,
      owner.address,
      owner.address,
      owner.address
    );
    await vault.setHook(await hook.getAddress());
    await vault.setBuyAndBurn(
      await imd.getAddress(),
      await venue.getAddress()
    );
    return { imd, venue, hook, burnExec };
  }

  describe("Deployment", function () {
    it("Should set router correctly", async function () {
      expect(await vault.router()).to.equal(owner.address);
    });

    it("Should set fee tiers", async function () {
      expect(await vault.tierFeeBps(0)).to.equal(2000); // FREE = 20%
      expect(await vault.tierFeeBps(1)).to.equal(1500); // BASIC = 15%
      expect(await vault.tierFeeBps(2)).to.equal(1000); // PRO = 10%
      expect(await vault.tierFeeBps(3)).to.equal(500); // WHALE = 5%
    });

    it("Should hardcode official split constants", async function () {
      expect(await vault.STAKERS_BPS()).to.equal(6000);
      expect(await vault.TREASURY_BPS()).to.equal(2000);
      expect(await vault.DEVS_BPS()).to.equal(1500);
      expect(await vault.BURN_BPS()).to.equal(500);
    });
  });

  describe("Deposits", function () {
    it("Should deposit ETH", async function () {
      await vault.connect(user1).deposit({ value: ONE });
      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(ONE);
    });

    it("Should issue shares correctly", async function () {
      await vault.connect(user1).deposit({ value: ONE });
      const pos = await vault.positions(user1.address);
      expect(pos.shares).to.equal(ONE);
    });

    it("Should reject zero deposit", async function () {
      await expect(
        vault.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("Must deposit ETH");
    });

    it("Should handle multiple deposits", async function () {
      await vault.connect(user1).deposit({ value: ONE });
      await vault.connect(user1).deposit({
        value: ethers.parseEther("2"),
      });
      const pos = await vault.positions(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("3"));
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await vault.connect(user1).deposit({
        value: ethers.parseEther("10"),
      });
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

  describe("Split de receitas (router/hook → cofre)", function () {
    it("receiveYield: router (owner placeholder) creditou o split exato", async function () {
      await expect(vault.connect(owner).receiveYield({ value: ONE })).to.emit(
        vault,
        "ProtocolFeesReceived"
      );

      expect(await vault.stakersAccrued()).to.equal(
        (ONE * 6000n) / 10000n
      );
      expect(await vault.treasuryAccrued()).to.equal(
        (ONE * 2000n) / 10000n
      );
      expect(await vault.devsAccrued()).to.equal((ONE * 1500n) / 10000n);
      expect(await vault.burnAccrued()).to.equal(
        ONE -
          (ONE * 6000n) / 10000n -
          (ONE * 2000n) / 10000n -
          (ONE * 1500n) / 10000n
      );
      expect(await vault.totalProtocolFees()).to.equal(ONE);
      expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(
        ONE
      );
    });

    it("receiveYield: estranho reverte; hook autorizado após setHook", async function () {
      await expect(
        vault.connect(stranger).receiveYield({ value: ONE })
      ).to.be.revertedWith("Not authorized");
      await expect(
        vault.connect(owner).receiveYield({ value: 0 })
      ).to.be.revertedWith("No yield");

      await vault.setHook(stranger.address);
      await vault.connect(stranger).receiveYield({ value: ONE });
      expect(await vault.totalProtocolFees()).to.equal(ONE);
    });

    it("receive() direto também passa pelo split (doação não escapa)", async function () {
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: ONE,
      });
      expect(await vault.totalProtocolFees()).to.equal(ONE);
      expect(await vault.stakersAccrued()).to.equal(
        (ONE * 6000n) / 10000n
      );
    });

    it("distributeSplit: só owner; 5% via Buy-and-Burn ($IMD ao executor, nunca ETH)", async function () {
      await vault.connect(owner).receiveYield({ value: ONE });

      await expect(
        vault.connect(stranger).distributeSplit()
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
      await expect(vault.distributeSplit()).to.be.revertedWith(
        "stakingVault not set"
      );

      const { imd, hook, burnExec } = await deployBuyAndBurnStack();

      await vault.setSplitRecipients(
        user1.address,
        user2.address,
        stranger.address,
        burnExec.address
      );

      const b1 = await ethers.provider.getBalance(user1.address);
      const b2 = await ethers.provider.getBalance(user2.address);
      const bBurn = await ethers.provider.getBalance(burnExec.address);

      await expect(vault.distributeSplit()).to.emit(vault, "SplitDistributed");

      expect(
        (await ethers.provider.getBalance(user1.address)) - b1
      ).to.equal((ONE * 6000n) / 10000n);
      expect(
        (await ethers.provider.getBalance(user2.address)) - b2
      ).to.equal((ONE * 2000n) / 10000n);

      const bExp =
        ONE -
        (ONE * 6000n) / 10000n -
        (ONE * 2000n) / 10000n -
        (ONE * 1500n) / 10000n;

      // Fatia de 5%: NUNCA ETH nativo ao BurnExecutor (ajuste)
      expect(
        (await ethers.provider.getBalance(burnExec.address)) - bBurn
      ).to.equal(0);
      // $IMD exato comprado a mercado (mock 1:1) → executor
      expect(await imd.balanceOf(burnExec.address)).to.equal(bExp);
      // Contador público soma o valor exato
      expect(await hook.totalIMDBurnedByOptimizer()).to.equal(bExp);
      // Cofre esvaziado (95% em ETH + 5% gasto na venue)
      expect(
        await ethers.provider.getBalance(await vault.getAddress())
      ).to.equal(0);
      expect(await vault.burnAccrued()).to.equal(0);
    });

    it("buyAndBurn: guarda de config, permissão livre e contador (sem distributeSplit)", async function () {
      await vault.connect(owner).receiveYield({ value: ONE });

      const [, , , , burnExec] = await ethers.getSigners();
      await vault.setSplitRecipients(
        user1.address,
        user2.address,
        stranger.address,
        burnExec.address
      );

      // Sem venue/token/hook: toda queima precisa somar ao contador público
      await expect(vault.connect(stranger).buyAndBurn()).to.be.revertedWith(
        "Buy-and-burn not configured"
      );
      await expect(vault.setBuyBurnSlippageBps(2001)).to.be.revertedWith(
        "Slippage too high"
      );

      const { imd, venue, hook } = await deployBuyAndBurnStack();
      await expect(
        vault.setBuyAndBurn(ethers.ZeroAddress, await venue.getAddress())
      ).to.be.revertedWith("Invalid config");

      // Permissível a qualquer conta (destinatário fixo em config)
      await expect(vault.connect(stranger).buyAndBurn()).to.emit(
        vault,
        "BuyAndBurn"
      );

      const bExp =
        ONE -
        (ONE * 6000n) / 10000n -
        (ONE * 2000n) / 10000n -
        (ONE * 1500n) / 10000n;

      // Só a fatia de 5% foi mexida — os outros balgos ficam intactos
      expect(await vault.burnAccrued()).to.equal(0);
      expect(await vault.stakersAccrued()).to.equal((ONE * 6000n) / 10000n);
      expect(await vault.treasuryAccrued()).to.equal((ONE * 2000n) / 10000n);
      expect(await vault.devsAccrued()).to.equal((ONE * 1500n) / 10000n);
      expect(await imd.balanceOf(burnExec.address)).to.equal(bExp);
      expect(await hook.totalIMDBurnedByOptimizer()).to.equal(bExp);
      // Cofre reteve os 95% restantes
      expect(
        await ethers.provider.getBalance(await vault.getAddress())
      ).to.equal(ONE - bExp);
      // Nada acumulado → no-op (não reverte)
      await expect(vault.buyAndBurn()).to.not.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should update router and hook", async function () {
      await vault.setRouter(user1.address);
      expect(await vault.router()).to.equal(user1.address);
      await vault.setHook(user2.address);
      expect(await vault.hook()).to.equal(user2.address);
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
