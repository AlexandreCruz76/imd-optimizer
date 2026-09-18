const { ethers } = require('ethers');

const RPC = 'https://eth-mainnet.g.alchemy.com/v2/alch_PDiKN7Ch-V5l6a8N4OF-E';
const provider = new ethers.JsonRpcProvider(RPC);

const HOOK_POOL = '0xc6c965bd164c483e87d0b550671798e9a3602840';
const CAPPED_BURN_LAUNCHER = '0x80587937a883743e67bB11dab356F60e4656C40d';
const IMD_TOKEN = '0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const MYSTERY_ADDR = '0x000000000004444c5dc75cB358380D2e3dE08A90';
const SENDER = '0x047F606fD5b2BaA5f5C6c4aB8958E45CB6B054B7';

async function decodeFunctionSelector() {
  console.log('=== Decoding Function Selector 0xc1d64bfb ===');
  
  // The function selector is 0xc1d64bfb
  // Let me search for this selector in known contracts
  
  // This could be a custom function on the hook pool
  // Let me try different function signatures
  
  const signatures = [
    'swap(address,bool,int256,uint160,bytes)',
    'swap(uint256,uint256,address,address)',
    'swapWithPermit(address,bool,int256,uint160,bytes)',
    'mint(address,int24,int24,uint256,bytes)',
    'collect(address,int24,int24,uint128,uint128)',
    'burn(int24,int24,uint128)',
    'flash(address,uint256,uint256,bytes)',
    'mint(uint256,uint256)',
    'swap(uint256,uint256)',
  ];
  
  let foundSig = null;
  for (const sig of signatures) {
    const hash = ethers.id(sig);
    const selector = hash.slice(0, 10);
    if (selector === '0xc1d64bfb') {
      foundSig = sig;
      console.log(`Found matching signature: ${sig}`);
      console.log(`Selector: ${selector}`);
      break;
    }
  }
  
  if (!foundSig) {
    console.log('Function signature not found in common signatures');
    console.log('\nLet me try to decode the input data manually...');
    
    // The input data is:
    // 0xc1d64bfb
    // 000000000000000000000000000000000000000000000007ecc1b337379dcbe4
    // 0000000000000000000000000000000000000000000000133eb7198bde2db5701
    // 00000000000000000000000000000000000000000000003635c9adc5dea000000
    // 000000000000000000000000000000000000000000000003635c9adc5dea000000
    
    const param1 = BigInt('0x000000000000000000000000000000000000000000000007ecc1b337379dcbe4');
    const param2 = BigInt('0x0000000000000000000000000000000000000000000000133eb7198bde2db5701');
    const param3 = BigInt('0x00000000000000000000000000000000000000000000003635c9adc5dea000000');
    const param4 = BigInt('0x000000000000000000000000000000000000000000000003635c9adc5dea000000');
    
    console.log('\nDecoded parameters (manual):');
    console.log('Param 1:', param1.toString());
    console.log('Param 2:', param2.toString());
    console.log('Param 3:', param3.toString());
    console.log('Param 4:', param4.toString());
    
    console.log('\nIn ETH:');
    console.log('Param 1:', ethers.formatEther(param1), 'ETH');
    console.log('Param 2:', ethers.formatEther(param2), 'ETH');
    console.log('Param 3:', ethers.formatEther(param3), 'ETH');
    console.log('Param 4:', ethers.formatEther(param4), 'ETH');
    
    // This looks like it could be a swap function with 4 parameters
    // Let me check if it's a custom hook pool function
  }
}

