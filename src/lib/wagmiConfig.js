import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
} from 'wagmi/chains';

// WalletConnect Project ID from user
const WALLETCONNECT_PROJECT_ID = '23cf8355e092e70e3d13dfd10b678792';

// Debug: Check if MetaMask is detected
if (typeof window !== 'undefined') {
  console.log('[v0] Window.ethereum available:', !!window.ethereum);
  console.log('[v0] MetaMask detected:', !!window.ethereum?.isMetaMask);
  console.log('[v0] All injected providers:', Object.keys(window).filter(key => key.includes('ethereum') || key.includes('wallet')));
}

export const config = getDefaultConfig({
  appName: 'Discussion Airdrops Tools',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, optimism, bsc],
  ssr: false, // Vite is a CSR framework
  // Ensure all injected wallet types are discovered (MetaMask, Phantom, etc)
  walletConnectParameters: {
    projectId: WALLETCONNECT_PROJECT_ID,
  },
  // Enable all wallet detection methods
  connectors: undefined, // Use default connectors from getDefaultConfig which includes injected providers
});
