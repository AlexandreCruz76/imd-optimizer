const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function findPoolCreationUsingAlchemy() {
  console.log('=== Finding Pool Creation via Alchemy trace ===');
  
  // Use Alchemy's getAssetTransfers API
  try {
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: HOOK_POOL,
          category: ['external', 'internal'],
          maxCount: '0x5',
          excludeZeroValue: true
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers) {
      console.log(`Found ${data.result.transfers.length} transfers to Hook Pool:`);
      for (const transfer of data.result.transfers) {
        console.log('\nTransfer:');
        console.log('  From:', transfer.from);
        console.log('  To:', transfer.to);
        console.log('  Value:', transfer.value);
        console.log('  Block:', transfer.blockNum);
        console.log('  Hash:', transfer.hash);
        console.log('  Category:', transfer.category);
      }
    } else {
      console.log('No transfers found or error:', data);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function findPoolCreationUsingTrace() {
  console.log('\n=== Finding Pool Creation via Trace ===');
  
  // Try to use debug_traceTransaction or trace_block
  // First, let's try to find the contract creation by looking at the bytecode
  const code = await provider.getCode(HOOK_POOL);
  
  // Check if it's a minimal proxy
  if (code.startsWith('0x363d3d373d3d3d363d73')) {
    console.log('Hook Pool is a minimal proxy (EIP-1167)');
    const implAddress = '0x' + code.slice(22, 62);
    console.log('Implementation address:', implAddress);
    
    // Check if the implementation is the CappedBurnLauncher
    if (implAddress.toLowerCase() === CAPPED_BURN_LAUNCHER.toLowerCase()) {
      console.log('Implementation IS CappedBurnLauncher!');
    }
  }
  
  // Check storage for potential factory/owner
  console.log('\nChecking CappedBurnLauncher storage slots...');
  for (let i = 0; i < 10; i++) {
    try {
      const storage = await provider.getStorage(CAPPED_BURN_LAUNCHER, i);
      if (storage !== '0x' + '0'.repeat(64)) {
        const value = BigInt(storage);
        console.log(`Storage slot ${i}: ${storage}`);
        
        if (value > 0 && value < 2n ** 160n) {
          const addr = '0x' + value.toString(16).padStart(40, '0');
          console.log(`  -> ${addr}`);
        }
      }
    } catch (e) {}
  }
}

async function findPoolCreationUsingLogs() {
  console.log('\n=== Finding Pool Creation using log search ===');
  
  // Uniswap V3 PoolCreated event signature
  const PoolCreatedTopic = '0x783cca1c0412dd0d695e7127b58eea8519b72d10936c7f18e33ac068b95140f8';
  
  const V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block:', latestBlock.toString());
  
  // Search in small chunks (Alchemy free tier limit)
  const chunkSize = 10;
  let found = false;
  
  // Start searching from latest block backwards
  // We'll search the last 100000 blocks
  const startBlock = Math.max(0, latestBlock - 100000);
  
  console.log(`Searching blocks ${startBlock} to ${latestBlock}...`);
  
  for (let fromBlock = latestBlock; fromBlock >= startBlock && !found; fromBlock -= chunkSize) {
    const toBlock = Math.max(fromBlock - chunkSize + 1, startBlock);
    
    try {
      const logs = await provider.getLogs({
        address: V3_FACTORY,
        topics: [PoolCreatedTopic],
        fromBlock: toBlock,
        toBlock: fromBlock,
      });
      
      if (logs.length > 0) {
        console.log(`\nFound ${logs.length} PoolCreated events in blocks ${toBlock}-${fromBlock}`);
        
        for (const log of logs) {
          const poolAddress = '0x' + log.data.slice(26);
          
          if (poolAddress.toLowerCase() === HOOK_POOL.toLowerCase()) {
            console.log('\n*** FOUND HOOK POOL CREATION ***');
            console.log('Transaction hash:', log.transactionHash);
            console.log('Block number:', log.blockNumber.toString());
            
            // Get transaction details
            const tx = await provider.getTransaction(log.transactionHash);
            const receipt = await provider.getTransactionReceipt(log.transactionHash);
            const block = await provider.getBlock(receipt.blockNumber);
            
            console.log('\nTransaction details:');
            console.log('From (deployer):', tx.from);
            console.log('To (factory):', tx.to);
            console.log('Value:', ethers.formatEther(tx.value), 'ETH');
            console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
            
            found = true;
            break;
          }
        }
      }
    } catch (e) {
      // Continue
    }
    
    if (fromBlock % 1000 === 0) {
      process.stdout.write(`Searched to block ${fromBlock}...\r`);
    }
  }
  
  if (!found) {
    console.log('\nHook Pool creation event not found in last 100000 blocks');
  }
  
  return found;
}

async function checkIMDTokenForBuyFunction() {
  console.log('\n=== Checking IMD Token for Buy Function ===');
  
  const code = await provider.getCode(IMD_TOKEN);
  
  // Look for function selectors that might be buy-related
  const buySelectors = {
    '0x6ea056c9': 'buy()',
    '0x1249c594': 'buy(uint256)',
    '0xd0e30db0': 'withdraw(uint256)',
    '0xb6b55f25': 'deposit()',
    '0x2e1a7d4d': 'withdraw(uint256)',
    '0x40c10f19': 'mint(address,uint256)',
    '0x095ea7b3': 'approve(address,uint256)',
  };
  
  console.log('Checking for buy function selectors in IMD token...');
  for (const [sel, func] of Object.entries(buySelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Try to call buy function
  console.log('\nAttempting to call buy() function...');
  try {
    const contract = new ethers.Contract(IMD_TOKEN, ['function buy() payable'], provider);
    // We just want to see if the function exists, not actually call it
    const iface = contract.interface;
    const func = iface.getFunction('buy');
    if (func) {
      console.log('buy() function found in ABI');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function main() {
  try {
    await findPoolCreationUsingAlchemy();
    await findPoolCreationUsingTrace();
    await findPoolCreationUsingLogs();
    await checkIMDTokenForBuyFunction();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
