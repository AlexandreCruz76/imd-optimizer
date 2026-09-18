const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function analyzePoolBytecode() {
  console.log('=== Analyzing Hook Pool Bytecode ===');
  
  const code = await provider.getCode(HOOK_POOL);
  
  // Look for known function selectors
  // Standard Uniswap V3 Pool selectors
  const v3PoolSelectors = {
    '0xe04331f0': 'getPool(address,address,uint24)',
    '0x1698ee82': 'createPool(address,address,uint24)',
    '0x8b5e231d': 'createPool(address,uint24)',
    '0x5a6a7b5c': 'createPool(address)',
    '0x095ea7b3': 'approve(address,uint256)',
    '0x18160ddd': 'totalSupply()',
    '0x70a08231': 'balanceOf(address)',
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    '0x8da5cb5b': 'owner()',
    '0xb6b55f25': 'deposit()',
    '0x2e1a7d4d': 'withdraw(uint256)',
    
    // Uniswap V3 Pool specific
    '0x0c4a4721': 'swap(address,bool,int256,uint160,bytes)',
    '0x128acb08': 'swapSingle(address,bool,int256,uint160,bytes)',
    '0x60387928': 'collectProtocolFees(address)',
    '0x872781f2': 'collectAllFees()',
    '0x095ea7b3': 'approve(address,uint256)',
    '0xdd62ed3e': 'allowance(address,address)',
    '0x7ecebe00': 'nonces(address)',
    '0xb3e2d498': 'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
    
    // Hook-related functions
    '0xd04c0a44': 'beforeSwap()',
    '0xf4db1e98': 'afterSwap()',
    '0xd660d098': 'beforeAddLiquidity()',
    '0x055185e4': 'afterAddLiquidity()',
    '0x26e19b60': 'beforeRemoveLiquidity()',
    '0x8fb4cd1a': 'afterRemoveLiquidity()',
  };
  
  console.log('\nSearching for function selectors in Hook Pool bytecode...');
  for (const [sel, func] of Object.entries(v3PoolSelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Also check for hook patterns
  const hookPatterns = [
    'beforeSwap', 'afterSwap', 'beforeAddLiquidity', 'afterAddLiquidity',
    'beforeRemoveLiquidity', 'afterRemoveLiquidity', 'onlyCallHooks'
  ];
  
  console.log('\nSearching for hook-related patterns in bytecode...');
  for (const pattern of hookPatterns) {
    if (code.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`Found pattern: ${pattern}`);
    }
  }
}

async function analyzeCappedBurnLauncherBytecode() {
  console.log('\n=== Analyzing CappedBurnLauncher Bytecode ===');
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  
  // More comprehensive function selector list
  const selectors = {
    // Standard ERC20
    '0x06fdde03': 'name()',
    '0x95d89b41': 'symbol()',
    '0x313ce567': 'decimals()',
    '0x18160ddd': 'totalSupply()',
    '0x70a08231': 'balanceOf(address)',
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    '0x095ea7b3': 'approve(address,uint256)',
    '0x8da5cb5b': 'owner()',
    
    // Uniswap V2/V3 related
    '0x095ea7b3': 'approve(address,uint256)',
    '0xb6b55f25': 'deposit()',
    '0x2e1a7d4d': 'withdraw(uint256)',
    
    // Pool creation
    '0x8b5e231d': 'createPool(address,uint24)',
    '0x5a6a7b5c': 'createPool(address)',
    '0x1698ee82': 'createPool(address,address,uint24)',
    
    // Buy functions
    '0x6ea056c9': 'buy()',
    '0x1249c594': 'buy(uint256)',
    '0xd0e30db0': 'deposit()',
    
    // Proxy/delegatecall
    '0x5c60da1b': 'implementation()',
  };
  
  console.log('\nSearching for function selectors in CappedBurnLauncher...');
  for (const [sel, func] of Object.entries(selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Look for string patterns in bytecode that might reveal function names
  console.log('\nSearching for string patterns in bytecode...');
  const strings = ['create', 'pool', 'launch', 'buy', 'sell', 'swap', 'mint', 'burn', 'deposit', 'withdraw'];
  for (const str of strings) {
    if (code.toLowerCase().includes(str.toLowerCase())) {
      console.log(`Found string: "${str}"`);
    }
  }
}

async function checkTokenForUniswap() {
  console.log('\n=== Checking IMD Token for Uniswap Integration ===');
  
  // Check if token has any reference to Uniswap
  const code = await provider.getCode(IMD_TOKEN);
  
  const patterns = ['uniswap', 'router', 'factory', 'pair', 'pool', 'swap', 'liquidity', 'buy', 'sell'];
  console.log('\nSearching for patterns in IMD token bytecode...');
  for (const pattern of patterns) {
    if (code.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`Found pattern: "${pattern}"`);
    }
  }
}

async function findCreationUsingEtherscan() {
  console.log('\n=== Attempting to find contract creation via Etherscan ===');
  
  // Use Etherscan API to get contract creation info
  const etherscanAPI = 'https://api.etherscan.io/api';
  
  try {
    const response = await fetch(`${etherscanAPI}?module=contract&action=getcontractcreation&contractaddresses=${CAPPED_BURN_LAUNCHER},${HOOK_POOL},${IMD_TOKEN}&apikey=YourApiKeyToken`);
    const data = await response.json();
    console.log('Etherscan API response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('Etherscan API error:', e.message);
  }
}

async function main() {
  try {
    await analyzePoolBytecode();
    await analyzeCappedBurnLauncherBytecode();
    await checkTokenForUniswap();
    await findCreationUsingEtherscan();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
