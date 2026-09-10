const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptimizerVaultTest — Security & Functionality", function () {
  let vault, owner, user1, user2, feeCollector;
  const FEE_COLLECTOR_INITIAL = ethers.ZeroAddress;
  
  // Tier constants
  const FREE = 0, BASIC = 1, PRO = 2, WHALE = 3;
  const TIER_FEES = [2000, 1500, 1000, 500];
  const TIER_COSTS = [0, ethers.parseEther("0.05"), ethers.parseEther("0.2"), ethers.parseEther("0.5")];
  const TIER_MIN_DEP = [ethers.parseEther("0.01"), ethers.parseEther("0.1"), ethers.parseEther("1"), ethers.parseEther("10")];

  beforeEach(async function () {
    [owner, user1, user2, feeCollector] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("OptimizerVaultTest");
    vault = await Vault.deploy();
  });

  // ══════════════════════════════════════════════════════════
  //  DEPLOY & INITIALIZATION
  // ══════════════════════════════════════════════════════════
  describe("Deploy", function () {
    it("should set owner to deployer", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("should set feeCollector to deployer", async function () {
      expect(await vault.feeCollector()).to.equal(owner.address);
    });

    it("should not be paused", async function () {
      expect(await vault.paused()).to.equal(false);
    });

    it("should have maxDepositPerUser = 50 ETH", async function () {
      expect(await vault.maxDepositPerUser()).to.equal(ethers.parseEther("50"));
    });

    it("should have correct tier fees", async function () {
      expect(await vault.tierFees(0)).to.equal(2000);
      expect(await vault.tierFees(1)).to.equal(1500);
      expect(await vault.tierFees(2)).to.equal(1000);
      expect(await vault.tierFees(3)).to.equal(500);
    });

    it("should have correct tier min deposits", async function () {
      expect(await vault.tierMinDeposit(0)).to.equal(ethers.parseEther("0.01"));
      expect(await vault.tierMinDeposit(1)).to.equal(ethers.parseEther("0.1"));
      expect(await vault.tierMinDeposit(2)).to.equal(ethers.parseEther("1"));
      expect(await vault.tierMinDeposit(3)).to.equal(ethers.parseEther("10"));
    });
  });

  // ══════════════════════════════════════════════════════════
  //  OWNERSHIP (2-STEP)
  // ══════════════════════════════════════════════════════════
  describe("Ownership", function () {
    it("should start transfer", async function () {
      await vault.transferOwnership(user1.address);
      expect(await vault.pendingOwner()).to.equal(user1.address);
      expect(await vault.owner()).to.equal(owner.address); // not yet transferred
    });

    it("should complete 2-step transfer", async function () {
      await vault.transferOwnership(user1.address);
      await vault.connect(user1).acceptOwnership();
      expect(await vault.owner()).to.equal(user1.address);
      expect(await vault.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("should reject non-pending owner accept", async function () {
      await vault.transferOwnership(user1.address);
      await expect(vault.connect(user2).acceptOwnership()).to.be.revertedWith("Not pending owner");
    });

    it("should reject zero address transfer", async function () {
      await expect(vault.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith("Invalid address");
    });

    it("should reject non-owner transfer", async function () {
      await expect(vault.connect(user1).transferOwnership(user1.address)).to.be.revertedWith("Not owner");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  PAUSE
  // ══════════════════════════════════════════════════════════
  describe("Pause", function () {
    it("should pause", async function () {
      await vault.pause();
      expect(await vault.paused()).to.equal(true);
    });

    it("should unpause", async function () {
      await vault.pause();
      await vault.unpause();
      expect(await vault.paused()).to.equal(false);
    });

    it("should reject subscribe when paused", async function () {
      await vault.pause();
      await expect(vault.connect(user1).subscribe(BASIC, { value: TIER_COSTS[BASIC] }))
        .to.be.revertedWith("Contract is paused");
    });

    it("should reject deposit when paused", async function () {
      await vault.connect(user1).subscribe(BASIC, { value: TIER_COSTS[BASIC] });
      await vault.pause();
      await expect(vault.connect(user1).deposit({ value: ethers.parseEther("0.1") }))
        .to.be.revertedWith("Contract is paused");
    });

    it("should reject non-owner pause", async function () {
      await expect(vault.connect(user1).pause()).to.be.revertedWith("Not owner");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  SUBSCRIPTION
  // ══════════════════════════════════════════════════════════
  describe("Subscribe", function () {
    it("should subscribe to FREE tier (cost=0)", async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      const sub = await vault.getSubscription(user1.address);
      expect(sub.tier).to.equal(FREE);
      expect(sub.active).to.equal(true);
    });

    it("should subscribe to BASIC tier", async function () {
      await vault.connect(user1).subscribe(BASIC, { value: TIER_COSTS[BASIC] });
      const sub = await vault.getSubscription(user1.address);
      expect(sub.tier).to.equal(BASIC);
      expect(sub.active).to.equal(true);
    });

    it("should subscribe to PRO tier", async function () {
      await vault.connect(user1).subscribe(PRO, { value: TIER_COSTS[PRO] });
      const sub = await vault.getSubscription(user1.address);
      expect(sub.tier).to.equal(PRO);
      expect(sub.active).to.equal(true);
    });

    it("should subscribe to WHALE tier", async function () {
      await vault.connect(user1).subscribe(WHALE, { value: TIER_COSTS[WHALE] });
      const sub = await vault.getSubscription(user1.address);
      expect(sub.tier).to.equal(WHALE);
      expect(sub.active).to.equal(true);
    });

    it("should refund overpayment", async function () {
      const overpay = ethers.parseEther("1");
      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).subscribe(BASIC, { value: overpay });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);
      // Should only have spent ~0.05 ETH + gas, not 1 ETH
      expect(balBefore - balAfter).to.be.lt(ethers.parseEther("0.1"));
    });

    it("should reject double subscribe", async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      await expect(vault.connect(user1).subscribe(FREE, { value: 0 }))
        .to.be.revertedWith("Already subscribed");
    });

    it("should reject insufficient cost", async function () {
      await expect(vault.connect(user1).subscribe(BASIC, { value: ethers.parseEther("0.01") }))
        .to.be.revertedWith("Insufficient cost");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  DEPOSIT
  // ══════════════════════════════════════════════════════════
  describe("Deposit", function () {
    beforeEach(async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
    });

    it("should deposit ETH", async function () {
      const amount = ethers.parseEther("1");
      await vault.connect(user1).deposit({ value: amount });
      const pos = await vault.getPosition(user1.address);
      expect(pos.ethDeposited).to.equal(amount);
      expect(pos.shares).to.equal(amount);
    });

    it("should update totalDeposits", async function () {
      const amount = ethers.parseEther("1");
      await vault.connect(user1).deposit({ value: amount });
      expect(await vault.totalDeposits()).to.equal(amount);
    });

    it("should update contract balance", async function () {
      const amount = ethers.parseEther("1");
      await vault.connect(user1).deposit({ value: amount });
      expect(await vault.getContractBalance()).to.equal(amount);
    });

    it("should reject zero deposit", async function () {
      await expect(vault.connect(user1).deposit({ value: 0 }))
        .to.be.revertedWith("Must deposit ETH");
    });

    it("should reject unsubscribe user", async function () {
      // user2 not subscribed
      await expect(vault.connect(user2).deposit({ value: ethers.parseEther("0.01") }))
        .to.be.revertedWith("Must be subscribed");
    });

    it("should reject below min deposit for tier", async function () {
      // FREE tier min = 0.01 ETH, try deposit 0.001
      await expect(vault.connect(user1).deposit({ value: ethers.parseEther("0.001") }))
        .to.be.revertedWith("Below minimum deposit");
    });

    it("should reject above max deposit", async function () {
      const max = await vault.maxDepositPerUser();
      await expect(vault.connect(user1).deposit({ value: max + 1n }))
        .to.be.revertedWith("Exceeds max deposit");
    });

    it("should calculate proportional shares on 2nd deposit", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });
      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });
      const pos = await vault.getPosition(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("4"));
      expect(pos.shares).to.be.gt(0);
    });

    it("should emit Deposited event", async function () {
      const amount = ethers.parseEther("1");
      await expect(vault.connect(user1).deposit({ value: amount }))
        .to.emit(vault, "Deposited").withArgs(user1.address, amount, amount);
    });
  });

  // ══════════════════════════════════════════════════════════
  //  WITHDRAW
  // ══════════════════════════════════════════════════════════
  describe("Withdraw", function () {
    beforeEach(async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });
    });

    it("should withdraw full amount", async function () {
      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).withdraw(ethers.parseEther("2"));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);
      expect(balAfter + gasUsed - balBefore).to.equal(ethers.parseEther("2"));
    });

    it("should withdraw partial amount", async function () {
      await vault.connect(user1).withdraw(ethers.parseEther("1"));
      const pos = await vault.getPosition(user1.address);
      expect(pos.ethDeposited).to.equal(ethers.parseEther("1"));
    });

    it("should update totalDeposits on withdraw", async function () {
      await vault.connect(user1).withdraw(ethers.parseEther("1"));
      expect(await vault.totalDeposits()).to.equal(ethers.parseEther("1"));
    });

    it("should reject zero withdraw", async function () {
      await expect(vault.connect(user1).withdraw(0))
        .to.be.revertedWith("Must withdraw ETH");
    });

    it("should reject over-withdraw", async function () {
      await expect(vault.connect(user1).withdraw(ethers.parseEther("3")))
        .to.be.revertedWith("Insufficient balance");
    });

    it("should emit Withdrawn event", async function () {
      await expect(vault.connect(user1).withdraw(ethers.parseEther("1")))
        .to.emit(vault, "Withdrawn");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  YIELD (addYieldToUser + claimYield)
  // ══════════════════════════════════════════════════════════
  describe("Yield", function () {
    beforeEach(async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });
    });

    it("owner should add yield to user", async function () {
      const amount = ethers.parseEther("0.01");
      await vault.addYieldToUser(user1.address, amount);
      const pos = await vault.getPosition(user1.address);
      expect(pos.yieldEarned).to.equal(amount);
    });

    it("should reject non-owner addYield", async function () {
      await expect(vault.connect(user1).addYieldToUser(user1.address, ethers.parseEther("0.1")))
        .to.be.revertedWith("Not owner");
    });

    it("should reject zero address", async function () {
      await expect(vault.addYieldToUser(ethers.ZeroAddress, ethers.parseEther("0.1")))
        .to.be.revertedWith("Invalid address");
    });

    it("should enforce daily yield limit (1% of totalDeposits)", async function () {
      // totalDeposits = 2 ETH, max daily yield = 0.02 ETH (1%)
      await expect(vault.addYieldToUser(user1.address, ethers.parseEther("0.03")))
        .to.be.revertedWith("Exceeds daily yield limit");
    });

    it("should allow yield within daily limit", async function () {
      // 1% of 2 ETH = 0.02 ETH
      await vault.addYieldToUser(user1.address, ethers.parseEther("0.02"));
      const pos = await vault.getPosition(user1.address);
      expect(pos.yieldEarned).to.equal(ethers.parseEther("0.02"));
    });

    it("user should claim yield", async function () {
      const yieldAmt = ethers.parseEther("0.01");
      await vault.addYieldToUser(user1.address, yieldAmt);
      
      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).claimYield();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);
      
      // netYield = 0.01 * (1 - 20%) = 0.008 ETH
      const expectedNet = yieldAmt - (yieldAmt * 2000n / 10000n);
      expect(balAfter + gasUsed - balBefore).to.equal(expectedNet);
    });

    it("should reject claim with no yield", async function () {
      await expect(vault.connect(user1).claimYield())
        .to.be.revertedWith("No yield to claim");
    });

    it("should track totalFeesCollected on claim", async function () {
      const yieldAmt = ethers.parseEther("0.01");
      await vault.addYieldToUser(user1.address, yieldAmt);
      await vault.connect(user1).claimYield();
      
      const expectedFee = yieldAmt * 2000n / 10000n; // 20% of 0.01 = 0.002
      expect(await vault.totalFeesCollected()).to.equal(expectedFee);
    });

    it("should reset yield after claim", async function () {
      await vault.addYieldToUser(user1.address, ethers.parseEther("0.01"));
      await vault.connect(user1).claimYield();
      const pos = await vault.getPosition(user1.address);
      expect(pos.yieldEarned).to.equal(0);
    });
  });

  // ══════════════════════════════════════════════════════════
  //  SWEEP STUCK FUNDS
  // ══════════════════════════════════════════════════════════
  describe("SweepStuckFunds", function () {
    it("should sweep stuck ETH (from receive())", async function () {
      await vault.setFeeCollector(feeCollector.address);
      // Send ETH directly to contract (bypassing deposit)
      await owner.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("0.5") });
      
      const balBefore = await ethers.provider.getBalance(feeCollector.address);
      await vault.sweepStuckFunds();
      const balAfter = await ethers.provider.getBalance(feeCollector.address);
      
      expect(balAfter - balBefore).to.equal(ethers.parseEther("0.5"));
    });

    it("should reject if no stuck funds", async function () {
      await expect(vault.sweepStuckFunds()).to.be.revertedWith("No stuck funds");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  FEE COLLECTOR
  // ══════════════════════════════════════════════════════════
  describe("FeeCollector", function () {
    it("should set fee collector", async function () {
      await vault.setFeeCollector(user1.address);
      expect(await vault.feeCollector()).to.equal(user1.address);
    });

    it("should reject zero address", async function () {
      await expect(vault.setFeeCollector(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });
  });

  // ══════════════════════════════════════════════════════════
  //  MULTI-USER SCENARIO
  // ══════════════════════════════════════════════════════════
  describe("Multi-User Scenario", function () {
    it("3 users deposit, yield, claim — correct fees per tier", async function () {
      // User1: FREE (20% fee)
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      await vault.connect(user1).deposit({ value: ethers.parseEther("0.5") });

      // User2: BASIC (15% fee) 
      await vault.connect(user2).subscribe(BASIC, { value: TIER_COSTS[BASIC] });
      await vault.connect(user2).deposit({ value: ethers.parseEther("1") });

      // Add yield (must be within daily limit: 1% of each user's deposit)
      const yield1 = ethers.parseEther("0.005"); // 1% of 0.5 ETH
      const yield2 = ethers.parseEther("0.01");  // 1% of 1 ETH
      await vault.addYieldToUser(user1.address, yield1);
      await vault.addYieldToUser(user2.address, yield2);

      // Claim user1 (FREE = 20%)
      const bal1Before = await ethers.provider.getBalance(user1.address);
      const tx1 = await vault.connect(user1).claimYield();
      const r1 = await tx1.wait();
      const gas1 = r1.gasUsed * r1.gasPrice;
      const bal1After = await ethers.provider.getBalance(user1.address);
      const net1 = yield1 - (yield1 * 2000n / 10000n);
      expect(bal1After + gas1 - bal1Before).to.equal(net1);

      // Claim user2 (BASIC = 15%)
      const bal2Before = await ethers.provider.getBalance(user2.address);
      const tx2 = await vault.connect(user2).claimYield();
      const r2 = await tx2.wait();
      const gas2 = r2.gasUsed * r2.gasPrice;
      const bal2After = await ethers.provider.getBalance(user2.address);
      const net2 = yield2 - (yield2 * 1500n / 10000n);
      expect(bal2After + gas2 - bal2Before).to.equal(net2);

      // Total fees: 20% of 0.005 + 15% of 0.01 = 0.001 + 0.0015 = 0.0025
      const totalFees = (yield1 * 2000n / 10000n) + (yield2 * 1500n / 10000n);
      expect(await vault.totalFeesCollected()).to.equal(totalFees);
    });
  });

  // ══════════════════════════════════════════════════════════
  //  VIEW FUNCTIONS
  // ══════════════════════════════════════════════════════════
  describe("View Functions", function () {
    it("getTierInfo returns correct values", async function () {
      const info = await vault.getTierInfo(FREE);
      expect(info.fee).to.equal(2000);
      expect(info.cost).to.equal(0);
      expect(info.minDeposit).to.equal(ethers.parseEther("0.01"));
    });

    it("getContractBalance returns correct balance", async function () {
      await vault.connect(user1).subscribe(FREE, { value: 0 });
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      expect(await vault.getContractBalance()).to.equal(ethers.parseEther("1"));
    });

    it("getDailyYieldAdded returns 0 for new day", async function () {
      expect(await vault.getDailyYieldAdded(user1.address)).to.equal(0);
    });
  });
});
