const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Suíte DEC-017 do OptimizerRouter:
 * - roteador puro (sem split no router, sem backrun/interceptação)
 * - taxa ÚNICA 0,05% (5 bps) sobre o volume final → cofre executa 60/20/15/5
 * - rota multi-hop sem taxação em cascata
 * - cotação fixed-point igual à execução da venue
 * - pull dos $STANDARD via transferFrom (custódia atômica)
 * - proteções: slippage pré/pós, cooldown, limites de preço
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

describe("OptimizerRouter — DEC-017 (rota, taxa única 0,05%, cofre)", function () {
  let router, vault, token, mockWETH, pool;
  let owner, user1, feeCollector;

  const PRICE = 0.001; // 1 STANDARD = 0.001 ETH
  const FEE_BPS = 5n; // 0,05% — DEC-017

  // Split oficial do cofre (DEC-017)
  const STAKERS_BPS = 6000n;
  const TREASURY_BPS = 2000n;
  const DEVS_BPS = 1500n;
  // burn = remainder (5%)

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

  async function deployStack() {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Standard Token", "STANDARD");
    mockWETH = await MockERC20.deploy("Wrapped ETH", "WETH");

    const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
    pool = await Pool.deploy(await token.getAddress());

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address);

    const Router = await ethers.getContractFactory("OptimizerRouter");
    router = await Router.deploy(
      await pool.getAddress(),
      await token.getAddress(),
      await mockWETH.getAddress(),
      await vault.getAddress()
    );
    await vault.setRouter(await router.getAddress());

    // Venue liquidez para pagar vendas
    await owner.sendTransaction({
      to: await pool.getAddress(),
      value: ethers.parseEther("100"),
    });
    await token.mint(await pool.getAddress(), ethers.parseEther("1000000"));

    // Usuário: $STANDARD + allowance
    await token.mint(user1.address, ethers.parseEther("10000"));
    await token.connect(user1).approve(await router.getAddress(), ethers.MaxUint256);

    await pool.setPrice(sqrtForPrice(PRICE));
  }

  beforeEach(async function () {
    [owner, user1, feeCollector] = await ethers.getSigners();
    await deployStack();
  });

  // Configura o Buy-and-Burn (ajuste da fatia de 5%): hook = contador público,
  // venue = pool mock (ETH → $IMD), token = $IMD de mercado.
  async function configureBuyAndBurn() {
    const Hook = await ethers.getContractFactory("OptimizerHookV2");
    const hook = await Hook.deploy(
      await vault.getAddress(),
      owner.address,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    await vault.setHook(await hook.getAddress());
    await vault.setBuyAndBurn(
      await token.getAddress(),
      await pool.getAddress()
    );
    return hook;
  }

  // ==================== VENDA SIMPLES: TAXA ÚNICA → COFRE ====================

  it("venda 100 STANDARD: líquido exato e taxa 0,05% integralmente ao cofre (split 60/20/15/5)", async function () {
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const expectedGross = quoteEth(amount, sqrt);
    const feeTotal = (expectedGross * FEE_BPS) / BPS;
    const expectedNet = expectedGross - feeTotal;
    const minOut = (expectedNet * 95n) / 100n;

    const userEthBefore = await ethOf(user1.address);
    const vaultBefore = await ethOf(await vault.getAddress());
    const routerBefore = await ethOf(await router.getAddress());
    const poolBefore = await ethOf(await pool.getAddress());

    const { rc } = await balanceChange(
      router.connect(user1).executeProtectedSellAndBurn(amount, minOut),
      user1.address
    );
    const userAfter = await ethOf(user1.address);
    const userNet = userAfter - userEthBefore + rc.gasUsed * rc.gasPrice;

    // Usuário recebe o líquido exato (1:1 com a cotação menos 0,05%)
    expect(userNet).to.equal(expectedNet);

    // Cofre recebe a taxa INTEGRAL (o cofre é quem divide)
    expect(await ethOf(await vault.getAddress())).to.equal(
      vaultBefore + feeTotal
    );
    // Router não retém nada (roteador puro — DEC-017)
    expect(await ethOf(await router.getAddress())).to.equal(routerBefore);
    // Venue pagou o gross integral
    expect(poolBefore - (await ethOf(await pool.getAddress()))).to.equal(
      expectedGross
    );

    // Split exato nos balgos do cofre (60/20/15 + resto 5%)
    expect(await vault.stakersAccrued()).to.equal(
      (feeTotal * STAKERS_BPS) / BPS
    );
    expect(await vault.treasuryAccrued()).to.equal(
      (feeTotal * TREASURY_BPS) / BPS
    );
    expect(await vault.devsAccrued()).to.equal((feeTotal * DEVS_BPS) / BPS);
    expect(await vault.burnAccrued()).to.equal(
      feeTotal -
        (feeTotal * STAKERS_BPS) / BPS -
        (feeTotal * TREASURY_BPS) / BPS -
        (feeTotal * DEVS_BPS) / BPS
    );
    expect(await vault.totalProtocolFees()).to.equal(feeTotal);

    // Custódia: $STANDARD movidos usuário → venue
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.parseEther("10000") - amount
    );
    expect(await token.balanceOf(await pool.getAddress())).to.equal(
      ethers.parseEther("1000000") + amount
    );

    // Stats (ABI de 5 campos preservado)
    const stats = await router.getStats();
    expect(stats.sellVolume).to.equal(amount);
    expect(stats.feesCollected).to.equal(feeTotal);
    expect(stats.yieldDistributed).to.equal(feeTotal);
    expect(stats.burnsExecuted).to.equal(0);

    // Evento de taxa
    const ev = (
      await router.queryFilter(router.filters.SwapFeeCollected(), rc.blockNumber)
    )[0];
    expect(ev.args.grossEth).to.equal(expectedGross);
    expect(ev.args.feeTotal).to.equal(feeTotal);
  });

  it("distributeSplit: 60/20/15 em ETH e fatia de 5% via Buy-and-Burn (nunca ETH ao burn)", async function () {
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const feeTotal = (gross * FEE_BPS) / BPS;
    const minOut = ((gross - feeTotal) * 90n) / 100n;
    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);

    const [_, __, ___, stakers, treasury, devs, burn] =
      await ethers.getSigners();
    const hook = await configureBuyAndBurn();
    await vault.setSplitRecipients(
      stakers.address,
      treasury.address,
      devs.address,
      burn.address
    );

    const sExp = (feeTotal * STAKERS_BPS) / BPS;
    const tExp = (feeTotal * TREASURY_BPS) / BPS;
    const dExp = (feeTotal * DEVS_BPS) / BPS;
    const bExp = feeTotal - sExp - tExp - dExp;

    const before = await Promise.all(
      [stakers, treasury, devs, burn].map((s) => ethOf(s.address))
    );
    const poolBefore = await ethOf(await pool.getAddress());
    const burnTokenBefore = await token.balanceOf(burn.address);

    await expect(vault.distributeSplit()).to.emit(vault, "SplitDistributed");

    const after_ = await Promise.all(
      [stakers, treasury, devs, burn].map((s) => ethOf(s.address))
    );
    expect(after_[0] - before[0]).to.equal(sExp);
    expect(after_[1] - before[1]).to.equal(tExp);
    expect(after_[2] - before[2]).to.equal(dExp);
    // Fatia de 5%: NUNCA ETH nativo ao BurnExecutor (ajuste)
    expect(after_[3] - before[3]).to.equal(0);
    // O ETH da fatia foi à venue e voltou como $IMD (mock 1:1) → executor
    expect((await ethOf(await pool.getAddress())) - poolBefore).to.equal(bExp);
    expect((await token.balanceOf(burn.address)) - burnTokenBefore).to.equal(
      bExp
    );
    // Contador público soma o valor exato da compra
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(bExp);
    expect(await ethOf(await vault.getAddress())).to.equal(0);
    expect(await vault.stakersAccrued()).to.equal(0);

    // Segunda chamada: nada acumulado → reverte
    await expect(vault.distributeSplit()).to.be.revertedWith(
      "Nothing accrued"
    );
  });

  it("buyAndBurn: guarda de config, qualquer conta dispara e contador soma o valor exato", async function () {
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const gross = quoteEth(amount, sqrt);
    const feeTotal = (gross * FEE_BPS) / BPS;
    const minOut = ((gross - feeTotal) * 90n) / 100n;
    await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);

    const [_, __, ___, stakers, treasury, devs, burn] =
      await ethers.getSigners();
    await vault.setSplitRecipients(
      stakers.address,
      treasury.address,
      devs.address,
      burn.address
    );

    const sExp = (feeTotal * STAKERS_BPS) / BPS;
    const tExp = (feeTotal * TREASURY_BPS) / BPS;
    const dExp = (feeTotal * DEVS_BPS) / BPS;
    const bExp = feeTotal - sExp - tExp - dExp;

    // Sem config: nenhuma queima escapa sem ir ao contador público
    await expect(vault.distributeSplit()).to.be.revertedWith(
      "Buy-and-burn not configured"
    );
    await expect(vault.connect(user1).buyAndBurn()).to.be.revertedWith(
      "Buy-and-burn not configured"
    );
    await expect(
      vault.setBuyAndBurn(ethers.ZeroAddress, await pool.getAddress())
    ).to.be.revertedWith("Invalid config");

    const hook = await configureBuyAndBurn();
    const burnEthBefore = await ethOf(burn.address);
    const vaultBefore = await ethOf(await vault.getAddress());

    // Qualquer conta dispara (destinatário fixo em config)
    await expect(vault.connect(user1).buyAndBurn())
      .to.emit(vault, "BuyAndBurn")
      .and.to.emit(hook, "BuyAndBurnCounted")
      .withArgs(bExp, await anyValue());

    // Só a fatia de 5% foi mexida — os outros balgos ficam intactos
    expect(await vault.burnAccrued()).to.equal(0);
    expect(await vault.stakersAccrued()).to.equal(sExp);
    expect(await vault.treasuryAccrued()).to.equal(tExp);
    expect(await vault.devsAccrued()).to.equal(dExp);
    // Executor recebe $IMD exato, NUNCA ETH
    expect(await token.balanceOf(burn.address)).to.equal(bExp);
    expect((await ethOf(burn.address)) - burnEthBefore).to.equal(0);
    // Contador público soma o valor exato
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(bExp);
    // Cofre reteve os 95%; a fatia de 5% saiu em ETH para a venue
    expect((await ethOf(await vault.getAddress())) - vaultBefore).to.equal(
      -bExp
    );
    // Nada acumulado → no-op (não reverte)
    await expect(vault.buyAndBurn()).to.not.be.reverted;
  });

  // ==================== ROTA MULTI-HOP (DEC-017) ====================

  it("multi-hop IMD→ETH→USDC: taxa ÚNICA sobre o volume final, sem cascata e sem tocar o cofre (ERC-20 final)", async function () {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC");

    const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
    const venue2 = await Pool.deploy(await usdc.getAddress());
    await usdc.mint(await venue2.getAddress(), ethers.parseEther("1000"));

    const amountIn = ethers.parseEther("1");
    const venues = [await pool.getAddress(), await venue2.getAddress()];
    const tokens = [await token.getAddress(), ethers.ZeroAddress, await usdc.getAddress()];

    const userUsdcBefore = await usdc.balanceOf(user1.address);
    const vaultBefore = await ethOf(await vault.getAddress());

    const { rc } = await balanceChange(
      router
        .connect(user1)
        .executeMultiHop(venues, tokens, amountIn, 1n),
      user1.address
    );
    const userGas = rc.gasUsed * rc.gasPrice;

    // Mock 1:1: volume final = amountIn; taxa = amountIn * 5/10000 (UMA vez)
    const finalVol = amountIn;
    const feeTotal = (finalVol * FEE_BPS) / BPS;
    const userOut = finalVol - feeTotal;

    // Usuário recebeu o líquido em USDC (sem ETH envolvido no payout)
    expect(await usdc.balanceOf(user1.address)).to.equal(
      userUsdcBefore + userOut
    );
    expect(userGas).to.be.gt(0n); // só gas de tx, sem ETH de payout

    // Taxa creditada em USDC no router (cofre só aceita ETH)
    expect(await router.erc20FeesAccrued(await usdc.getAddress())).to.equal(
      feeTotal
    );
    // Cofre intocado: split só acontece quando o ativo final é ETH
    expect(await ethOf(await vault.getAddress())).to.equal(vaultBefore);
    expect(await vault.totalProtocolFees()).to.equal(0);

    // Sem dupla taxação: 1:1 ⇒ se houvesse cascata seria > feeTotal
    expect(feeTotal).to.equal((amountIn * FEE_BPS) / BPS);

    const stats = await router.getStats();
    expect(stats.feesCollected).to.equal(feeTotal);

    const ev = (
      await router.queryFilter(router.filters.MultiHopExecuted(), rc.blockNumber)
    )[0];
    expect(ev.args.amountIn).to.equal(amountIn);
    expect(ev.args.finalOut).to.equal(finalVol);
    expect(ev.args.feeTotal).to.equal(feeTotal);
    expect(ev.args.userOut).to.equal(userOut);
  });

  it("multi-hop ETH final: taxa segue para o cofre (único destino de fee em ETH)", async function () {
    const amountIn = ethers.parseEther("1");
    const venues = [await pool.getAddress()];
    const tokens = [await token.getAddress(), ethers.ZeroAddress];

    const userEthBefore = await ethOf(user1.address);
    const vaultBefore = await ethOf(await vault.getAddress());
    const { rc } = await balanceChange(
      router.connect(user1).executeMultiHop(venues, tokens, amountIn, 1n),
      user1.address
    );
    const userNet = (await ethOf(user1.address)) - userEthBefore + rc.gasUsed * rc.gasPrice;

    const feeTotal = (amountIn * FEE_BPS) / BPS;
    // Usuário recebe ETH líquido (1:1 menos a taxa única)
    expect(userNet).to.equal(amountIn - feeTotal);
    // Cofre recebe a taxa
    expect(await ethOf(await vault.getAddress())).to.equal(
      vaultBefore + feeTotal
    );
    expect(await token.balanceOf(user1.address)).to.equal(
      ethers.parseEther("10000") - amountIn
    );
    const ev = (
      await router.queryFilter(router.filters.MultiHopExecuted(), rc.blockNumber)
    )[0];
    expect(ev.args.feeTotal).to.equal(feeTotal);
  });

  it("multi-hop: rota inválida (tamanhos, entrada ETH, vazio, zero out) reverte", async function () {
    const usdc = await (
      await ethers.getContractFactory("MockERC20")
    ).deploy("USD Coin", "USDC");
    const venues = [await pool.getAddress()];
    const tokens = [await token.getAddress(), ethers.ZeroAddress];

    await expect(
      router
        .connect(user1)
        .executeMultiHop([], [await token.getAddress(), ethers.ZeroAddress], 1n, 1n)
    ).to.be.revertedWith("Empty route");
    await expect(
      router
        .connect(user1)
        .executeMultiHop(
          [await pool.getAddress(), await pool.getAddress()],
          [await token.getAddress(), ethers.ZeroAddress],
          1n,
          1n
        )
    ).to.be.revertedWith("Route mismatch");
    await expect(
      router
        .connect(user1)
        .executeMultiHop(
          venues,
          [ethers.ZeroAddress, await usdc.getAddress()],
          1n,
          1n
        )
    ).to.be.revertedWith("Route must start with a token");
    await expect(
      router.connect(user1).executeMultiHop(venues, tokens, 0, 1n)
    ).to.be.revertedWith("Invalid amount");
    await expect(
      router.connect(user1).executeMultiHop(venues, tokens, 1n, 0)
    ).to.be.revertedWith("Min amount must be > 0");

    // minOut acima do líquido (cascata/receita) → pós-checagem
    await expect(
      router
        .connect(user1)
        .executeMultiHop(
          [await pool.getAddress()],
          [await token.getAddress(), ethers.ZeroAddress],
          ethers.parseEther("1"),
          ethers.parseEther("1") // 1:1 bruto; líquido = 1 - 0,05%
        )
    ).to.be.revertedWith("Slippage exceeded");

    // Sem allowance: transferFrom reverte
    const other = (await ethers.getSigners())[3];
    await token.mint(other.address, ethers.parseEther("10"));
    await expect(
      router
        .connect(other)
        .executeMultiHop(
          [await pool.getAddress()],
          [await token.getAddress(), ethers.ZeroAddress],
          ethers.parseEther("1"),
          1n
        )
    ).to.be.reverted;
  });

  it("multi-hop: cooldown por carteira também vale", async function () {
    const venues = [await pool.getAddress()];
    const tokens = [await token.getAddress(), ethers.ZeroAddress];

    await router
      .connect(user1)
      .executeMultiHop(venues, tokens, ethers.parseEther("1"), 1n);
    await expect(
      router
        .connect(user1)
        .executeMultiHop(venues, tokens, ethers.parseEther("1"), 1n)
    ).to.be.revertedWith("Block delay not met");
    await router
      .connect(user1)
      .executeMultiHop(venues, tokens, ethers.parseEther("1"), 1n);
  });

  // ==================== PROTEÇÕES ====================

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

  it("execução pior (60 bps): sem backrun — apenas constata desvio (interceptação é do hook)", async function () {
    await pool.setExecSlippageBps(60);
    const amount = ethers.parseEther("100");
    const [sqrt] = await (await router.getPoolState()).slice(0, 1);
    const expectedGross = quoteEth(amount, sqrt);
    const minOut = ((expectedGross - (expectedGross * FEE_BPS) / BPS) * 90n) / 100n;

    const routerBefore = await ethOf(await router.getAddress());
    const tx = await router.connect(user1).executeProtectedSellAndBurn(amount, minOut);
    const rc = await tx.wait();

    // Router continua puro (sem retenção de orçamento/burn)
    expect(await ethOf(await router.getAddress())).to.equal(routerBefore);
    expect(rc.blockNumber).to.be.gt(0);
    expect(await router.totalMEVCaptured()).to.equal(0);
  });

  // ==================== ADMIN ====================

  it("admin: fee >5% e delay >100 revertem; fee até 5% é aceita", async function () {
    await expect(router.setFee(501)).to.be.revertedWith(
      "Fee too high (max 5%)"
    );
    await expect(router.setMinBlockDelay(101)).to.be.revertedWith(
      "Delay too high"
    );
    await expect(router.setFee(500)).to.emit(router, "FeeUpdated");
    expect(await router.feeBps()).to.equal(500n);
    await router.setFee(5);
    expect(await router.feeBps()).to.equal(5n);
  });

  it("withdrawFees: só residual de ETH, parcial, e revertes corretos", async function () {
    // Router normalmente fica sem saldo (taxa vai integral ao cofre)
    await expect(router.withdrawFees(1)).to.be.revertedWith(
      "Insufficient balance"
    );
    await expect(router.withdrawFees(0)).to.be.revertedWith("No fees");

    // Doação direta gera residual
    await owner.sendTransaction({
      to: await router.getAddress(),
      value: ethers.parseEther("1"),
    });
    await expect(
      router.withdrawFees(ethers.parseEther("1") + 1n)
    ).to.be.revertedWith("Insufficient balance");

    const collectorBefore = await ethOf(feeCollector.address);
    await router.setFeeCollector(feeCollector.address);
    await router.withdrawFees(ethers.parseEther("1"));
    // feeCollector não pagou gas (owner enviou a tx) ⇒ delta exato
    expect((await ethOf(feeCollector.address)) - collectorBefore).to.equal(
      ethers.parseEther("1")
    );
    expect(await ethOf(await router.getAddress())).to.equal(0);
  });

  it("withdrawErc20Fees: só o dono retira fee ERC-20 e o saldo zera", async function () {
    const usdc = await (
      await ethers.getContractFactory("MockERC20")
    ).deploy("USD Coin", "USDC");
    await usdc.mint(await pool.getAddress(), ethers.parseEther("1000"));

    const amountIn = ethers.parseEther("1");
    await router
      .connect(user1)
      .executeMultiHop(
        [await pool.getAddress()],
        [await token.getAddress(), await usdc.getAddress()],
        amountIn,
        1n
      );

    const feeTotal = (amountIn * FEE_BPS) / BPS;
    expect(await router.erc20FeesAccrued(await usdc.getAddress())).to.equal(
      feeTotal
    );

    // Sem fee nenhuma: reverte
    const wethAddr = await mockWETH.getAddress();
    await expect(
      router.withdrawErc20Fees(wethAddr, owner.address)
    ).to.be.revertedWith("No fees");

    await expect(router.withdrawErc20Fees(await usdc.getAddress(), ethers.ZeroAddress))
      .to.be.revertedWith("Invalid address");

    await router.withdrawErc20Fees(await usdc.getAddress(), feeCollector.address);
    expect(await usdc.balanceOf(feeCollector.address)).to.equal(feeTotal);
    expect(await router.erc20FeesAccrued(await usdc.getAddress())).to.equal(0);

    await expect(
      router.withdrawErc20Fees(await usdc.getAddress(), feeCollector.address)
    ).to.be.revertedWith("No fees");
  });

  it("constructor: endereços zero revertem", async function () {
    const Router = await ethers.getContractFactory("OptimizerRouter");
    await expect(
      Router.deploy(
        ethers.ZeroAddress,
        await token.getAddress(),
        await mockWETH.getAddress(),
        await vault.getAddress()
      )
    ).to.be.revertedWith("Invalid pool");
    await expect(
      Router.deploy(
        await pool.getAddress(),
        ethers.ZeroAddress,
        await mockWETH.getAddress(),
        await vault.getAddress()
      )
    ).to.be.revertedWith("Invalid token");
    await expect(
      Router.deploy(
        await pool.getAddress(),
        await token.getAddress(),
        await mockWETH.getAddress(),
        ethers.ZeroAddress
      )
    ).to.be.revertedWith("Invalid vault");
  });
});

// matcher local: aceita qualquer valor no assert de evento
function anyValue() {
  return (val) => val !== undefined && val !== null;
}
