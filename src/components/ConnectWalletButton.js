"use client";
import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useConnect } from 'wagmi';

export default function ConnectWalletButton() {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState(null);
  const { connect, connectors, isLoading, pendingConnector } = useConnect();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      // Try to connect using the first available connector (usually injected/MetaMask)
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet');
      // Refresh the page after 2 seconds if there's an error
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  if (!isClient) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-700 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
        <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
          <button onClick={handleConnect} className="text-white font-medium">
            Reconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        if (!mounted) {
          return null;
        }

        if (!account) {
          return (
            <div className="bg-gradient-to-r from-red-magic to-blue-magic hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
              <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
                <button onClick={openConnectModal} className="text-white font-medium">
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
              <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
                <button onClick={openChainModal} className="text-white font-medium flex items-center gap-2">
                  {chain?.name || 'Unknown Network'}
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
              <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
                <button onClick={openAccountModal} className="text-white font-medium">
                  {account.displayName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                </button>
              </div>
            </div>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Wallet button error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}
