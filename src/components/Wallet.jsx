'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  Coins,
  Loader,
  Download,
  Search,
  Filter,
  Calculator
} from 'lucide-react';
import { 
  collection, 
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useFirebase } from '../lib/firebaseContext.jsx';
import { fetchBalanceInUSD } from '../lib/blockchainUtils';
import { exportToCSV, exportToJSON, formatWalletsForExport } from '../lib/exportUtils';
import { searchWallets, filterWalletsByChain, filterWalletsByBalance, sortWalletsByBalance } from '../lib/searchUtils';

const Wallet = ({ user }) => {
  const { db } = useFirebase();
  const appId = 'airdrop-tracker-prod';
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState(null);
  const [multiChainAddress, setMultiChainAddress] = useState('');
  const [multiChainResults, setMultiChainResults] = useState(null);
  const [isCheckingMultiChain, setIsCheckingMultiChain] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrevValue, setCalcPrevValue] = useState(null);
  const [calcOperation, setCalcOperation] = useState(null);
  const [calcNewNumber, setCalcNewNumber] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    chain: 'Ethereum'
  });
  
  const chainOptions = [
    'Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Base',
    'Avalanche', 'Fantom', 'zkSync', 'Linea', 'Mantle',
    'Celo', 'Gnosis', 'Harmony', 'Moonbeam',
    'Solana', 'Bitcoin'
  ];

  // Token symbols by chain
  const getTokenSymbol = (chain) => {
    const symbols = {
      'Ethereum': 'ETH', 'ETH': 'ETH',
      'BSC': 'BNB',
      'Polygon': 'MATIC',
      'Arbitrum': 'ETH',
      'Optimism': 'ETH',
      'Base': 'ETH',
      'Avalanche': 'AVAX',
      'Fantom': 'FTM',
      'zkSync': 'ETH',
      'Linea': 'ETH',
      'Mantle': 'MNT',
      'Celo': 'CELO',
      'Gnosis': 'xDAI',
      'Harmony': 'ONE',
      'Moonbeam': 'GLMR',
      'Solana': 'SOL',
      'Bitcoin': 'BTC',
    };
    return symbols[chain] || 'ETH';
  };

  // Fetch wallets from Firebase - reset state on user change
  useEffect(() => {
    // Clear wallets when user changes
    setWallets([]);
    setError(null);
    
    if (!user || !db) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'wallets'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(data);
      setIsLoading(false);
    }, (err) => {
      console.error('[v0] Wallet.jsx Error fetching wallets:', err.message);
      setError('Failed to load wallets: ' + err.message);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, db, appId]);

  // Fetch balances for all wallets
  const handleRefreshBalances = React.useCallback(async () => {
    if (wallets.length === 0) return;
    
    setIsRefreshing(true);
    console.log('[v0] Starting balance refresh for all wallets');

    try {
      for (const wallet of wallets) {
        try {
          console.log(`[v0] Fetching balance for ${wallet.name} (${wallet.chain})`);
          const balanceData = await fetchBalanceInUSD(wallet.address, wallet.chain);
          
          // Update wallet in Firebase with new balance
          const walletRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallets', wallet.id);
          await updateDoc(walletRef, {
            balance: balanceData.balance,
            balanceUSD: balanceData.balanceUSD,
            price: balanceData.price,
            lastUpdated: serverTimestamp()
          });
          
          console.log(`[v0] Updated ${wallet.name}:`, balanceData);
        } catch (err) {
          console.error(`[v0] Error updating ${wallet.name}:`, err.message);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('[v0] Error refreshing balances:', err.message);
      setError('Failed to refresh balances');
    } finally {
      setIsRefreshing(false);
    }
  }, [wallets, db, appId, user]);

  // Calculate total balance (USD)
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balanceUSD || 0), 0);
  const totalTokens = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  // Calculator functions
  const calcHandleNumber = (num) => {
    setCalcDisplay(calcDisplay === '0' ? String(num) : calcDisplay + num);
    setCalcNewNumber(false);
  };

  const calcHandleOperation = (op) => {
    const currentValue = parseFloat(calcDisplay);
    if (calcPrevValue === null) {
      setCalcPrevValue(currentValue);
      setCalcDisplay(calcDisplay + ' ' + op + ' ');
    } else if (calcOperation) {
      const result = calcPerformOperation(calcPrevValue, currentValue, calcOperation);
      setCalcDisplay(result + ' ' + op + ' ');
      setCalcPrevValue(result);
    }
    setCalcOperation(op);
    setCalcNewNumber(true);
  };

  const calcPerformOperation = (prev, current, op) => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return current !== 0 ? prev / current : 0;
      default: return current;
    }
  };

  const calcHandleEquals = () => {
    if (calcDisplay.includes(' ')) {
      const parts = calcDisplay.split(' ');
      if (parts.length >= 3) {
        const firstNum = parseFloat(parts[0]);
        const op = parts[1];
        const lastNum = parseFloat(parts[2]);
        const result = calcPerformOperation(firstNum, lastNum, op);
        setCalcDisplay(String(result));
        setCalcPrevValue(null);
        setCalcOperation(null);
        setCalcNewNumber(true);
      }
    }
  };

  const calcHandleClear = () => {
    setCalcDisplay('0');
    setCalcPrevValue(null);
    setCalcOperation(null);
    setCalcNewNumber(true);
  };

  // Add new wallet
  const handleAddWallet = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'wallets'), {
        name: formData.name.trim(),
        address: formData.address.trim(),
        chain: formData.chain,
        balance: 0,
        balanceUSD: 0,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      console.log("[v0] Wallet.jsx: Wallet added successfully");
      setFormData({ name: '', address: '', chain: 'Ethereum' });
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error('[v0] Wallet.jsx Error adding wallet:', err.message);
      setError('Failed to add wallet: ' + err.message);
    }
  };

  // Delete wallet
  const handleDeleteWallet = async (walletId) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'wallets', walletId));
      setError(null);
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError('Failed to delete wallet');
    }
  };

  // Refresh wallet balance for a specific network
  const handleRefreshSpecific = async (walletId, chain) => {
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) return;

      setIsRefreshing(true);
      const balanceData = await fetchBalanceInUSD(wallet.address, chain);
      
      // Calculate total USD across all EVM networks
      const evmChains = [
        'Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Base',
        'Avalanche', 'Fantom', 'zkSync', 'Linea', 'Mantle',
        'Celo', 'Gnosis', 'Harmony', 'Moonbeam'
      ];

      let totalUSD = 0;
      for (const evmChain of evmChains) {
        try {
          const data = await fetchBalanceInUSD(wallet.address, evmChain);
          totalUSD += data.balanceUSD || 0;
        } catch (err) {
          console.log(`[v0] Could not fetch from ${evmChain}:`, err.message);
        }
      }

      const updatedWallets = wallets.map(w => 
        w.id === walletId 
          ? { 
              ...w, 
              ...balanceData, 
              chain,
              totalUSD: totalUSD // Store total across all networks
            }
          : w
      );
      setWallets(updatedWallets);
      console.log(`[v0] Total USD across all networks for ${wallet.name}: $${totalUSD}`);
    } catch (err) {
      console.error('[v0] Error refreshing wallet:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check balance across all EVM networks
  const handleCheckAllEVMNetworks = async () => {
    if (!multiChainAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setIsCheckingMultiChain(true);
    const results = [];
    let totalUSD = 0;

    const evmChains = [
      'Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Base',
      'Avalanche', 'Fantom', 'zkSync', 'Linea', 'Mantle',
      'Celo', 'Gnosis', 'Harmony', 'Moonbeam'
    ];

    console.log('[v0] Starting multi-chain balance check for:', multiChainAddress);

    for (const chain of evmChains) {
      try {
        const balanceData = await fetchBalanceInUSD(multiChainAddress, chain);
        if (balanceData.balance > 0 || balanceData.balanceUSD > 0) {
          results.push({
            chain,
            ...balanceData
          });
          totalUSD += balanceData.balanceUSD;
          console.log(`[v0] ${chain}: ${balanceData.balance} ${balanceData.tokenSymbol} ($${balanceData.balanceUSD})`);
        }
      } catch (err) {
        console.error(`[v0] Error checking ${chain}:`, err.message);
      }
    }

    // Sort by balance USD descending
    results.sort((a, b) => b.balanceUSD - a.balanceUSD);

    setMultiChainResults({
      address: multiChainAddress,
      totalUSD,
      results,
      topToken: results[0] || null
    });

    setIsCheckingMultiChain(false);
    console.log('[v0] Multi-chain check complete. Total USD:', totalUSD);
  };

  const formatAddress = (address) => {
    if (address.length < 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    console.log(`Address ${address} copied to clipboard`);
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading wallets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Total Balance Card */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
              <WalletIcon size={16} className="text-indigo-400" />
              Total Portfolio Value
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${isHidden ? 'text-slate-600' : 'text-white'}`}>
                {isHidden ? '••••••' : `$${(totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span className="text-sm text-slate-500">USD</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {wallets.length === 0 
                ? 'Add wallets to view portfolio value' 
                : `${wallets.length} wallet${wallets.length !== 1 ? 's' : ''} tracked`}
            </p>
          </div>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title={isHidden ? 'Show balance' : 'Hide balance'}
          >
            {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-800">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all"
          >
            <Plus size={16} />
            Add Wallet
          </button>
          <button
            onClick={handleRefreshBalances}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* CALCULATOR SECTION */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Calculator size={18} className="text-cyan-400"/> Calculator
        </h3>
        
        <div className="bg-slate-950 rounded-lg p-3 space-y-2 max-w-sm">
          {/* Display */}
          <div className="bg-slate-800 rounded-lg p-3 text-right">
            <div className="text-2xl font-mono font-bold text-cyan-400 truncate">
              {calcDisplay}
            </div>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={calcHandleClear}
              className="col-span-2 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              Clear
            </button>
            <button
              onClick={() => calcHandleOperation('/')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              ÷
            </button>
            <button
              onClick={() => calcHandleOperation('*')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              ×
            </button>

            {[7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => calcHandleNumber(num)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => calcHandleOperation('-')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              -
            </button>

            {[4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => calcHandleNumber(num)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => calcHandleOperation('+')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded transition-colors row-span-2 text-xs"
            >
              +
            </button>

            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => calcHandleNumber(num)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => calcHandleNumber(0)}
              className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              0
            </button>
            <button
              onClick={() => setCalcDisplay(calcDisplay === '0' ? '0' : calcDisplay + '.')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              .
            </button>

            <button
              onClick={calcHandleEquals}
              className="col-span-2 bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded transition-colors text-xs"
            >
              =
            </button>
          </div>
        </div>
      </div>

      {/* Wallets List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Coins size={18} className="text-indigo-400" />
              My Wallets
            </h3>
            {user && wallets.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const filtered = searchWallets(filterWalletsByChain(wallets, selectedChain), searchTerm);
                    const formatted = formatWalletsForExport(filtered);
                    exportToCSV(formatted, 'wallets-export.csv');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded transition-colors"
                  title="Export as CSV"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  onClick={() => {
                    const filtered = searchWallets(filterWalletsByChain(wallets, selectedChain), searchTerm);
                    const formatted = formatWalletsForExport(filtered);
                    exportToJSON(formatted, 'wallets-export.json');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded transition-colors"
                  title="Export as JSON"
                >
                  <Download size={14} />
                  JSON
                </button>
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari wallet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Chains</option>
              {chainOptions.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="desc">Highest Balance</option>
              <option value="asc">Lowest Balance</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {(() => {
            let filtered = searchWallets(filterWalletsByChain(wallets, selectedChain), searchTerm);
            filtered = sortWalletsByBalance(filtered, sortOrder);
            
            if (filtered.length === 0) {
              return (
                <div className="p-8 text-center">
                  <div className="rounded-full bg-slate-800 p-3 w-fit mx-auto mb-3">
                    <WalletIcon size={24} className="text-slate-600" />
                  </div>
                  {wallets.length === 0 ? (
                    <>
                      <p className="text-slate-500 mb-4">No wallets added yet</p>
                      <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-all"
                      >
                        <Plus size={16} />
                        Add Your First Wallet
                      </button>
                    </>
                  ) : (
                    <p className="text-slate-500">No wallets match your filters</p>
                  )}
                </div>
              );
            }

            return filtered.map((wallet) => (
              <div key={wallet.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Wallet Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg ${
                        wallet.chain === 'Solana' 
                          ? 'bg-purple-900/30 text-purple-400'
                          : wallet.chain === 'Bitcoin'
                          ? 'bg-orange-900/30 text-orange-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}>
                        <Coins size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold">{wallet.name}</h4>
                        <p className="text-xs text-slate-500">{wallet.chain}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-2 text-xs text-slate-400">
                      <code className="font-mono flex-1 truncate">{wallet.address}</code>
                      <button
                        onClick={() => handleCopyAddress(wallet.address)}
                        className="p-1 hover:text-slate-200 transition-colors"
                        title="Copy address"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Balance & Actions */}
                  <div className="text-right space-y-3 flex flex-col items-end">
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Balance</p>
                        <p className={`text-2xl font-bold ${isHidden ? 'text-slate-600' : 'text-white'}`}>
                          {isHidden ? '••••' : `${(wallet.balance || 0).toFixed(6)}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {getTokenSymbol(wallet.chain)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">USD</p>
                        <p className={`text-lg font-semibold ${isHidden ? 'text-slate-600' : 'text-slate-300'}`}>
                          {isHidden ? '••••' : `$${(wallet.balanceUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">{wallet.chain}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={wallet.chain}
                        onChange={(e) => {
                          const updatedWallet = { ...wallet, chain: e.target.value };
                          const updatedWallets = wallets.map(w => w.id === wallet.id ? updatedWallet : w);
                          setWallets(updatedWallets);
                          handleRefreshSpecific(wallet.id, e.target.value);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.4rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.2em 1.2em',
                          paddingRight: '1.75rem'
                        }}
                      >
                        {chainOptions.map(chain => (
                          <option key={chain} value={chain}>{chain}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete wallet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Add Wallet Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add New Wallet</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Wallet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main MetaMask"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Blockchain</label>
                <select
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {chainOptions.map(chain => (
                    <option key={chain} value={chain}>{chain}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Wallet Address</label>
                <input
                  type="text"
                  placeholder="Paste wallet address here..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-6"
              >
                Save Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
