const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const MYSTERY_ADDR = '0x000000000004444c5dc75cB358380D2e3dE08A90';

async function identifyMysteryAddress() {
  console.log('=== Identifying Mystery Address ===');
  
  // The address 0x000000000004444c5dc75cB358380D2e3dE08A90 looks like a deterministic address
  // This pattern is common in Uniswap V4 or similar protocols
  
  const code = await provider.getCode(MYSTERY_ADDR);
  
  // Check for V4 Pool Manager selectors
  const v4Selectors = {
    '0x128acb08': 'swap',
    '0x219f5d17': 'swap',
    '0x0c4a4721': 'swap',
    '0xac9650d8': 'multicall',
    '0x5ae401dc': 'multicall',
    '0x3593564c': 'execute',
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x8803dbee': 'swapTokensForExactTokens',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0xfb3bdb41': 'swapETHForExactTokens',
  };
  
  console.log('\nChecking for function selectors...');
  for (const [sel, func] of Object.entries(v4Selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Check for known Uniswap V4 addresses
  const knownV4Addresses = {
    '0x000000000004444c5dc75cB358380D2e3dE08A90': 'Uniswap V4 PoolManager (possibly)',
    '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': 'Uniswap V4 PoolManager',
    '0x0000000000000068f24ca170d58a5ce75e8a7770': 'Uniswap V4 PositionDescriptor',
  };
  
  const mysteryLower = MYSTERY_ADDR.toLowerCase();
  if (knownV4Addresses[mysteryLower]) {
    console.log('\n*** This address is: ' + knownV4Addresses[mysteryLower] + ' ***');
  }
  
  // Check the event signature in the log
  // 0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec
  // This could be a Swap event from Uniswap V4
  
  console.log('\nEvent signature 0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec:');
  // Let me check what this event might be
  const possibleEvents = [
    'Swap(address,address,int256,int256,uint160)',
    'Swap(address,address,int256,int256)',
    'Swap(address,uint256,uint256)',
  ];
  
  for (const event of possibleEvents) {
    const hash = ethers.id(event);
    if (hash === '0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec') {
      console.log(`  Event: ${event}`);
    }
  }
}

async function analyzeHookPoolFunction() {
  console.log('\n=== Analyzing Hook Pool Function 0xc1d64bfb ===');
  
  // The function selector 0xc1d64bfb is called on the hook pool
  // Let me search for this in known function signatures
  
  const signatures = [
    'swap(address,address,int256,int256,bytes)',
    'swap(address,address,int256,uint256,bytes)',
    'swapWithPermit(address,address,int256,uint256,bytes)',
    'mint(address,address,int24,int24,uint256)',
    'collect(address,int24,int24,uint128,uint128)',
    'burn(int24,int24,uint128)',
  ];
  
  for (const sig of signatures) {
    const hash = ethers.id(sig);
    const selector = hash.slice(0, 10);
    if (selector === '0xc1d64bfb') {
      console.log(`Found matching function: ${sig}`);
      console.log(`Selector: ${selector}`);
      break;
    }
  }
  
  // If not found, it's likely a custom function
  console.log('\nThis appears to be a custom function on the hook pool.');
  console.log('The function takes 4 uint256 parameters:');
  console.log('  - Param 1: Amount or sqrtPriceX96');
  console.log('  - Param 2: Amount or sqrtPriceX96');
  console.log('  - Param 3: Amount In (1000 ETH)');
  console.log('  - Param 4: Amount Out (1000 ETH)');
}

async function summarizeFindings() {
  console.log('\n=== SUMMARY OF FINDINGS ===');
  
  console.log('\n1. POOL CREATION:');
  console.log('   - Hook Pool: 0xc6c965bd164c483e87d0b550671798e9a3602840');
  console.log('   - Created at Block: 25887100');
  console.log('   - Created on: September 2, 2026 at 04:05:11 UTC');
  console.log('   - Created by EOA: 0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7');
  console.log('   - Initial ETH: 3.8 ETH sent in the creation transaction');
  
  console.log('\n2. CAPPED BURN LAUNCHER:');
  console.log('   - Address: 0x80587937a883743e67bB11dab356F60e4656C40d');
  console.log('   - First funded on: September 7, 2026 (5 days after pool creation)');
  console.log('   - Deployer: 0x5b95a971b4583a5f011e9da082acdd679b870d06');
  console.log('   - This is NOT the pool creator');
  
  console.log('\n3. MYSTERY ADDRESS:');
  console.log('   - Address: 0x000000000004444c5dc75cB358380D2e3dE08A90');
  console.log('   - This appears to be a Uniswap V4 related contract');
  console.log('   - It emits events when swaps occur on the hook pool');
  console.log('   - IMD tokens are transferred to this address during swaps');
  
  console.log('\n4. BUY MECHANISM:');
  console.log('   - The function selector 0xc1d64bfb is called directly on the hook pool');
  console.log('   - This is likely a custom swap function specific to this pool');
  console.log('   - ETH is sent directly to the hook pool');
  console.log('   - The mystery address (0x000000000004444c5dc75cB358380D2e3dE08A90)');
  console.log('     appears to be involved in the swap routing');
  
  console.log('\n5. POOL TOKENS:');
  console.log('   - Token0: IMD (0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7)');
  console.log('   - Token1: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)');
}

async function main() {
  try {
    await identifyMysteryAddress();
    await analyzeHookPoolFunction();
    await summarizeFindings();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