async function findHookPoolCreation() {
  console.log('\n=== Finding Hook Pool Creation ===');
  
  // We know the hook pool exists, let's find when it was created
  // by searching for the first transaction or log
  
  // Use alchemy_getAssetTransfers to find the first transfer
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
          maxCount: '0x1'
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers && data.result.transfers.length > 0) {
      const firstTransfer = data.result.transfers[0];
      console.log('\nFirst transfer to Hook Pool:');
      console.log('  From:', firstTransfer.from);
      console.log('  To:', firstTransfer.to);
      console.log('  Value:', firstTransfer.value);
      console.log('  Block:', firstTransfer.blockNum);
      console.log('  Hash:', firstTransfer.hash);
      
      // Get the block timestamp
      const blockNum = parseInt(firstTransfer.blockNum, 16);
      const block = await provider.getBlock(blockNum);
      console.log('  Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function checkCappedBurnLauncherCreation() {
  console.log('\n=== Checking CappedBurnLauncher Creation ===');
  
  // Use alchemy_getAssetTransfers to find when CappedBurnLauncher was created
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
          toAddress: CAPPED_BURN_LAUNCHER,
          category: ['external'],
          maxCount: '0x1'
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    if (data.result && data.result.transfers && data.result.transfers.length > 0) {
      const firstTransfer = data.result.transfers[0];
      console.log('\nFirst transfer to CappedBurnLauncher:');
      console.log('  From:', firstTransfer.from);
      console.log('  Value:', firstTransfer.value);
      console.log('  Block:', firstTransfer.blockNum);
      console.log('  Hash:', firstTransfer.hash);
      
      // Get the block timestamp
      const blockNum = parseInt(firstTransfer.blockNum, 16);
      const block = await provider.getBlock(blockNum);
      console.log('  Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

async function analyzeMysteryAddress() {
  console.log('\n=== Analyzing Mystery Address 0x000000000004444c5dc75cB358380D2e3dE08A90 ===');
  
  // This address has a special pattern - 0x000000000004444c5dc75cB358380D2e3dE08A90
  // This could be a Uniswap V3 related contract
  
  const code = await provider.getCode(MYSTERY_ADDR);
  console.log('Bytecode length:', code.length / 2, 'bytes');
  
  // Check for Uniswap V3 SwapRouter02 selectors
  const selectors = {
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x8803dbee': 'swapTokensForExactTokens',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0xfb3bdb41': 'swapETHForExactTokens',
    '0x3593564c': 'execute(address,bytes,uint256)',
    '0xac9650d8': 'multicall(uint256,bytes[])',
    '0x04e45aaf': 'quoteExactInputSingle',
    '0xf7729d49': 'quoteExactOutputSingle',
  };
  
  console.log('\nSearching for function selectors...');
  for (const [sel, func] of Object.entries(selectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (code.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  // Check what's at the storage slots
  console.log('\nStorage analysis:');
  const slot0 = await provider.getStorage(MYSTERY_ADDR, 0);
  const slot2 = await provider.getStorage(MYSTERY_ADDR, 2);
  
  // Slot 0 contains an address - this is likely the owner or factory
  const slot0Addr = '0x' + slot0.slice(26);
  console.log('Slot 0 address:', slot0Addr);
  
  // Check if this is a known address
  const knownAddresses = {
    '0x1f98431c8ad98523631ae4a59f267346ea31f984': 'Uniswap V3 Factory',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'SwapRouter',
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'SwapRouter02',
    '0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6': 'ProtocolFeeManager',
  };
  
  const slot0Lower = slot0Addr.toLowerCase();
  if (knownAddresses[slot0Lower]) {
    console.log(`  This is: ${knownAddresses[slot0Lower]}`);
  }
}

async function checkBuyMechanism() {
  console.log('\n=== Checking Buy Mechanism ===');
  
  // Check if there's a buy function on the hook pool or CappedBurnLauncher
  const buySelectors = {
    '0x6ea056c9': 'buy()',
    '0x1249c594': 'buy(uint256)',
    '0xd0e30db0': 'deposit()',
    '0xb6b55f25': 'deposit()',
  };
  
  console.log('\nChecking CappedBurnLauncher for buy functions...');
  const cappedCode = await provider.getCode(CAPPED_BURN_LAUNCHER);
  for (const [sel, func] of Object.entries(buySelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (cappedCode.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  console.log('\nChecking Hook Pool for buy functions...');
  const hookCode = await provider.getCode(HOOK_POOL);
  for (const [sel, func] of Object.entries(buySelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (hookCode.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
  
  console.log('\nChecking IMD Token for buy functions...');
  const tokenCode = await provider.getCode(IMD_TOKEN);
  for (const [sel, func] of Object.entries(buySelectors)) {
    const selHex = sel.slice(2).toLowerCase();
    if (tokenCode.toLowerCase().includes(selHex)) {
      console.log(`Found: ${sel} = ${func}`);
    }
  }
}

async function main() {
  try {
    await decodeFunctionSelector();
    await findHookPoolCreation();
    await checkCappedBurnLauncherCreation();
    await analyzeMysteryAddress();
    await checkBuyMechanism();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
