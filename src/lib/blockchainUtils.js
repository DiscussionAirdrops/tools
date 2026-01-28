// Multi-chain balance fetching utility
// Supports all EVM networks, Solana, Bitcoin with hybrid approach (RPC + APIs)

// Chain ID mapping - All major EVM networks
const CHAIN_IDS = {
  'Ethereum': 1,
  'EVM': 1,
  'ETH': 1,
  'BSC': 56,
  'Polygon': 137,
  'MATIC': 137,
  'Arbitrum': 42161,
  'ARB': 42161,
  'Optimism': 10,
  'OP': 10,
  'Base': 8453,
  'Avalanche': 43114,
  'AVAX': 43114,
  'Fantom': 250,
  'FTM': 250,
  'zkSync': 324,
  'Linea': 59144,
  'Mantle': 5000,
  'Celo': 42220,
  'Gnosis': 100,
  'Harmony': 1666600000,
  'Moonbeam': 1284,
};

const RPC_ENDPOINTS = {
  1: 'https://eth.llamarpc.com', // Ethereum Mainnet
  56: 'https://bsc-dataseed.binance.org', // BSC
  137: 'https://polygon-rpc.com', // Polygon
  42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
  10: 'https://mainnet.optimism.io', // Optimism
  8453: 'https://mainnet.base.org', // Base
  43114: 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
  250: 'https://rpc.ftm.tools', // Fantom
  324: 'https://mainnet.era.zksync.io', // zkSync Era
  59144: 'https://rpc.linea.build', // Linea
  5000: 'https://rpc.mantle.xyz', // Mantle
  42220: 'https://forno.celo.org', // Celo
  100: 'https://rpc.gnosischain.com', // Gnosis
  1666600000: 'https://api.harmony.one', // Harmony
  1284: 'https://rpc.api.moonbeam.network', // Moonbeam
};

// Token symbols for each network
const NETWORK_TOKENS = {
  1: 'ETH',
  56: 'BNB',
  137: 'MATIC',
  42161: 'ETH',
  10: 'ETH',
  8453: 'ETH',
  43114: 'AVAX',
  250: 'FTM',
  324: 'ETH',
  59144: 'ETH',
  5000: 'MNT',
  42220: 'CELO',
  100: 'xDAI',
  1666600000: 'ONE',
  1284: 'GLMR',
};

// Fetch EVM Balance
const fetchEVMBalance = async (address, chain = 'Ethereum') => {
  try {
    const chainId = CHAIN_IDS[chain] || 1;
    const rpcUrl = RPC_ENDPOINTS[chainId];

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.result) {
      const balanceWei = BigInt(data.result);
      const balanceEth = Number(balanceWei) / 1e18;
      return balanceEth;
    }
    return 0;
  } catch (error) {
    console.error('[v0] Error fetching EVM balance:', error.message);
    return 0;
  }
};

// Fetch Solana Balance
const fetchSolanaBalance = async (address) => {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });

    const data = await response.json();
    if (data.result?.value !== undefined) {
      return data.result.value / 1e9; // Convert lamports to SOL
    }
    return 0;
  } catch (error) {
    console.error('[v0] Error fetching Solana balance:', error.message);
    return 0;
  }
};

// Fetch Bitcoin Balance
const fetchBitcoinBalance = async (address) => {
  try {
    const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
    if (response.ok) {
      const balance = await response.text();
      return parseInt(balance) / 1e8; // Convert satoshi to BTC
    }
    return 0;
  } catch (error) {
    console.error('[v0] Error fetching Bitcoin balance:', error.message);
    return 0;
  }
};

// Fetch current prices for all supported tokens
const fetchPrices = async () => {
  try {
    const tokenIds = 'ethereum,solana,bitcoin,binancecoin,matic-network,arbitrum,optimism,base,avalanche-2,fantom,zksync,linea,mantle,celo,xdai,harmony,moonbeam';
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd`
    );
    const data = await response.json();
    return {
      ETH: data.ethereum?.usd || 0,
      BNB: data.binancecoin?.usd || 0,
      MATIC: data['matic-network']?.usd || 0,
      ARB: data.arbitrum?.usd || 0,
      OP: data.optimism?.usd || 0,
      BASE: data.base?.usd || 0,
      AVAX: data['avalanche-2']?.usd || 0,
      FTM: data.fantom?.usd || 0,
      ZKSYNC: data.zksync?.usd || 0,
      LINEA: data.linea?.usd || 0,
      MNT: data.mantle?.usd || 0,
      CELO: data.celo?.usd || 0,
      xDAI: data.xdai?.usd || 0,
      ONE: data.harmony?.usd || 0,
      GLMR: data.moonbeam?.usd || 0,
      SOL: data.solana?.usd || 0,
      BTC: data.bitcoin?.usd || 0,
    };
  } catch (error) {
    console.error('[v0] Error fetching prices:', error.message);
    return {
      ETH: 0, BNB: 0, MATIC: 0, ARB: 0, OP: 0, BASE: 0,
      AVAX: 0, FTM: 0, ZKSYNC: 0, LINEA: 0, MNT: 0, CELO: 0,
      xDAI: 0, ONE: 0, GLMR: 0, SOL: 0, BTC: 0,
    };
  }
};

// Main function: Fetch balance in USD for any chain
export const fetchBalanceInUSD = async (address, chain) => {
  try {
    console.log(`[v0] fetchBalanceInUSD: ${chain} - ${address}`);

    let balance = 0;
    let tokenSymbol = 'ETH';
    let networkName = chain;

    // Fetch balance based on chain type
    if (chain === 'Bitcoin') {
      balance = await fetchBitcoinBalance(address);
      tokenSymbol = 'BTC';
    } else if (chain === 'Solana') {
      balance = await fetchSolanaBalance(address);
      tokenSymbol = 'SOL';
    } else {
      // All other chains are EVM - get the correct chain ID
      const chainId = CHAIN_IDS[chain] || 1;
      balance = await fetchEVMBalance(address, chain);
      tokenSymbol = NETWORK_TOKENS[chainId] || 'ETH';
      networkName = Object.keys(CHAIN_IDS).find(key => CHAIN_IDS[key] === chainId) || chain;
    }

    // Fetch current prices
    const prices = await fetchPrices();
    const price = prices[tokenSymbol] || 0;
    const balanceUSD = balance * price;

    const result = {
      balance,
      balanceUSD,
      price,
      tokenSymbol,
      chain: networkName,
      chainId: CHAIN_IDS[chain],
    };

    console.log('[v0] Balance fetched:', result);
    return result;
  } catch (error) {
    console.error('[v0] fetchBalanceInUSD error:', error.message);
    return {
      balance: 0,
      balanceUSD: 0,
      price: 0,
      tokenSymbol: '',
      chain,
      error: error.message,
    };
  }
};

// Export all functions
export {
  fetchEVMBalance,
  fetchSolanaBalance,
  fetchBitcoinBalance,
  fetchPrices
};
