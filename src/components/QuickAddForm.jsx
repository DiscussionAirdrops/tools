'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const AVAILABLE_TAGS = ['airdrop', 'testnet', 'waitlist', 'info', 'update', 'yapping'];

const QuickAddForm = ({ onAdd, wallets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setText] = useState('');
  const [type, setType] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState('');

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const parseTextInput = (text) => {
    // Extract URL from text
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    const link = urlMatch ? urlMatch[1] : '';

    // Extract first line as project name
    const lines = text.trim().split('\n');
    const project = lines[0] || '';

    // Extract tags (hashtags) from text
    const tagMatches = text.match(/#\w+/g) || [];
    const tags = tagMatches.map(tag => tag.substring(1)); // Remove # symbol

    // Extract full text as task detail
    const task = text.trim();

    return { project, task, link, tags };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!textInput.trim()) {
      setError('Please enter project information');
      return;
    }

    if (!type.trim()) {
      setError('Please select a type');
      return;
    }

    const parsed = parseTextInput(textInput);

    if (!parsed.project.trim()) {
      setError('Could not parse project name from text');
      return;
    }

    onAdd({
      project: parsed.project.substring(0, 50),
      task: parsed.task,
      chain: 'Unknown',
      link: parsed.link,
      walletId: 'all',
      type: type,
      priority: 'High',
      tags: selectedTags.length > 0 ? selectedTags : ['airdrop'],
      source: 'localhost',
    });

    // Reset form
    setText('');
    setType('');
    setSelectedTags([]);
    setError('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 shadow-lg transition-all hover:scale-105"
      >
        <Plus size={20} />
        <span className="text-sm font-semibold">Quick Add</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Quick Add Airdrop</h3>
          <button 
            onClick={() => {
              setIsOpen(false);
              setError('');
              setText('');
            }} 
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Input - Main */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Paste Airdrop Info
              <span className="text-xs text-slate-500 font-normal"> (auto-parse title and link)</span>
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Example:
UniMex 5,000 UNX Airdrop
Complete Task:
https://app.galxe.com/quest/UniMex/GCVEjtYDo8`}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
              rows="5"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select Type</option>
              <option value="Daily">Daily</option>
              <option value="Retro">Retro</option>
              <option value="Testnet">Testnet</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Pending">Pending</option>
              <option value="Abu-abu">Abu-abu</option>
              <option value="Scam">Scam</option>
              <option value="Winner">Winner</option>
            </select>
          </div>

          {/* Tags Selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Tags</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-bold text-white transition-colors"
          >
            Add to Airdrops
          </button>
        </form>

        {/* Preview */}
        {textInput && (
          <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">Preview:</p>
            <div className="text-sm text-slate-300 space-y-1">
              <p><span className="text-slate-500">Project:</span> {parseTextInput(textInput).project.substring(0, 50)}</p>
              {parseTextInput(textInput).link && (
                <p className="break-all"><span className="text-slate-500">Link:</span> {parseTextInput(textInput).link}</p>
              )}
              <p><span className="text-slate-500">Tags:</span> {(selectedTags.length > 0 ? selectedTags : ['airdrop']).map(tag => `#${tag}`).join(', ')}</p>
              <p><span className="text-slate-500">Source:</span> localhost</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAddForm;
