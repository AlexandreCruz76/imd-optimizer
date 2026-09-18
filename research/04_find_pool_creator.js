const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function searchForPoolCreation() {
  console.log('=== Searching for Pool Creation Events ===');
  
  // Uniswap V3 PoolCreated event
  // event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)
  const PoolCreatedTopic = '0x783cca1c0412dd0d695e7127b58eea8519b72d10936c7f18e33ac068b95140f8';
  
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block:', latestBlock.toString());
  
  // Search in chunks of 2000 blocks
  const chunkSize = 2000;
  let found = false;
  
  // Start from a reasonable block (IMD was likely created recently)
  // Let's start from latest - 50000 blocks
  const startBlock = Math.max(0, latestBlock - 50000);
  
  console.log(`Searching from block ${startBlock} to ${latestBlock}...`);
  
  for (let fromBlock = startBlock; fromBlock <= latestBlock && !found; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);
    
    try {
      const logs = await provider.getLogs({
        address: V3_FACTORY,
        topics: [PoolCreatedTopic],
        fromBlock,
        toBlock,
      });
      
      if (logs.length > 0) {
        console.log(`\nFound ${logs.length} PoolCreated events in blocks ${fromBlock}-${toBlock}`);
        
        for (const log of logs) {
          // Decode topics
          const token0 = '0x' + log.topics[1].slice(26);
          const token1 = '0x' + log.topics[2].slice(26);
          const fee = parseInt(log.topics[3], 16);
          const poolAddress = '0x' + log.data.slice(26);
          
          // Check if this is our hook pool
          if (poolAddress.toLowerCase() === HOOK_POOL.toLowerCase()) {
            console.log('\n*** FOUND HOOK POOL CREATION ***');
            console.log('Pool address:', poolAddress);
            console.log('Token0:', token0);
            console.log('Token1:', token1);
            console.log('Fee:', fee);
            console.log('Transaction hash:', log.transactionHash);
            console.log('Block number:', log.blockNumber.toString());
            
            // Get transaction details
            const tx = await provider.getTransaction(log.transactionHash);
            const receipt = await provider.getTransactionReceipt(log.transactionHash);
            const block = await provider.getBlock(receipt.blockNumber);
            
            console.log('\nTransaction details:');
            console.log('From (deployer):', tx.from);
            console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
            
            // Check if deployer is CappedBurnLauncher
            if (tx.from.toLowerCase() === CAPPED_BURN_LAUNCHER.toLowerCase()) {
              console.log('\n*** DEPLOYER IS CAPPED_BURN_LAUNCHER ***');
            } else {
              console.log('\nDeployer is NOT CappedBurnLauncher');
              console.log('Deployer address:', tx.from);
            }
            
            found = true;
            break;
          }
        }
      }
    } catch (e) {
      // Continue searching
    }
    
    if (fromBlock % 10000 === 0) {
      process.stdout.write(`Searched to block ${fromBlock}...\r`);
    }
  }
  
  if (!found) {
    console.log('\nHook Pool creation event not found in recent blocks');
  }
  
  return found;
}

async function checkAllTransactions() {
  console.log('\n=== Checking all transactions to CappedBurnLauncher ===');
  
  const latestBlock = await provider.getBlockNumber();
  
  // Search for any contract interaction with CappedBurnLauncher
  // This will catch function calls to the contract
  
  // Common function selectors
  const selectors = {
    '0x8b5e231d': 'createPool',
    '0x5a6a7b5c': 'createPool',
    '0x6ea056c9': 'buy',
    '0x1249c594': 'buy',
    '0xb6b55f25': 'deposit',
  };
  
  console.log(`Searching for transactions to CappedBurnLauncher in last 1000 blocks...`);
  
  const logs = await provider.getLogs({
    address: CAPPED_BURN_LAUNCHER,
    fromBlock: latestBlock - 1000,
    toBlock: latestBlock,
  });
  
  console.log(`Found ${logs.length} events`);
  
  for (const log of logs.slice(0, 10)) {
    const tx = await provider.getTransaction(log.transactionHash);
    console.log('\nTx:', log.transactionHash);
    console.log('From:', tx.from);
    console.log('Value:', ethers.formatEther(tx.value), 'ETH');
    console.log('Input data (first 10 bytes):', tx.data.slice(0, 10));
    console.log('Block:', log.blockNumber.toString());
  }
}

async function checkTokenApprovals() {
  console.log('\n=== Checking Token Approvals for CappedBurnLauncher ===');
  
  // Check if CappedBurnLauncher has approval to spend IMD tokens
  const tokenABI = ['function allowance(address owner, address spender) view returns (uint256)'];
  const token = new ethers.Contract(IMD_TOKEN, tokenABI, provider);
  
  // Check some known addresses
  const addresses = [
    '0x0000000000000000000000000000000000000001',
    CAPPED_BURN_LAUNCHER,
  ];
  
  for (const addr of addresses) {
    try {
      const allowance = await token.allowance(HOOK_POOL, addr);
      if (allowance > 0) {
        console.log(`Allowance from ${HOOK_POOL} to ${addr}:`, allowance.toString());
      }
    } catch (e) {}
  }
}

async function findPoolCreator() {
  console.log('\n=== Finding Pool Creator via Storage Analysis ===');
  
  // Read storage slots from CappedBurnLauncher
  // Common patterns:
  // - Slot 0: implementation address (for proxies)
  // - Slot 1: owner
  // - Slot 2: factory
  
  for (let i = 0; i < 10; i++) {
    try {
      const storage = await provider.getStorage(CAPPED_BURN_LAUNCHER, i);
      if (storage !== '0x' + '0'.repeat(64)) {
        const value = BigInt(storage);
        console.log(`Storage slot ${i}: ${storage}`);
        
        // Check if it looks like an address
        if (value > 0 && value < 2n ** 160n) {
          const addr = '0x' + value.toString(16).padStart(40, '0');
          console.log(`  Possible address: ${addr}`);
          
          // Check if it's a contract
          const code = await provider.getCode(addr);
          if (code !== '0x') {
            console.log(`  Contract bytecode length: ${code.length / 2} bytes`);
          }
        }
      }
    } catch (e) {}
  }
}

async function main() {
  try {
    await searchForPoolCreation();
    await checkAllTransactions();
    await findPoolCreator();
    await checkTokenApprovals();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
