// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Mock Uniswap V4 Pool para testes
 * Simula swaps e retorna preço configurável
 */
contract MockUniswapV4Pool {
    uint160 public sqrtPriceX96 = 79228162514264337593543950336; // 1:1 price
    int24 public tick = 0;
    bool public unlocked = true;

    // Configuração para testes
    uint256 public ethReserve = 100 ether;
    uint256 public standardReserve = 100000 ether;

    function setPrice(uint160 _sqrtPriceX96) external {
        sqrtPriceX96 = _sqrtPriceX96;
    }

    function setReserves(uint256 _eth, uint256 _standard) external {
        ethReserve = _eth;
        standardReserve = _standard;
    }

    /**
     * @dev Simula swap — retorna valores baseados na configuração
     */
    function swap(
        bool zeroForOne,
        int256 amountSpecified,
        uint160, // sqrtPriceX96Limit
        bytes calldata // data
    ) external returns (int256 amount0, int256 amount1) {
        uint256 absAmount = uint256(amountSpecified > 0 ? amountSpecified : -amountSpecified);

        if (zeroForOne) {
            // Token0 (STANDARD) → Token1 (ETH)
            // Retorna ~99% do valor (simulando 1% fee)
            amount0 = -int256(absAmount);
            amount1 = int256((absAmount * 99) / 100);
        } else {
            // Token1 (ETH) → Token0 (STANDARD)
            amount1 = -int256(absAmount);
            amount0 = int256((absAmount * 99) / 100);
        }
    }

    function slot0() external view returns (
        uint160,
        int24,
        uint16,
        uint16,
        uint16,
        uint8,
        bool
    ) {
        return (sqrtPriceX96, tick, 0, 0, 0, 0, unlocked);
    }
}
