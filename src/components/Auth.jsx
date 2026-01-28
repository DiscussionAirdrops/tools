'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, Loader2, Settings, ChevronRight, Copy, Shield } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getAuth,
  updateProfile 
} from 'firebase/auth';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Firebase Config State
  const [jsonInput, setJsonInput] = useState('');
  const [configError, setConfigError] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Izinkan user membaca/menulis datanya sendiri
    // Path harus sesuai dengan struktur di App.jsx: artifacts -> appId -> users -> userId
    match /artifacts/{appId}/users/{userId}/{document=**} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  useEffect(() => {
    // Check if Firebase config exists
    const hasConfig = localStorage.getItem('firebase_projectId');
    setShowSetup(!hasConfig);
    
    if (hasConfig) {
      setFirebaseConfig({
        apiKey: localStorage.getItem('firebase_apiKey'),
        authDomain: localStorage.getItem('firebase_authDomain'),
        projectId: localStorage.getItem('firebase_projectId'),
        storageBucket: localStorage.getItem('firebase_storageBucket'),
        messagingSenderId: localStorage.getItem('firebase_messagingSenderId'),
        appId: localStorage.getItem('firebase_appId')
      });
    }
  }, []);

  const extractConfigFromJson = (jsonString) => {
    try {
      // Simple approach: extract just the object content between { and }
      let text = jsonString.trim();
      
      // Find opening brace
      const openBrace = text.indexOf('{');
      if (openBrace === -1) {
        throw new Error('No opening brace found');
      }
      
      // Find closing brace (count nested braces)
      let braceCount = 0;
      let closeBrace = -1;
      for (let i = openBrace; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            closeBrace = i;
            break;
          }
        }
      }
      
      if (closeBrace === -1) {
        throw new Error('No closing brace found');
      }
      
      // Extract JSON between braces
      let jsonStr = text.substring(openBrace, closeBrace + 1);
      
      // Remove all // comments (but only outside of strings)
      jsonStr = jsonStr.split('\n').map(line => {
        // Find // that's not inside quotes
        let inString = false;
        let escaped = false;
        for (let i = 0; i < line.length - 1; i++) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (line[i] === '\\') {
            escaped = true;
            continue;
          }
          if (line[i] === '"') {
            inString = !inString;
            continue;
          }
          if (!inString && line[i] === '/' && line[i + 1] === '/') {
            return line.substring(0, i);
          }
        }
        return line;
      }).join('\n');
      
      // Remove /* */ comments
      jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Remove trailing commas
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      
      // Convert JavaScript object notation to valid JSON
      // Add quotes around property names that don't have them
      jsonStr = jsonStr.replace(/(\{|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      
      console.log('[v0] Parsing JSON:', jsonStr.substring(0, 80));
      const data = JSON.parse(jsonStr);
      
      // Extract Firebase config
      if (data.apiKey) {
        return {
          apiKey: data.apiKey,
          authDomain: data.authDomain || '',
          projectId: data.projectId || '',
          storageBucket: data.storageBucket || '',
          messagingSenderId: data.messagingSenderId || '',
          appId: data.appId || '',
        };
      }
      
      if (data.project_id) {
        return {
          projectId: data.project_id,
          apiKey: 'AIzaSyDummy',
          authDomain: `${data.project_id}.firebaseapp.com`,
          storageBucket: `${data.project_id}.appspot.com`,
          messagingSenderId: data.project_id.split('-')[0],
          appId: '1:0:web:0',
        };
      }
      
      throw new Error('Missing apiKey or project_id in config');
    } catch (err) {
      console.error('[v0] Parse error:', err.message);
      throw new Error(`Failed to parse JSON: ${err.message}`);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setConfigError('');
    setConfigLoading(true);

    try {
      if (!jsonInput.trim()) {
        setConfigError('Please paste your Firebase config JSON');
        setConfigLoading(false);
        return;
      }

      const config = extractConfigFromJson(jsonInput);

      // Save to localStorage
      Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(`firebase_${key}`, value);
      });

      console.log('[v0] Firebase config saved successfully from JSON');
      setShowSetup(false);
      setConfigError('');
      setJsonInput('');
      
      // Reload the app to reinitialize Firebase with new config
      window.location.reload();
    } catch (err) {
      console.error('[v0] Config error:', err);
      setConfigError(err.message || 'Failed to process Firebase config');
      setConfigLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = getAuth();

      if (isLogin) {
        // Sign In
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('[v0] User signed in:', result.user.email);
        onLogin(result.user);
      } else {
        // Sign Up
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update display name
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
        
        console.log('[v0] User registered:', result.user.email);
        onLogin(result.user);
      }
    } catch (err) {
      console.error('[v0] Auth error:', err);
      
      // Handle specific Firebase errors
      let errorMessage = 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Firebase Setup Screen
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full mb-4">
              <Settings size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Connect Your Firebase</h1>
            <p className="text-slate-400">Paste your Firebase config to get started</p>
          </div>

          {/* Card */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur mb-6">
            {/* Error Message */}
            {configError && (
              <div className="mb-4 flex gap-2 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{configError}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
              <p className="text-xs text-indigo-300 mb-3 font-semibold">Setup Instructions:</p>
              
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-medium">Firebase Console</a></li>
                <li>Select your project → Project Settings (gear icon)</li>
                <li>In <strong>"Your apps"</strong>, find your <strong>Web App</strong></li>
                <li>Copy the config JSON and paste below</li>
              </ol>
            </div>

            {/* Firebase Firestore Rules */}
            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-purple-400" />
                  <p className="text-xs text-purple-300 font-semibold">Firestore Security Rules:</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    copiedRules
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-700/50 hover:bg-purple-600 text-purple-200'
                  }`}
                >
                  <Copy size={12} />
                  {copiedRules ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-xs text-purple-200 font-mono whitespace-pre-wrap bg-slate-900/50 p-2 rounded block max-h-40 overflow-y-auto">
                {firestoreRules}
              </code>
              <p className="text-xs text-purple-300 mt-2">
                Paste di Firebase Console → Firestore → Rules tab
              </p>
            </div>

            {/* JSON Textarea */}
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Paste Firebase Config JSON di sini:
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={'{\n  "apiKey": "AIza...",\n  "authDomain": "project.firebaseapp.com",\n  "projectId": "my-project",\n  "storageBucket": "my-project.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123456789:web:abc123"\n}'}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono h-40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={configLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {configLoading && <Loader2 size={18} className="animate-spin" />}
                {configLoading ? 'Setting up...' : 'Connect Firebase'}
              </button>
            </form>

            <p className="text-xs text-slate-500 mt-4 text-center">
              Your config is stored locally in your browser only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discussion Airdrops Tools</h1>
          <p className="text-slate-400">Track and manage your crypto airdrops</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-gap-2 gap-2 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Your data is encrypted and secure with Firebase
        </p>

        {/* Reconfigure Firebase */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="text-slate-400 hover:text-slate-300 text-xs flex items-center justify-center gap-1 mx-auto"
          >
            <Settings size={14} />
            Reconfigure Firebase
          </button>
        </div>
      </div>
    </div>
  );
}
