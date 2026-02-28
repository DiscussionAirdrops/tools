'use client';

import React, { useState } from 'react';
import { Send, Copy, Check, AlertCircle, Loader, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

export default function Multisender() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [recipients, setRecipients] = useState([{ address: '', amount: '' }]);
  const [isMethod, setIsMethod] = useState('direct');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  const chains = {
    1: { name: 'Ethereum', explorer: 'https://etherscan.io' },
    56: { name: 'BSC', explorer: 'https://bscscan.com' },
    137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
    42161: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const totalAmount = recipients.reduce((sum, r) => {
    try {
      return sum + (parseFloat(r.amount) || 0);
    } catch {
      return sum;
    }
  }, 0);

  const handleDirectSend = async () => {
    setError('');
    setTxHash('');

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    const validRecipients = recipients.filter(r => r.address && r.amount);
    if (validRecipients.length === 0) {
      setError('Please add at least one valid recipient');
      return;
    }

    setIsSending(true);

    try {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available');
      }

      let successCount = 0;
      for (const recipient of validRecipients) {
        try {
          const hash = await walletClient.sendTransaction({
            account: address,
            to: recipient.address,
            value: parseEther(recipient.amount),
          });

          await publicClient.waitForTransactionReceipt({ hash });
          successCount++;
          setTxHash(hash);
        } catch (txError) {
          console.error('[v0] Error sending to', recipient.address, txError);
        }
      }

      if (successCount === 0) {
        throw new Error('Failed to send any transactions');
      }

      setError('');
      setRecipients([{ address: '', amount: '' }]);

    } catch (err) {
      console.error('[v0] Multisend error:', err);
      setError(err.message || 'Failed to send tokens');
    } finally {
      setIsSending(false);
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
          <Send size={18} className="text-blue-400" />
          Multisender - Batch Send
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsMethod('direct')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              isMethod === 'direct'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Direct Send
          </button>
          <button
            onClick={() => setIsMethod('contract')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              isMethod === 'contract'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Contract (Soon)
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            {isMethod === 'direct'
              ? 'Send native tokens (ETH, MATIC, etc) to multiple addresses. Each transaction is sent separately.'
              : 'Deploy a multisender contract for efficient batch transfers (coming soon)'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-400">Recipient Address</label>
                <input
                  type="text"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-400">Amount</label>
                <input
                  type="number"
                  value={recipient.amount}
                  onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => removeRecipient(index)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                disabled={recipients.length === 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRecipient}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-6 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
        >
          <Plus size={16} />
          Add Recipient
        </button>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Total Amount:</span>
            <span className="text-white font-mono font-semibold">{totalAmount.toFixed(6)} {chains[chainId]?.name || 'ETH'}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {txHash && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-green-300">TX Hash:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-green-300">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                <button
                  onClick={() => copyToClipboard(txHash)}
                  className="p-1 hover:bg-green-500/20 rounded transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-green-400" />}
                </button>
                <a
                  href={`${chains[chainId]?.explorer}/tx/${txHash}`}
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
          onClick={handleDirectSend}
          disabled={isSending || !isConnected || recipients.filter(r => r.address && r.amount).length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          {isSending && <Loader size={18} className="animate-spin" />}
          {isSending ? 'Sending...' : `Send to ${recipients.filter(r => r.address && r.amount).length} Recipients`}
        </button>
      </div>
    </div>
  );
}
