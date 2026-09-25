# Proprietary Mathematics Protection

## Strategy: Off-Chain Verification

The core mathematical models are kept **off-chain** to protect intellectual property.

---

## What's On-Chain vs Off-Chain

### On-Chain (Open Source)
```
✅ OptimizerVault — Deposit/withdraw logic
✅ OptimizerGenesisKey — NFT minting
✅ BuilderStakingVault — Staking logic
✅ OptimizerHook — Hook callbacks (simplified)
```

### Off-Chain (Proprietary)
```
🔒 MEV detection algorithm
🔒 Price impact calculation
🔒 Optimal routing logic
🔒 Fee optimization math
🔒 Elasticity parameters
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                  PROTECTION MODEL                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. On-chain hook detects swap event                    │
│     └── Emits event to off-chain service                │
│                                                         │
│  2. Off-chain service runs proprietary math             │
│     └── Calculates optimal action                       │
│                                                         │
│  3. Signed transaction sent back on-chain               │
│     └── Executes with cryptographic proof               │
│                                                         │
│  4. On-chain verifies signature                         │
│     └── Only authorized service can execute             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation

```solidity
// On-chain: Simplified hook
function afterSwap(...) external {
    // Emit event for off-chain service
    emit SwapExecuted(sender, amountIn, amountOut, sqrtPriceX96);
    
    // Off-chain service will call executeArbitrage with signature
}

// On-chain: Verify and execute
function executeArbitrage(
    uint256 amount,
    bool zeroForOne,
    bytes memory signature
) external {
    // Verify signature from authorized service
    bytes32 hash = keccak256(abi.encodePacked(amount, zeroForOne, block.timestamp));
    address signer = ECDSA.recover(hash, signature);
    require(signer == authorizedService, "Unauthorized");
    
    // Execute with verified parameters
    _executeArbitrageInternal(amount, zeroForOne);
}
```

---

## Benefits

| Aspect | Protection |
|--------|------------|
| Algorithm | Hidden in off-chain service |
| Parameters | Not visible on-chain |
| Optimization | Can be updated without contract upgrade |
| Competition | Cannot be copied from blockchain |

---

## What Competitors See

```
// They can see:
✅ Contract addresses
✅ Function signatures
✅ Event emissions
✅ Balance changes

// They cannot see:
🔒 Mathematical models
🔒 Detection algorithms
🔒 Optimal parameters
🔒 Routing logic
```

---

## Legal Protection

- **Trade Secret:** Mathematical models are trade secrets
- **Copyright:** Code is MIT licensed, but models are proprietary
- **Patent:** Consider filing for novel MEV capture methods

---

*The math is the moat. Keep it off-chain.* 🐸
