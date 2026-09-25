// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

/**
 * @title IStandardCore
 * @notice Interface for The Standard Core contract
 */
interface IStandardCore {
    function burn(uint256 amount) external;
}

/**
 * @title MockStandardCore
 * @notice Mock Standard Core for testing
 */
contract MockStandardCore is IStandardCore {
    uint256 public totalBurned;

    function burn(uint256 amount) external {
        totalBurned += amount;
    }
}
