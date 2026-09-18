const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

// Known addresses
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';

// Uniswap V3 Factory
const V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function getContractCreationInfo() {
  console.log('=== 1. Contract Creation Info ===');
  
  // Get the creation transaction for CappedBurnLauncher
  // We need to find the deployer and creation block
  const deployerABI = [
    'function owner() view returns (address)',
  ];
  
  // Try to get contract source via Etherscan API
  console.log('\nChecking CappedBurnLauncher...');
  
  // Get storage to find owner
  try {
    // Try to call owner() function
    const contract = new ethers.Contract(CAPPED_BURN_LAUNCHER, ['function owner() view returns (address)'], provider);
    const owner = await contract.owner();
    console.log('CappedBurnLauncher owner:', owner);
  } catch (e) {
    console.log('Cannot call owner():', e.message);
  }
  
  // Check if there's a factory pattern
  try {
    const factoryContract = new ethers.Contract(CAPPED_BURN_LAUNCHER, ['function factory() view returns (address)'], provider);
    const factory = await factoryContract.factory();
    console.log('CappedBurnLauncher factory:', factory);
  } catch (e) {}
  
  // Check creator
  try {
    const creatorContract = new ethers.Contract(CAPPED_BURN_LAUNCHER, ['function creator() view returns (address)'], provider);
    const creator = await creatorContract.creator();
    console.log('CappedBurnLauncher creator:', creator);
  } catch (e) {}
}

