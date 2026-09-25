// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockUniswapV4Pool
 * @notice Mock Uniswap V4 Pool for testing
 */
contract MockUniswapV4Pool {
    uint160 public mockSqrtPriceX96 = 1517882343751509868544;
    int24 public mockTick = 0;

    function setPrice(uint160 sqrtPriceX96) external {
        mockSqrtPriceX96 = sqrtPriceX96;
    }

    function setTick(int24 tick) external {
        mockTick = tick;
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
        return (mockSqrtPriceX96, mockTick, 0, 0, 0, 0, true);
    }

    function swap(
        bool zeroForOne,
        int256 amountSpecified,
        uint160,
        bytes calldata
    ) external returns (int256 amount0, int256 amount1) {
        if (amountSpecified > 0) {
            if (zeroForOne) {
                amount0 = -amountSpecified;
                amount1 = amountSpecified;
            } else {
                amount1 = -amountSpecified;
                amount0 = amountSpecified;
            }
        } else {
            if (zeroForOne) {
                amount1 = -amountSpecified;
                amount0 = amountSpecified;
            } else {
                amount0 = -amountSpecified;
                amount1 = amountSpecified;
            }
        }
    }

    function approve(address, uint256) external returns (bool) {
        return true;
    }

    function transferFrom(address, address, uint256) external returns (bool) {
        return true;
    }

    function balanceOf(address) external view returns (uint256) {
        return 0;
    }

    function transfer(address, uint256) external returns (bool) {
        return true;
    }
}
