'use client';

import React, { useState } from 'react';
import { Wifi, Plus, Trash2, Copy, Check, AlertCircle } from 'lucide-react';

export default function CustomRPCManager({ customRPCs = [], setCustomRPCs = () => {} }) {
  const [newRPC, setNewRPC] = useState({ name: '', rpcUrl: '', chainId: '' });
  const [copied, setCopied] = useState(null);

  const defaultRPCs = [
    { name: 'Ethereum', chainId: 1, rpc: 'https://eth.llamarpc.com' },
    { name: 'BSC', chainId: 56, rpc: 'https://bsc-dataseed.binance.org' },
    { name: 'Polygon', chainId: 137, rpc: 'https://polygon-rpc.com' },
    { name: 'Arbitrum', chainId: 42161, rpc: 'https://arb1.arbitrum.io/rpc' },
    { name: 'Optimism', chainId: 10, rpc: 'https://mainnet.optimism.io' },
  ];

  const allRPCs = [...defaultRPCs, ...customRPCs];

  const addRPC = () => {
    if (!newRPC.name || !newRPC.rpcUrl || !newRPC.chainId) {
      alert('Please fill all fields');
      return;
    }

    const exists = allRPCs.find(r => r.chainId === parseInt(newRPC.chainId));
    if (exists) {
      alert('Chain ID already exists');
      return;
    }

    setCustomRPCs([...customRPCs, { ...newRPC, chainId: parseInt(newRPC.chainId) }]);
    setNewRPC({ name: '', rpcUrl: '', chainId: '' });
  };

  const removeRPC = (chainId) => {
    setCustomRPCs(customRPCs.filter(r => r.chainId !== chainId));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wifi size={18} className="text-blue-400" />
          Custom RPC Manager
        </h3>

        {/* Add New RPC */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-3">
          <h4 className="text-sm font-medium text-white">Add Custom RPC</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Network Name</label>
              <input
                type="text"
                value={newRPC.name}
                onChange={(e) => setNewRPC({ ...newRPC, name: e.target.value })}
                placeholder="My Network"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Chain ID</label>
              <input
                type="number"
                value={newRPC.chainId}
                onChange={(e) => setNewRPC({ ...newRPC, chainId: e.target.value })}
                placeholder="1"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">RPC URL</label>
                <input
                  type="text"
                  value={newRPC.rpcUrl}
                  onChange={(e) => setNewRPC({ ...newRPC, rpcUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={addRPC}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* RPC List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white mb-3">Available RPCs</h4>

          {allRPCs.length === 0 ? (
            <p className="text-xs text-slate-400">No RPCs added</p>
          ) : (
            allRPCs.map((rpc) => (
              <div key={rpc.chainId} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{rpc.name}</p>
                  <p className="text-xs text-slate-400">Chain ID: {rpc.chainId}</p>
                  <p className="text-xs text-slate-500 truncate font-mono">{rpc.rpc}</p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(rpc.rpc, rpc.chainId)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    {copied === rpc.chainId ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>

                  {customRPCs.find(c => c.chainId === rpc.chainId) && (
                    <button
                      onClick={() => removeRPC(rpc.chainId)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-6 flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            Add custom RPC endpoints to connect to different blockchain networks. Use these RPCs in your applications.
          </p>
        </div>
      </div>
    </div>
  );
}
