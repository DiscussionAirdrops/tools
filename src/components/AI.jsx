'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../lib/firebaseContext.jsx';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Plus, Trash2, Settings, MessageSquare, Sparkles, Copy, Check, AlertCircle } from 'lucide-react';

const AI = ({ user }) => {
  const { db } = useFirebase();
  const appId = 'airdrop-tracker-prod';
  const [activeTab, setActiveTab] = useState('chat');
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newProvider, setNewProvider] = useState({ name: '', apiKey: '', showKey: false });
  const [copiedKey, setCopiedKey] = useState(null);
  const messagesEndRef = useRef(null);

  // Load providers on mount
  useEffect(() => {
    if (user) loadProviders();
  }, [user]);

  // Load providers from Firestore
  const loadProviders = async () => {
    try {
      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'aiProviders'));
      const snapshot = await getDocs(q);
      const providersMap = {};
      snapshot.docs.forEach(doc => {
        providersMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setProviders(providersMap);
      if (Object.keys(providersMap).length > 0 && !selectedProvider) {
        setSelectedProvider(Object.keys(providersMap)[0]);
      }
    } catch (err) {
      console.error('[v0] Error loading providers:', err);
    }
  };

  // Add new provider
  const handleAddProvider = async () => {
    if (!newProvider.name.trim() || !newProvider.apiKey.trim()) {
      setError('Provider name dan API key harus diisi');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'aiProviders'), {
        name: newProvider.name.trim(),
        apiKey: newProvider.apiKey.trim(),
        type: getProviderType(newProvider.name),
        createdAt: serverTimestamp()
      });

      setProviders(prev => ({
        ...prev,
        [docRef.id]: { id: docRef.id, name: newProvider.name, apiKey: newProvider.apiKey, type: getProviderType(newProvider.name) }
      }));

      if (!selectedProvider) setSelectedProvider(docRef.id);
      setNewProvider({ name: '', apiKey: '', showKey: false });
      setError(null);
      console.log('[v0] Provider added successfully');
    } catch (err) {
      setError('Gagal menambah provider: ' + err.message);
    }
  };

  // Delete provider
  const handleDeleteProvider = async (providerId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'aiProviders', providerId));
      const newProviders = { ...providers };
      delete newProviders[providerId];
      setProviders(newProviders);
      if (selectedProvider === providerId) {
        setSelectedProvider(Object.keys(newProviders)[0] || '');
      }
      console.log('[v0] Provider deleted');
    } catch (err) {
      setError('Gagal menghapus provider: ' + err.message);
    }
  };

  // Send message to AI
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedProvider) {
      setError('Pilih provider dan masukkan pesan');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const provider = providers[selectedProvider];
      console.log('[v0] Calling AI provider:', provider.name);
      
      const response = await callAI(provider);

      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'ai',
        provider: provider.name,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      console.log('[v0] AI response received successfully');
    } catch (err) {
      console.error('[v0] Chat error:', err);
      setError('Error: ' + err.message);
      
      // Remove last user message if API call failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Universal AI caller with better error handling
  const callAI = async (provider) => {
    const message = input;
    const type = provider.type || 'openai';

    try {
      if (type === 'openai') {
        return await callOpenAI(provider.apiKey, message);
      } else if (type === 'groq') {
        return await callGroq(provider.apiKey, message);
      } else if (type === 'anthropic') {
        return await callAnthropic(provider.apiKey, message);
      } else if (type === 'cohere') {
        return await callCohere(provider.apiKey, message);
      } else if (type === 'huggingface') {
        return await callHuggingFace(provider.apiKey, message);
      } else {
        throw new Error('Provider type tidak dikenali: ' + type);
      }
    } catch (err) {
      throw new Error(`API Error (${provider.name}): ${err.message}`);
    }
  };

  // OpenAI API
  const callOpenAI = async (apiKey, message) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error: ' + response.statusText);
    }
    return data.choices[0].message.content;
  };

  // Groq API - Using llama-3.3-70b-versatile (current production model)
  const callGroq = async (apiKey, message) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error: ' + response.statusText);
    }
    return data.choices[0].message.content;
  };

  // Anthropic API
  const callAnthropic = async (apiKey, message) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic API error: ' + response.statusText);
    }
    return data.content[0].text;
  };

  // Cohere API
  const callCohere = async (apiKey, message) => {
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        model: 'command-light'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Cohere API error: ' + response.statusText);
    }
    return data.text;
  };

  // Hugging Face API
  const callHuggingFace = async (apiKey, message) => {
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: message,
        options: { use_cache: false }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.[0] || 'Hugging Face API error');
    }
    return data[0].generated_text;
  };

  // Get provider type
  const getProviderType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('openai')) return 'openai';
    if (lowerName.includes('groq')) return 'groq';
    if (lowerName.includes('anthropic') || lowerName.includes('claude')) return 'anthropic';
    if (lowerName.includes('cohere')) return 'cohere';
    if (lowerName.includes('hugging')) return 'huggingface';
    return 'openai';
  };

  // Delete all messages
  const handleClearChat = () => {
    if (window.confirm('Hapus semua chat? Tindakan ini tidak bisa dibatalkan.')) {
      setMessages([]);
      setError(null);
    }
  };

  // Copy to clipboard
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .glass-effect {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
      `}</style>

      {/* Header */}
      <div className="glass-effect border-b border-slate-700/30 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 animate-slideIn">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-violet-400 animate-pulse-soft" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">AI Assistant</h1>
          </div>
          <div className="flex gap-2">
            {activeTab === 'chat' && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500/20 to-red-500/20 hover:from-rose-500/30 hover:to-red-500/30 text-rose-300 transition-all duration-300 border border-rose-500/30 hover:border-rose-500/50"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-700/30">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-300 border-b-2 ${
              activeTab === 'chat'
                ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-300 border-b-2 ${
              activeTab === 'providers'
                ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Providers
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'chat' ? (
          // Chat View
          <div className="w-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-violet-400" />
                    </div>
                    <p className="text-slate-300 text-lg font-semibold">Mulai percakapan baru</p>
                    <p className="text-slate-500 text-sm mt-2">Pilih provider AI dan ketik pertanyaan Anda</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-br-none shadow-lg'
                          : 'glass-effect text-slate-100 rounded-bl-none'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <p className="text-xs text-violet-300 mb-1 font-semibold uppercase tracking-wider">{msg.provider}</p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-violet-200' : 'text-slate-400'}`}>
                        {msg.timestamp?.toLocaleTimeString?.() || ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/50 rounded-lg flex gap-3 text-rose-300 text-sm animate-slideIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="glass-effect border-t border-slate-700/30 px-6 py-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="flex-1 px-4 py-2 glass-effect rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                >
                  <option value="">-- Pilih Provider --</option>
                  {Object.entries(providers).map(([id, prov]) => (
                    <option key={id} value={id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                  placeholder="Tanya sesuatu ke AI..."
                  className="flex-1 px-4 py-3 glass-effect rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !selectedProvider || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-violet-500/50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Providers Management
          <div className="w-full flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Add New Provider */}
            <div className="glass-effect border border-slate-700/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" />
                Add AI Provider
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Provider Name</label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., OpenAI, Groq, Claude, etc."
                    className="w-full px-4 py-2 glass-effect rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={newProvider.showKey ? 'text' : 'password'}
                      value={newProvider.apiKey}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="flex-1 px-4 py-2 glass-effect rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                    />
                    <button
                      onClick={() => setNewProvider(prev => ({ ...prev, showKey: !prev.showKey }))}
                      className="px-3 py-2 glass-effect hover:bg-slate-700/50 rounded-lg text-slate-300 transition-all"
                    >
                      {newProvider.showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddProvider}
                  className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-violet-500/50"
                >
                  <Plus className="w-4 h-4" />
                  Add Provider
                </button>
              </div>
            </div>

            {/* Existing Providers */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Your Providers</h3>
              {Object.keys(providers).length === 0 ? (
                <p className="text-slate-400 text-sm">Belum ada provider. Tambah provider baru untuk memulai!</p>
              ) : (
                Object.entries(providers).map(([id, prov]) => (
                  <div key={id} className="glass-effect border border-slate-700/30 rounded-lg p-4 flex items-center justify-between hover:border-violet-500/50 transition-all duration-300">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{prov.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 text-xs bg-slate-900/50 text-slate-300 px-2 py-1 rounded border border-slate-700/50 overflow-hidden text-ellipsis">
                          {prov.showKey ? prov.apiKey : '•'.repeat(20)}
                        </code>
                        <button
                          onClick={() => handleCopyKey(prov.apiKey)}
                          className="p-2 glass-effect hover:bg-slate-700/50 rounded text-slate-300 transition-all"
                        >
                          {copiedKey === prov.apiKey ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProvider(id)}
                      className="ml-4 p-2 glass-effect hover:bg-rose-500/20 hover:border-rose-500/50 rounded text-rose-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AI;
