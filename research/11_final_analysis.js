const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const MYSTERY_ADDR = '0x000000000004444c5dc75cB358380D2e3dE08A90';

async function analyzeMysteryAddress() {
  console.log('=== Deep Analysis of Mystery Address ===');
  console.log('Address:', MYSTERY_ADDR);
  
  const code = await provider.getCode(MYSTERY_ADDR);
  
  // Check for Uniswap V4 selectors
  const v4Selectors = {
    '0x128acb08': 'swap(address,address,int256,int256,bytes)',
    '0x219f5d17': 'swap(address,address,int256,uint256,address)',
    '0x0c4a4721': 'swap(address,bool,int256,uint160,bytes)',
    '0xac9650d8': 'multicall(uint256,bytes[])',
    '0x5ae401dc': 'multicall(uint256,bytes[])',
    '0x3593564c': 'execute(address,bytes,uint256)',
    '0x38ed1739': 'swapExactTokensForTokens',
  };
  
  console.log('\nChecking for function selectors...');
  for (const [sel, func] of Object.entries(v4Selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Check all storage slots
  console.log('\nStorage analysis:');
  for (let i = 0; i < 10; i++) {
    try {
      const storage = await provider.getStorage(MYSTERY_ADDR, i);
      if (storage !== '0x' + '0'.repeat(64)) {
        const value = BigInt(storage);
        console.log(`Slot ${i}: ${storage}`);
        
        // Check if it's an address
        if (value > 0 && value < 2n ** 160n) {
          const addr = '0x' + value.toString(16).padStart(40, '0');
          console.log(`  -> Address: ${addr}`);
          
          // Check what's at that address
          const codeAtAddr = await provider.getCode(addr);
          if (codeAtAddr !== '0x') {
            console.log(`     Contract bytecode length: ${codeAtAddr.length / 2} bytes`);
          }
        }
      }
    } catch (e) {}
  }
}

async function findHookPoolCreationBySearchingBlocks() {
  console.log('\n=== Searching for Hook Pool Creation Block ===');
  
  // We know the first transfer to Hook Pool was at block 25887100
  // The hook pool must have been created before that
  // Let's search for PoolCreated events
  
  const V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  const PoolCreatedTopic = '0x783cca1c0412dd0d695e7127b58eea8519b72d10936c7f18e33ac068b95140f8';
  
  // Search backwards from block 25887100
  const startBlock = 25887100;
  
  console.log(`Searching backwards from block ${startBlock}...`);
  
  // We'll use alchemy_getAssetTransfers to find when the contract was deployed
  try {
    // Get the contract creation transaction
    // by looking for the first incoming transfer
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x' + (startBlock - 50000).toString(16),
          toBlock: '0x' + startBlock.toString(16),
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
      console.log(`\nFound ${data.result.transfers.length} transfers to Hook Pool:`);
      for (const transfer of data.result.transfers) {
        const blockNum = parseInt(transfer.blockNum, 16);
        const block = await provider.getBlock(blockNum);
        
        console.log(`\n  From: ${transfer.from}`);
        console.log(`  Value: ${transfer.value} ETH`);
        console.log(`  Block: ${blockNum}`);
        console.log(`  Timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
        console.log(`  Hash: ${transfer.hash}`);
        console.log(`  Category: ${transfer.category}`);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function checkHookPoolCreation() {
  console.log('\n=== Checking Hook Pool Contract Creation ===');
  
  // The hook pool address is 0xc6c965bd164c483e87d0b550671798e9a3602840
  // Let's check if we can find when it was created by looking at storage
  
  // First, let's check the code size at different blocks
  const testBlocks = [25800000, 25850000, 25880000, 25887000, 25887100];
  
  console.log('Checking hook pool code at different blocks...');
  for (const block of testBlocks) {
    try {
      const code = await provider.getCode(HOOK_POOL, block);
      console.log(`Block ${block}: ${code !== '0x' ? 'EXISTS' : 'NOT EXISTS'}`);
    } catch (e) {
      console.log(`Block ${block}: Error - ${e.message}`);
    }
  }
}

async function analyzeTransaction() {
  console.log('\n=== Analyzing First Transaction to Hook Pool ===');
  
  const txHash = '0xe6c5c6657a2fba1473b578042a51bc02d625cb46ca8244be9de0adddd19ad36f';
  
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log('Transaction details:');
  console.log('  Hash:', txHash);
  console.log('  From:', tx.from);
  console.log('  To:', tx.to);
  console.log('  Value:', ethers.formatEther(tx.value), 'ETH');
  console.log('  Input data length:', tx.data.length / 2, 'bytes');
  
  // Decode the input data
  // 0xc1d64bfb is the function selector
  const selector = tx.data.slice(0, 10);
  console.log('\n  Function selector:', selector);
  
  // The input data has 4 parameters (each 32 bytes = 64 hex chars)
  const paramData = tx.data.slice(10);
  console.log('  Parameter data length:', paramData.length / 2, 'bytes');
  
  // Decode parameters
  const param1 = BigInt('0x' + paramData.slice(0, 64));
  const param2 = BigInt('0x' + paramData.slice(64, 128));
  const param3 = BigInt('0x' + paramData.slice(128, 192));
  const param4 = BigInt('0x' + paramData.slice(192, 256));
  
  console.log('\n  Decoded parameters:');
  console.log('  Param 1:', param1.toString(), '(', ethers.formatEther(param1), 'ETH)');
  console.log('  Param 2:', param2.toString(), '(', ethers.formatEther(param2), 'ETH)');
  console.log('  Param 3:', param3.toString(), '(', ethers.formatEther(param3), 'ETH)');
  console.log('  Param 4:', param4.toString(), '(', ethers.formatEther(param4), 'ETH)');
  
  // The log shows a swap event from the mystery address
  // Let's analyze the logs
  console.log('\n  Transaction logs:');
  for (const log of receipt.logs) {
    console.log('\n  Log:');
    console.log('    Address:', log.address);
    console.log('    Topics:', log.topics);
    console.log('    Data:', log.data);
  }
}

async function main() {
  try {
    await analyzeMysteryAddress();
    await findHookPoolCreationBySearchingBlocks();
    await checkHookPoolCreation();
    await analyzeTransaction();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
