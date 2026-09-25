// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOptimizerHook
 * @notice Interface for OptimizerHook — 3-Layer Meta-Hook for Uniswap V4
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IOptimizerHook {
    /**
     * @notice Hook called before swap — Layer 1: Identity-Fi
     * @param sender Swap initiator
     * @param zeroForOne Swap direction
     * @param amountSpecified Amount to swap
     * @param amountOutMinimum Minimum output
     * @param sqrtPriceX96 Current price
     * @param data Additional data
     * @return amount0 Amount of token0
     * @return amount1 Amount of token1
     * @return sqrtPriceX96After Price after swap
     */
    function beforeSwap(
        address sender,
        bool zeroForOne,
        uint256 amountSpecified,
        uint256 amountOutMinimum,
        uint256 sqrtPriceX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1, uint256 sqrtPriceX96After);

    /**
     * @notice Hook called after swap — Layer 2: Elasticity + Layer 3: MEV
     * @param sender Swap initiator
     * @param zeroForOne Swap direction
     * @param amountSpecified Amount to swap
     * @param amountOut Amount received
     * @param sqrtPriceX96 Price after swap
     * @param tick Tick after swap
     * @param data Additional data
     * @return liquidityDelta Change in liquidity
     */
    function afterSwap(
        address sender,
        bool zeroForOne,
        uint256 amountSpecified,
        uint256 amountOut,
        uint256 sqrtPriceX96,
        int256 tick,
        bytes calldata data
    ) external returns (int128 liquidityDelta);

    /**
     * @notice Get total fees collected
     * @return Total fees in basis points
     */
    function getTotalFeesCollected() external view returns (uint256);

    /**
     * @notice Get total MEV captured
     * @return Total MEV captured
     */
    function getTotalMEVCaptured() external view returns (uint256);
}
