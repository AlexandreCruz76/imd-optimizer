const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function analyzeCappedBurnLauncher() {
  console.log('=== Analyzing CappedBurnLauncher Contract ===');
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  
  // Extract embedded addresses from bytecode (pused to 20 bytes)
  console.log('\nLooking for embedded addresses in CappedBurnLauncher bytecode...');
  
  // Look for PUSH20 opcodes (0x73) followed by 20 bytes
  const addressPattern = /73([0-9a-f]{40})/g;
  let match;
  const addresses = new Set();
  
  while ((match = addressPattern.exec(code.toLowerCase())) !== null) {
    const addr = '0x' + match[1];
    addresses.add(addr);
  }
  
  console.log(`Found ${addresses.size} potential addresses:`);
  for (const addr of addresses) {
    console.log(`  ${addr}`);
  }
  
  // Look for other patterns
  console.log('\nLooking for other patterns...');
  
  // Look for CREATE2 opcode (0xf5)
  if (code.includes('f5')) {
    console.log('Found CREATE2 opcode - this contract creates contracts');
  }
  
  // Look for SSTORE patterns
  if (code.includes('55')) {
    console.log('Found SSTORE opcode - contract stores state');
  }
}

async function analyzeHookPool() {
  console.log('\n=== Analyzing Hook Pool Contract ===');
  
  const code = await provider.getCode(HOOK_POOL);
  
  // Look for hook-related function selectors
  console.log('\nHook-related function selectors:');
  const hookSelectors = {
    '0xd04c0a44': 'beforeSwap()',
    '0xf4db1e98': 'afterSwap()',
    '0xd660d098': 'beforeAddLiquidity()',
    '0x055185e4': 'afterAddLiquidity()',
    '0x26e19b60': 'beforeRemoveLiquidity()',
    '0x8fb4cd1a': 'afterRemoveLiquidity()',
    '0x30a4f446': 'onlyCallHooks()',
    '0x19aa3ef0': 'hook()',
  };
  
  for (const [sel, func] of Object.entries(hookSelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Look for embedded addresses
  console.log('\nLooking for embedded addresses in Hook Pool bytecode...');
  const addressPattern = /73([0-9a-f]{40})/g;
  let match;
  const addresses = new Set();
  
  while ((match = addressPattern.exec(code.toLowerCase())) !== null) {
    const addr = '0x' + match[1];
    addresses.add(addr);
  }
  
  console.log(`Found ${addresses.size} potential addresses:`);
  for (const addr of addresses) {
    console.log(`  ${addr}`);
  }
}

async function findPoolCreationUsingLogs() {
  console.log('\n=== Finding Pool Creation Using Alchemy API ===');
  
  // Use Alchemy's getAssetTransfers to find when the contract was created
  try {
    const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: HOOK_POOL,
          category: ['external'],
          maxCount: '0x1'
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers) {
      console.log('First transfer to Hook Pool:', data.result.transfers[0]);
    }
  } catch (e) {
    console.log('Alchemy API error:', e.message);
  }
  
  // Try to find the first transaction to the hook pool
  try {
    const latestBlock = await provider.getBlockNumber();
    
    // Search backwards from latest block
    for (let i = latestBlock; i >= latestBlock - 100000; i -= 1000) {
      try {
        const block = await provider.getBlock(i);
        if (block && block.transactions.length > 0) {
          // Check if any transaction involves the hook pool
          for (const txHash of block.transactions.slice(0, 10)) {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.to && tx.to.toLowerCase() === HOOK_POOL.toLowerCase()) {
              console.log('\nFound transaction to Hook Pool!');
              console.log('Block:', i);
              console.log('Tx hash:', txHash);
              console.log('From:', tx.from);
              console.log('Value:', ethers.formatEther(tx.value), 'ETH');
              return;
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.log('Error searching for transactions:', e.message);
  }
}

async function main() {
  try {
    await analyzeCappedBurnLauncher();
    await analyzeHookPool();
    await findPoolCreationUsingLogs();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
