"use client";

import { useState, useCallback, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useReadContract, useWriteContract } from 'wagmi';
import { tokenABI, tokenContractAddress } from '@/app/game/roulette/contractDetails';

export const useToken = (address) => {
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Read token balance
  const { data: balanceData, isError, isLoading: isBalanceLoading } = useReadContract({
    address: tokenContractAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: Boolean(address),
    watch: true,
  });

  // Update balance when data changes
  useEffect(() => {
    if (balanceData) {
      setBalance(formatUnits(balanceData, 18));
    }
    if (isError) {
      setError('Failed to load token balance');
    }
    setIsLoading(isBalanceLoading);
  }, [balanceData, isError, isBalanceLoading]);

  const transfer = useCallback(async (to, amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const { writeContract } = useWriteContract();
      
      await writeContract({
        address: tokenContractAddress,
        abi: tokenABI,
        functionName: 'transfer',
        args: [to, parseUnits(amount.toString(), 18)],
      });
      
      return true;
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const { data: refreshedBalance } = await useReadContract({
        address: tokenContractAddress,
        abi: tokenABI,
        functionName: 'balanceOf',
        args: [address],
      });
      
      if (refreshedBalance) {
        setBalance(formatUnits(refreshedBalance, 18));
      }
    } catch (err) {
      console.error('Failed to refresh token balance:', err);
      setError('Failed to refresh token balance');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    balance,
    transfer,
    isLoading,
    error,
    refresh
  };
}; 