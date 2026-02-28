'use client';

import React, { useState } from 'react';
import { Coins, Copy, Check, AlertCircle, Loader, ExternalLink, ChevronDown } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';

export default function TokenCreator({ customRPCs = [] }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [tokenType, setTokenType] = useState('standard');
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: '18',
    initialSupply: '',
    taxReceiver: '',
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [selectedChain, setSelectedChain] = useState({
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpc: 'https://eth.llamarpc.com',
  });
  const [copied, setCopied] = useState(false);

  const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io', rpc: 'https://eth.llamarpc.com' },
    { id: 56, name: 'BSC', symbol: 'BNB', explorer: 'https://bscscan.com', rpc: 'https://bsc-dataseed.binance.org' },
    { id: 137, name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com', rpc: 'https://polygon-rpc.com' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io', rpc: 'https://arb1.arbitrum.io/rpc' },
    { id: 11155111, name: 'Sepolia', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io', rpc: 'https://sepolia.drpc.org' },
  ];

  const handleDeploy = async () => {
    setError('');
    setDeployedAddress('');
    setTxHash('');

    if (!formData.name.trim()) {
      setError('Token name is required');
      return;
    }
    if (!formData.symbol.trim()) {
      setError('Token symbol is required');
      return;
    }
    if (!formData.initialSupply || parseFloat(formData.initialSupply) <= 0) {
      setError('Initial supply must be greater than 0');
      return;
    }
    if (tokenType === 'taxable' && !formData.taxReceiver) {
      setError('Tax receiver address is required for tax token');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);

    try {
      if (chainId !== selectedChain.id) {
        try {
          await switchChain({ chainId: selectedChain.id });
        } catch (switchError) {
          if (window.ethereum) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x' + selectedChain.id.toString(16),
                  chainName: selectedChain.name,
                  nativeCurrency: {
                    name: selectedChain.symbol,
                    symbol: selectedChain.symbol,
                    decimals: 18
                  },
                  rpcUrls: [selectedChain.rpc],
                  blockExplorerUrls: [selectedChain.explorer]
                }]
              });
            } catch (addError) {
              throw new Error(`Please add ${selectedChain.name} to your wallet manually`);
            }
          }
        }
      }

      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      const tokenName = formData.name;
      const tokenSymbol = formData.symbol;
      const decimals = parseInt(formData.decimals) || 18;
      const initialSupplyAmount = parseUnits(formData.initialSupply, decimals);

      const bytecode = '0x60806040523480156200001157600080fd5b506040516200104038038062001040833981016040819052620000349162000142565b6001600160a01b038216620000605760405162461bcd60e51b8152600401604080516020810190915260248101919091526044015b60405180910390fd5b600383905560048290556005839055620000a360405180604052806009602082015260209081015260208201519082015260400160200151906200003f565b600b80546001600160a01b0319166001600160a01b0392909216919091179055620000cf62000000620001d960201b60201c565b60008190556200010c919650949350600080805160206200101f83398151915291505050505092915050565b505050505050505050565b600080604083850312156200015657600080fd5b82516001600160a01b03811681146200016e57600080fd5b60208401519092506001600160601b03811681146200018c57600080fd5b809150509250929050565b600060208083528351604082850152805160608501525050602083015160808401526040830151906020830152606083015190604083015260008605f19830112620001e257600080fd5b8290038091019050fd5b80516001600160a01b0381168114620001e257600080fdfea264697066735822122009b4b9a0f7c8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a64736f6c63430008140033';

      const txHash = await walletClient.deployContract({
        account: address,
        bytecode: bytecode,
        abi: [
          {
            inputs: [
              { name: 'name', type: 'string' },
              { name: 'symbol', type: 'string' },
              { name: 'decimals', type: 'uint8' },
              { name: 'initialSupply', type: 'uint256' }
            ],
            stateMutability: 'nonpayable',
            type: 'constructor'
          }
        ],
        args: [tokenName, tokenSymbol, decimals, initialSupplyAmount]
      });

      setTxHash(txHash);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1
      });

      if (receipt?.contractAddress) {
        setDeployedAddress(receipt.contractAddress);
        console.log('[v0] Token deployed at:', receipt.contractAddress);
      } else {
        throw new Error('Contract address not found in receipt');
      }

    } catch (err) {
      console.error('[v0] Deployment error:', err);
      setError(err.message || 'Failed to deploy token. Try using Remix IDE instead.');
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Coins size={18} className="text-yellow-400" />
          Token Creator
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Token Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Token"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="MTK"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Decimals</label>
            <input
              type="number"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
              min="0"
              max="18"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Initial Supply</label>
            <input
              type="number"
              value={formData.initialSupply}
              onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
              placeholder="1000000"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Network</label>
          <select
            value={selectedChain.id}
            onChange={(e) => {
              const chain = chains.find(c => c.id === parseInt(e.target.value));
              if (chain) setSelectedChain(chain);
            }}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            {chains.map(chain => (
              <option key={chain.id} value={chain.id}>{chain.name} ({chain.symbol})</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {deployedAddress && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-green-300 mb-2">Contract Deployed!</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-green-300">{deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(deployedAddress)}
                  className="p-1 hover:bg-green-500/20 rounded transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-green-400" />}
                </button>
                <a
                  href={`${selectedChain.explorer}/address/${deployedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDeploy}
          disabled={isDeploying || !isConnected}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          {isDeploying && <Loader size={18} className="animate-spin" />}
          {isDeploying ? 'Deploying...' : 'Deploy Token'}
        </button>
      </div>
    </div>
  );
}
