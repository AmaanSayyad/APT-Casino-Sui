"use client";
import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';

// Sample ABI for the lending contract
const LENDING_POOL_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Lending pool addresses by chain
const LENDING_POOL_ADDRESSES = {
  5003: '0x1234567890123456789012345678901234567890', // Mantle Sepolia - Replace with actual address
  50002: '0x0987654321098765432109876543210987654321', // Pharos Devnet - Replace with actual address
};

// Available assets for lending/borrowing
const AVAILABLE_ASSETS = [
  {
    symbol: 'MNT',
    name: 'Mantle',
    iconColor: '#2196F3',
    chainId: 5003,
    address: null, // Native token
    apy: 0.94,
    ltv: 0.7 // Loan to value ratio
  },
  {
    symbol: 'PHR',
    name: 'Pharos',
    iconColor: '#34C759',
    chainId: 50002,
    address: null, // Native token
    apy: 0.85,
    ltv: 0.7
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    iconColor: '#2775CA',
    chainId: 5003,
    address: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    apy: 1.2,
    ltv: 0.8
  },
  {
    symbol: 'APTC',
    name: 'APT Casino Token',
    iconColor: '#E04C95',
    chainId: 5003,
    address: '0x4Af5AE15A2F535a0e02A357a13F79F499F4bE1e3',
    apy: 6.03,
    ltv: 0.5
  }
];

/**
 * Hook to interact with the lending market
 */
const useLendingMarket = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [marketData, setMarketData] = useState({
    assets: [],
    userDeposits: {},
    userBorrows: {},
    loading: true,
    error: null
  });

  // Contract write hooks
  const { writeContractAsync: writeContract, isPending } = useWriteContract();

  // Get lending pool address for current chain
  const lendingPoolAddress = chainId ? LENDING_POOL_ADDRESSES[chainId] : undefined;

  // Filter assets for current chain
  useEffect(() => {
    if (chainId) {
      const filteredAssets = AVAILABLE_ASSETS.filter(asset => 
        asset.chainId === chainId || asset.chainId === 0 // 0 for chain-agnostic assets
      );

      // Simulate user balances - in production this would be fetched from the contract
      const simulateUserData = () => {
        const deposits = {};
        const borrows = {};
        
        filteredAssets.forEach(asset => {
          if (Math.random() > 0.5) {
            deposits[asset.symbol] = {
              amount: (Math.random() * 10).toFixed(4),
              value: (Math.random() * 1000).toFixed(2),
              apy: asset.apy
            };
          }
          
          if (Math.random() > 0.7) {
            borrows[asset.symbol] = {
              amount: (Math.random() * 5).toFixed(4),
              value: (Math.random() * 500).toFixed(2),
              interest: asset.apy + 2
            };
          }
        });
        
        return { deposits, borrows };
      };
      
      const userData = isConnected ? simulateUserData() : { deposits: {}, borrows: {} };
      
      setMarketData({
        assets: filteredAssets,
        userDeposits: userData.deposits,
        userBorrows: userData.borrows,
        loading: false,
        error: null
      });
    }
  }, [chainId, isConnected]);

  // Function to deposit an asset
  const depositAsset = async (asset, amount) => {
    if (!isConnected || !lendingPoolAddress) {
      throw new Error('Wallet not connected or lending pool not available');
    }
    
    try {
      // For native token deposits, we need to handle differently
      if (!asset.address) {
        // This would be your deposit function for native token
        // For now, we're just simulating success
        return { success: true, hash: `0x${Math.random().toString(16).substring(2, 10)}` };
      }
      
      // For ERC20 tokens
      const txHash = await writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'deposit',
        args: [asset.address, amount],
      });
      
      return { success: true, hash: txHash };
    } catch (error) {
      console.error('Deposit error:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to withdraw an asset
  const withdrawAsset = async (asset, amount) => {
    if (!isConnected || !lendingPoolAddress) {
      throw new Error('Wallet not connected or lending pool not available');
    }
    
    try {
      const txHash = await writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'withdraw',
        args: [asset.address || '0x0000000000000000000000000000000000000000', amount],
      });
      
      return { success: true, hash: txHash };
    } catch (error) {
      console.error('Withdraw error:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to borrow an asset
  const borrowAsset = async (asset, amount) => {
    if (!isConnected || !lendingPoolAddress) {
      throw new Error('Wallet not connected or lending pool not available');
    }
    
    try {
      const txHash = await writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [asset.address || '0x0000000000000000000000000000000000000000', amount],
      });
      
      return { success: true, hash: txHash };
    } catch (error) {
      console.error('Borrow error:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to repay a borrowed asset
  const repayAsset = async (asset, amount) => {
    if (!isConnected || !lendingPoolAddress) {
      throw new Error('Wallet not connected or lending pool not available');
    }
    
    try {
      const txHash = await writeContract({
        address: lendingPoolAddress,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [asset.address || '0x0000000000000000000000000000000000000000', amount],
      });
      
      return { success: true, hash: txHash };
    } catch (error) {
      console.error('Repay error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    ...marketData,
    isPending,
    depositAsset,
    withdrawAsset,
    borrowAsset,
    repayAsset
  };
};

export default useLendingMarket; 