const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

async function investigateFirstTransfer() {
  console.log('=== Investigating First ETH Transfer to Hook Pool ===');
  
  const txHash = '0xe6c5c6657a2fba1473b578042a51bc02d625cb46ca8244be9de0adddd19ad36f';
  
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  const block = await provider.getBlock(receipt.blockNumber);
  
  console.log('Transaction hash:', txHash);
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', ethers.formatEther(tx.value), 'ETH');
  console.log('Block:', receipt.blockNumber.toString());
  console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
  
  // Decode input data
  console.log('\nInput data:', tx.data);
  
  // Check all logs in this transaction
  console.log('\nLogs in this transaction:');
  for (const log of receipt.logs) {
    console.log('\nLog:');
    console.log('  Address:', log.address);
    console.log('  Topics:', log.topics);
    console.log('  Data:', log.data);
  }
  
  // Check if this transaction created the hook pool
  // by looking at internal transactions
  console.log('\n=== Checking for Contract Creation ===');
  
  // Check if the hook pool exists before this block
  try {
    const codeBefore = await provider.getCode(HOOK_POOL, receipt.blockNumber - 1);
    console.log('Hook pool code before this block:', codeBefore !== '0x' ? 'EXISTS' : 'NOT EXISTS');
  } catch (e) {
    console.log('Cannot check code before block:', e.message);
  }
  
  const codeAt = await provider.getCode(HOOK_POOL, receipt.blockNumber);
  console.log('Hook pool code at this block:', codeAt !== '0x' ? 'EXISTS' : 'NOT EXISTS');
  
  // Check if the sender is the CappedBurnLauncher
  if (tx.from.toLowerCase() === CAPPED_BURN_LAUNCHER.toLowerCase()) {
    console.log('\n*** SENDER IS CAPPED_BURN_LAUNCHER ***');
  } else {
    console.log('\nSender is NOT CappedBurnLauncher');
    console.log('Sender:', tx.from);
  }
}

async function findPoolCreationEvent() {
  console.log('\n=== Looking for Pool Creation Event ===');
  
  // Uniswap V3 PoolCreated event signature
  const PoolCreatedTopic = '0x783cca1c0412dd0d695e7127b58eea8519b72d10936c7f18e33ac068b95140f8';
  
  // Get logs from V3 Factory around the block we found
  const targetBlock = 25841020; // Approximate block based on hex 0x18b017c
  
  console.log(`Searching for PoolCreated events around block ${targetBlock}...`);
  
  // Search in a range around the target block
  const searchRange = 100;
  
  try {
    const logs = await provider.getLogs({
      address: V3_FACTORY,
      topics: [PoolCreatedTopic],
      fromBlock: targetBlock - searchRange,
      toBlock: targetBlock + searchRange,
    });
    
    console.log(`Found ${logs.length} PoolCreated events`);
    
    for (const log of logs) {
      const poolAddress = '0x' + log.data.slice(26);
      console.log('\nPoolCreated event:');
      console.log('  Pool:', poolAddress);
      console.log('  Token0:', '0x' + log.topics[1].slice(26));
      console.log('  Token1:', '0x' + log.topics[2].slice(26));
      console.log('  Fee:', parseInt(log.topics[3], 16));
      console.log('  Block:', log.blockNumber.toString());
      console.log('  Tx:', log.transactionHash);
      
      if (poolAddress.toLowerCase() === HOOK_POOL.toLowerCase()) {
        console.log('\n*** THIS IS THE HOOK POOL CREATION ***');
        
        const tx = await provider.getTransaction(log.transactionHash);
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        const block = await provider.getBlock(receipt.blockNumber);
        
        console.log('\nCreator:', tx.from);
        console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
        
        return { tx, receipt, block, log };
      }
    }
  } catch (e) {
    console.log('Error searching for logs:', e.message);
  }
  
  return null;
}

async function checkContractCreation() {
  console.log('\n=== Checking Contract Creation using debug_traceTransaction ===');
  
  // Try to use Alchemy's debug_traceTransaction
  const txHash = '0xe6c5c6657a2fba1473b578042a51bc02d625cb46ca8244be9de0adddd19ad36f';
  
  try {
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'debug_traceTransaction',
        params: [txHash, { disableStorage: true, disableMemory: true }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result) {
      console.log('Trace result:', JSON.stringify(data.result, null, 2).slice(0, 2000));
    } else {
      console.log('Error:', data.error);
    }
  } catch (e) {
    console.log('Error calling debug_traceTransaction:', e.message);
  }
}

async function analyzeCappedBurnLauncherForPoolCreation() {
  console.log('\n=== Analyzing CappedBurnLauncher for Pool Creation Logic ===');
  
  const code = await provider.getCode(CAPPED_BURN_LAUNCHER);
  
  // Look for CREATE/CREATE2 opcodes
  const createOpcodes = {
    'f0': 'CREATE',
    'f5': 'CREATE2',
  };
  
  console.log('\nLooking for contract creation opcodes...');
  for (const [opcode, name] of Object.entries(createOpcodes)) {
    if (code.includes(opcode)) {
      console.log(`Found ${name} opcode (0x${opcode})`);
    }
  }
  
  // Look for Uniswap V3 Factory address
  console.log('\nLooking for Uniswap V3 Factory address...');
  const factoryHex = V3_FACTORY.slice(2).toLowerCase();
  if (code.toLowerCase().includes(factoryHex)) {
    console.log('Found V3 Factory address in CappedBurnLauncher!');
  }
  
  // Look for function selectors
  console.log('\nLooking for pool creation function selectors...');
  const poolCreationSelectors = {
    '0x8b5e231d': 'createPool(address,uint24)',
    '0x5a6a7b5c': 'createPool(address)',
    '0x1698ee82': 'createPool(address,address,uint24)',
  };
  
  for (const [sel, func] of Object.entries(poolCreationSelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
}

async function main() {
  try {
    await investigateFirstTransfer();
    await findPoolCreationEvent();
    await checkContractCreation();
    await analyzeCappedBurnLauncherForPoolCreation();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
