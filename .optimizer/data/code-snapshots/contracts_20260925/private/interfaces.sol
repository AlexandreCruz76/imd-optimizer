// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStandardCore
 * @notice Interface do contrato core do The Standard Protocol
 * @dev Usado para queimar tokens $STANDARD durante contração monetária
 */
interface IStandardCore {
    /**
     * @notice Queima tokens $STANDARD para restaurar paridade
     * @dev Chamado durante eventos de contração monetária
     * @param amount Quantidade de $STANDARD a queimar
     */
    function burn(uint256 amount) external;

    /**
     * @notice Retorna o supply total de $STANDARD
     */
    function totalSupply() external view returns (uint256);

    /**
     * @notice Retorna o saldo de $STANDARD de um usuário
     */
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title IUniswapV4Pool
 * @notice Interface simplificada da Pool Uniswap V4
 * @dev Usado para executar swaps e obter estado da pool
 */
interface IUniswapV4Pool {
    /**
     * @notice Executa um swap na pool
     * @param zeroForOne True se trocando token0 por token1
     * @param amountSpecified Quantidade a ser trocada (negativo = venda)
     * @param sqrtPriceX96Limit Limite de preço sqrt
     * @return amount0 Delta do token0
     * @return amount1 Delta do token1
     */
    function swap(
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceX96Limit,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    /**
     * @notice Retorna o preço atual da pool em sqrtPriceX96
     */
    function slot0() external view returns (
        uint160 sqrtPriceX96,
        int24 tick,
        uint16 observationIndex,
        uint16 observationCardinality,
        uint16 observationCardinalityNext,
        uint8 feeProtocol,
        bool unlocked
    );
}

/**
 * @title IERC20Burnable
 * @notice Interface estendida para tokens com função burn
 */
interface IERC20Burnable {
    function burn(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title IWETH
 * @notice Interface para WETH (Wrapped ETH)
 */
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