async function findPoolCreationTx() {
  console.log('\n=== 2. Finding Pool Creation Transaction ===');
  
  // Uniswap V3 PoolCreated event signature
  const PoolCreatedTopic = '0x783cca1c0412dd0d695e7127b58eea8519b72d10936c7f18e33ac068b95140f8';
  
  // Get the latest block to search from
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block:', latestBlock.toString());
  
  // We need to search for the creation of the hook pool
  // Try searching in chunks
  const chunkSize = 2000;
  
  for (let startBlock = latestBlock - 50000; startBlock <= latestBlock; startBlock += chunkSize) {
    const endBlock = Math.min(startBlock + chunkSize - 1, latestBlock);
    
    try {
      const logs = await provider.getLogs({
        address: V3_FACTORY,
        topics: [PoolCreatedTopic],
        fromBlock: startBlock,
        toBlock: endBlock,
      });
      
      // Filter for our hook pool
      for (const log of logs) {
        if (log.topics[3] && log.topics[3].toLowerCase().includes(HOOK_POOL.slice(2).toLowerCase())) {
          const tx = await provider.getTransaction(log.transactionHash);
          const receipt = await provider.getTransactionReceipt(log.transactionHash);
          const block = await provider.getBlock(receipt.blockNumber);
          
          console.log('Found Hook Pool creation!');
          console.log('Transaction hash:', log.transactionHash);
          console.log('Block number:', receipt.blockNumber.toString());
          console.log('Block timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
          console.log('From (creator):', tx.from);
          
          // Decode the event data
          const poolAddress = '0x' + log.topics[3].slice(26);
          console.log('Pool address:', poolAddress);
          
          return { tx, receipt, block, log };
        }
      }
    } catch (e) {
      // Skip errors
    }
  }
  
  console.log('Could not find Hook Pool creation event in recent blocks');
  return null;
}

async function getPoolInfo() {
  console.log('\n=== 3. Pool Info ===');
  
  // Uniswap V3 Pool ABI for basic info
  const poolABI = [
    'function factory() view returns (address)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function fee() view returns (uint24)',
    'function tickSpacing() view returns (int24)',
  ];
  
  const pool = new ethers.Contract(HOOK_POOL, poolABI, provider);
  
  try {
    console.log('Pool factory:', await pool.factory());
    console.log('Token0:', await pool.token0());
    console.log('Token1:', await pool.token1());
    console.log('Fee:', (await pool.fee()).toString());
    console.log('Tick spacing:', (await pool.tickSpacing()).toString());
  } catch (e) {
    console.log('Error reading pool:', e.message);
  }
}

async function checkTokenForBuyFunction() {
  console.log('\n=== 4. Checking IMD Token for Buy Functions ===');
  
  // Common buy function signatures
  const possibleFunctions = [
    'function buy(uint256 amount) payable',
    'function buy() payable',
    'function purchase() payable',
    'function buyTokens() payable',
    'function mint() payable',
    'function swap() payable',
    'function buy(address token) payable',
    'function buyWithETH() payable',
    'function buyToken() payable',
    'function buy(address to) payable',
    'function buy(address recipient, uint256 amount) payable',
  ];
  
  const code = await provider.getCode(IMD_TOKEN);
  
  // Check for function selectors in the bytecode
  for (const func of possibleFunctions) {
    try {
      const iface = new ethers.Interface([func]);
      const selector = iface.getFunction(func.split('(')[0].split(' ').pop()).selector;
      
      // Check if the selector exists in the bytecode (as bytes4)
      const selectorHex = selector.slice(2);
      if (code.toLowerCase().includes(selectorHex.toLowerCase())) {
        console.log(`Found function: ${func}`);
      }
    } catch (e) {}
  }
  
  // Also check for common patterns in the bytecode
  console.log('\nBytecode analysis:');
  
  // Check for payable functions
  if (code.includes('5f35')) {
    console.log('Found PUSH0 + CALLDATALOAD pattern');
  }
  
  // Check for ETH receiving functions
  if (code.includes('f3')) {
    console.log('Found RETURN opcode');
  }
  
  // Look for common Uniswap router patterns
  if (code.includes('7ff36ab5')) {
    console.log('Found swapExactETHForTokens selector');
  }
  if (code.includes('38ed1739')) {
    console.log('Found swapExactTokensForTokens selector');
  }
}

async function checkCappedBurnLauncherForCreatePool() {
  console.log('\n=== 5. CappedBurnLauncher - Create Pool Functions ===');
  
  const possibleFunctions = [
    'function createPool(address token, uint24 fee) payable',
    'function createPool(address token) payable',
    'function launch(address token) payable',
    'function create(address token, uint24 fee) payable',
    'function createPoolWithFee(address token, uint24 fee) payable',
    'function initialize(address token) payable',
    'function deploy(address token) payable',
    'function createPool(address tokenA, address tokenB, uint24 fee) payable',
  ];
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  
  // Check for function selectors
  for (const func of possibleFunctions) {
    try {
      const iface = new ethers.Interface([func]);
      const selector = iface.getFunction(func.split('(')[0].split(' ').pop()).selector;
      
      const selectorHex = selector.slice(2);
      if (code.toLowerCase().includes(selectorHex.toLowerCase())) {
        console.log(`Found function: ${func}`);
      }
    } catch (e) {}
  }
}

async function getRecentTransactions() {
  console.log('\n=== 6. Recent Transactions on CappedBurnLauncher ===');
  
  const latestBlock = await provider.getBlockNumber();
  
  // Search for transactions to CappedBurnLauncher
  try {
    // Get logs from the contract
    const logs = await provider.getLogs({
      address: CAPPED_BURN_LAUNCHER,
      fromBlock: latestBlock - 1000,
      toBlock: latestBlock,
    });
    
    console.log(`Found ${logs.length} events from CappedBurnLauncher in last 1000 blocks`);
    
    for (const log of logs.slice(0, 5)) {
      console.log('\nEvent:', log.topics[0]);
      console.log('Tx hash:', log.transactionHash);
      console.log('Block:', log.blockNumber.toString());
    }
  } catch (e) {
    console.log('Error getting logs:', e.message);
  }
}

async function main() {
  try {
    await getContractCreationInfo();
    await getPoolInfo();
    await checkTokenForBuyFunction();
    await checkCappedBurnLauncherForCreatePool();
    await findPoolCreationTx();
    await getRecentTransactions();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
