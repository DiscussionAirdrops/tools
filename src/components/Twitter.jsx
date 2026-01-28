'use client';

import React, { useState, useEffect } from 'react';
import { 
  Twitter as TwitterIcon,
  Plus,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  Loader,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { 
  collection, 
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { extractTwitterUsername, fetchTwitterProfileData, getTwitterProfileUrl } from '../lib/twitterUtils';

const Twitter = ({ user, db }) => {
  const appId = 'airdrop-tracker-prod';
  const [twitterAccounts, setTwitterAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // Form state
  const [twitterUrl, setTwitterUrl] = useState('');

  // Fetch Twitter accounts from Firebase
  useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'twitter'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('[v0] Twitter.jsx: Fetched accounts', data);
      setTwitterAccounts(data);
      setIsLoading(false);
    }, (err) => {
      console.error('[v0] Twitter.jsx Error fetching accounts:', err.message);
      setError('Failed to load Twitter accounts');
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch Twitter profile data when URL changes
  const handleUrlChange = async (url) => {
    setTwitterUrl(url);
    setPreviewData(null);
    setError(null);

    if (!url.trim()) return;

    const username = extractTwitterUsername(url);
    if (!username) {
      setError('Invalid Twitter URL format');
      return;
    }

    try {
      setIsFetching(true);
      const profileData = await fetchTwitterProfileData(username);
      setPreviewData(profileData);
    } catch (err) {
      console.error('[v0] Error fetching profile:', err);
      setError('Failed to fetch profile data');
    } finally {
      setIsFetching(false);
    }
  };

  // Add Twitter account
  const handleAddTwitter = async (e) => {
    e.preventDefault();
    
    if (!twitterUrl.trim() || !previewData) {
      setError('Please enter a valid Twitter URL');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const username = extractTwitterUsername(twitterUrl);
      const profileUrl = getTwitterProfileUrl(username);

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'twitter'), {
        username: previewData.username,
        twitterUrl: profileUrl,
        photoUrl: previewData.photoUrl,
        source: previewData.source,
        createdAt: serverTimestamp()
      });

      console.log('[v0] Twitter account added successfully');
      setTwitterUrl('');
      setPreviewData(null);
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error('[v0] Error adding Twitter account:', err.message);
      setError('Failed to add Twitter account: ' + err.message);
    }
  };

  // Delete Twitter account
  const handleDeleteTwitter = async (accountId) => {
    if (!confirm('Delete this Twitter account?')) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'twitter', accountId));
      console.log('[v0] Twitter account deleted');
      setError(null);
    } catch (err) {
      console.error('[v0] Error deleting account:', err.message);
      setError('Failed to delete account');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading Twitter accounts...</div>
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
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-900/30">
              <TwitterIcon size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Twitter Accounts</h2>
              <p className="text-sm text-slate-400">{twitterAccounts.length} account{twitterAccounts.length !== 1 ? 's' : ''} connected</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-all"
          >
            <Plus size={16} />
            Add Twitter
          </button>
        </div>
      </div>

      {/* Twitter Accounts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {twitterAccounts.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
            <div className="rounded-full bg-slate-800 p-3 w-fit mx-auto mb-3">
              <TwitterIcon size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 mb-4">No Twitter accounts added yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all"
            >
              <Plus size={16} />
              Add Your First Twitter
            </button>
          </div>
        ) : (
          twitterAccounts.map((account) => (
            <div key={account.id} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-all group">
              {/* Card Header with Photo */}
              <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                <img 
                  src={account.photoUrl || 'https://via.placeholder.com/300x300?text=Twitter'}
                  alt={account.username}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=' + account.username;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex items-end p-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-xs truncate">@{account.username}</h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2 space-y-2">
                {/* Twitter Link */}
                <a 
                  href={account.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                >
                  <LinkIcon size={12} />
                  Visit
                  <ExternalLink size={10} />
                </a>

                {/* Actions */}
                <div className="flex gap-1.5 pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => handleCopyUrl(account.twitterUrl)}
                    className="flex-1 rounded text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Twitter URL"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDeleteTwitter(account.id)}
                    className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Twitter Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Twitter Account</h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setTwitterUrl('');
                  setPreviewData(null);
                  setError(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTwitter} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Twitter URL or Username</label>
                <input
                  type="text"
                  placeholder="e.g. https://twitter.com/username or @username"
                  value={twitterUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Enter a Twitter URL or username</p>
              </div>

              {/* Preview */}
              {isFetching && (
                <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin text-blue-400" />
                  <span className="text-sm text-slate-400">Fetching profile...</span>
                </div>
              )}

              {previewData && !isFetching && (
                <div className="rounded-lg border border-blue-900/50 bg-blue-900/20 p-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={previewData.photoUrl || "/placeholder.svg"}
                      alt={previewData.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48?text=' + previewData.username;
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold">@{previewData.username}</p>
                      <p className="text-xs text-slate-400">Ready to add</p>
                    </div>
                    <Check size={20} className="text-emerald-400" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!previewData || isFetching}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors mt-6"
              >
                {isFetching ? 'Fetching...' : 'Add Twitter Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Twitter;
