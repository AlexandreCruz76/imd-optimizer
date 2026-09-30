const { expect } = require("chai");
const { ethers, network } = require("hardhat");

/**
 * Suíte DEC-017 do OptimizerHookV2:
 * - Identity Fees congeladas (Alpha): só a taxa base de 0,05% do Router
 * - Interceptação (afterSwap, impacto ≥50 bps OU bot do oracle):
 *   ETH → cofre INTEGRAL (split 60/20/15/5 exclusivo do cofre)
 *   $IMD → auto-burn (burn() ou fallback 0x…dEaD) + contador público
 *   totalIMDBurnedByOptimizer (exibido no front)
 * - Sem dupla taxação: o hook não cobra fee alguma
 */

const BURN_DEAD =
  "0x000000000000000000000000000000000000dEaD";

function signUpdate(owner, newBots) {
  // espelha keccak256(abi.encodePacked(newBots)) + toEthSignedMessageHash
  // (encodePacked de address[] alinha cada elemento a 32 bytes, sem comprimento)
  const padded = ethers.concat(
    newBots.map((a) => ethers.zeroPadValue(a, 32))
  );
  const msgHash = ethers.keccak256(padded);
  return owner.signMessage(ethers.getBytes(msgHash));
}

describe("OptimizerHookV2 — DEC-017 (interceptação, burn, contador)", function () {
  let hook, vault, oracle, genesisKey, identityMD, token, burnable;
  let owner, user, stranger, stakers, treasury, devs, burnRecipient;

  const ONE = ethers.parseEther("1");
  const SQRT = 2n ** 96n;

  async function ethOf(addr) {
    return await ethers.provider.getBalance(addr);
  }

  async function fundHookEth(value) {
    await owner.sendTransaction({
      to: await hook.getAddress(),
      value,
    });
  }

  beforeEach(async function () {
    [owner, user, stranger, stakers, treasury, devs, burnRecipient] =
      await ethers.getSigners();

    const IMEVOracle = await ethers.getContractFactory(
      "contracts/private/IMEVOracle.sol:IMEVOracle"
    );
    oracle = await IMEVOracle.deploy([owner.address]);

    const GenesisKey = await ethers.getContractFactory("OptimizerGenesisKey");
    genesisKey = await GenesisKey.deploy();
    identityMD = await GenesisKey.deploy();

    const Vault = await ethers.getContractFactory("OptimizerVaultV2");
    vault = await Vault.deploy(owner.address); // router placeholder

    const Hook = await ethers.getContractFactory("OptimizerHookV2");
    hook = await Hook.deploy(
      await vault.getAddress(),
      owner.address, // stakingVault (placeholder; não usado na interceptação)
      await genesisKey.getAddress(),
      await identityMD.getAddress(),
      await oracle.getAddress()
    );

    await vault.setHook(await hook.getAddress());
    await vault.setSplitRecipients(
      stakers.address,
      treasury.address,
      devs.address,
      burnRecipient.address
    );

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Standard IMD", "IMD");
    await hook.setTargetToken(await token.getAddress());

    // Hook carregado: ETH para forwardar + $IMD para queimar
    await fundHookEth(ethers.parseEther("2"));
    await token.mint(await hook.getAddress(), ethers.parseEther("1000"));
  });

  it("interceptação estática (impacto 1000 bps): ETH integral ao cofre, IMD → dEaD e contador exato", async function () {
    const before = await ethOf(await hook.getAddress());
    expect(before).to.equal(ethers.parseEther("2"));

    await expect(
      hook.afterSwap(
        user.address,
        true,
        ethers.parseEther("100"),
        ethers.parseEther("90"),
        SQRT,
        0,
        "0x"
      )
    )
      .to.emit(hook, "ArbitrageExecuted")
      .and.to.emit(hook, "IMDBurned")
      .and.to.emit(hook, "ETHForwardedToVault");

    // ETH integral ao cofre (não escalado por impacto — DEC-017)
    expect(await ethOf(await hook.getAddress())).to.equal(0);
    expect(await ethOf(await vault.getAddress())).to.equal(
      ethers.parseEther("2")
    );
    // Split 60/20/15/5 creditado no cofre
    expect(await vault.stakersAccrued()).to.equal(
      ethers.parseEther("1.2")
    );
    expect(await vault.treasuryAccrued()).to.equal(
      ethers.parseEther("0.4")
    );
    expect(await vault.devsAccrued()).to.equal(
      ethers.parseEther("0.3")
    );
    expect(await vault.burnAccrued()).to.equal(
      ethers.parseEther("0.1")
    );
    expect(await vault.totalProtocolFees()).to.equal(
      ethers.parseEther("2")
    );

    // $IMD: fallback para 0x…dEaD (MockERC20 não expõe burn(uint256))
    expect(await token.balanceOf(BURN_DEAD)).to.equal(
      ethers.parseEther("1000")
    );
    expect(await token.balanceOf(await hook.getAddress())).to.equal(0);

    // Contador público exato (DEC-017)
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1000")
    );
    expect(await hook.totalMEVCaptured()).to.equal(1000);
    expect(await hook.totalArbitragesExecuted()).to.equal(1);
  });

  it("contador acumula entre interceptações (segundo evento soma ao total)", async function () {
    await hook.afterSwap(
      user.address,
      true,
      ethers.parseEther("100"),
      ethers.parseEther("90"),
      SQRT,
      0,
      "0x"
    );
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1000")
    );

    // Recarrega o hook e intercepta de novo
    await fundHookEth(ethers.parseEther("0.5"));
    await token.mint(await hook.getAddress(), ethers.parseEther("500"));

    await hook.afterSwap(
      stranger.address,
      false,
      ethers.parseEther("200"),
      ethers.parseEther("180"),
      SQRT,
      0,
      "0x"
    );

    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1500")
    );
    expect(await token.balanceOf(BURN_DEAD)).to.equal(
      ethers.parseEther("1500")
    );
    expect(await ethOf(await vault.getAddress())).to.equal(
      ethers.parseEther("2.5")
    );
  });

  it("caminho burn(uint256) real: viaBurnFunction=true e supply reduz", async function () {
    const Burnable = await ethers.getContractFactory("MockBurnableToken");
    burnable = await Burnable.deploy(ethers.parseEther("10000"));
    await hook.setTargetToken(await burnable.getAddress());
    await burnable.mint(await hook.getAddress(), ethers.parseEther("500"));

    const supplyBefore = await burnable.totalSupply();
    const deadBefore = await burnable.balanceOf(BURN_DEAD);

    await expect(
      hook.afterSwap(
        user.address,
        true,
        ethers.parseEther("100"),
        ethers.parseEther("90"),
        SQRT,
        0,
        "0x"
      )
    )
      .to.emit(hook, "IMDBurned")
      .withArgs(ethers.parseEther("500"), true, await anyValue());

    expect(await burnable.totalSupply()).to.equal(
      supplyBefore - ethers.parseEther("500")
    );
    expect(await burnable.balanceOf(BURN_DEAD)).to.equal(deadBefore);
    expect(await burnable.balanceOf(await hook.getAddress())).to.equal(0);
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("500")
    );
  });

  it("sem interceptação (impacto 1 bps < 50): nada muda — hook mantém saldo", async function () {
    const hookEthBefore = await ethOf(await hook.getAddress());
    const counterBefore = await hook.totalIMDBurnedByOptimizer();

    const tx = await hook.afterSwap(
      user.address,
      true,
      ethers.parseEther("100"),
      ethers.parseEther("99.99"),
      SQRT,
      0,
      "0x"
    );
    const rc = await tx.wait();

    expect(await ethOf(await hook.getAddress())).to.equal(hookEthBefore);
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(counterBefore);
    expect(await token.balanceOf(await hook.getAddress())).to.equal(
      ethers.parseEther("1000")
    );
    expect(await ethOf(await vault.getAddress())).to.equal(0);
    expect(await vault.totalProtocolFees()).to.equal(0);

    const arbEvents = await hook.queryFilter(
      hook.filters.ArbitrageExecuted(),
      rc.blockNumber,
      rc.blockNumber
    );
    expect(arbEvents.length).to.equal(0);
    // Oracle consultado (deteção estática como fallback)
    expect(await hook.oracleQueries()).to.be.gt(0);
  });

  it("oracle confirma bot (confiança 100 ≥ 70): intercepta mesmo com impacto baixo", async function () {
    const bots = [user.address];
    const sig = await signUpdate(owner, bots);
    await oracle.connect(owner).updateMEVBots(bots, sig);
    expect((await oracle.isMEVBot(user.address)).isBot).to.equal(true);

    await fundHookEth(ethers.parseEther("1"));
    await token.mint(await hook.getAddress(), ethers.parseEther("100"));

    await expect(
      hook.afterSwap(
        user.address,
        true,
        ethers.parseEther("100"),
        ethers.parseEther("99.99"),
        SQRT,
        0,
        "0x"
      )
    )
      .to.emit(hook, "MEVCaptured")
      .withArgs(user.address, 1, true);

    expect(await ethOf(await vault.getAddress())).to.equal(
      ethers.parseEther("3") // 2 do beforeEach + 1 do teste
    );
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1100") // 1000 do beforeEach + 100 do teste
    );
  });

  it("Identity Fees congeladas na Alpha (DEC-017): tiers 0 e nenhuma taxa no hook", async function () {
    expect(await hook.FEE_GENESIS()).to.equal(0);
    expect(await hook.FEE_IDENTITY_MD()).to.equal(0);
    expect(await hook.FEE_RETAIL()).to.equal(0);
    expect(await hook.FEE_B2B()).to.equal(0);

    const [amount0, amount1, sqrtAfter] = await hook.beforeSwap.staticCall(
      user.address,
      true,
      ethers.parseEther("10"),
      0,
      SQRT,
      "0x"
    );
    expect(amount0).to.equal(ethers.parseEther("10"));
    expect(amount1).to.equal(0);
    expect(sqrtAfter).to.equal(SQRT);

    // Antes/depois da troca: hook não acumula taxa nenhuma
    // (a única taxa é a de 0,05% do Router — sem dupla taxação)
    expect(await hook.getTotalFeesCollected()).to.equal(0);
    expect(await hook.totalFeesCollected()).to.equal(0);
  });

  it("beforeSwap não cobra fee mesmo para tiers identitários (retail/b2b)", async function () {
    await hook.setB2BPartner(stranger.address, true);
    expect(await hook.collectFees.staticCall()).to.equal(0);
    // partnerFees nunca crescem sem cumulatividade de identity fee
    await hook.beforeSwap(
      stranger.address,
      true,
      ethers.parseEther("1000"),
      0,
      SQRT,
      "0x"
    );
    expect(await hook.partnerFees(stranger.address)).to.equal(0);
    expect(await hook.getUserFees(stranger.address)).to.equal(0);
    expect(await hook.totalFeesCollected()).to.equal(0);
  });

  it("withdrawMEV: só owner reenvia saldo retido ao cofre", async function () {
    // Sem interceptação: saldo fica retido
    await hook.afterSwap(
      user.address,
      true,
      ethers.parseEther("100"),
      ethers.parseEther("99.99"),
      SQRT,
      0,
      "0x"
    );
    expect(await ethOf(await hook.getAddress())).to.equal(
      ethers.parseEther("2")
    );

    await expect(hook.connect(stranger).withdrawMEV()).to.be.revertedWithCustomError(
      hook,
      "OwnableUnauthorizedAccount"
    );

    await expect(hook.withdrawMEV())
      .to.emit(hook, "ETHForwardedToVault")
      .withArgs(ethers.parseEther("2"), await anyValue());

    expect(await ethOf(await hook.getAddress())).to.equal(0);
    expect(await ethOf(await vault.getAddress())).to.equal(
      ethers.parseEther("2")
    );
    expect(await vault.totalProtocolFees()).to.equal(
      ethers.parseEther("2")
    );
  });

  it("sem targetToken definido: interceptação só encaminha ETH (contador fica 0)", async function () {
    // Remove o token de interceptação (endereço zero = não configurado)
    // setTargetToken(zero) é permitido; burn pulado
    await hook.setTargetToken(ethers.ZeroAddress);

    await expect(
      hook.afterSwap(
        user.address,
        true,
        ethers.parseEther("100"),
        ethers.parseEther("90"),
        SQRT,
        0,
        "0x"
      )
    ).to.emit(hook, "ETHForwardedToVault");

    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(0);
    expect(await ethOf(await vault.getAddress())).to.equal(
      ethers.parseEther("2")
    );
  });

  it("recordBuyAndBurn: apenas o cofre reporta (guarda do contador público)", async function () {
    const vaultAddr = await vault.getAddress();

    await expect(
      hook.connect(stranger).recordBuyAndBurn(ethers.parseEther("1"))
    ).to.be.revertedWith("Not vault");
    await expect(
      hook.connect(user).recordBuyAndBurn(ethers.parseEther("1"))
    ).to.be.revertedWith("Not vault");

    // Simula o cofre (endereço do contrato) para os caminhos autorizados
    await owner.sendTransaction({
      to: vaultAddr,
      value: ethers.parseEther("1"),
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [vaultAddr],
    });
    const vaultSigner = await ethers.getSigner(vaultAddr);

    await expect(
      hook.connect(vaultSigner).recordBuyAndBurn(0)
    ).to.be.revertedWith("Zero amount");

    await expect(
      hook.connect(vaultSigner).recordBuyAndBurn(ethers.parseEther("7"))
    )
      .to.emit(hook, "BuyAndBurnCounted")
      .withArgs(ethers.parseEther("7"), await anyValue());
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("7")
    );

    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [vaultAddr],
    });
  });

  it("contador agrega auto-burn da interceptação + Buy-and-Burn do cofre (valor exato)", async function () {
    // 1) Interceptação: 1000 $IMD auto-queimados
    await hook.afterSwap(
      user.address,
      true,
      ethers.parseEther("100"),
      ethers.parseEther("90"),
      SQRT,
      0,
      "0x"
    );
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1000")
    );

    // 2) Buy-and-Burn do cofre: fatia de 5% de 2 ETH = 0,1 ETH → $IMD
    const Pool = await ethers.getContractFactory("MockUniswapV4Pool");
    const pool = await Pool.deploy(await token.getAddress());
    await token.mint(await pool.getAddress(), ethers.parseEther("100"));
    await vault.setBuyAndBurn(
      await token.getAddress(),
      await pool.getAddress()
    );

    const burnEthBefore = await ethOf(burnRecipient.address);
    await expect(vault.distributeSplit())
      .to.emit(vault, "BuyAndBurn")
      .and.to.emit(hook, "BuyAndBurnCounted")
      .withArgs(ethers.parseEther("0.1"), await anyValue());

    // Fatia de 5%: executor recebe $IMD exato, NUNCA ETH
    expect(await token.balanceOf(burnRecipient.address)).to.equal(
      ethers.parseEther("0.1")
    );
    expect(
      (await ethOf(burnRecipient.address)) - burnEthBefore
    ).to.equal(0);
    expect(await vault.burnAccrued()).to.equal(0);
    // Split completo distribuído; cofre sem saldo
    expect(await ethOf(await vault.getAddress())).to.equal(0);
    expect(await vault.stakersAccrued()).to.equal(0);

    // Contador público agrega as duas origens com valor exato
    expect(await hook.totalIMDBurnedByOptimizer()).to.equal(
      ethers.parseEther("1000.1")
    );
    expect(await token.balanceOf(BURN_DEAD)).to.equal(
      ethers.parseEther("1000")
    );
  });
});

// matcher local: aceita qualquer valor no assert de evento
function anyValue() {
  return (val) => val !== undefined && val !== null;
}
