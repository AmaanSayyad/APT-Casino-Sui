"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Tooltip, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';

const BalanceContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(198, 157, 242, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(198, 157, 242, 0.2)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(198, 157, 242, 0.15)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 20px rgba(198, 157, 242, 0.15)',
  },
}));

const TokenContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  position: 'relative',
});

const DevModeBadge = styled(Box)({
  position: 'absolute',
  top: '-12px',
  right: '-12px',
  background: 'rgba(245, 158, 11, 0.8)',
  color: 'white',
  fontSize: '0.6rem',
  padding: '2px 4px',
  borderRadius: '4px',
  fontWeight: 'bold',
});

const TokenBalance = () => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balances, setBalances] = useState({
    APTC: '0',
    MNT: '0',
  });
  const [selectedToken, setSelectedToken] = useState('APTC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setMounted(true);

    // Don't try to use Wagmi in development
    if (isDev) {
      setLoading(false);
      setBalances({
        APTC: (Math.random() * 1000 + 100).toFixed(2),
        MNT: (Math.random() * 5 + 0.5).toFixed(4),
      });
      setIsConnected(true);
      
      // Set up dev wallet toggle event listener
      const handleDevWalletToggle = () => {
        setIsConnected(prev => !prev);
      };
      
      window.addEventListener('dev-wallet-toggle', handleDevWalletToggle);
      return () => {
        window.removeEventListener('dev-wallet-toggle', handleDevWalletToggle);
      };
    }

    // Safe way to use Wagmi hooks
    const loadWalletData = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { useAccount, useBalance } = await import('wagmi');
        
        // Get account data
        const accountData = useAccount();
        if (accountData) {
          setAddress(accountData.address);
          setIsConnected(accountData.isConnected);
          
          // Get token balances if connected
          if (accountData.isConnected && accountData.address) {
            try {
              // Get native token balance (MNT)
              const nativeBalance = useBalance({
                address: accountData.address,
              });
              
              // Get APTC token balance
              const { default: useToken } = await import('@/hooks/useToken');
              const tokenData = useToken(accountData.address);
              
              setBalances({
                APTC: tokenData?.balance || '0',
                MNT: nativeBalance?.data?.formatted || '0',
              });
            } catch (err) {
              console.warn("Failed to load token balances:", err);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.warn("Failed to load wallet data:", err);
        setError(true);
        setLoading(false);
        
        // In case of error, show mock balance in development
        if (process.env.NODE_ENV === 'development') {
          setBalances({
            APTC: (Math.random() * 1000 + 100).toFixed(2),
            MNT: (Math.random() * 5 + 0.5).toFixed(4),
          });
          setIsConnected(true);
        }
      }
    };

    // Try to load the wallet data
    loadWalletData();
  }, [isDev]);

  // Toggle between tokens
  const toggleToken = () => {
    setSelectedToken(prev => prev === 'APTC' ? 'MNT' : 'APTC');
  };

  if (!mounted) {
    return null;
  }
  
  // Not connected, but still show component with message
  if (!isConnected && !isDev) {
    return (
      <BalanceContainer sx={{ opacity: 0.7 }}>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            color: '#E0E0E0',
            fontWeight: 500,
          }}
        >
          Connect wallet to view balance
        </Typography>
      </BalanceContainer>
    );
  }

  // Handle error state
  if (error) {
    return (
      <BalanceContainer>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            color: '#E0E0E0',
            fontWeight: 500,
          }}
        >
          {isDev ? `Dev Balance: ${balances.APTC} APTC` : "Connect wallet"}
        </Typography>
      </BalanceContainer>
    );
  }

  return (
    <Tooltip 
      title={`Click to toggle between tokens`} 
      arrow 
      placement="bottom"
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}
    >
      <BalanceContainer onClick={toggleToken}>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            color: '#E0E0E0',
            mr: 1,
            fontWeight: 500,
          }}
        >
          Balance:
        </Typography>
        {loading ? (
          <CircularProgress size={16} sx={{ color: '#c69df2' }} />
        ) : (
          <TokenContainer>
            {isDev && <DevModeBadge>DEV</DevModeBadge>}
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(90deg, #c69df2 0%, #a67de0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em',
              }}
            >
              {balances[selectedToken]} {selectedToken}
            </Typography>
          </TokenContainer>
        )}
      </BalanceContainer>
    </Tooltip>
  );
};

export default TokenBalance; 