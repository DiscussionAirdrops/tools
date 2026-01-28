'use client';

import { useMemo } from "react"

import React, { useState, useEffect, useRef } from 'react';

import { 
  LayoutDashboard,
  Wallet,
  Settings,
  Menu,
  Trash2,
  FileJson,
  MessageCircle,
  Sparkles,
  CreditCard,
  Copy,
  TrendingUp,
  Coins,
  Twitter,
  Youtube,
  Download,
  CheckCircle,
  X,
  CheckCircle2,
  Zap,
  HelpCircle,
  Hash,
  AlertCircle,
  RefreshCw,
  Clock,
  Search,
  ExternalLink,
  Calendar,
  Star
} from 'lucide-react';

// Import Components
import Auth from './components/Auth';
import WalletComponent from './components/Wallet';
import TwitterComponent from './components/Twitter';
import SettingsComponent from './components/Settings';
import AIComponent from './components/AI';
import YouTubeComponent from './components/YouTube';
import QuickAddForm from './components/QuickAddForm';

// Import Firestore Service
import { initializeFirestore, getUserAirdrops, addAirdrop, updateAirdrop, deleteAirdrop, getUserWallets, addWallet, updateWallet, deleteWallet } from './lib/firebaseService';



// --- FIREBASE IMPORTS ---
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';

// Import Wagmi and RainbowKit
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmiConfig';

// --- CONFIGURATION ---
const ALLOWED_TAGS = ['airdrop', 'testnet', 'waitlist', 'info', 'update', 'yapping'];

// Create QueryClient instance
const queryClient = new QueryClient();

// Get Firebase config from Environment Variables (PRIMARY) or localStorage (FALLBACK)
const getFirebaseConfig = () => {
  // Priority 1: Environment Variables (RECOMMENDED - most secure)
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
    console.log('[v0] Firebase config loaded from Environment Variables:', config.projectId);
    return config;
  }

  // Priority 2: localStorage (user manual setup via Auth component)
  if (typeof window !== 'undefined') {
    const apiKey = localStorage.getItem('firebase_apiKey');
    const projectId = localStorage.getItem('firebase_projectId');
    
    if (apiKey && projectId) {
      const config = {
        apiKey: apiKey,
        authDomain: localStorage.getItem('firebase_authDomain') || '',
        projectId: projectId,
        storageBucket: localStorage.getItem('firebase_storageBucket') || '',
        messagingSenderId: localStorage.getItem('firebase_messagingSenderId') || '',
        appId: localStorage.getItem('firebase_appId') || '',
      };
      console.log('[v0] Firebase config loaded from localStorage:', projectId);
      return config;
    }
  }
  
  console.warn('[v0] No Firebase config found! Please setup environment variables VITE_FIREBASE_* or use Auth component.');
  return null;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase variables - will be set in App component on first mount
let app = null;
let auth = null;
let firestore = null;
let db = null; // Declare db variable

export const initFirebase = (config) => {
  try {
    if (!config) {
      console.error("[v0] Firebase config is required. User must setup credentials first.");
      return { app: null, auth: null, firestore: null };
    }
    
    const existingApps = getApps();
    
    if (existingApps.length === 0) {
      if (!config.apiKey || !config.projectId) {
        console.warn("[v0] Firebase config incomplete:", { apiKey: !!config.apiKey, projectId: config.projectId });
        return { app: null, auth: null, firestore: null };
      }
      app = initializeApp(config);
      auth = getAuth(app);
      firestore = getFirestore(app);
      db = firestore; // Update export
      console.log("[v0] Firebase initialized with config:", config.projectId);
    } else {
      app = existingApps[0];
      auth = getAuth(app);
      firestore = getFirestore(app);
      db = firestore; // Update export
      console.log("[v0] Using existing Firebase app");
    }
  } catch (error) {
    console.error("[v0] Firebase init error:", error);
  }
  
  return { app, auth, firestore };
};

export const getDb = () => db;
export const getAuth_ = () => auth;
export const getApp_ = () => app;
export const appId = 'airdrop-tracker-prod';

// --- MOCK WALLETS (RESTORED) ---
// Ini dibutuhkan untuk filter di dashboard utama
const WALLETS = [
  { id: 'w1', name: 'Main Alpha', address: '0x12...89', type: 'Primary' },
  { id: 'w2', name: 'Sybil Beta', address: '0x44...21', type: 'Secondary' },
  { id: 'w3', name: 'Sybil Gamma', address: '0x99...11', type: 'Secondary' },
  { id: 'w4', name: 'Sybil Delta', address: '0xAA...22', type: 'Secondary' },
];

