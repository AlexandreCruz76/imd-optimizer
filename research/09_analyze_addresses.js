const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const MYSTERY_ADDR = '0x000000000004444c5dc75cB358380D2e3dE08A90';
const SENDER = '0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7';

async function analyzeMysteryAddress() {
  console.log('=== Analyzing Mystery Address: 0x000000000004444c5dc75cB358380D2e3dE08A90 ===');
  
  const code = await provider.getCode(MYSTERY_ADDR);
  console.log('Bytecode length:', code.length / 2, 'bytes');
  
  // Check if it's a known contract
  // This looks like it could be a Uniswap V3 related contract
  // Check common selectors
  
  const selectors = {
    '0x095ea7b3': 'approve(address,uint256)',
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x8803dbee': 'swapTokensForExactTokens',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0xfb3bdb41': 'swapETHForExactTokens',
    '0x3593564c': 'execute(address,bytes,uint256)',
    '0xac9650d8': 'multicall(uint256,bytes[])',
  };
  
  console.log('\nSearching for function selectors...');
  for (const [sel, func] of Object.entries(selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Check storage for known patterns
  console.log('\nChecking storage slots...');
  for (let i = 0; i < 5; i++) {
    try {
      const storage = await provider.getStorage(MYSTERY_ADDR, i);
      if (storage !== '0x' + '0'.repeat(64)) {
        console.log(`Slot ${i}: ${storage}`);
      }
    } catch (e) {}
  }
}

async function analyzeSender() {
  console.log('\n=== Analyzing Sender: 0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7 ===');
  
  const code = await provider.getCode(SENDER);
  console.log('Is contract:', code !== '0x' ? 'YES' : 'NO (EOA)');
  
  if (code === '0x') {
    // Check balance
    const balance = await provider.getBalance(SENDER);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    // Check recent transactions
    const latestBlock = await provider.getBlockNumber();
    console.log('\nChecking recent activity...');
    
    // Use alchemy_getAssetTransfers
    try {
      const response = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x' + (latestBlock - 1000).toString(16),
            toBlock: 'latest',
            fromAddress: SENDER,
            category: ['external'],
            maxCount: '0x10'
          }],
          id: 1
        })
      });
      
      const data = await response.json();
      if (data.result && data.result.transfers) {
        console.log(`\nRecent outgoing transfers from sender:`);
        for (const transfer of data.result.transfers.slice(0, 10)) {
          console.log(`\n  To: ${transfer.to}`);
          console.log(`  Value: ${transfer.value} ETH`);
          console.log(`  Block: ${transfer.blockNum}`);
          console.log(`  Hash: ${transfer.hash}`);
        }
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

async function decodeFunctionSelector() {
  console.log('\n=== Decoding Function Selector 0xc1d64bfb ===');
  
  // The input data starts with 0xc1d64bfb
  // This is the function selector for the function called on the Hook Pool
  
  // Common function signatures
  const signatures = [
    'swap(address,bool,int256,uint160,bytes)',
    'swapWithPermit(address,bool,int256,uint160,bytes)',
    'mint(address,int24,int24,uint256,bytes)',
    'collect(address,int24,int24,uint128,uint128)',
    'burn(int24,int24,uint128)',
  ];
  
  for (const sig of signatures) {
    const hash = ethers.id(sig);
    const selector = hash.slice(0, 10);
    if (selector === '0xc1d64bfb') {
      console.log(`Function signature: ${sig}`);
      console.log(`Selector: ${selector}`);
      break;
    }
  }
  
  // Also check if it's a custom function
  console.log('\nTrying to decode input data...');
  const input = '0xc1d64bfb000000000000000000000000000000000000000000000007ecc1b337379dcbe400000000000000000000000000000000000000000000133eb7198bde2db570100000000000000000000000000000000000000000000003635c9adc5dea0000000000000000000000000000000000000000000000000003635c9adc5dea00000';
  
  // Decode the parameters
  // Looks like 4 uint256 values
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    '0x' + input.slice(10)
  );
  
  console.log('\nDecoded parameters:');
  console.log('Param 1:', decoded[0].toString());
  console.log('Param 2:', decoded[1].toString());
  console.log('Param 3:', decoded[2].toString());
  console.log('Param 4:', decoded[3].toString());
  
  console.log('\nIn ETH:');
  console.log('Param 1:', ethers.formatEther(decoded[0]), 'ETH');
  console.log('Param 2:', ethers.formatEther(decoded[1]), 'ETH');
  console.log('Param 3:', ethers.formatEther(decoded[2]), 'ETH');
  console.log('Param 4:', ethers.formatEther(decoded[3]), 'ETH');
}

async function checkCappedBurnLauncherCreator() {
  console.log('\n=== Checking CappedBurnLauncher Creator ===');
  
  // Try to find when CappedBurnLauncher was deployed
  // Use alchemy_getAssetTransfers
  try {
    const latestBlock = await provider.getBlockNumber();
    
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: CAPPED_BURN_LAUNCHER,
          category: ['external'],
          maxCount: '0x5'
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers) {
      console.log(`Found ${data.result.transfers.length} transfers to CappedBurnLauncher:`);
      for (const transfer of data.result.transfers) {
        console.log(`\n  From: ${transfer.from}`);
        console.log(`  Value: ${transfer.value} ETH`);
        console.log(`  Block: ${transfer.blockNum}`);
        console.log(`  Hash: ${transfer.hash}`);
        console.log(`  Category: ${transfer.category}`);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function main() {
  try {
    await analyzeMysteryAddress();
    await analyzeSender();
    await decodeFunctionSelector();
    await checkCappedBurnLauncherCreator();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
