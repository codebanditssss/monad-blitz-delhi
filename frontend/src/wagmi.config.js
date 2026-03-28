import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] }
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' }
  }
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Fight Club',
  projectId: 'd272d2819ad2a37bdf0eef4ff8cd4722',
  chains: [monadTestnet],
});
