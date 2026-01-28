'use client';

import React, { useState } from 'react';
import { Copy, Wallet as WalletIcon } from 'lucide-react';
import { useAccount, useBalance, useSendTransaction, useChainId } from 'wagmi';
import { parseEther } from 'viem';

const DONATION_ADDRESS = '0x2473EF56532306bEB024a0Af1065470771d92920';
const NETWORK_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
};

const WalletDonation = ({ openConnectModal }) => {
  const [copied, setCopied] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { sendTransaction, isPending } = useSendTransaction();
  const chainId = useChainId();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonate = async () => {
    if (!donationAmount) {
      alert('Silakan masukkan jumlah donasi');
      return;
    }

    try {
      const amountInWei = parseEther(donationAmount);
      sendTransaction({
        to: DONATION_ADDRESS,
        value: amountInWei,
      });
      console.log('[v0] Donation transaction initiated');
      setDonationAmount('');
      setTimeout(() => setShowDonationModal(false), 2000);
    } catch (error) {
      console.error('[v0] Donation error:', error);
      alert('Terjadi kesalahan: ' + error.message);
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
      <div className="bg-slate-900 border border-amber-700/50 rounded-xl p-6 max-w-lg w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Support inokrambol
          </h3>
          <button
            onClick={() => setShowDonationModal(false)}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

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
              <div className="bg-slate-900 border border-emerald-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Connected Wallet:</p>
                <p className="text-xs text-emerald-300 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-xs text-amber-300 mt-2 font-semibold">Network: {NETWORK_NAMES[chainId] || `Chain ${chainId}`}</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-2">Amount ({balance?.symbol}):</label>
                <input
                  type="number"
                  step="0.001"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDonate}
                  disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  {isPending ? 'Processing...' : 'Send Donation'}
                </button>
              </div>
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