// Generate color untuk setiap task - eye-friendly palette
const generateTaskColor = (taskId) => {
  const colors = [
    { bg: 'bg-blue-950/40', border: 'border-blue-800/50', accent: 'text-blue-400' },
    { bg: 'bg-purple-950/40', border: 'border-purple-800/50', accent: 'text-purple-400' },
    { bg: 'bg-pink-950/40', border: 'border-pink-800/50', accent: 'text-pink-400' },
    { bg: 'bg-cyan-950/40', border: 'border-cyan-800/50', accent: 'text-cyan-400' },
    { bg: 'bg-emerald-950/40', border: 'border-emerald-800/50', accent: 'text-emerald-400' },
    { bg: 'bg-amber-950/40', border: 'border-amber-800/50', accent: 'text-amber-400' },
    { bg: 'bg-rose-950/40', border: 'border-rose-800/50', accent: 'text-rose-400' },
    { bg: 'bg-indigo-950/40', border: 'border-indigo-800/50', accent: 'text-indigo-400' },
  ];
  const hash = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Get type styling (unified for frequency + label) - eye-friendly colors
const getTypeStyle = (type) => {
  const styles = {
    'Daily': { bg: 'bg-slate-800/60', text: 'text-cyan-400', border: 'border-cyan-800/40' },
    'Retro': { bg: 'bg-slate-800/60', text: 'text-blue-400', border: 'border-blue-800/40' },
    'Testnet': { bg: 'bg-slate-800/60', text: 'text-purple-400', border: 'border-purple-800/40' },
    'Ongoing': { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/40' },
    'Pending': { bg: 'bg-slate-800/60', text: 'text-yellow-400', border: 'border-yellow-800/40' },
    'Abu-abu': { bg: 'bg-slate-800/60', text: 'text-slate-400', border: 'border-slate-700/40' },
    'Scam': { bg: 'bg-slate-800/60', text: 'text-red-400', border: 'border-red-800/40' },
    'Winner': { bg: 'bg-slate-800/60', text: 'text-emerald-400', border: 'border-emerald-800/40' },
  };
  return styles[type] || { bg: 'bg-slate-800/60', text: 'text-slate-400', border: 'border-slate-700/40' };
};

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const isTaskNew = (task) => {
  const dateToCheck = task.jsonDate || task.createdAt;
  if (!dateToCheck) return true; 
  const now = new Date();
  const taskDate = dateToCheck.toDate ? dateToCheck.toDate() : new Date(dateToCheck);
  const diffInHours = (now - taskDate) / (1000 * 60 * 60);
  return diffInHours < 24; 
};

// --- DONATE MODAL COMPONENT ---
const DonateModal = ({ isOpen, onClose }) => {
  const donationAddress = '0x2473EF56532306bEB024a0Af1065470771d92920';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(donationAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <span className="text-2xl">💙</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Support Discussion Airdrops Tools</h2>
          <p className="text-sm text-slate-400">Help us keep building amazing tools</p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Info Cards */}
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3">
              <p className="text-xs text-slate-500 mb-1">Donation Address (Ethereum)</p>
              <p className="font-mono text-sm text-slate-200 break-all">{donationAddress}</p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              copied 
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' 
                : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Address
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Supported Networks */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Supported Networks:</p>
            <div className="flex flex-wrap gap-2">
              {['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'].map((network) => (
                <span key={network} className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  {network}
                </span>
              ))}
            </div>
          </div>

          {/* Thank You Message */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 mt-4">
            <p className="text-xs text-blue-300 text-center">
              Every contribution helps us improve and maintain this project. Thank you! 🙏
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- MODAL COMPONENT (Task) ---
const AddTaskModal = ({ isOpen, onClose, onAdd, wallets }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onAdd({
      project: formData.get('project'),
      task: formData.get('task'),
      chain: formData.get('chain'),
      link: formData.get('link'),
      walletId: formData.get('walletId'),
      type: formData.get('type'),
      priority: formData.get('priority'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Add New Grind</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Target Wallet</label>
            <select name="walletId" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none">
              {wallets.filter(w => w.id !== 'all').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Project Name</label>
              <input name="project" required placeholder="e.g. ZkSync" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Chain</label>
              <input name="chain" required placeholder="e.g. Era Mainnet" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Link / URL</label>
            <input name="link" placeholder="https://..." className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Task Detail</label>
            <input name="task" required placeholder="e.g. Bridge 0.01 ETH" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
            <select name="type" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none">
              <option value="">Select Type</option>
              <option value="Daily">Daily</option>
              <option value="Retro">Retro</option>
              <option value="Testnet">Testnet</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Pending">Pending</option>
              <option value="Abu-abu">Abu-abu</option>
              <option value="Scam">Scam</option>
              <option value="Winner">Winner</option>
              <option value="End">End</option>
            </select>
          </div>

          <button type="submit" className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors">
            Add Task
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SIDEBAR COMPONENT ---
const Sidebar = ({ activeTab, setActiveTab, tags, types }) => {
  const sortedTags = useMemo(() => {
    return tags.sort((a, b) => {
      const indexA = ALLOWED_TAGS.indexOf(a);
      const indexB = ALLOWED_TAGS.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return a.localeCompare(b);
    });
  }, [tags]);

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 md:flex">
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-2 text-indigo-400">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          <span className="text-lg font-bold tracking-tight text-white">Discussion Airdrops Tools</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar">
        <nav className="space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'wallets', label: 'My Wallets', icon: Wallet },
            { id: 'twitter', label: 'Twitter', icon: Twitter },
            { id: 'ai', label: 'AI Assistant', icon: Sparkles },
            { id: 'youtube', label: 'YouTube', icon: Youtube },
            { id: 'done', label: 'DONE', icon: CheckCircle },
            { id: 'favorites', label: 'Favorites', icon: Star },
            { id: 'settings', label: 'Settings', icon: Settings, showAlert: !import.meta.env.VITE_FIREBASE_API_KEY },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative ${
                activeTab === item.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>
              {item.showAlert && (
                <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
        
        {types && types.length > 0 && (
          <div className="mt-8">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Zap size={12} /> TYPES
            </h4>
            <nav className="space-y-1">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(`type-${type}`)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === `type-${type}`
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Zap size={16} className={activeTab === `type-${type}` ? 'text-indigo-400' : 'text-slate-500 opacity-70'} />
                  <span className="truncate">{type}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {sortedTags && sortedTags.length > 0 && (
          <div className="mt-8">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Menu size={12} /> TAGS
            </h4>
            <nav className="space-y-1">
              {sortedTags.map((tag) => {
                const isUnknown = tag === 'unknown';
                const TagIcon = isUnknown ? HelpCircle : Hash;
                const displayLabel = tag.charAt(0).toUpperCase() + tag.slice(1);

                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTab(`tag-${tag}`)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === `tag-${tag}`
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <TagIcon size={16} className={activeTab === `tag-${tag}` ? 'text-indigo-400' : 'text-slate-500 opacity-70'} />
                    <span className="truncate">{displayLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
          <h4 className="text-xs font-bold uppercase text-indigo-400">Connect With Us</h4>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-400">
              <a href="https://www.youtube.com/@DiscussionAirdrops" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                YouTube: @DiscussionAirdrops
              </a>
            </p>
            <p className="text-xs text-slate-400">
              <a href="https://twitter.com/inokrambol" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Twitter: @inokrambol
              </a>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, subtext, type, icon: Icon }) => {
  const styles = {
    blue: 'bg-blue-900/20 text-blue-400 border-blue-900/30',
    green: 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30',
    orange: 'bg-orange-950/20 text-orange-400 border-orange-950/30',
    purple: 'bg-purple-900/20 text-purple-400 border-purple-900/30',
  };
  
  const currentStyle = styles[type] || styles.blue;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition-all hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${currentStyle} bg-opacity-20`}>
            {Icon && <Icon size={20} className={currentStyle.split(' ')[1]} />}
          </div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${currentStyle}`}>
          {subtext}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [user, setUser] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [resetTime, setResetTime] = useState(() => {
    const saved = localStorage.getItem('dailyResetTime');
    return saved ? parseInt(saved) : 0; // Default 00:00 (midnight)
  });
  const [sortBy, setSortBy] = useState('date');
  const fileInputRef = useRef(null);
  const [telegramLink, setTelegramLink] = useState(''); // Declare telegramLink

  // Declare updateTask function
  const updateTask = async (taskId, updatedTask) => {
    if (!user) return;
    try {
      const db = getDb();
      if (!db) {
        console.error("[v0] Firestore not initialized");
        return;
      }
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), updatedTask);
    } catch (e) {
      console.error("Error updating task: ", e);
    }
  };

  // 1. AUTHENTICATION & UID LOGGING
  useEffect(() => {
    // Initialize Firebase with stored config
    const { auth: authInstance, app: appInstance } = initFirebase(firebaseConfig);
    
    if (!authInstance) {
      console.log("[v0] Firebase auth not available - show setup screen");
      setLoading(false);
      return;
    }
    
    // Initialize Firestore service and get db instance
    if (appInstance) {
      try {
        initializeFirestore(appInstance);
        db = getFirestore(appInstance);
        setDbInstance(db);
        console.log("[v0] Firestore service initialized, db:", !!db);
      } catch (e) {
        console.warn("[v0] Firestore service init warning:", e.message);
      }
    }
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
      console.log("[v0] Auth state changed:", { email: currentUser?.email, hasUser: !!currentUser });
      
      if (currentUser) {
        console.log("[v0] User logged in:", currentUser.email);
        setUser(currentUser);
        setAuthError(null);
      } else {
        console.log("[v0] No user logged in");
        setUser(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("[v0] Auth state error:", error);
      setAuthError(error.message);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // 2. FIRESTORE SYNC & DAILY LOGIC
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const processedTasks = fetchedTasks.map(t => {
        if (t.frequency === 'Daily' && t.status === 'Done' && t.lastDoneDate) {
          const lastDate = t.lastDoneDate.toDate ? t.lastDoneDate.toDate() : new Date(t.lastDoneDate);
          const today = new Date();
          
          const isSameDay = lastDate.getDate() === today.getDate() &&
                            lastDate.getMonth() === today.getMonth() &&
                            lastDate.getFullYear() === today.getFullYear();
          
          if (!isSameDay) {
            return { ...t, status: 'Pending', isReset: true }; 
          }
        }
        return t;
      });

      setTasks(processedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      if (error.code === 'permission-denied') {
          setAuthError("Database permission denied. Please update Firestore Rules.");
          setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 3. HANDLERS
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTasks([]);
      console.log("[v0] User logged out successfully");
    } catch (error) {
      console.error("[v0] Error logging out:", error);
      setAuthError("Failed to logout");
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setAuthError(null);
    setLoading(false);
    console.log("[v0] User logged in:", userData.email);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setIsSyncing(false);
    }, 1200);
  };

  const addTask = async (newTask) => {
    if (!user) return;
    try {
      await addDoc(collection(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks'), {
        ...newTask,
        frequency: newTask.frequency || 'Daily',
        status: 'Pending',
        createdAt: serverTimestamp(),
        lastDoneDate: null
      });
    } catch (e) {
      console.error("Error adding task: ", e);
      alert(`Gagal menambah task: ${e.message}`);
    }
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (!Array.isArray(jsonData)) {
            alert("Format JSON salah. Harus berupa Array of Objects [{}, {}].");
            return;
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const item of jsonData) {
            const description = item.content?.full_text || item.task || item.description || '';
            if (!description) continue;

            // --- DATE EXTRACTION ---
            let jsonTimestamp = null;
            if (item.date) {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) {
                    jsonTimestamp = Timestamp.fromDate(d);
                }
            }

            let realLink = '';
            const urlMatches = description.match(/(https?:\/\/[^\s,\]\)]+)/g);
            if (urlMatches && urlMatches.length > 0) {
                realLink = urlMatches[0]; 
            }

            let sourceName = '';
            if (item.source) {
                sourceName = item.source;
            }

            let cleanDesc = description.replace(/[*_]/g, '').trim(); 
            let project = 'Unknown Project';
            const firstLine = cleanDesc.split('\n')[0];
            const projectMatch = firstLine.match(/^([^:\n-]+)/);
            if (projectMatch && projectMatch[1]) {
                project = projectMatch[1].substring(0, 40).trim(); 
            } else {
                project = firstLine.substring(0, 30) + '...';
            }

            let rawTags = [];
            if (item.tags_detected && Array.isArray(item.tags_detected)) {
                rawTags = item.tags_detected;
            } else {
                rawTags = description.match(/#\w+/g) || [];
            }
            
            const normalizedTags = rawTags.map(tag => tag.toLowerCase().replace('#', ''));
            let finalTags = normalizedTags.filter(tag => ALLOWED_TAGS.includes(tag));
            finalTags = [...new Set(finalTags)];
            if (finalTags.length === 0) finalTags = ['unknown'];

            const importedData = {
                project: project,
                task: description,
                chain: item.chain || 'Unknown',
                link: realLink || telegramLink, 
                tags: finalTags,
                source: sourceName,
                jsonDate: jsonTimestamp 
            };

            const checkLink = importedData.link;
            
            const existingTask = tasks.find(t => 
                t.link && checkLink && 
                t.link.toLowerCase() === checkLink.toLowerCase() && 
                (selectedWallet === 'all' || t.walletId === selectedWallet)
            );

            if (existingTask) {
                const taskChanged = existingTask.task !== importedData.task;
                const currentTags = existingTask.tags || [];
                const tagsChanged = JSON.stringify([...currentTags].sort()) !== JSON.stringify([...finalTags].sort());
                const sourceChanged = existingTask.source !== importedData.source;

                if (taskChanged || tagsChanged || sourceChanged) {
                    await updateDoc(doc(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks', existingTask.id), {
                        project: importedData.project,
                        task: importedData.task,
                        tags: importedData.tags,
                        source: importedData.source, 
                        jsonDate: importedData.jsonDate, 
                        status: taskChanged ? 'Pending' : existingTask.status,
                        lastUpdated: serverTimestamp()
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                await addDoc(collection(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks'), {
                    ...importedData,
                    walletId: selectedWallet === 'all' ? WALLETS[1].id : selectedWallet,
                    frequency: 'Daily',
                    priority: 'Medium',
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                    lastDoneDate: null
                });
                addedCount++;
            }
        }

        alert(`Import JSON Selesai:\n${addedCount} Baru\n${updatedCount} Diupdate\n${skippedCount} Dilewati`);
        event.target.value = ''; 

      } catch (err) {
        console.error("JSON Parse Error:", err);
        alert("Gagal membaca file JSON. Pastikan format valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleJsonExport = async () => {
    if (!user || tasks.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const exportData = tasks.map(task => ({
        project: task.project,
        task: task.task,
        chain: task.chain,
        link: task.link,
        type: task.type,
        priority: task.priority,
        status: task.status,
        walletId: task.walletId,
        source: task.source || 'Manual',
        createdAt: task.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        lastDoneDate: task.lastDoneDate?.toDate?.().toISOString() || null,
      }));

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `airdrops_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const toggleFavorite = (taskId) => {
    setFavorites(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const deleteAllTasks = async () => {
    if (!user) return;
    const confirmMsg = "⚠️ PERINGATAN KERAS ⚠️\n\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA TASK?\nTindakan ini tidak bisa dibatalkan.";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
        const q = query(collection(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            alert("Tidak ada data untuk dihapus.");
            setLoading(false);
            return;
        }

        const batch = writeBatch(getDb());
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        alert(`Berhasil menghapus ${snapshot.size} task.`);
    } catch (e) {
        console.error("Error deleting all:", e);
        alert("Gagal menghapus data. Coba lagi.");
    } finally {
        setLoading(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    if (!user) return;
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
    const updateData = { status: newStatus };
    if (newStatus === 'Done') updateData.lastDoneDate = Timestamp.now();

    try {
      await updateDoc(doc(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks', task.id), updateData);
    } catch (e) {
      console.error("Error updating task: ", e);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Hapus task ini?')) return;
    try {
      await deleteDoc(doc(getDb(), 'artifacts', appId, 'users', user.uid, 'tasks', taskId));
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  // 4. FILTERING & STATS
  const availableTags = useMemo(() => {
      return ALLOWED_TAGS;
  }, []);

  const availableTypes = useMemo(() => {
      const allTypes = tasks
          .map(t => t.type)
          .filter(type => type && type.trim() !== '');
      const uniqueTypes = [...new Set(allTypes)];
      return uniqueTypes.sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let data = tasks;
    
    // 1. Filter Wallet
    if (selectedWallet !== 'all') {
      data = data.filter(t => t.walletId === selectedWallet);
    }

    // 2. Filter by Type
    if (activeTab.startsWith('type-')) {
        const typeName = activeTab.replace('type-', '');
        data = data.filter(t => t.type === typeName);
    }
    // 3. Filter Tab/Tag
    else if (activeTab.startsWith('tag-')) {
        const tagName = activeTab.replace('tag-', '');
        data = data.filter(t => t.tags && t.tags.includes(tagName));
    }

    // 4. Search Query Filter
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        data = data.filter(t => 
            (t.project && t.project.toLowerCase().includes(lowerQ)) ||
            (t.task && t.task.toLowerCase().includes(lowerQ)) ||
            (t.source && t.source.toLowerCase().includes(lowerQ))
        );
    }

    // Apply sorting
    return data.sort((a, b) => {
      // Always prioritize pending tasks first
      if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1;
      
      // Then sort by selected sort option
      if (sortBy === 'project') {
        return (a.project || '').localeCompare(b.project || '');
      } else if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      } else {
        // Default: sort by date (newest first)
        const timeA = a.jsonDate?.toMillis ? a.jsonDate.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.jsonDate?.toMillis ? b.jsonDate.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA; 
      }
    });
  }, [selectedWallet, activeTab, tasks, searchQuery, sortBy]); 

  const stats = useMemo(() => {
    return {
      dailyPending: filteredTasks.filter(t => t.frequency === 'Daily' && t.status === 'Pending').length,
      totalPending: tasks.filter(t => t.status === 'Pending').length,
      doneToday: tasks.filter(t => t.status === 'Done').length,
    };
  }, [filteredTasks, tasks]);

  const getWalletName = (id) => WALLETS.find(w => w.id === id)?.name || id;
  const getPageTitle = () => {
      if (activeTab.startsWith('type-')) {
          const rawType = activeTab.replace('type-', '');
          return rawType + ' Tasks';
      }
      if (activeTab.startsWith('tag-')) {
          const rawTag = activeTab.replace('tag-', '');
          return rawTag.charAt(0).toUpperCase() + rawTag.slice(1) + ' Tasks';
      }
      if (activeTab === 'dashboard') return 'Daily Operations';
      if (activeTab === 'wallets') return 'Wallet Management';
  
      if (activeTab === 'ai') return 'AI Assistant';
      if (activeTab === 'twitter') return 'Twitter Management';
      if (activeTab === 'youtube') return 'YouTube Channel';
      if (activeTab === 'settings') return 'Settings & Configuration';
      return 'Dashboard';
  };

  // -- LOADING / ERROR STATES --
  if (authError) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-center text-slate-400 p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
            <p className="max-w-md bg-slate-900 p-4 rounded-lg border border-slate-800 text-sm font-mono text-red-400">{authError}</p>
            <button onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-500">Retry</button>
        </div>
    );
  }

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <p>Loading your grind station...</p>
    </div>
  );

  // Show Auth screen if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <div className="flex h-screen bg-slate-900 font-sans text-slate-100">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tags={availableTags} types={availableTypes} />
            <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
            <QuickAddForm onAdd={addTask} wallets={WALLETS} />

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col overflow-hidden">
              
              {/* Top Header */}
              <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-white">
                    {getPageTitle()}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                    {user?.email || 'User'}
                  </span>
                  <button 
                    onClick={() => setIsDonateOpen(true)}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:shadow-blue-500/50"
                    title="Support the project"
                  >
                    Donate 💙
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition"
                    title="Logout"
                  >
                    Logout
                  </button>
                </div>
              </header>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8">
                  
                  {/* Conditional Rendering for Tabs */}
                  {activeTab === 'wallets' ? (
                      // WALLET MANAGER VIEW
                      <WalletComponent user={user} db={dbInstance} />
                  ) : activeTab === 'twitter' ? (
                      // TWITTER MANAGER VIEW
                      <TwitterComponent user={user} db={dbInstance} />

                  ) : activeTab === 'youtube' ? (
                      // YOUTUBE CHANNEL VIEW
                      <YouTubeComponent user={user} />
                  ) : activeTab === 'ai' ? (
                      // AI ASSISTANT VIEW
                      <AIComponent user={user} db={dbInstance} />
                  ) : activeTab === 'done' ? (
                      // DONE TASKS VIEW
                      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                        <div className="border-b border-slate-800 px-6 py-4">
                          <h3 className="font-semibold text-white">Completed Tasks</h3>
                          <span className="text-sm text-slate-400">{tasks.filter(t => t.status === 'Done').length} projects completed</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-800">
                                <th className="px-6 py-3 text-left font-semibold text-slate-300">Project</th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-300">Type</th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-300">Link</th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-300">Completed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tasks.filter(t => t.status === 'Done').length > 0 ? (
                                tasks.filter(t => t.status === 'Done').map((task) => (
                                  <tr key={task.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                    <td className="px-6 py-3 text-slate-200">{task.project}</td>
                                    <td className="px-6 py-3">
                                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                        {task.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3">
                                      {task.link ? (
                                        <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate max-w-xs block">
                                          {task.link}
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">
                                      {task.lastDoneDate?.toDate?.().toLocaleDateString?.() || task.lastDoneDate || '-'}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    No completed tasks yet
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : activeTab === 'favorites' ? (
                      // FAVORITES VIEW
                      <div className="space-y-4">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 shadow-sm">
                          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">Favorite Airdrops</h3>
                                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                                  {tasks.filter(t => favorites.includes(t.id)).length} favorites
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Table Content */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                              <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                                <tr>
                                  <th className="px-6 py-3 font-medium">Project / Source</th>
                                  <th className="px-6 py-3 font-medium">Task Detail</th>
                                  <th className="px-6 py-3 font-medium">Type</th>
                                  <th className="px-6 py-3 text-right font-medium">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {tasks.filter(t => favorites.includes(t.id)).length > 0 ? (
                                  tasks.filter(t => favorites.includes(t.id)).map((task, index) => {
                                    const taskColor = generateTaskColor(task.id);
                                    const taskNumber = index + 1;
                                    return (
                                      <tr key={task.id} className={`group transition-all border-l-4 ${taskColor.border} ${task.status === 'Done' ? 'bg-slate-950/30 opacity-60' : `${taskColor.bg} hover:${taskColor.bg}`}`}>
                                        <td className="px-6 py-4">
                                          <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-bold ${taskColor.accent} border ${taskColor.border}`}>
                                              #{taskNumber}
                                            </div>
                                            <div className="flex-1">
                                              <div className={`font-medium ${task.status === 'Done' ? 'text-slate-500' : 'text-slate-200'}`}>
                                                {task.project}
                                              </div>
                                              
                                              {task.source && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium bg-slate-800/50 px-1.5 py-0.5 rounded w-fit">
                                                  <MessageCircle size={10} className="text-blue-400"/> {task.source}
                                                </div>
                                              )}
                                              {!task.source && <div className="text-xs text-slate-400 mt-1">{task.chain}</div>}

                                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                <Calendar size={10} />
                                                {formatDate(task.jsonDate || task.createdAt)}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <span className={`${task.status === 'Done' ? 'text-slate-600 line-through' : 'text-slate-300'} block max-w-xs truncate`} title={task.task}>
                                            {task.task}
                                          </span>
                                          {task.tags && task.tags.length > 0 && (
                                             <div className="mt-1 flex flex-wrap gap-1">
                                                {task.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className={`inline-flex items-center text-[10px] px-1.5 rounded ${tag === 'unknown' ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-900/20'}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                             </div>
                                          )}
                                          {task.priority === 'High' && task.status !== 'Done' && (
                                            <span className="mt-1 inline-flex items-center rounded-sm bg-red-900/30 px-1.5 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                                              🔥 High
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-6 py-4">
                                           <select 
                                             value={task.type || ''}
                                             onChange={(e) => {
                                               const updated = { ...task, type: e.target.value };
                                               updateTask(task.id, updated);
                                             }}
                                             className={`inline-flex items-center rounded px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide border bg-slate-950 cursor-pointer focus:outline-none transition-colors ${getTypeStyle(task.type).bg} ${getTypeStyle(task.type).text} border-${getTypeStyle(task.type).border}`}
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
                                             <option value="End">End</option>
                                           </select>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center justify-end gap-3">
                                            {task.link && (
                                              <a 
                                                href={task.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg p-2 text-slate-600 hover:bg-blue-900/20 hover:text-blue-400 transition-colors"
                                                title="Visit Link"
                                              >
                                                <ExternalLink size={16} />
                                              </a>
                                            )}
                                            <button 
                                              onClick={() => {
                                                const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
                                                const updateData = { status: newStatus };
                                                if (newStatus === 'Done') updateData.lastDoneDate = Timestamp.now();
                                                updateTask(task.id, updateData);
                                              }}
                                              className={`rounded-lg p-2 transition-colors ${
                                                task.status === 'Done'
                                                  ? 'text-green-400 hover:bg-green-900/20'
                                                  : 'text-slate-600 hover:bg-green-900/20 hover:text-green-400'
                                              }`}
                                              title={task.status === 'Done' ? 'Mark as Pending' : 'Mark as Done'}
                                            >
                                              <CheckCircle2 size={16} />
                                            </button>
                                            <button 
                                              onClick={() => toggleFavorite(task.id)}
                                              className="text-yellow-400 hover:text-yellow-300 transition-colors rounded-lg p-2 hover:bg-yellow-900/20"
                                              title="Remove from favorites"
                                            >
                                              <Star size={16} fill="currentColor" />
                                            </button>
                                            <button 
                                              onClick={() => deleteTask(task.id)}
                                              className="rounded-lg p-2 text-slate-600 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                                              title="Delete Task"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                      No favorite airdrops yet. Click the star icon on any project to add to favorites!
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                  ) : activeTab === 'settings' ? (
                      // SETTINGS VIEW
                      <SettingsComponent user={user} />
                  ) : (
                      // DEFAULT DASHBOARD / TASK VIEW
                      <>
                        {/* Stats Row */}
                        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                          <StatCard 
                            title={activeTab.startsWith('tag-') ? "Pending in Category" : "Daily Grind Left"} 
                            value={stats.dailyPending} 
                            subtext={stats.dailyPending > 0 ? "Priority 🔥" : "All Clear"} 
                            type="orange" 
                            icon={RefreshCw}
                          />
                          <StatCard 
                            title="Total Pending" 
                            value={stats.totalPending} 
                            subtext="Tasks" 
                            type="blue" 
                            icon={Clock}
                          />
                          <StatCard 
                            title="Done Today" 
                            value={stats.doneToday} 
                            subtext="Keep going!" 
                            type="green" 
                            icon={CheckCircle2}
                          />
                        </div>

                        {/* Table Section */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                          {/* Table Header with Search Bar */}
                          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">Task Overview</h3>
                                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                                  {filteredTasks.length} tasks
                                </span>
                              </div>
                              
                              {/* Right Side: Search & Buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                  {/* Search Input */}
                                  <div className="relative w-full sm:w-64">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                      <input 
                                          type="text" 
                                          placeholder="Search projects..." 
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                                      />
                                  </div>

                                  {/* Sort Dropdown */}
                                  <select 
                                      value={sortBy}
                                      onChange={(e) => setSortBy(e.target.value)}
                                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                                  >
                                      <option value="date">Sort by Date</option>
                                      <option value="project">Sort by Project</option>
                                      <option value="status">Sort by Status</option>
                                  </select>

                                  <div className="flex gap-2 justify-end">
                                      <button 
                                        onClick={handleManualSync}
                                        disabled={isSyncing}
                                        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
                                        title="Sync Now"
                                      >
                                        <RefreshCw size={16} className={isSyncing ? "animate-spin text-indigo-400" : ""} /> 
                                      </button>

                                      <input 
                                      type="file" 
                                      accept=".json" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      onChange={handleJsonUpload} 
                                      />
                                      
                                      <button 
                                      onClick={deleteAllTasks}
                                      className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all"
                                      title="Hapus Semua Data"
                                      >
                                      <Trash2 size={16} />
                                      </button>

                                      <button 
                                      onClick={() => fileInputRef.current.click()}
                                      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                                      title="Import JSON"
                                      >
                                      <FileJson size={16} />
                                      </button>

                                      <button 
                                      onClick={handleJsonExport}
                                      className="flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 transition-all"
                                      title="Export JSON"
                                      >
                                      <Download size={16} />
                                      </button>
                                  </div>
                              </div>
                            </div>

                          </div>

                            {/* Table Content */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                                  <tr>
                                    <th className="px-6 py-3 font-medium">Project / Source</th>
                                    <th className="px-6 py-3 font-medium">Task Detail</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 text-right font-medium">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                  {filteredTasks.length > 0 ? (
                                    filteredTasks.map((task, index) => {
                                      const taskColor = generateTaskColor(task.id);
                                      const taskNumber = index + 1;
                                      return (
                                      <tr key={task.id} className={`group transition-all border-l-4 ${taskColor.border} ${task.status === 'Done' ? 'bg-slate-950/30 opacity-60' : `${taskColor.bg} hover:${taskColor.bg}`}`}>
                                        <td className="px-6 py-4">
                                          <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-bold ${taskColor.accent} border ${taskColor.border}`}>
                                              #{taskNumber}
                                            </div>
                                            <div className="flex-1">
                                              <div className={`font-medium ${task.status === 'Done' ? 'text-slate-500' : 'text-slate-200'}`}>
                                                {task.project}
                                              </div>
                                              
                                              {/* --- NEW BADGE INDICATOR --- */}
                                              {isTaskNew(task) && (
                                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20 animate-pulse mt-1">
                                                  <Sparkles size={8} /> NEW
                                                </span>
                                              )}

                                              {task.source && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium bg-slate-800/50 px-1.5 py-0.5 rounded w-fit">
                                                  <MessageCircle size={10} className="text-blue-400"/> {task.source}
                                                </div>
                                              )}
                                              {!task.source && <div className="text-xs text-slate-400 mt-1">{task.chain}</div>}

                                              {/* --- DATE DISPLAY --- */}
                                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                <Calendar size={10} />
                                                {formatDate(task.jsonDate || task.createdAt)}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <span className={`${task.status === 'Done' ? 'text-slate-600 line-through' : 'text-slate-300'} block max-w-xs truncate`} title={task.task}>
                                            {task.task}
                                          </span>
                                          {/* Display Tags */}
                                          {task.tags && task.tags.length > 0 && (
                                             <div className="mt-1 flex flex-wrap gap-1">
                                                {task.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className={`inline-flex items-center text-[10px] px-1.5 rounded ${tag === 'unknown' ? 'text-slate-400 bg-slate-800' : 'text-indigo-400 bg-indigo-900/20'}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                             </div>
                                          )}
                                          {task.priority === 'High' && task.status !== 'Done' && (
                                            <span className="mt-1 inline-flex items-center rounded-sm bg-red-900/30 px-1.5 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                                              🔥 High
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-6 py-4">
                                           <select 
                                             value={task.type || ''}
                                             onChange={(e) => {
                                               const updated = { ...task, type: e.target.value };
                                               updateTask(task.id, updated);
                                             }}
                                             className={`inline-flex items-center rounded px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide border bg-slate-950 cursor-pointer focus:outline-none transition-colors ${getTypeStyle(task.type).bg} ${getTypeStyle(task.type).text} border-${getTypeStyle(task.type).border}`}
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
                                             <option value="End">End</option>
                                           </select>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center justify-end gap-3">
                                            <button 
                                              onClick={() => {
                                                const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
                                                const updateData = { status: newStatus };
                                                if (newStatus === 'Done') updateData.lastDoneDate = Timestamp.now();
                                                updateTask(task.id, updateData);
                                              }}
                                              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                task.status === 'Done' 
                                                  ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40' 
                                                  : 'bg-slate-700/50 text-slate-300 hover:bg-emerald-900/30 hover:text-emerald-400'
                                              }`}
                                              title={task.status === 'Done' ? 'Mark as Pending' : 'Mark as Done'}
                                            >
                                              <CheckCircle2 size={14} />
                                              {task.status === 'Done' ? 'Done' : 'Do It'}
                                            </button>
                                            {task.link && (
                                              <button 
                                                onClick={() => window.open(task.link, '_blank')}
                                                className="flex items-center gap-1 rounded-lg bg-indigo-900/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-900/40 transition-colors"
                                                title="Open Project Link"
                                              >
                                                <ExternalLink size={14} />
                                                Link
                                              </button>
                                            )}
                                            <button 
                                              onClick={() => toggleFavorite(task.id)}
                                              className={`rounded-lg p-2 transition-colors ${
                                                favorites.includes(task.id)
                                                  ? 'text-yellow-400 hover:bg-yellow-900/20'
                                                  : 'text-slate-600 hover:bg-yellow-900/20 hover:text-yellow-400'
                                              }`}
                                              title={favorites.includes(task.id) ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                              <Star size={16} fill={favorites.includes(task.id) ? 'currentColor' : 'none'} />
                                            </button>
                                            <button 
                                              onClick={() => deleteTask(task.id)}
                                              className="rounded-lg p-2 text-slate-600 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                                              title="Delete Task"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                          <div className="rounded-full bg-slate-800 p-3">
                                            <CheckCircle2 size={24} className="text-slate-600" />
                                          </div>
                                          <p>No tasks found {activeTab.startsWith('tag-') ? `in ${activeTab.replace('tag-', '')}` : 'here'}. Time to touch grass? 🌱</p>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Table Footer */}
                            <div className="border-t border-slate-800 bg-slate-900 px-6 py-3 flex justify-between items-center text-xs text-slate-500">
                              <span>Showing {filteredTasks.length} tasks</span>
                              <span className="flex items-center gap-1"><RefreshCw size={10}/> Data syncs automatically</span>
                            </div>
                          </div>
                      </>
                  )}
              </div>
            </main>
          </div>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default App;
