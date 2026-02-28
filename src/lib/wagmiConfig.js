import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
} from 'wagmi/chains';
import { http } from 'viem';

// WalletConnect Project ID - Safe public ID
const WALLETCONNECT_PROJECT_ID = '23cf8355e092e70e3d13dfd10b678792';

export const config = getDefaultConfig({
  appName: 'Discussion Airdrops Tools',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, optimism],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  ssr: false,
  multiInjectedProviderDiscovery: false,
});
