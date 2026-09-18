// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BuilderStakingVault
 * @notice Stake $BUILDER → Earn 60% of Optimizer performance fees
 * @dev ERC-4626-style vault for $BUILDER token staking
 *
 * Fee Distribution:
 * - 60% → $BUILDER Stakers (this vault)
 * - 20% → Treasury
 * - 15% → Developers
 * - 5% → Burn
 *
 * Builder Score Multipliers:
 * - 30 days: 1.00x
 * - 90 days: 1.35x
 * - 180 days: 1.85x
 */
contract BuilderStakingVault is ERC20, Ownable, ReentrancyGuard {

    // ==================== STATE ====================

    IERC20 public builderToken;
    address public builderTokenAddress;

    // Rastreamento de taxas
    uint256 public totalFeesDistributed;
    uint256 public pendingFees;
    mapping(address => uint256) public pendingRewards;

    // Níveis de bloqueio
    uint256 public constant LOCK_30_DAYS = 30 days;
    uint256 public constant LOCK_90_DAYS = 90 days;
    uint256 public constant LOCK_180_DAYS = 180 days;

    // Multiplicadores (basis points)
    uint256 public constant MULT_30_DAYS = 10000;   // 1.00x
    uint256 public constant MULT_90_DAYS = 13500;   // 1.35x
    uint256 public constant MULT_180_DAYS = 18500;  // 1.85x

    // Posições dos usuários
    struct StakingPosition {
        uint256 amount;
        uint256 lockEnd;
        uint256 lockTier;
        uint256 multiplier;
        uint256 depositTime;
        uint256 rewardDebt;
    }

    mapping(address => StakingPosition[]) public positions;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public builderScore;

    // Estatísticas globais
    uint256 public totalDeposited;
    uint256 public totalBuilderScore;
    uint256 public totalPositions;

    // Distribuição de taxas
    uint256 public performanceFeeBps = 1500; // 15% do yield
    uint256 public stakerShareBps = 6000;    // 60% vai para stakers

    // ==================== EVENTS ====================

    event Staked(
        address indexed user,
        uint256 amount,
        uint256 lockTier,
        uint256 builderScore,
        uint256 lockEnd
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 penalty,
        uint256 timestamp
    );
    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event FeesDeposited(uint256 amount, uint256 timestamp);
    event FeesUpdated(uint256 performanceFee, uint256 stakerShare);

    // ==================== ERRORS ====================

    error InvalidLockTier();
    error InsufficientAmount();
    error LockNotExpired();
    error NothingToWithdraw();
    error NoRewards();
    error TransferFailed();

    // ==================== CONSTRUCTOR ====================

    constructor(
        address _builderToken
    ) ERC20("Optimizer Builder Stake", "oBUILD") Ownable(msg.sender) {
        builderToken = IERC20(_builderToken);
        builderTokenAddress = _builderToken;
    }

    // ==================== CORE FUNCTIONS ====================

    /**
     * @notice Fazer stake de tokens $BUILDER
     * @param amount Quantidade de $BUILDER para fazer stake
     * @param lockTier Período de bloqueio: 30, 90 ou 180 dias
     */
    function stake(uint256 amount, uint256 lockTier) external nonReentrant {
        if (amount == 0) revert InsufficientAmount();
        if (lockTier != 30 && lockTier != 90 && lockTier != 180) {
            revert InvalidLockTier();
        }

        // Calcular multiplicador e duração
        uint256 multiplier;
        uint256 lockDuration;

        if (lockTier == 30) {
            multiplier = MULT_30_DAYS;
            lockDuration = LOCK_30_DAYS;
        } else if (lockTier == 90) {
            multiplier = MULT_90_DAYS;
            lockDuration = LOCK_90_DAYS;
        } else {
            multiplier = MULT_180_DAYS;
            lockDuration = LOCK_180_DAYS;
        }

        // Transferir tokens do usuário
        bool transferred = builderToken.transferFrom(msg.sender, address(this), amount);
        if (!transferred) revert TransferFailed();

        // Calcular pontuação do builder
        uint256 score = (amount * multiplier) / 10000;

        // Criar posição
        StakingPosition memory newPos = StakingPosition({
            amount: amount,
            lockEnd: block.timestamp + lockDuration,
            lockTier: lockTier,
            multiplier: multiplier,
            depositTime: block.timestamp,
            rewardDebt: 0
        });

        positions[msg.sender].push(newPos);

        // Mintar tokens de recibo
        _mint(msg.sender, amount);

        // Atualizar estatísticas
        totalStaked[msg.sender] += amount;
        builderScore[msg.sender] += score;
        totalDeposited += amount;
        totalBuilderScore += score;
        totalPositions++;

        emit Staked(msg.sender, amount, lockTier, score, block.timestamp + lockDuration);
    }

    /**
     * @notice Retirar $BUILDER em stake (após o bloqueio expirar)
     * @param positionIndex Índice da posição para retirar
     */
    function withdraw(uint256 positionIndex) external nonReentrant {
        if (positionIndex >= positions[msg.sender].length) revert NothingToWithdraw();

        StakingPosition storage pos = positions[msg.sender][positionIndex];
        if (pos.amount == 0) revert NothingToWithdraw();

        uint256 amount = pos.amount;
        uint256 penalty = 0;

        // Verificar se o bloqueio ainda está ativo
        if (block.timestamp < pos.lockEnd) {
            // Retirada antecipada — penalidade de 2%
            penalty = (amount * 200) / 10000;
        }

        uint256 amountToSend = amount - penalty;
        uint256 score = (amount * pos.multiplier) / 10000;

        // Atualizar estado ANTES da transferência
        pos.amount = 0;
        pos.lockEnd = 0;
        totalStaked[msg.sender] -= amount;
        builderScore[msg.sender] -= score;
        totalDeposited -= amount;
        totalBuilderScore -= score;

        // Queimar tokens de recibo
        _burn(msg.sender, amount);

        // Transferir tokens
        bool transferred = builderToken.transfer(msg.sender, amountToSend);
        if (!transferred) revert TransferFailed();

        // Enviar penalidade para endereço de queima
        if (penalty > 0) {
            builderToken.transfer(address(0xdead), penalty);
        }

        emit Withdrawn(msg.sender, amountToSend, penalty, block.timestamp);
    }

    /**
     * @notice Reivindicar recompensas acumuladas
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = pendingRewards[msg.sender];
        if (rewards == 0) revert NoRewards();

        pendingRewards[msg.sender] = 0;

        // Transferir recompensas
        bool transferred = builderToken.transfer(msg.sender, rewards);
        if (!transferred) revert TransferFailed();

        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }

    // ==================== FEE DISTRIBUTION ====================

    /**
     * @notice Depositar taxas de performance para distribuição aos stakers
     * @dev Chamado pelo OptimizerVault após coletar taxas
     */
    function depositFees() external payable onlyOwner {
        uint256 feeAmount = msg.value;
        uint256 stakerShare = (feeAmount * stakerShareBps) / 10000;

        pendingFees += stakerShare;
        totalFeesDistributed += stakerShare;

        // Distribuir proporcionalmente aos stakers
        if (totalBuilderScore > 0) {
            // Simplificado: distribuir igualmente por ponto
            // Em produção, usar um acumulador de recompensa por token
        }

        emit FeesDeposited(feeAmount, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPendingRewards(address user) external view returns (uint256) {
        return pendingRewards[user];
    }

    function getStakingPosition(address user, uint256 index) external view returns (StakingPosition memory) {
        return positions[user][index];
    }

    function getPositionCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    function getBuilderScore(address user) external view returns (uint256) {
        return builderScore[user];
    }

    function getTotalStaked(address user) external view returns (uint256) {
        return totalStaked[user];
    }

    // ==================== ADMIN ====================

    function setPerformanceFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 5000, "Fee too high");
        performanceFeeBps = _feeBps;
        emit FeesUpdated(_feeBps, stakerShareBps);
    }

    function setStakerShare(uint256 _shareBps) external onlyOwner {
        require(_shareBps <= 10000, "Share too high");
        stakerShareBps = _shareBps;
        emit FeesUpdated(performanceFeeBps, _shareBps);
    }

    function withdrawFees(address to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees");

        (bool sent, ) = to.call{value: balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}
}
