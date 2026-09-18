const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

// Known addresses
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const POOL_ID = '0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3';

async function getPoolCreation() {
  console.log('=== 1. Checking Hook Pool (CappedBurnLauncher pool) creation ===');
  
  const code = await provider.getCode(HOOK_POOL);
  console.log('Hook Pool has code:', code !== '0x' ? 'YES' : 'NO');
  
  const deployTx = await provider.getTransactionReceipt(
    '0x' + await provider.send('eth_getStorageAt', [HOOK_POOL, '0x0', 'latest']).then(r => '')
  );
  
  // Get the block number where the contract was created
  // by looking at the first transaction to the contract
  const block = await provider.getBlock('latest');
  console.log('Latest block:', block.number.toString());
}

async function checkCappedBurnLauncher() {
  console.log('\n=== 2. CappedBurnLauncher Contract Analysis ===');
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  console.log('CappedBurnLauncher bytecode length:', code.length);
  
  // Check the contract's storage slots for pool creation logic
  // Try to get the first few storage slots
  for (let i = 0; i < 5; i++) {
    try {
      const storage = await provider.getStorage(CAPPED_BURN_LAUNCHER, i);
      if (storage !== '0x' + '0'.repeat(64)) {
        console.log(`Storage slot ${i}:`, storage);
      }
    } catch (e) {}
  }
}

async function checkTokenContract() {
  console.log('\n=== 3. IMD Token Contract Analysis ===');
  
  const code = await provider.getCode(IMD_TOKEN);
  console.log('IMD Token bytecode length:', code.length);
  
  // ERC20 functions
  const abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function owner() view returns (address)',
  ];
  
  const contract = new ethers.Contract(IMD_TOKEN, abi, provider);
  
  try {
    console.log('Name:', await contract.name());
    console.log('Symbol:', await contract.symbol());
    console.log('Decimals:', (await contract.decimals()).toString());
    console.log('Total Supply:', ethers.formatEther(await contract.totalSupply()));
  } catch (e) {
    console.log('Error calling token functions:', e.message);
  }
}

async function checkV3PoolFactory() {
  console.log('\n=== 4. Looking for Uniswap V3 Pool Factory ===');
  
  // Common Uniswap V3 Factory addresses
  const factories = [
    '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Mainnet V3 Factory
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // V3 Pool Factory
  ];
  
  for (const factory of factories) {
    const code = await provider.getCode(factory);
    console.log(`Factory ${factory} has code:`, code !== '0x' ? 'YES' : 'NO');
  }
}

async function getTransactionHistory() {
  console.log('\n=== 5. Checking recent transactions on Hook Pool ===');
  
  // Get the latest block number
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block:', latestBlock.toString());
  
  // Look at recent blocks for activity on the pool
  const blockRange = 100;
  let foundTx = false;
  
  // Get logs from the hook pool for Uniswap V3 events
  // Swap event signature
  const swapTopic = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67';
  
  try {
    const logs = await provider.getLogs({
      address: HOOK_POOL,
      topics: [swapTopic],
      fromBlock: latestBlock - blockRange,
      toBlock: latestBlock,
    });
    
    console.log(`Found ${logs.length} swap events in last ${blockRange} blocks`);
    
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      console.log('Latest swap tx hash:', latestLog.transactionHash);
      console.log('Block number:', latestLog.blockNumber.toString());
    }
  } catch (e) {
    console.log('Error getting logs:', e.message);
  }
}

async function main() {
  try {
    await getPoolCreation();
    await checkCappedBurnLauncher();
    await checkTokenContract();
    await checkV3PoolFactory();
    await getTransactionHistory();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
