"use client";
import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { polygon, mainnet, mantleSepoliaTestnet } from 'viem/chains'
import dynamic from 'next/dynamic';

// Define Mantle Sepolia chain
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
};

// Define Pharos Devnet chain
const pharosDevnet = {
  id: 50002,
  name: 'Pharos Devnet',
  network: 'pharos-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Pharos',
    symbol: 'PHR',
  },
  rpcUrls: {
    default: { http: ['https://devnet.dplabs-internal.com'] },
    public: { http: ['https://devnet.dplabs-internal.com'] },
  },
  blockExplorers: {
    default: { name: 'Pharos Explorer', url: 'https://pharosscan.xyz' },
  },
  testnet: true,
};

// Configure transport with improved settings
const configureTransport = (url) => http({
  batch: { batchSize: 1 },  // Disable batching for more reliable connections
  fetchOptions: {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST', // Blockchain JSON-RPC calls require POST
  },
  timeout: 30000, // 30 seconds timeout
  retryCount: 3,
  retryDelay: 1000,
});

export const publicMainnetClient = createPublicClient({
  chain: mainnet,
  transport: configureTransport(mainnet.rpcUrls.default.http[0]),
});

export const publicPolygonClient = createPublicClient({
  chain: polygon,
  transport: configureTransport(polygon.rpcUrls.default.http[0]),
});

export const publicMantleSepoliaClient = createPublicClient({
  chain: mantleSepolia,
  transport: configureTransport(mantleSepolia.rpcUrls.default.http[0]),
});

export const publicPharosSepoliaClient = createPublicClient({
  chain: pharosDevnet,
  transport: configureTransport(pharosDevnet.rpcUrls.default.http[0]),
});

let walletClient = null;

export const getWalletClient = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No ethereum provider found');
  }

  try {
    // Request account access if needed
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create wallet client if not already created
    if (!walletClient) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // Prefer Pharos Devnet (0xc352), fallback to Mantle Sepolia
      const chain = chainId === '0xc352' ? pharosDevnet : mantleSepolia;
      
      walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum),
      });
    }

    return walletClient;
  } catch (error) {
    console.error('Failed to get wallet client:', error);
    walletClient = null; // Reset for next attempt
    throw error;
  }
};

export const createCustomWalletClient = (account) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No ethereum provider found');
  }
  
  return createWalletClient({
    account,
    chain: pharosDevnet,
    transport: custom(window.ethereum)
  });
};

export const checkNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x138b' && chainId !== '0xc352') { // Mantle or Pharos Devnet chainId
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xc352' }], // Default to Pharos Devnet
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            // Add both networks
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x138b',
                chainName: 'Mantle Sepolia',
                nativeCurrency: {
                  name: 'Mantle',
                  symbol: 'MNT',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
                blockExplorerUrls: ['https://sepolia.mantlescan.xyz']
              }],
            });
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xc352',
                chainName: 'Pharos Devnet',
                nativeCurrency: {
                  name: 'Pharos',
                  symbol: 'PHR',
                  decimals: 18
                },
                rpcUrls: ['https://devnet.dplabs-internal.com'],
                blockExplorerUrls: ['https://pharosscan.xyz']
              }],
            });
          } catch (addError) {
            console.error('Error adding networks:', addError);
            return false;
          }
        } else {
          console.error('Error switching network:', switchError);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};