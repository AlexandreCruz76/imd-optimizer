const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Get bytecode and look for function signatures
async function analyzeBytecode(address, name) {
  console.log(`\n=== ${name} (${address}) ===`);
  
  const code = await provider.getCode(address);
  console.log('Bytecode length:', code.length / 2, 'bytes');
  
  // Common function selectors (4-byte)
  const selectors = {
    // Pool functions
    '0xe04331f0': 'getPool(address,address,uint24)',
    '0x1698ee82': 'createPool(address,address,uint24)',
    '0x8b5e231d': 'createPool(address,uint24)',
    '0x5a6a7b5c': 'createPool(address)',
    
    // Token functions
    '0x06fdde03': 'name()',
    '0x95d89b41': 'symbol()',
    '0x313ce567': 'decimals()',
    '0x18160ddd': 'totalSupply()',
    '0x70a08231': 'balanceOf(address)',
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    
    // Buy functions
    '0xb6b55f25': 'deposit()',
    '0xd0e30db0': 'withdraw(uint256)',
    '0x6ea056c9': 'buy()',
    '0x1249c594': 'buy(uint256)',
    '0x40c10f19': 'mint(address,uint256)',
    
    // Uniswap V3
    '0x095ea7b3': 'approve(address,uint256)',
    '0x1249c594': 'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
    
    // CappedBurnLauncher specific
    '0x8b5e231d': 'create(address,uint24)',
    '0x5a6a7b5c': 'create(address)',
    '0x2e1a7d4d': 'withdraw(uint256)',
    '0x8da5cb5b': 'owner()',
  };
  
  console.log('\nFound function selectors:');
  for (const [sel, func] of Object.entries(selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`  ${sel} = ${func}`);
    }
  }
}

async function getTransactionDetails(txHash) {
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  return {
    from: tx.from,
    to: tx.to,
    value: tx.value,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status: receipt.status,
  };
}

async function findDeployerAndCreation() {
  console.log('\n=== Finding CappedBurnLauncher Deployer ===');
  
  // Search for contract creation by checking recent blocks
  const latestBlock = await provider.getBlockNumber();
  
  // The contract might be deployed by another factory
  // Check the code for init code patterns
  
  // Try to get contract source from Etherscan-like API
  console.log('Checking Etherscan for contract info...');
  
  // We'll search for transactions that created this contract
  // by looking for CREATE/CREATE2 opcode patterns
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  
  // Check if it's a minimal proxy (EIP-1167)
  if (code.startsWith('0x363d3d373d3d3d363d73')) {
    console.log('Contract is a minimal proxy (EIP-1167)');
    // Extract implementation address from bytecode
    const implAddress = '0x' + code.slice(22, 62);
    console.log('Implementation address:', implAddress);
    
    const implCode = await provider.getCode(implAddress);
    console.log('Implementation bytecode length:', implCode.length / 2, 'bytes');
  } else {
    console.log('Contract is not a minimal proxy');
  }
}

async function checkPoolLiquidity() {
  console.log('\n=== Checking Hook Pool Liquidity ===');
  
  // Uniswap V3 Pool ABI for liquidity info
  const poolABI = [
    'function liquidity() view returns (uint128)',
    'function slot0() view returns (uint160,int24,int24,uint16,uint16,uint8,bool)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
  ];
  
  const pool = new ethers.Contract(HOOK_POOL, poolABI, provider);
  
  try {
    const liquidity = await pool.liquidity();
    console.log('Current liquidity:', liquidity.toString());
    
    const slot0 = await pool.slot0();
    console.log('Sqrt price:', slot0[0].toString());
    console.log('Tick:', slot0[1].toString());
    
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    console.log('Token0:', token0);
    console.log('Token1:', token1);
    
    // Get token balances
    const token0Contract = new ethers.Contract(token0, ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)'], provider);
    const token1Contract = new ethers.Contract(token1, ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)'], provider);
    
    const balance0 = await token0Contract.balanceOf(HOOK_POOL);
    const balance1 = await token1Contract.balanceOf(HOOK_POOL);
    
    const symbol0 = await token0Contract.symbol();
    const symbol1 = await token1Contract.symbol();
    
    console.log(`\nPool balances:`);
    console.log(`${symbol0}: ${ethers.formatEther(balance0)}`);
    console.log(`${symbol1}: ${ethers.formatEther(balance1)}`);
  } catch (e) {
    console.log('Error reading pool:', e.message);
  }
}

async function main() {
  try {
    await analyzeBytecode(CAPPED_BURN_LAUNCHER, 'CappedBurnLauncher');
    await analyzeBytecode(IMD_TOKEN, 'IMD Token');
    await analyzeBytecode(HOOK_POOL, 'Hook Pool');
    
    await findDeployerAndCreation();
    await checkPoolLiquidity();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
