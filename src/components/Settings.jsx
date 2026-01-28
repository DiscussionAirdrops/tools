'use client';

import React from 'react';
import { 
  Settings as SettingsIcon, 
  Copy, 
  Shield,
  Heart,
  Clock
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import WalletDonation from './WalletDonation';

const Settings = ({ user }) => { 
  const [copied, setCopied] = React.useState(false);
  const [resetTime, setResetTime] = React.useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('dailyResetTime') : null;
    return saved ? parseInt(saved) : 0;
  });
  const { openConnectModal } = useConnectModal();

  // Get Firebase config from localStorage
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('firebase_apiKey') || '' : '';
  const projectId = typeof window !== 'undefined' ? localStorage.getItem('firebase_projectId') || '' : '';
  const authDomain = typeof window !== 'undefined' ? localStorage.getItem('firebase_authDomain') || '' : '';
  const storageBucket = typeof window !== 'undefined' ? localStorage.getItem('firebase_storageBucket') || '' : '';
  const messagingSenderId = typeof window !== 'undefined' ? localStorage.getItem('firebase_messagingSenderId') || '' : '';
  const appId = typeof window !== 'undefined' ? localStorage.getItem('firebase_appId') || '' : '';

  const envTemplate = `# Firebase Config (Optional)
VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <SettingsIcon size={28} className="text-indigo-400"/> Settings
            </h2>
         </div>
       </div>

       {/* SECTION: WARNING - Only show if ENV not set */}
       {!import.meta.env.VITE_FIREBASE_API_KEY && (
         <div className="bg-red-900/20 border-2 border-red-700/50 rounded-xl p-6">
             <p className="text-xs font-bold text-red-300">⚠️ PERINGATAN - PENTING!</p>
             <p className="text-xs text-red-200 leading-relaxed mt-2">
               Konfigurasi Firebase yang ditampilkan di sini hanya tersimpan di browser Anda secara sementara. Untuk dapat membuild project ke hosting atau membuka aplikasi di browser/perangkat lain, Anda HARUS meng-update file <strong>.env</strong> di folder project Anda dengan kode di bawah.
             </p>
             <p className="text-xs text-red-200 leading-relaxed mt-2">
               Tanpa update file .env, aplikasi tidak akan berfungsi saat di-build atau di-deploy ke hosting.
             </p>
         </div>
       )}

       {/* SECTION: FIREBASE ENVIRONMENT SETUP */}
       <div className="bg-slate-900 border border-emerald-800/40 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Shield size={18} className="text-emerald-400"/> Environment Variables Setup (Firebase)
          </h3>
          
          {/* Status Indicator */}
          <div className={`p-3 rounded-lg flex items-center gap-2 ${import.meta.env.VITE_FIREBASE_API_KEY ? 'bg-emerald-900/20 border border-emerald-700/50' : 'bg-amber-900/20 border border-amber-700/50'}`}>
              <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_FIREBASE_API_KEY ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
              <span className={`text-xs font-semibold ${import.meta.env.VITE_FIREBASE_API_KEY ? 'text-emerald-300' : 'text-amber-300'}`}>
                {import.meta.env.VITE_FIREBASE_API_KEY ? 'Environment Variables sudah aktif ✓' : 'Belum menggunakan Environment Variables'}
              </span>
          </div>

          {/* Code Template - Only show if ENV not set */}
          {!import.meta.env.VITE_FIREBASE_API_KEY && (
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-mono">Environment Variables Template:</p>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/50 p-3 rounded block overflow-x-auto">
                  {envTemplate}
                </code>
            </div>
          )}
       </div>

       {/* SECTION: DAILY RESET TIME */}
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock size={18} className="text-indigo-400"/> Daily Tasks Reset Time
          </h3>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Pilih jam berapa daily tasks yang sudah selesai akan di-reset kembali ke status Pending untuk dikerjakan lagi besok.
          </p>

          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-300">Reset Jam:</label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="23" 
                value={resetTime}
                onChange={(e) => {
                  const newTime = parseInt(e.target.value);
                  setResetTime(newTime);
                  localStorage.setItem('dailyResetTime', newTime.toString());
                }}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg min-w-24">
                <Clock size={16} className="text-indigo-400" />
                <span className="text-sm font-bold text-white">
                  {String(resetTime).padStart(2, '0')}:00
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Default: 00:00 (tengah malam). Setiap jam yang ditentukan, daily tasks yang Done akan otomatis reset ke Pending.
            </p>
          </div>
       </div>

       {/* SECTION: SUPPORT DEVELOPER - DONATION ONLY */}
       <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-600/60 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Heart size={18} className="text-orange-400"/> Support Developer
          </h3>
          
          <p className="text-xs text-amber-100 leading-relaxed">
            Aplikasi ini dibuat untuk membantu kamu mengelola airdrop dan crypto assets. Dukungan Anda membantu development fitur baru. Terima kasih!
          </p>
          
          <WalletDonation openConnectModal={openConnectModal} />
          
          {/* Contact & Social - Compact */}
          <div className="flex gap-3 text-xs">
            <a 
              href="https://x.com/inokrambol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-amber-100 hover:text-orange-300 transition-colors"
            >
              <span>𝕏</span>
              <span>@inokrambol</span>
            </a>
            <span className="text-slate-600">•</span>
            <a 
              href="https://t.me/guitarXwar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-amber-100 hover:text-blue-300 transition-colors"
            >
              <span>💬</span>
              <span>@guitarXwar</span>
            </a>
          </div>
       </div>
    </div>
  );
};

export default Settings;
