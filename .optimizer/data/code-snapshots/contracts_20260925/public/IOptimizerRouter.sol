// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOptimizerRouter
 * @notice Interface for OptimizerRouter — Protected sell with atomic MEV capture
 * @dev Full implementation is proprietary and kept off-chain
 */
interface IOptimizerRouter {
    /**
     * @notice Execute protected sell of $STANDARD with atomic MEV capture
     * @param standardAmount Exact amount of $STANDARD to sell
     * @param minAmountOut Minimum ETH acceptable (slippage protection)
     */
    function executeProtectedSellAndBurn(
        uint256 standardAmount,
        uint256 minAmountOut
    ) external;

    /**
     * @notice Get pool state
     * @return sqrtPriceX96 Current sqrt price
     * @return tick Current tick
     * @return unlocked Pool lock status
     */
    function getPoolState() external view returns (
        uint160 sqrtPriceX96,
        int24 tick,
        bool unlocked
    );

    /**
     * @notice Get protocol statistics
     * @return sellVolume Total sell volume
     * @return mevCaptured Total MEV captured
     * @return burnsExecuted Total burns executed
     * @return yieldDistributed Total yield distributed
     */
    function getStats() external view returns (
        uint256 sellVolume,
        uint256 mevCaptured,
        uint256 burnsExecuted,
        uint256 yieldDistributed
    );
}
