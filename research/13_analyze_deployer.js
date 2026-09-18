const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const DEPLOYER = '0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7';
const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const MYSTERY_ADDR = '0x000000000004444c5dc75cB358380D2e3dE08A90';

async function analyzeDeployer() {
  console.log('=== Analyzing Deployer Address ===');
  console.log('Address:', DEPLOYER);
  
  // Check if it's an EOA or contract
  const code = await provider.getCode(DEPLOYER);
  console.log('Is contract:', code !== '0x' ? 'YES' : 'NO (EOA)');
  
  // Check balance
  const balance = await provider.getBalance(DEPLOYER);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  
  // Get all transactions from this address
  console.log('\nSearching for transactions from this address...');
  
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
          fromAddress: DEPLOYER,
          category: ['external'],
          maxCount: '0x100'
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers) {
      console.log(`\nFound ${data.result.transfers.length} outgoing transactions:`);
      
      const uniqueTo = new Set();
      for (const transfer of data.result.transfers) {
        uniqueTo.add(transfer.to);
        
        const blockNum = parseInt(transfer.blockNum, 16);
        const block = await provider.getBlock(blockNum);
        
        console.log(`\n  To: ${transfer.to}`);
        console.log(`  Value: ${transfer.value} ETH`);
        console.log(`  Block: ${blockNum}`);
        console.log(`  Timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
        console.log(`  Hash: ${transfer.hash}`);
      }
      
      console.log('\n\nUnique recipients:', uniqueTo.size);
      for (const addr of uniqueTo) {
        console.log('  -', addr);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function checkKnownDeployers() {
  console.log('\n=== Checking Known Deployers ===');
  
  // Check if this is a known deployer address
  const knownDeployers = {
    '0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7': 'Possible Uniswap V4 Deployer',
    '0x4e59b44847b379578588920ca78fbf26c0b4956c': 'CREATE2 Deployer',
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
    '0xE592427A0AEce92De3EdEe1F18E0157C05861564': 'Uniswap V3 Router',
  };
  
  const deployerLower = DEPLOYER.toLowerCase();
  if (knownDeployers[deployerLower]) {
    console.log(`This address is: ${knownDeployers[deployerLower]}`);
  } else {
    console.log('This is not a commonly known deployer address');
  }
}

async function traceTransaction() {
  console.log('\n=== Tracing the Pool Creation Transaction ===');
  
  const txHash = '0xe6c5c6657a2fba1473b578042a51bc02d625cb46ca8244be9de0adddd19ad36f';
  
  // Try to get trace using Alchemy
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
      console.log('\nTransaction trace (first 3000 chars):');
      console.log(JSON.stringify(data.result, null, 2).slice(0, 3000));
    } else if (data.error) {
      console.log('Error:', data.error.message);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function main() {
  try {
    await analyzeDeployer();
    await checkKnownDeployers();
    await traceTransaction();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
