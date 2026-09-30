const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Suíte de consistência do OptimizerRouter como AGREGADOR:
 * - modelo de taxa sustentável (usuário paga feeBps; splits vault/collector/burn)
 * - cotação fixed-point igual à execução da venue (preços realistas)
 * - pull dos $STANDARD via transferFrom (custódia atômica)
 * - proteções: slippage pré/pós, cooldown, limites de preço
 * - backrun orçado pela taxa → burn (nunca drena o float)
 */

const TWO96 = 2n ** 96n;
const BPS = 10000n;

function sqrtForPrice(priceEthPerStd) {
  const scaled = BigInt(Math.round(Math.sqrt(priceEthPerStd) * 1e9));
  return (TWO96 * scaled) / 1000000000n;
}

function quoteEth(amount, sqrt) {
  const step = (amount * sqrt) / TWO96;
  return (step * sqrt) / TWO96;
}

describe("OptimizerRouter — agregador (modelo de taxa, consistência)", function () {
  let router, vault, mockCore, token, mockWETH, pool;
  let owner, user1, feeCollector;

  const PRICE = 0.001; // 1 STANDARD = 0.001 ETH (preço realista)
  const FEE_BPS = 50n; // 0.5%
  const VAULT_SHARE = 5000n; // 50% da taxa
  const BURN_BUDGET = 2000n; // 20% da taxa
  // collector = 30%

  async function ethOf(addr) {
    return await ethers.provider.getBalance(addr);
  }

  async function balanceChange(txPromise, addr) {
    const before = await ethOf(addr);
    const tx = await txPromise;
    const rc = await tx.wait();
    const after = await ethOf(addr);
    const gas = rc.gasUsed * rc.gasPrice;
    return { delta: after - before, gas, tx, rc };
  }

  beforeEach(async function () {
    [owner, user1, feeCollector] = await ethers.getSigners();

    const MockCore = await ethers.getContractFactory("MockStandardCore");
    mockCore = await MockCore.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Standard Token", "STANDARD");
    mockWETH = await MockERC20.deploy("Wrapped ETH", "WETH");

    const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
    pool = await Pool.deploy(await token.getAddress());

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address);

    const Router = await ethers.getContractFactory("OptimizerRouter");
    router = await Router.deploy(
      await mockCore.getAddress(),
      await pool.getAddress(),
      await token.getAddress(),
      await mockWETH.getAddress(),
      await vault.getAddress()
    );
    await vault.setRouter(await router.getAddress());

    // Venue liquidez: ETH para pagar vendas + $STANDARD para backrun
    await owner.sendTransaction({
      to: await pool.getAddress(),
      value: ethers.parseEther("100"),
    });
    await token.mint(await pool.getAddress(), ethers.parseEther("1000000"));

    // Usuário: $STANDARD + allowance
    await token.mint(user1.address, ethers.parseEther("10000"));
    await token.connect(user1).approve(await router.getAddress(), ethers.MaxUint256);

    // Preço realista
    await pool.setPrice(sqrtForPrice(PRICE));
  });

  it("venda 100 STANDARD a 0.001 ETH: splits da taxa exatos e float não drena", async function () {
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const expectedGross = quoteEth(amount, sqrt);
    const feeTotal = (expectedGross * FEE_BPS) / BPS;
    const expectedNet = expectedGross - feeTotal;
    const vaultShare = (feeTotal * VAULT_SHARE) / BPS;
    const burnBudget = (feeTotal * BURN_BUDGET) / BPS;
    const collectorShare = feeTotal - vaultShare - burnBudget;
    const minOut = (expectedNet * 95n) / 100n;

    const userEthBefore = await ethOf(user1.address);
    const vaultBefore = await ethOf(vault.getAddress());
    const ownerBefore = await ethOf(owner.address);
    const routerBefore = await ethOf(await router.getAddress());
    const poolBefore = await ethOf(await pool.getAddress());

    const { rc } = await balanceChange(
      router.connect(user1).executeProtectedSellAndBurn(amount, minOut),
      user1.address
    );
    const userAfter = await ethOf(user1.address);
    const userNet = userAfter - userEthBefore + rc.gasUsed * rc.gasPrice;

    // Usuário recebe o líquido exato (1:1 com a cotação menos 0.5%)
    expect(userNet).to.equal(expectedNet);

    // Splits
    expect(await ethOf(vault.getAddress())).to.equal(vaultBefore + vaultShare);
    expect(await ethOf(owner.address)).to.equal(ownerBefore + collectorShare);
    // Router retém APENAS o orçamento de burn (reserva) — não há dreno
    expect(await ethOf(await router.getAddress())).to.equal(
      routerBefore + burnBudget
    );
    // Venue pagou o gross integral
    expect(poolBefore - (await ethOf(await pool.getAddress()))).to.equal(
      expectedGross
    );

    // Custódia: $STANDARD movidos usuário → venue
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.parseEther("10000") - amount
    );
    expect(await token.balanceOf(await pool.getAddress())).to.equal(
      ethers.parseEther("1000000") + amount
    );

    // Stats
    const stats = await router.getStats();
    expect(stats.sellVolume).to.equal(amount);
    expect(stats.feesCollected).to.equal(feeTotal);
    expect(stats.yieldDistributed).to.equal(vaultShare);
    expect(stats.burnsExecuted).to.equal(0); // impacto 0 ⇒ sem backrun

    // Evento de taxa
    const ev = (
      await router.queryFilter(router.filters.SwapFeeCollected(), rc.blockNumber)
    )[0];
    expect(ev.args.grossEth).to.equal(expectedGross);
    expect(ev.args.feeTotal).to.equal(feeTotal);
    expect(ev.args.vaultShare).to.equal(vaultShare);
    expect(ev.args.collectorShare).to.equal(collectorShare);
  });

  it("execução pior que a cotação (60 bps) dispara backrun orçado e burn", async function () {
    await pool.setExecSlippageBps(60);
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const expectedGross = quoteEth(amount, sqrt);
    const feeTotal = (expectedGross * FEE_BPS) / BPS;
    const burnBudget = (feeTotal * BURN_BUDGET) / BPS;
    const minOut = ((expectedGross - feeTotal) * 90n) / 100n;

    const routerBefore = await ethOf(await router.getAddress());
    const poolBefore = await ethOf(await pool.getAddress());

    const tx = await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);
    const rc = await tx.wait();

    // Burn executado (orçamento > 0 e impacto 60 > 50 bps)
    expect(await mockCore.totalBurned()).to.be.gt(0);
    const stats = await router.getStats();
    expect(stats.burnsExecuted).to.equal(1);
    expect(stats.mevCaptured).to.equal(await mockCore.totalBurned());

    // Consistência de caixa: gross entra, líquido+vault+collector saem,
    // orçamento é gasto na compra ⇒ delta do router = 0 (sem dreno de float)
    expect(await ethOf(await router.getAddress())).to.equal(routerBefore);

    // Venue: pagou o gross REAL (com 60 bps de desvio) e recebeu de volta
    // exatamente o orçamento de backrun calculado sobre esse gross
    const realGross = expectedGross - (expectedGross * 60n) / BPS;
    const realFee = (realGross * FEE_BPS) / BPS;
    const realBudget = (realFee * BURN_BUDGET) / BPS;
    expect(
      poolBefore - (await ethOf(await pool.getAddress()))
    ).to.equal(realGross - realBudget);

    // O router ficou com $STANDARD da compra (mock core só contabiliza)
    expect(await token.balanceOf(await router.getAddress())).to.be.gt(0);
    expect(rc.blockNumber).to.be.gt(0);
  });

  it("sem impacto (0 bps) não há backrun — orçamento fica reservado", async function () {
    const amount = ethers.parseEther("10");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const burnBudget = ((gross * FEE_BPS) / BPS) * BURN_BUDGET / BPS;
    const minOut = ((gross - (gross * FEE_BPS) / BPS) * 90n) / 100n;

    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);
    expect(await mockCore.totalBurned()).to.equal(0);
    expect(await ethOf(await router.getAddress())).to.equal(burnBudget);
  });

  it("pré-checagem: minAmountOut acima do líquido esperado reverte", async function () {
    const amount = ethers.parseEther("10");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const net = gross - (gross * FEE_BPS) / BPS;
    await expect(
      router.connect(user1).executeProtectedSellAndBurn(amount, net + 1n)
    ).to.be.revertedWith("Slippage exceeded");
  });

  it("pré-checagem: minAmountOut >10% abaixo do esperado reverte (MAX_SLIPPAGE_BPS)", async function () {
    const amount = ethers.parseEther("10");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const net = gross - (gross * FEE_BPS) / BPS;
    const tooLow = (net * 85n) / 100n; // 15% abaixo
    await expect(
      router.connect(user1).executeProtectedSellAndBurn(amount, tooLow)
    ).to.be.revertedWith("Slippage exceeded");
  });

  it("pós-checagem: execução pior que minAmountOut reverte mesmo com pré-checagem ok", async function () {
    await pool.setExecSlippageBps(60);
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const net = gross - (gross * FEE_BPS) / BPS;
    // 0.3% abaixo do esperado: pré-checagem passa (≤10%) mas a execução
    // (60 bps pior) entrega menos que o mínimo
    const minOut = (net * 997n) / 1000n;
    await expect(
      router.connect(user1).executeProtectedSellAndBurn(amount, minOut)
    ).to.be.revertedWith("Slippage exceeded");
  });

  it("cooldown: segunda venda em bloco seguinte reverte e passa após o delay", async function () {
    const amount = ethers.parseEther("1");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const minOut = ((gross - (gross * FEE_BPS) / BPS) * 90n) / 100n;

    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);
    await expect(
      router.connect(user1).executeProtectedSellAndBurn(amount, minOut)
    ).to.be.revertedWith("Block delay not met");
    // Bloco seguinte (hardhat minera 1 bloco por tx) ⇒ passa
    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);
  });

  it("custódia: sem allowance o transferFrom reverte (exige approve)", async function () {
    const other = (await ethers.getSigners())[3];
    await token.mint(other.address, ethers.parseEther("10"));
    const amount = ethers.parseEther("1");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const net = gross - (gross * FEE_BPS) / BPS;
    const minOut = (net * 95n) / 100n; // pré-checagem passa; falha no pull
    await expect(
      router.connect(other).executeProtectedSellAndBurn(amount, minOut)
    ).to.be.reverted;
  });

  it("preço extremo 1000 ETH/STANDARD: cotação coerente e venda executa", async function () {
    await pool.setPrice(sqrtForPrice(1000));
    const amount = ethers.parseEther("0.01"); // → ~10 ETH
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    expect(gross).to.be.closeTo(ethers.parseEther("10"), 10n ** 12n);

    const net = gross - (gross * FEE_BPS) / BPS;
    const minOut = (net * 90n) / 100n;
    const { rc } = await balanceChange(
      router.connect(user1).executeProtectedSellAndBurn(amount, minOut),
      user1.address
    );
    const ev = (
      await router.queryFilter(router.filters.SwapFeeCollected(), rc.blockNumber)
    )[0];
    expect(ev.args.grossEth).to.equal(gross);
    expect(ev.args.feeTotal).to.equal((gross * FEE_BPS) / BPS);
  });

  it("preço extremo 1e-6 ETH/STANDARD: cotação > 0 e venda executa", async function () {
    await pool.setPrice(sqrtForPrice(0.000001));
    const amount = ethers.parseEther("10000"); // → ~0.01 ETH
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    expect(gross).to.be.gt(0);

    const net = gross - (gross * FEE_BPS) / BPS;
    expect(net).to.be.gt(0);
    const tx = await router
      .connect(user1)
      .executeProtectedSellAndBurn(amount, net > 1000n ? net - 1000n : 1n);
    await tx.wait();
    const stats = await router.getStats();
    expect(stats.sellVolume).to.equal(amount);
  });

  it("admin: divisões >100%, fee >5% e delay >100 revertem", async function () {
    await expect(
      router.setFeeShares(9000, 2000)
    ).to.be.revertedWith("Shares exceed 100%");
    await expect(router.setFee(501)).to.be.revertedWith(
      "Fee too high (max 5%)"
    );
    await expect(router.setMinBlockDelay(101)).to.be.revertedWith(
      "Delay too high"
    );
    await expect(router.setFeeShares(5000, 2000)).to.emit(
      router,
      "FeeSharesUpdated"
    );
  });

  it("withdrawFees: parcial, só o disponível, e revertes corretos", async function () {
    // Sem saldo: reverte
    await expect(router.withdrawFees(1)).to.be.revertedWith(
      "Insufficient balance"
    );

    // Gera receita residual (orçamento de burn sem backrun)
    const amount = ethers.parseEther("10");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const burnBudget = ((gross * FEE_BPS) / BPS) * BURN_BUDGET / BPS;
    const minOut = ((gross - (gross * FEE_BPS) / BPS) * 90n) / 100n;
    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);

    const routerBal = await ethOf(await router.getAddress());
    expect(routerBal).to.equal(burnBudget);

    await expect(router.withdrawFees(burnBudget + 1n)).to.be.revertedWith(
      "Insufficient balance"
    );
    await expect(router.withdrawFees(0)).to.be.revertedWith("No fees");

    const collectorBefore = await ethOf(owner.address);
    const { rc } = await balanceChange(
      router.withdrawFees(burnBudget),
      owner.address
    );
    const collectorAfter = await ethOf(owner.address);
    expect(collectorAfter + rc.gasUsed * rc.gasPrice).to.equal(
      collectorBefore + burnBudget
    );
    expect(await ethOf(await router.getAddress())).to.equal(0);
  });

  it("constructor: endereços zero revertem", async function () {
    const Router = await ethers.getContractFactory("OptimizerRouter");
    await expect(
      Router.deploy(
        ethers.ZeroAddress,
        await pool.getAddress(),
        await token.getAddress(),
        await mockWETH.getAddress(),
        await vault.getAddress()
      )
    ).to.be.revertedWith("Invalid core");
  });
});
