"use client";
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Create context to share wallet state throughout the app
const WalletStatusContext = createContext(null);

// Provider component to wrap the app with
export function WalletStatusProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [chain, setChain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
    
    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      
      // In development mode, create a simulated wallet
      if (process.env.NODE_ENV === 'development') {
        // Simulate connection state from localStorage
        const savedState = localStorage.getItem('dev-wallet-state');
        if (savedState === 'connected') {
          setIsConnected(true);
          setAddress('0x1234...6789'); // Fake address
          setChain({ id: 5003, name: 'Mantle Sepolia' });
        } else {
          setIsConnected(false);
          setAddress(null);
          setChain(null);
        }
        
        setIsLoading(false);
        
        // Set up event listener for toggling wallet in dev mode
        const handleDevWalletToggle = () => {
          setIsConnected(prev => {
            const newState = !prev;
            localStorage.setItem('dev-wallet-state', newState ? 'connected' : 'disconnected');
            
            if (newState) {
              setAddress('0x1234...6789');
              setChain({ id: 5003, name: 'Mantle Sepolia' });
              
              // Dispatch global event that wallet was connected
              window.dispatchEvent(new Event('wallet-connected'));
            } else {
              setAddress(null);
              setChain(null);
            }
            
            return newState;
          });
        };
        
        window.addEventListener('dev-wallet-toggle', handleDevWalletToggle);
        return () => {
          window.removeEventListener('dev-wallet-toggle', handleDevWalletToggle);
        };
      }
      
      // In production mode, use real wallet connection
      try {
        const { useAccount, useNetwork } = await import('wagmi');
        
        // Get account status
        const accountData = useAccount();
        if (accountData) {
          setIsConnected(accountData.isConnected || false);
          setAddress(accountData.address || null);
        }
        
        // Get network/chain info
        const networkData = useNetwork();
        if (networkData && networkData.chain) {
          setChain(networkData.chain);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError('Failed to connect to wallet provider');
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Function to connect wallet
  const connectWallet = useCallback(async () => {
    if (isDev) {
      // In dev mode, simulate connection
      setIsConnected(true);
      setAddress('0x1234...6789');
      setChain({ id: 5003, name: 'Mantle Sepolia' });
      localStorage.setItem('dev-wallet-state', 'connected');
      return true;
    }
    
    try {
      // In production, use RainbowKit
      const { useConnectModal } = await import('@rainbow-me/rainbowkit');
      const { openConnectModal } = useConnectModal();
      
      if (openConnectModal) {
        openConnectModal();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to open connect modal:', err);
      setError('Failed to open wallet connection dialog');
      return false;
    }
  }, [isDev]);
  
  // Function to disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (isDev) {
      // In dev mode, simulate disconnection
      setIsConnected(false);
      setAddress(null);
      setChain(null);
      localStorage.setItem('dev-wallet-state', 'disconnected');
      return true;
    }
    
    try {
      // In production, use Wagmi
      const { useDisconnect } = await import('wagmi');
      const { disconnect } = useDisconnect();
      
      if (disconnect) {
        disconnect();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError('Failed to disconnect wallet');
      return false;
    }
  }, [isDev]);
  
  // Reset any errors
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  // The value we'll provide to consumers
  const value = {
    isConnected,
    address,
    chain,
    isLoading,
    error,
    isDev,
    connectWallet,
    disconnectWallet,
    resetError
  };
  
  return (
    <WalletStatusContext.Provider value={value}>
      {children}
    </WalletStatusContext.Provider>
  );
}

// Hook for components to consume
export default function useWalletStatus() {
  const context = useContext(WalletStatusContext);
  
  if (!context) {
    throw new Error('useWalletStatus must be used within a WalletStatusProvider');
  }
  
  return context;
} 