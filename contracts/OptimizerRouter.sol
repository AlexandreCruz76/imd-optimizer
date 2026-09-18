// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces.sol";

/**
 * @title OptimizerRouter
 * @notice Router que envelopa vendas de $STANDARD e internaliza MEV
 * @dev Executa sequência atômica: Venda → Captura MEV → Burn → Distribui Yield
 *
 * FLUXO ATÔMICO (indivisível):
 * 1. Validação e Proteção de Slippage
 * 2. Execução do Choque (Venda de $STANDARD por ETH)
 * 3. Captura do MEV (Arbitragem Interna)
 * 4. Acionamento da Contração (Burn via The Standard)
 * 5. Distribuição do Lucro (Yield para LPs do Vault)
 *
 * ⚠️ IMPORTANTE: Transações devem ser enviadas via RPCs Privados
 * (Flashbots, MEV-Share) para evitar sandwich attacks no mempool.
 */
contract OptimizerRouter is Ownable, ReentrancyGuard {

    // ==================== CONSTANTS ====================

    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // 10% max slippage
    uint256 public constant MIN_LIQUIDITY = 1 ether;  // Liquidez mínima para operar

    // ==================== STATE ====================

    IStandardCore public immutable standardCore;
    IUniswapV4Pool public immutable standardPool;
    IERC20Burnable public immutable standardToken;
    IWETH public immutable weth;

    address public immutable vault;
    address public feeCollector;

    // Proteção contra manipulação
    uint256 public lastBlockNumber;
    uint256 public minBlockDelay = 1; // Blocos mínimos entre operações do mesmo usuário
    mapping(address => uint256) public lastOperationBlock;

    // Tracking
    uint256 public totalSellVolume;
    uint256 public totalMEVCaptured;
    uint256 public totalBurnsExecuted;
    uint256 public totalYieldDistributed;

    // Fee structure
    uint256 public feeBps = 50; // 0.5% taxa do protocolo

    // ==================== EVENTS ====================

    event ProtectedSellExecuted(
        address indexed user,
        uint256 standardAmount,
        uint256 ethReceived,
        uint256 mevCaptured,
        uint256 burnAmount,
        uint256 yieldDistributed,
        uint256 timestamp
    );

    event MEVCaptured(
        uint256 amount,
        uint256 timestamp
    );

    event TokensBurned(
        uint256 amount,
        uint256 timestamp
    );

    event YieldDistributed(
        uint256 amount,
        uint256 timestamp
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);

    // ==================== ERRORS ====================

    error SlippageExceeded();
    error InsufficientLiquidity();
    error BlockDelayNotMet();
    error TransferFailed();
    error InvalidAmount();
    error Unauthorized();

    // ==================== CONSTRUCTOR ====================

    /**
     * @notice Deploy do OptimizerRouter
     * @param _standardCore Endereço do contrato core do The Standard
     * @param _standardPool Endereço da pool ETH/$STANDARD no Uniswap V4
     * @param _standardToken Endereço do token $STANDARD
     * @param _weth Endereço do WETH
     * @param _vault Endereço do OptimizerVault para distribuição de yield
     */
    constructor(
        address _standardCore,
        address _standardPool,
        address _standardToken,
        address _weth,
        address _vault
    ) Ownable(msg.sender) {
        standardCore = IStandardCore(_standardCore);
        standardPool = IUniswapV4Pool(_standardPool);
        standardToken = IERC20Burnable(_standardToken);
        weth = IWETH(_weth);
        vault = _vault;
        feeCollector = msg.sender;
    }

    // ==================== FUNÇÃO PRINCIPAL ====================

    /**
     * @notice Executa venda protegida de $STANDARD com captura atômica de MEV
     * @dev SEQUÊNCIA ATÔMICA (indivisível):
     *
     * Passo 1: Validação e Proteção de Slippage
     * - Recebe quantidade exata de $STANDARD e minAmountOut
     * - Require estrito para reverter se preço manipulado
     *
     * Passo 2: Execução do Choque (Venda)
     * - Swap de $STANDARD por ETH na pool V4
     * - Transferência do ETH para o usuário (garantindo minAmountOut)
     *
     * Passo 3: Captura do MEV (Arbitragem Interna)
     * - Calcula distorção gerada na pool
     * - Executa back-swap para comprar $STANDARD na baixa
     * - Extrai valor que seria de MEV bot terceirizado
     *
     * Passo 4: Acionamento da Contração (Burn)
     * - Pega tokens $STANDARD obtidos na arbitragem
     * - Chama IStandardCore.burn() para queimar
     * - Auxilia redução de oferta e retorno da paridade
     *
     * Passo 5: Distribuição do Lucro (Yield)
     * - Lucro restante vai para OptimizerVault
     * - Vault distribui como yield para LPs
     *
     * ⚠️ TRANSAÇÕES DEVEM SER ENVIADAS VIA RPCs PRIVADOS
     * (Flashbots ou MEV-Share) para invisibilidade no mempool.
     *
     * @param standardAmount Quantidade exata de $STANDARD a vender
     * @param minAmountOut Mínimo de ETH aceitável (proteção slippage)
     */
    function executeProtectedSellAndBurn(
        uint256 standardAmount,
        uint256 minAmountOut
    ) external nonReentrant {
        // ═══════════════════════════════════════════════════════════════
        // PASSO 1: VALIDAÇÃO E PROTEÇÃO DE SLIPPAGE
        // ═══════════════════════════════════════════════════════════════

        require(standardAmount > 0, "Invalid amount");
        require(minAmountOut > 0, "Min amount must be > 0");

        // Proteção contra sandwich attacks:
        // Verifica se houve operação recente do mesmo usuário
        // (previne manipulação em mempool público)
        require(
            block.number > lastOperationBlock[msg.sender] + minBlockDelay,
            "Block delay not met"
        );

        // Verifica liquidez mínima na pool
        (uint160 sqrtPriceX96, , , , , , ) = standardPool.slot0();
        require(sqrtPriceX96 > 0, "Insufficient liquidity");

        // Calcula preço esperado (simplificado)
        // Em produção, usar TWAP oracle para precificação mais precisa
        uint256 expectedEthOut = _estimateEthOutput(standardAmount, sqrtPriceX96);

        // Validação anti-manipulação:
        // Se preço desviou mais que MAX_SLIPPAGE_BPS, reverter
        if (expectedEthOut > 0) {
            uint256 slippageBps = ((expectedEthOut - minAmountOut) * 10000) / expectedEthOut;
            require(slippageBps <= MAX_SLIPPAGE_BPS, "Slippage exceeded");
        }

        // Atualiza tracking de proteção
        lastOperationBlock[msg.sender] = block.number;

        // ═══════════════════════════════════════════════════════════════
        // PASSO 2: EXECUÇÃO DO CHOQUE (VENDA)
        // ═══════════════════════════════════════════════════════════════

        // Aprova o router para gastar $STANDARD do usuário
        standardToken.approve(address(standardPool), standardAmount);

        // Executa swap: $STANDARD → ETH
        // amountSpecified negativo = venda
        (int256 amount0, int256 amount1) = standardPool.swap(
            true, // zeroForOne: $STANDARD (token0) → ETH (token1)
            -int256(standardAmount), // Negativo = venda
            sqrtPriceX96, // Limit (simplificado)
            "" // Data
        );

        // Calcula ETH recebido
        uint256 ethReceived = uint256(amount1);

        // Valida minAmountOut
        require(ethReceived >= minAmountOut, "Slippage exceeded");

        // Transfere ETH para o usuário
        (bool sent, ) = msg.sender.call{value: ethReceived}("");
        require(sent, "Transfer failed");

        // ═══════════════════════════════════════════════════════════════
        // PASSO 3: CAPTURA DO MEV (ARBITRAGEM INTERNA)
        // ═══════════════════════════════════════════════════════════════

        // Calcula distorção gerada na pool pelo swap
        uint256 priceImpact = _calculatePriceImpact(standardAmount, ethReceived);

        uint256 mevCaptured = 0;
        uint256 standardBoughtBack = 0;

        // Se impacto > 0.5%, há oportunidade de arbitragem
        if (priceImpact > 50) {
            // Calcula quanto $STANDARD pode comprar de volta
            // (comprando na baixa recém-criada)
            standardBoughtBack = _estimateStandardOutput(ethReceived / 2, sqrtPriceX96);

            if (standardBoughtBack > 0) {
                // Executa back-swap: ETH → $STANDARD
                // (comprando na baixa para capturar MEV)
                weth.approve(address(standardPool), ethReceived / 2);

                (int256 backAmount0, int256 backAmount1) = standardPool.swap(
                    false, // zeroForOne: ETH (token1) → $STANDARD (token0)
                    int256(ethReceived / 2), // Positivo = compra
                    sqrtPriceX96,
                    ""
                );

                mevCaptured = uint256(backAmount0); // $STANDARD comprado
                totalMEVCaptured += mevCaptured;

                emit MEVCaptured(mevCaptured, block.timestamp);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PASSO 4: ACIONAMENTO DA CONTRAÇÃO (BURN)
        // ═══════════════════════════════════════════════════════════════

        if (mevCaptured > 0) {
            // Chama a função nativa do The Standard para queimar tokens
            // Isso reduz a oferta e auxilia no retorno da paridade
            standardCore.burn(mevCaptured);

            totalBurnsExecuted++;

            emit TokensBurned(mevCaptured, block.timestamp);
        }

        // ═══════════════════════════════════════════════════════════════
        // PASSO 5: DISTRIBUIÇÃO DO LUCRO (YIELD)
        // ═══════════════════════════════════════════════════════════════

        // Calcula lucro restante (ETH)
        // Lucro = ETH da venda - ETH usado na arbitragem - taxas
        uint256 yieldAmount = 0;

        if (ethReceived > ethReceived / 2) {
            yieldAmount = (ethReceived - ethReceived / 2) - (ethReceived * feeBps / 10000);
        }

        if (yieldAmount > 0) {
            // Deposita lucro no Vault para distribuição aos LPs
            // O Vault distribui como yield proporcional
            (bool yieldSent, ) = vault.call{value: yieldAmount}("");
            require(yieldSent, "Yield transfer failed");

            totalYieldDistributed += yieldAmount;

            emit YieldDistributed(yieldAmount, block.timestamp);
        }

        // Atualiza tracking
        totalSellVolume += standardAmount;

        emit ProtectedSellExecuted(
            msg.sender,
            standardAmount,
            ethReceived,
            mevCaptured,
            mevCaptured, // burnAmount = mevCaptured
            yieldAmount,
            block.timestamp
        );
    }

    // ==================== FUNÇÕES DE ESTIMATIVA ====================

    /**
     * @notice Estima quanto ETH será recebido por uma quantidade de $STANDARD
     * @dev Cálculo simplificado — em produção usar TWAP oracle
     */
    function _estimateEthOutput(
        uint256 standardAmount,
        uint160 sqrtPriceX96
    ) internal pure returns (uint256) {
        if (sqrtPriceX96 == 0) return 0;

        // Preço = (sqrtPriceX96)^2 / 2^192
        // Simplificação: ethOut ≈ standardAmount * price
        uint256 price = (uint256(sqrtPriceX96) * sqrtPriceX96) / (2 ** 192);
        return (standardAmount * price) / (10 ** 18);
    }

    /**
     * @notice Estima quanto $STANDARD será comprado com uma quantidade de ETH
     */
    function _estimateStandardOutput(
        uint256 ethAmount,
        uint160 sqrtPriceX96
    ) internal pure returns (uint256) {
        if (sqrtPriceX96 == 0) return 0;

        uint256 price = (uint256(sqrtPriceX96) * sqrtPriceX96) / (2 ** 192);
        if (price == 0) return 0;

        return (ethAmount * (10 ** 18)) / price;
    }

    /**
     * @notice Calcula o impacto de preço de um swap
     * @dev Retorna em basis points (0.01%)
     */
    function _calculatePriceImpact(
        uint256 amountIn,
        uint256 amountOut
    ) internal pure returns (uint256) {
        if (amountIn == 0 || amountOut == 0) return 0;
        // Impacto = (entrada - saída) / entrada * 10000
        return ((amountIn - amountOut) * 10000) / amountIn;
    }

    // ==================== FUNÇÕES ADMIN ====================

    /**
     * @notice Atualiza taxa do protocolo
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Fee too high (max 5%)");
        emit FeeUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    /**
     * @notice Atualiza coletor de taxas
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        emit FeeCollectorUpdated(feeCollector, newCollector);
        feeCollector = newCollector;
    }

    /**
     * @notice Define delay mínimo entre operações
     */
    function setMinBlockDelay(uint256 delay) external onlyOwner {
        minBlockDelay = delay;
    }

    /**
     * @notice Withdraw taxas acumuladas
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees");

        (bool sent, ) = feeCollector.call{value: balance}("");
        require(sent, "Withdraw failed");
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPoolState() external view returns (
        uint160 sqrtPriceX96,
        int24 tick,
        bool unlocked
    ) {
        (sqrtPriceX96, tick, , , , , unlocked) = standardPool.slot0();
    }

    function getStats() external view returns (
        uint256 sellVolume,
        uint256 mevCaptured,
        uint256 burnsExecuted,
        uint256 yieldDistributed
    ) {
        return (
            totalSellVolume,
            totalMEVCaptured,
            totalBurnsExecuted,
            totalYieldDistributed
        );
    }

    receive() external payable {}
}
