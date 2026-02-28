'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Wallet as WalletIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useChainId } from 'wagmi';
import { parseEther } from 'viem';

const DONATION_ADDRESS = '0x2473EF56532306bEB024a0Af1065470771d92920';
const NETWORK_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  43114: 'Avalanche',
};

const WalletDonation = ({ openConnectModal }) => {
  const [copied, setCopied] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const { sendTransaction, isPending, isSuccess, isError, error, data: txHash } = useSendTransaction();
  const chainId = useChainId();

  useEffect(() => {
    if (isSuccess && txHash) {
      setTransactionStatus('success');
      setTransactionHash(txHash);
      setDonationAmount('');
      setErrorMessage('');
      console.log('[v0] Donation successful, tx:', txHash);
      setTimeout(() => {
        setShowDonationModal(false);
        setTransactionStatus(null);
        setTransactionHash('');
      }, 3000);
    }
  }, [isSuccess, txHash]);

  useEffect(() => {
    if (isError && error) {
      setTransactionStatus('error');
      setErrorMessage(error.message || 'Transaction failed');
      console.error('[v0] Donation error:', error.message);
    }
  }, [isError, error]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setErrorMessage('Silakan masukkan jumlah donasi yang valid');
      return;
    }

    if (!balance) {
      setErrorMessage('Balance tidak terdeteksi');
      return;
    }

    const amount = parseFloat(donationAmount);
    const balanceAmount = parseFloat(balance.formatted);
    
    // Estimate gas fee (rough estimate: 21000 gas * current gas price)
    // We'll reserve ~0.001 ETH for gas as safety margin (varies by network)
    const estimatedGasBuffer = 0.001;
    const totalNeeded = amount + estimatedGasBuffer;
    
    if (amount > balanceAmount) {
      setErrorMessage(`Saldo tidak cukup. Anda punya ${balanceAmount.toFixed(4)} ${balance.symbol}, butuh ${amount.toFixed(4)} ${balance.symbol}`);
      return;
    }

    if (totalNeeded > balanceAmount) {
      setErrorMessage(`Saldo tidak cukup untuk donasi + gas fee. Anda punya ${balanceAmount.toFixed(4)}, tapi perlu ~${totalNeeded.toFixed(4)} ${balance.symbol} (termasuk gas)`);
      return;
    }

    try {
      setTransactionStatus('pending');
      setErrorMessage('');
      console.log('[v0] Initiating donation:', { amount, to: DONATION_ADDRESS, token: balance.symbol, network: NETWORK_NAMES[chainId] });
      
      const amountInWei = parseEther(donationAmount);
      sendTransaction({
        to: DONATION_ADDRESS,
        value: amountInWei,
      });
    } catch (err) {
      setTransactionStatus('error');
      setErrorMessage(err.message || 'Failed to initiate transaction');
      console.error('[v0] Donation error:', err);
    }
  };

  if (!showDonationModal) {
    return (
      <button
        onClick={() => setShowDonationModal(true)}
        className="block w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold py-2 px-4 rounded-lg text-sm text-center transition-all transform hover:scale-105"
      >
        Follow & Donasi Sekarang
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-700/50 rounded-xl p-6 max-w-lg w-full space-y-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Support inokrambol
          </h3>
          <button
            onClick={() => {
              setShowDonationModal(false);
              setTransactionStatus(null);
              setErrorMessage('');
              setDonationAmount('');
            }}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {transactionStatus === 'success' && (
          <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle size={20} />
              <p className="font-semibold">Terima kasih atas donasi Anda!</p>
            </div>
            <p className="text-xs text-emerald-300">
              Transaction berhasil. Tx: <code className="bg-slate-950 px-2 py-1 rounded">{transactionHash?.slice(0, 10)}...{transactionHash?.slice(-8)}</code>
            </p>
          </div>
        )}

        {/* Error Message */}
        {transactionStatus === 'error' && errorMessage && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <p className="font-semibold">Error</p>
            </div>
            <p className="text-xs text-red-300">{errorMessage}</p>
          </div>
        )}

        {/* Donation Address */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
          <p className="text-xs text-slate-400">Donation Address (All EVM Networks):</p>
          <div className="bg-slate-950 border border-slate-700 rounded p-2">
            <code className="text-xs text-emerald-300 font-mono break-all">{DONATION_ADDRESS}</code>
          </div>
          <button
            onClick={handleCopyAddress}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
        </div>

        {/* Wallet Connection */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <p className="text-xs text-slate-400 font-semibold">Or Connect Wallet to Donate:</p>
          
          {!isConnected ? (
            <button
              onClick={openConnectModal}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
            >
              <WalletIcon size={16} />
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-900 border border-emerald-700/50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Connected Wallet:</p>
                  <p className="text-xs text-emerald-300 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Network:</p>
                  <p className="text-xs text-amber-300 font-semibold">{NETWORK_NAMES[chainId] || `Chain ${chainId}`}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Balance:</p>
                  <p className="text-xs text-cyan-300 font-semibold">
                    {balanceLoading ? 'Loading...' : balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-2">Amount ({balance?.symbol}):</label>
                <input
                  type="number"
                  step="0.001"
                  value={donationAmount}
                  onChange={(e) => {
                    setDonationAmount(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="0.1"
                  disabled={isPending}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Saldo: {balanceLoading ? 'Loading...' : `${parseFloat(balance?.formatted || '0').toFixed(4)} ${balance?.symbol}`}
                </p>
              </div>

              {/* Gas Fee Warning */}
              <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                <p className="text-xs text-orange-200">
                  <strong>⚠ Perhatian:</strong> Pastikan saldo Anda cukup untuk donasi + gas fee (~0.001 {balance?.symbol})
                </p>
              </div>

              <button
                onClick={handleDonate}
                disabled={isPending || transactionStatus === 'pending'}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 rounded-lg text-sm transition-all disabled:cursor-not-allowed"
              >
                {isPending || transactionStatus === 'pending' ? 'Processing...' : 'Send Donation'}
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
          <p className="text-xs text-amber-100 text-center">
            Setiap donasi membantu kami terus mengembangkan fitur dan maintenance aplikasi. Terima kasih!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletDonation;
