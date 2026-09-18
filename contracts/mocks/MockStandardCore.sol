// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Mock Standard Core para testes
 * Simula a função burn() do The Standard
 */
contract MockStandardCore is ERC20 {
    uint256 private _totalBurned;

    constructor() ERC20("Mock Standard", "STD") {}

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        _totalBurned += amount;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function totalBurned() external view returns (uint256) {
        return _totalBurned;
    }
}
