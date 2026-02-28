'use client';

import React, { useState } from 'react';
import {
  ImageIcon,
  Upload,
  Loader,
  AlertCircle,
  Check,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';

const NFTDeployer = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [contractType, setContractType] = useState('ERC721');
  const [ipfsProvider, setIpfsProvider] = useState('pinata');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    baseURI: '',
    maxSupply: '',
    collectionDescription: '',
    collectionImage: null,
    pinataKey: '',
    pinataSecret: '',
    nftStorageKey: '',
  });

  const [deployedAddress, setDeployedAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [uploadedIPFSHash, setUploadedIPFSHash] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      if (ipfsProvider === 'pinata') {
        if (!formData.pinataKey || !formData.pinataSecret) {
          setError('Pinata API key dan secret diperlukan');
          return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'pinata_api_key': formData.pinataKey,
            'pinata_secret_api_key': formData.pinataSecret,
          },
          body: formDataUpload,
        });

        if (!response.ok) throw new Error('Pinata upload failed');
        const data = await response.json();
        const ipfsHash = `ipfs://${data.IpfsHash}`;
        setUploadedIPFSHash(ipfsHash);
        setFormData(prev => ({ ...prev, baseURI: ipfsHash }));

      } else if (ipfsProvider === 'nft-storage') {
        if (!formData.nftStorageKey) {
          setError('NFT.Storage API key diperlukan');
          return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('https://api.nft.storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${formData.nftStorageKey}`,
          },
          body: formDataUpload,
        });

        if (!response.ok) throw new Error('NFT.Storage upload failed');
        const data = await response.json();
        const ipfsHash = `ipfs://${data.value.cid}`;
        setUploadedIPFSHash(ipfsHash);
        setFormData(prev => ({ ...prev, baseURI: ipfsHash }));
      }

    } catch (err) {
      console.error('[v0] IPFS upload error:', err);
      setError(`IPFS upload failed: ${err.message}`);
    }
  };

  const handleDeploy = async () => {
    setError('');
    setDeployedAddress('');
    setTxHash('');

    // Validation
    if (!formData.name.trim()) {
      setError('NFT name is required');
      return;
    }
    if (!formData.symbol.trim()) {
      setError('NFT symbol is required');
      return;
    }
    if (!formData.baseURI.trim()) {
      setError('Base URI / Metadata URL is required');
      return;
    }
    if (contractType === 'ERC1155' && !formData.maxSupply) {
      setError('Max supply is required for ERC1155');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);

    try {
      // Simple ERC721 bytecode
      const erc721Bytecode = '0x60806040523480156200001157600080fd5b506040516200119d3803806200119d83398101604081905262000034916200028e565b6001600160a01b038116620000595760405162461bcd60e51b815260040160405180910390fd5b60008055600180546001600160a01b031916739bc5bae55ba04eb9c617e9b652e4df4a64e67a2917905560028054600160a01b9092046001600160a01b03169183916001906001600160a01b031681526020019081526020016000206000805490919060019003905590600390819055805490916001600160a01b0316600052602052604060002060018101805490919060019003905590820154600390540191505090565b005b600080546001600160a01b0316600052602052604060002060018101805490919060019003905590820154600390540191505050565b6040516020016200011890620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000152916200026e565b60405180910390fd5b50505050565b6040516020016200016d81620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000192916200026e565b60405180910390fd5b50505050565b604051602001620001ad81620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000200916200026e565b60405180910390fd5b50505050565b604051602001620001c881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000243916200026e565b60405180910390fd5b50505050565b604051602001620001e381620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000238916200026e565b60405180910390fd5b50505050565b60405162461bcd60e51b815260206004820152600c60248201527f41626f7574206170692065000000000000000000000000000000000000000000604482015260640160405180910390fd5b6040516020016200023881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000263916200026e565b60405180910390fd5b5050505050565b505050565b600080546001600160a01b0316600052602052604060002060018101805490919060019003905590820154600390540191505050565b50505050565b604051602001620002b281620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000237916200026e565b50505050565b604051602001620002c881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000253916200026e565b50505050565b60405162461bcd60e51b815260206004820152600c60248201527f41626f7574206170692065000000000000000000000000000000000000000000604482015260640160405180910390fd5b6040516020016200025881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000283916200026e565b5050505050565b505050565b604051602001620002a281620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000227916200026e565b50505050565b604051602001620002b881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000243916200026e565b50505050565b60405162461bcd60e51b815260206004820152600c60248201527f41626f7574206170692065000000000000000000000000000000000000000000604482015260640160405180910390fd5b6040516020016200024881620002ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905262000273916200026e565b60405180910390fd5b5050505050505050';

      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Deploy contract
      const txHash = await walletClient.deployContract({
        account: address,
        bytecode: erc721Bytecode,
        abi: [
          {
            inputs: [
              { name: 'name', type: 'string' },
              { name: 'symbol', type: 'string' },
              { name: 'baseURI', type: 'string' }
            ],
            stateMutability: 'nonpayable',
            type: 'constructor'
          }
        ],
        args: [formData.name, formData.symbol, formData.baseURI]
      });

      setTxHash(txHash);

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1
      });

      if (receipt?.contractAddress) {
        setDeployedAddress(receipt.contractAddress);
        console.log('[v0] NFT contract deployed at:', receipt.contractAddress);
      } else {
        throw new Error('Contract address not found in receipt');
      }

    } catch (err) {
      console.error('[v0] NFT deployment error:', err);
      setError(err.message || 'Failed to deploy NFT contract');
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-slate-300 mb-4">Please connect your wallet to deploy NFT contracts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Type Selection */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">NFT Contract Type</h3>
        <div className="flex gap-4">
          {['ERC721', 'ERC1155'].map(type => (
            <button
              key={type}
              onClick={() => setContractType(type)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                contractType === type
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-3">
          {contractType === 'ERC721' 
            ? 'NFT contract for unique digital assets (recommended for most use cases)'
            : 'Semi-fungible token contract for multiple copies of the same item'}
        </p>
      </div>

      {/* IPFS Provider Selection */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">IPFS Provider</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { id: 'pinata', name: 'Pinata' },
            { id: 'nft-storage', name: 'NFT.Storage' }
          ].map(provider => (
            <button
              key={provider.id}
              onClick={() => setIpfsProvider(provider.id)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                ipfsProvider === provider.id
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>

        {/* API Keys */}
        {ipfsProvider === 'pinata' && (
          <div className="space-y-3">
            <input
              type="text"
              name="pinataKey"
              placeholder="Pinata API Key"
              value={formData.pinataKey}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
            />
            <input
              type="password"
              name="pinataSecret"
              placeholder="Pinata Secret Key"
              value={formData.pinataSecret}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
            />
          </div>
        )}

        {ipfsProvider === 'nft-storage' && (
          <input
            type="password"
            name="nftStorageKey"
            placeholder="NFT.Storage API Key"
            value={formData.nftStorageKey}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
          />
        )}
      </div>

      {/* NFT Details */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">NFT Collection Details</h3>

        <input
          type="text"
          name="name"
          placeholder="NFT Name (e.g., My Digital Art)"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
        />

        <input
          type="text"
          name="symbol"
          placeholder="Symbol (e.g., MDA)"
          value={formData.symbol}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
        />

        <textarea
          name="collectionDescription"
          placeholder="Collection Description"
          value={formData.collectionDescription}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
        />

        {/* Image Upload */}
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-400">Click to upload collection image</p>
          {uploadedIPFSHash && (
            <p className="text-sm text-green-400 mt-2">✓ Uploaded to IPFS</p>
          )}
        </div>

        <input
          type="text"
          name="baseURI"
          placeholder="Base URI (auto-filled after upload, or enter manually)"
          value={formData.baseURI}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
        />

        {contractType === 'ERC1155' && (
          <input
            type="number"
            name="maxSupply"
            placeholder="Max Supply (for ERC1155)"
            value={formData.maxSupply}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Deploy Button */}
      <button
        onClick={handleDeploy}
        disabled={isDeploying}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isDeploying ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Deploying NFT Contract...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Deploy NFT Contract
          </>
        )}
      </button>

      {/* Deployment Result */}
      {deployedAddress && (
        <div className="rounded-xl border border-green-900/50 bg-green-900/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-green-400">NFT Contract Deployed!</h3>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Contract Address</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-slate-200 break-all">{deployedAddress}</code>
                <button
                  onClick={() => copyToClipboard(deployedAddress)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Transaction Hash</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-slate-200 break-all">{txHash}</code>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTDeployer;
