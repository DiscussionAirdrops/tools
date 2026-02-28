'use client';

import React, { useState } from 'react';
import { Coins, Wifi, ImageIcon, Send, ChevronDown, Search } from 'lucide-react';
import TokenCreator from './TokenCreator';
import NFTDeployer from './NFTDeployer';
import CustomRPCManager from './CustomRPCManager';
import Multisender from './Multisender';
import ProjectScanner from './ProjectScanner';

const Tools = ({ aiProviders = {} }) => {
  const [activeTab, setActiveTab] = useState('token-creator');
  const [customRPCs, setCustomRPCs] = useState([]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Development Tools</h2>
        <p className="text-slate-400">Deploy contracts, send batch transactions, and manage RPCs</p>
      </div>

      {/* Tools Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-6">
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'token-creator', label: 'Token Creator', icon: Coins },
            { id: 'nft-deployer', label: 'NFT Creator', icon: ImageIcon },
            { id: 'multisender', label: 'Multisender', icon: Send },
            { id: 'custom-rpc', label: 'Custom RPC', icon: Wifi },
            { id: 'project-scanner', label: 'Project Scanner', icon: Search },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'token-creator' && <TokenCreator customRPCs={customRPCs} />}
          {activeTab === 'nft-deployer' && <NFTDeployer />}
          {activeTab === 'multisender' && <Multisender />}
          {activeTab === 'custom-rpc' && <CustomRPCManager customRPCs={customRPCs} setCustomRPCs={setCustomRPCs} />}
          {activeTab === 'project-scanner' && <ProjectScanner aiProviders={aiProviders} />}
        </div>
      </div>
    </div>
  );
};

export default Tools;
