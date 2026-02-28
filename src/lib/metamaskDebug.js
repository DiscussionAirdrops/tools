/**
 * MetaMask Connection Debugger & Auto-Reconnect
 * Improved detection dan auto-restore previous connection
 */

// Store connection state in localStorage untuk auto-reconnect
const STORAGE_KEY = 'metamask_connection_state';

export const saveConnectionState = (connected = true) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      connected,
      timestamp: Date.now(),
      previousAddress: window.ethereum?.selectedAddress || null,
    }));
  }
};

export const getConnectionState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const state = localStorage.getItem(STORAGE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (e) {
    return null;
  }
};

export const clearConnectionState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const checkMetaMaskAvailability = () => {
  console.log('[v0] ===== MetaMask Connection Diagnostics =====');
  
  // Check 1: Apakah window.ethereum tersedia?
  if (typeof window === 'undefined') {
    console.error('[v0] ❌ Window tidak tersedia (SSR environment)');
    return { available: false, reason: 'SSR_ENVIRONMENT' };
  }

  if (!window.ethereum) {
    console.error('[v0] ❌ window.ethereum tidak ditemukan');
    console.log('[v0] MetaMask tidak terinstall atau tidak aktif.');
    console.log('[v0] Solusi:');
    console.log('[v0]   1. Install MetaMask extension dari https://metamask.io');
    console.log('[v0]   2. Refresh halaman ini setelah install');
    console.log('[v0]   3. Pastikan MetaMask extension aktif (enabled) di browser settings');
    return { available: false, reason: 'METAMASK_NOT_INSTALLED' };
  }

  console.log('[v0] ✅ window.ethereum ditemukan');
  
  // Check 2: Apakah isMetaMask true?
  if (!window.ethereum.isMetaMask) {
    console.warn('[v0] ⚠️  window.ethereum.isMetaMask = false');
    console.log('[v0] Ini kemungkinan provider lain (WalletConnect, Coinbase Wallet, dll)');
  } else {
    console.log('[v0] ✅ window.ethereum.isMetaMask = true');
  }

  // Check 3: Provider status
  const isConnected = window.ethereum.isConnected?.();
  const selectedAddress = window.ethereum.selectedAddress;
  
  console.log('[v0] Provider status:');
  console.log('[v0]   - isConnected:', isConnected);
  console.log('[v0]   - selectedAddress:', selectedAddress);
  console.log('[v0]   - chainId:', window.ethereum.chainId);

  if (isConnected && selectedAddress) {
    console.log('[v0] ✅ MetaMask sudah terhubung!');
    saveConnectionState(true);
    return { available: true, reason: 'METAMASK_AVAILABLE', connected: true, address: selectedAddress };
  } else {
    console.log('[v0] ⚠️ MetaMask terinstall tapi belum terhubung. Klik "Connect Wallet" untuk connect.');
    return { available: true, reason: 'METAMASK_AVAILABLE', connected: false };
  }
};

export const debugWagmiConnection = () => {
  console.log('[v0] ===== Wagmi Connection Debug =====');
  console.log('[v0] Jika ConnectButton tidak muncul atau tidak responsif:');
  console.log('[v0]   1. Pastikan AppWrapper.jsx render terlebih dahulu');
  console.log('[v0]   2. Lihat apakah ada error di console');
  console.log('[v0]   3. Cek wagmiConfig.js - apakah chains sudah benar?');
  console.log('[v0]   4. Pastikan viem dan wagmi package terinstall dengan benar');
  
  // Check React Query
  if (window.__REACT_QUERY_DEVTOOLS_INSTALLED__) {
    console.log('[v0] ✅ React Query DevTools tersedia');
  }
};

export const setupMetaMaskListeners = () => {
  if (!window.ethereum) {
    console.warn('[v0] MetaMask tidak tersedia untuk setup listeners');
    return;
  }

  console.log('[v0] Setting up MetaMask event listeners');

  // Account change - simple logging only
  window.ethereum.on('accountsChanged', (accounts) => {
    console.log('[v0] Account changed:', accounts);
  });

  // Chain change
  window.ethereum.on('chainChanged', (chainId) => {
    console.log('[v0] Chain changed to:', chainId);
    // Reload page untuk consistency
    setTimeout(() => window.location.reload(), 500);
  });

  // Connection
  window.ethereum.on('connect', (connectInfo) => {
    console.log('[v0] MetaMask connected, chainId:', connectInfo.chainId);
  });

  // Disconnection
  window.ethereum.on('disconnect', (error) => {
    console.log('[v0] MetaMask disconnected');
    if (error) console.log('[v0] Error:', error);
  });
};

export const requestMetaMaskConnection = async () => {
  if (!window.ethereum) {
    console.error('[v0] MetaMask tidak tersedia');
    throw new Error('MetaMask tidak tersedia');
  }

  try {
    console.log('[v0] Requesting MetaMask connection...');
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    console.log('[v0] ✅ Connection berhasil! Accounts:', accounts);
    saveConnectionState(true);
    return accounts;
  } catch (error) {
    console.error('[v0] ❌ Connection failed:');
    if (error.code === 4001) {
      console.error('[v0] User rejected connection request');
      clearConnectionState();
    } else if (error.code === -32002) {
      console.error('[v0] Connection request sudah pending. Lihat popup MetaMask.');
    } else {
      console.error('[v0] Error:', error.message);
    }
    throw error;
  }
};

export const autoReconnectMetaMask = async () => {
  if (typeof window === 'undefined') return false;
  if (!window.ethereum) return false;

  const prevState = getConnectionState();
  if (!prevState?.connected) return false;

  try {
    console.log('[v0] Attempting auto-reconnect to MetaMask...');
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
    
    if (accounts.length > 0) {
      console.log('[v0] ✅ Auto-reconnect successful!');
      saveConnectionState(true);
      return true;
    } else {
      console.log('[v0] ⚠️ Auto-reconnect failed: no accounts found');
      clearConnectionState();
      return false;
    }
  } catch (error) {
    console.error('[v0] Auto-reconnect error:', error.message);
    clearConnectionState();
    return false;
  }
};

export const troubleshootMetaMask = () => {
  console.clear();
  console.log('[v0] 🔧 MetaMask Troubleshooting Guide 🔧');
  console.log('[v0] ================================================');
  
  checkMetaMaskAvailability();
  debugWagmiConnection();
  
  console.log('[v0] ================================================');
  console.log('[v0] Troubleshooting Steps:');
  console.log('[v0] 1. Lihat konsol untuk pesan error');
  console.log('[v0] 2. Pastikan MetaMask terinstall dan aktif');
  console.log('[v0] 3. Refresh halaman (Ctrl+R atau Cmd+R)');
  console.log('[v0] 4. Cek wagmiConfig.js untuk konfigurasi chains');
  console.log('[v0] 5. Pastikan ini HTTPS connection (tidak HTTP)');
  console.log('[v0] 6. Buka React DevTools untuk inspect component tree');
  console.log('[v0] ================================================');
};

export const initializeMetaMaskDetection = () => {
  console.log('[v0] Checking MetaMask availability...');
  checkMetaMaskAvailability();
};
