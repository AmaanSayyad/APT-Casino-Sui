"use client";
import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { FaArrowDown, FaExchangeAlt } from "react-icons/fa";

// APTC token addresses on different chains
const APTC_TOKEN_ADDRESSES = {
  5003: '0x4Af5AE15A2F535a0e02A357a13F79F499F4bE1e3', // Mantle Sepolia
  50002: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // Pharos Devnet
};

// Chain information
const CHAIN_INFO = {
  5003: {
    name: "Mantle Sepolia", 
    nativeCurrency: { symbol: "MNT", name: "Mantle", decimals: 18 }
  },
  50002: {
    name: "Pharos Devnet", 
    nativeCurrency: { symbol: "PHR", name: "Pharos", decimals: 18 }
  }
};

// Sample tokens per chain (for demo purposes)
const CHAIN_TOKENS = {
  5003: [
    { symbol: "MNT", name: "Mantle", balance: "0.42", iconColor: "#2196F3", address: null }, // null for native token
    { symbol: "USDC", name: "USD Coin", balance: "125.5", iconColor: "#2775CA", address: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889" },
    { symbol: "APTC", name: "APT Casino Token", balance: "512.33", iconColor: "#E04C95", address: APTC_TOKEN_ADDRESSES[5003] }
  ],
  50002: [
    { symbol: "PHR", name: "Pharos", balance: "0.55", iconColor: "#34C759", address: null }, // null for native token
    { symbol: "APTC", name: "APT Casino Token", balance: "345.12", iconColor: "#E04C95", address: APTC_TOKEN_ADDRESSES[50002] }
  ]
};

// Mock exchange rates (for demo purposes)
const EXCHANGE_RATES = {
  5003: { // Mantle Sepolia
    "MNT": 5.76,
    "USDC": 1.01,
  },
  50002: { // Pharos Devnet
    "PHR": 4.23,
  }
};

const OneInchWidget = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState(null);
  const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  
  // Get available tokens for current chain
  const availableTokens = chainId && CHAIN_TOKENS[chainId] ? CHAIN_TOKENS[chainId] : [];
  
  // Initialize fromToken when chainId changes
  useEffect(() => {
    if (chainId && CHAIN_TOKENS[chainId] && CHAIN_TOKENS[chainId].length > 0) {
      // Set default from token to native token
      setFromToken(CHAIN_TOKENS[chainId][0]);
      setFromAmount("");
      setToAmount("");
    }
  }, [chainId]);
  
  // Calculate APTC amount based on from token and amount
  const calculateAPTC = (amount, token) => {
    if (!amount || isNaN(amount) || !token || !chainId) return "";
    
    const rates = EXCHANGE_RATES[chainId] || {};
    const rate = rates[token.symbol] || 1;
    
    return (parseFloat(amount) * rate).toFixed(2);
  };
  
  // Handle input change for the amount field
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setFromAmount(value);
    if (fromToken) {
      setToAmount(calculateAPTC(value, fromToken));
    }
  };
  
  // Handle token selection change
  const handleTokenChange = (token) => {
    setFromToken(token);
    setToAmount(calculateAPTC(fromAmount, token));
    setDropdown(false);
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (fromToken) {
      setFromAmount(fromToken.balance);
      setToAmount(calculateAPTC(fromToken.balance, fromToken));
    }
  };
  
  // Handle swap action
  const handleSwap = async () => {
    if (!fromAmount || !fromToken) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, you would call the 1inch API here
      // For demo purposes, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success notification
      alert(`Successfully swapped ${fromAmount} ${fromToken.symbol} to ${toAmount} APTC`);
      
      // Reset form
      setFromAmount("");
      setToAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
      alert("Swap failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate USD value
  const getUSDValue = (amount, tokenSymbol) => {
    if (!amount || isNaN(amount)) return "$0.00";
    
    const usdRates = {
      MNT: 3.27,
      PHR: 2.85,
      USDC: 1.00,
      APTC: 3.62
    };
    
    return `$${(parseFloat(amount) * (usdRates[tokenSymbol] || 1)).toFixed(2)}`;
  };
  
  return (
    <div className="bg-[#1A0015] rounded-xl p-6">
      <p className="text-white/70 text-sm mb-6">Swap tokens from any chain to APTC with zero slippage and the best rates</p>
      
      {!address ? (
        <div className="flex flex-col items-center justify-center py-10 text-white/70">
          <p>Please connect your wallet to use the swap widget</p>
        </div>
      ) : !chainId || !CHAIN_INFO[chainId] ? (
        <div className="flex flex-col items-center justify-center py-10 text-white/70">
          <p>Please connect to a supported network (Mantle Sepolia or Pharos Devnet)</p>
        </div>
      ) : (
        <div className="mx-auto" style={{ width: '100%', maxWidth: '500px' }}>
          {/* From Token Selection */}
          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-2">From</label>
            <div className="p-[1px] rounded-lg bg-gradient-to-r from-red-magic to-blue-magic">
              <div className="bg-[#250020] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <input 
                    type="number" 
                    placeholder="0.0" 
                    value={fromAmount}
                    onChange={handleAmountChange}
                    className="bg-transparent w-2/3 focus:outline-none text-xl font-medium text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      className="bg-[#3A0030] hover:bg-[#4A0040] px-3 py-1 rounded-md text-sm"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </button>
                    <div className="relative">
                      <div 
                        className="bg-[#3A0030] rounded-md px-3 py-2 flex items-center gap-2 min-w-[120px] cursor-pointer hover:bg-[#4A0040] transition-colors"
                        onClick={() => setDropdown(!dropdown)}
                      >
                        {fromToken && (
                          <>
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: fromToken?.iconColor }}
                            >
                              <span className="text-xs font-bold">{fromToken?.symbol?.charAt(0)}</span>
                            </div>
                            <span>{fromToken?.symbol}</span>
                          </>
                        )}
                        <span className="text-white/50">▼</span>
                      </div>
                      
                      {/* Token Dropdown */}
                      {dropdown && (
                        <div className="absolute top-full mt-1 right-0 w-full bg-[#3A0030] rounded-md shadow-lg z-10">
                          {availableTokens.map((token, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-2 p-2 hover:bg-[#4A0040] cursor-pointer"
                              onClick={() => handleTokenChange(token)}
                            >
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: token.iconColor }}
                              >
                                <span className="text-xs font-bold">{token.symbol.charAt(0)}</span>
                              </div>
                              <span>{token.symbol}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-white/50">≈ {getUSDValue(fromAmount, fromToken?.symbol)}</span>
                  <span className="text-white/50">Balance: {fromToken?.balance || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button className="bg-[#3A0030] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#1A0015] hover:bg-[#4A0040] transition-colors">
              <FaArrowDown className="text-white" />
            </button>
          </div>
          
          {/* To Token Selection (APTC) */}
          <div className="mb-6">
            <label className="block text-sm text-white/70 mb-2">To</label>
            <div className="p-[1px] rounded-lg bg-gradient-to-r from-red-magic to-blue-magic">
              <div className="bg-[#250020] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    placeholder="0.0" 
                    value={toAmount}
                    readOnly
                    className="bg-transparent w-2/3 focus:outline-none text-xl font-medium text-white"
                  />
                  <div className="flex items-center gap-2">
                    <div className="bg-[#3A0030] rounded-md px-3 py-2 flex items-center gap-2 min-w-[120px]">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-magic to-blue-magic flex items-center justify-center">
                        <span className="text-xs font-bold">A</span>
                      </div>
                      <span>APTC</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-white/50">≈ {getUSDValue(toAmount, "APTC")}</span>
                  <span className="text-white/50">Balance: {CHAIN_TOKENS[chainId]?.find(t => t.symbol === "APTC")?.balance || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rate and Settings */}
          <div className="bg-[#0F000B] rounded-lg p-3 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Rate</span>
              <span className="text-white text-sm">
                1 {fromToken?.symbol || ''} = {EXCHANGE_RATES[chainId]?.[fromToken?.symbol] || '0.00'} APTC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Fee</span>
              <span className="text-white text-sm">0.3% ({(fromAmount * 0.003 || 0).toFixed(6)} {fromToken?.symbol || ''})</span>
            </div>
          </div>
          
          {/* Swap Button */}
          <button 
            className={`w-full py-4 rounded-lg text-white font-medium bg-gradient-to-r from-red-magic to-blue-magic hover:from-blue-magic hover:to-red-magic transition-all duration-300 shadow-lg ${loading || !fromAmount ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleSwap}
            disabled={loading || !fromAmount}
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FaExchangeAlt />
              )}
              <span>{loading ? 'Swapping...' : 'Swap to APTC'}</span>
            </div>
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-white/50">
              Powered by APT Casino Swap Engine
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneInchWidget; 