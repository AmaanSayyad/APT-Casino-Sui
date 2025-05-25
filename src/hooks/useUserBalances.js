"use client";
import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useBalance, 
  useChainId,
  useReadContract 
} from 'wagmi';
import { formatUnits } from 'viem';

// APTC token addresses by chain
const APTC_TOKEN_ADDRESSES = {
  5003: '0x4Af5AE15A2F535a0e02A357a13F79F499F4bE1e3', // Mantle Sepolia
  50002: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // Pharos Devnet
};

// Simple ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Hook to fetch all relevant user balances
 */
const useUserBalances = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [balances, setBalances] = useState({
    native: null,
    aptc: null,
    other: [],
    loading: true,
    error: null
  });

  // Fetch native token balance
  const { 
    data: nativeBalance, 
    isError: isNativeError,
    isLoading: isNativeLoading
  } = useBalance({ 
    address: isConnected ? address : undefined,
    watch: true
  });

  // Fetch APTC token balance
  const aptcTokenAddress = chainId ? APTC_TOKEN_ADDRESSES[chainId] : undefined;
  const { 
    data: aptcBalance,
    isError: isAPTCError,
    isLoading: isAPTCLoading
  } = useReadContract({
    address: aptcTokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!(isConnected && aptcTokenAddress && address)
  });

  // Fetch decimals for APTC
  const { 
    data: aptcDecimals
  } = useReadContract({
    address: aptcTokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    enabled: !!(aptcTokenAddress)
  });

  useEffect(() => {
    // Determine if we have all the data we need
    const isLoading = isNativeLoading || isAPTCLoading;
    const hasError = isNativeError || isAPTCError;
    
    if (isConnected && !isLoading) {
      try {
        // Format the native balance
        const formattedNative = nativeBalance ? {
          symbol: nativeBalance.symbol,
          formatted: nativeBalance.formatted,
          value: nativeBalance.value,
          decimals: nativeBalance.decimals
        } : null;
        
        // Format the APTC balance if we have it
        const formattedAPTC = aptcBalance && aptcDecimals ? {
          symbol: 'APTC',
          formatted: formatUnits(aptcBalance, aptcDecimals),
          value: aptcBalance,
          decimals: aptcDecimals
        } : null;
        
        // Update the balances
        setBalances({
          native: formattedNative,
          aptc: formattedAPTC,
          other: [], // This could be extended to include other tokens
          loading: false,
          error: hasError ? 'Error fetching balances' : null
        });
      } catch (error) {
        console.error('Error processing balances:', error);
        setBalances(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    } else if (!isConnected) {
      setBalances({
        native: null,
        aptc: null,
        other: [],
        loading: false,
        error: null
      });
    }
  }, [
    isConnected, 
    address, 
    nativeBalance, 
    aptcBalance, 
    aptcDecimals,
    isNativeLoading, 
    isAPTCLoading,
    isNativeError, 
    isAPTCError
  ]);

  return balances;
};

export default useUserBalances; 