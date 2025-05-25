"use client";
import React, { useState, useReducer, useMemo, useEffect, useRef, useCallback } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { ThemeProvider, styled, createTheme } from "@mui/material/styles";
import InfoIcon from "@mui/icons-material/Info";
import ClearIcon from "@mui/icons-material/Clear";
import UndoIcon from "@mui/icons-material/Undo";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import currency from "currency.js";
import TextFieldCurrency from "@/components/TextFieldCurrency";
import Button from "@/components/Button";
import { rouletteTutorial, rouletteOdds } from "./tutorials";
import {
  rouletteABI,
  rouletteContractAddress,
  tokenABI,
  tokenContractAddress,
} from "./contractDetails";
import * as ViemClient from "./ViemClient";
import { getContract, parseEther } from "viem";
import { muiStyles } from "./styles";
import Image from "next/image";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import GameDetail from "../../../components/GameDetail";
import { gameData, bettingTableData } from "./config/gameDetail";
import { useToken } from "@/hooks/useToken";
import BettingHistory from '@/components/BettingHistory';
import useWalletStatus from '@/hooks/useWalletStatus';
import { FaVolumeMute, FaVolumeUp, FaChartLine, FaCoins, FaTrophy, FaDice, FaBalanceScale, FaRandom, FaPercentage, FaPlayCircle } from "react-icons/fa";
import { GiCardRandom, GiDiceTarget, GiRollingDices, GiPokerHand } from "react-icons/gi";
import { motion } from "framer-motion";
import RouletteLeaderboard from './components/RouletteLeaderboard';
import StrategyGuide from './components/StrategyGuide';
import RoulettePayout from './components/RoulettePayout';
import WinProbabilities from './components/WinProbabilities';
import RouletteHistory from './components/RouletteHistory';

// Debug imports
console.log("ViemClient:", ViemClient);
console.log("publicPharosSepoliaClient:", ViemClient.publicPharosSepoliaClient);

const TooltipWide = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 800,
    padding: '8px 12px',
    fontSize: '0.85rem',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(5px)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  },
});

const enhancedTooltip = {
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(5px)',
    padding: '8px 12px',
    fontSize: '0.85rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  }
};

const BetType = {
  NUMBER: 0,    // Single number (35:1)
  COLOR: 1,     // Red/Black (1:1)
  ODDEVEN: 2,   // Odd/Even (1:1)
  HIGHLOW: 3,   // 1-18/19-36 (1:1)
  DOZEN: 4,     // 1-12, 13-24, 25-36 (2:1)
  COLUMN: 5,    // First, Second, Third column (2:1)
  SPLIT: 6,     // Two adjacent numbers (17:1)
  STREET: 7,    // Three numbers horizontal (11:1)
  CORNER: 8,    // Four numbers (8:1)
  LINE: 9       // Six numbers (5:1)
};

function BetBox({ betValue = 0, betType = "", position = "top-right", ...props }) {
  // Calculate position based on the position prop
  const getPosition = () => {
    switch (position) {
      case "top-right":
        return { top: "25%", left: "75%" };
      case "top-left":
        return { top: "25%", left: "25%" };
      case "bottom-right":
        return { top: "75%", left: "75%" };
      case "bottom-left":
        return { top: "75%", left: "25%" };
      default:
        return { top: "25%", left: "75%" }; // Default to top-right
    }
  };

  return (
    <Tooltip
      title={
        <Typography>
          {betType}: {betValue}
        </Typography>
      }
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: enhancedTooltip.tooltip
        }
      }}
    >
      <Box
        sx={{
          position: "absolute",
          ...getPosition(),
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 215, 0, 0.9)",
          border: "2px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          "&:hover": {
            transform: "translate(-50%, -50%) scale(1.1)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
          },
        }}
        {...props}
      >
        <Typography
          sx={{ 
            fontSize: "13px", 
            color: "black", 
            fontWeight: "bold",
            textShadow: "0 0 2px rgba(255,255,255,0.5)",
          }}
        >
          {betValue}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function GridInside({
  insideNumber = -1, // must define this
  topEdge = false,
  red = false,
  straightup = 0,
  splitleft = 0,
  splitbottom = 0,
  corner = 0,
  placeBet,
  isWinner = false,
  ...props
}) {
  // Calculate corner bet numbers
  const getCornerNumbers = () => {
    // For numbers on the left edge of the grid, we need to handle differently
    const isLeftEdge = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(insideNumber);
    
    if (isLeftEdge) {
      return `Corner (${insideNumber}-${insideNumber+1}-${insideNumber+3}-${insideNumber+4})`;
    }
    
    // For non-left edge numbers
    return `Corner (${insideNumber-1}-${insideNumber}-${insideNumber+2}-${insideNumber+3})`;
  };
  
  return (
    <ParentSize {...props}>
      {({ width }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            width: width,
            height: topEdge ? width + 10 : width,
            ...(red && { backgroundColor: (theme) => theme.palette.game.red }),
            ...(isWinner && {
              boxShadow: "0 0 15px 5px rgba(255, 215, 0, 0.7)",
              zIndex: 3,
            }),
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
              zIndex: 2
            }
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", width: "10px" }}
            id="left-edge"
          >
            {topEdge && (
              <Box
                sx={{
                  height: "10px",
                  backgroundColor: (theme) => theme.palette.dark.card,
                }}
              ></Box>
            )}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                backgroundColor: (theme) => theme.palette.dark.card,
                cursor: "pointer",
              }}
              id="left-split-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 2)}
            >
              {splitleft > 0 && (
                <BetBox
                  betValue={splitleft}
                  betType={`Split (${insideNumber-1}/${insideNumber})`}
                  position="top-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 2)
                  }
                />
              )}
            </Box>
            <Box
              sx={{
                position: "relative",
                height: "10px",
                backgroundColor: (theme) => theme.palette.dark.card,
                cursor: "pointer",
              }}
              id="left-corner-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 4)}
            >
              {corner > 0 && (
                <BetBox
                  betValue={corner}
                  betType={getCornerNumbers()}
                  position="bottom-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 4)
                  }
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {topEdge && (
              <Box
                sx={{
                  height: "10px",
                  backgroundColor: (theme) => theme.palette.dark.card,
                }}
              ></Box>
            )}
            <Box
              sx={{
                position: "relative",
                flex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
              id="straight-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 1)}
            >
              <Typography 
                variant="h5" 
                sx={{
                  position: "relative",
                  zIndex: 4,
                  textShadow: "0 0 4px rgba(0,0,0,0.8)",
                  fontWeight: "bold",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  transform: "translateX(-10%)", // Slight offset to avoid chip overlap
                }}
              >
                {insideNumber}
              </Typography>
              {straightup > 0 && (
                <BetBox
                  betValue={straightup}
                  betType={"Straight up"}
                  position="top-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 1)
                  }
                />
              )}
            </Box>
            <Box
              sx={{
                position: "relative",
                flex: 1,
                backgroundColor: (theme) => theme.palette.dark.card,
                maxHeight: "10px",
                minHeight: "10px",
                cursor: "pointer",
              }}
              id="bottom-split-bet"
              onClick={(e) => placeBet(e, "inside", (insideNumber - 1) * 4 + 3)}
            >
              {splitbottom > 0 && (
                <BetBox
                  betValue={splitbottom}
                  betType={`Split (${insideNumber}/${insideNumber+3})`}
                  position="bottom-right"
                  onClick={(e) =>
                    placeBet(e, "inside", (insideNumber - 1) * 4 + 3)
                  }
                />
              )}
            </Box>
          </Box>
        </Box>
      )}
    </ParentSize>
  );
}

function GridZero({ inside, placeBet, ...props }) {
  return (
    <ParentSize {...props}>
      {({ width, height }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: width,
            height: height,
            cursor: "pointer",
            clipPath: "polygon(100% 0%, 100% 100%, 40% 100%, 0% 50%, 40% 0%)",
            backgroundColor: (theme) => theme.palette.game.green,
          }}
          onClick={(e) => placeBet(e, "inside", 0)}
        >
          <Typography variant="h5">0</Typography>
          {inside[0] > 0 && (
            <BetBox
              betValue={inside[0]}
              betType={"Straight up"}
              onClick={(e) => placeBet(e, "inside", 0)}
            />
          )}
        </Box>
      )}
    </ParentSize>
  );
}

function GridColumnBet({
  topCard = false,
  bottomCard = false,
  index,
  columns,
  bet,
  placeBet,
  ...props
}) {
  return (
    <ParentSize style={{ height: "100%" }} {...props}>
      {({ width, height }) => (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: width,
            height: height,
            cursor: "pointer",
            backgroundColor: (theme) => theme.palette.dark.button,
            borderTop: (theme) =>
              `${topCard ? 10 : 5}px solid ${theme.palette.dark.card}`,
            borderBottom: (theme) =>
              `${bottomCard ? 10 : 5}px solid ${theme.palette.dark.card}`,
            borderRight: (theme) => "10px solid " + theme.palette.dark.card,
            borderLeft: (theme) => "10px solid " + theme.palette.dark.card,
          }}
          onClick={(e) => placeBet(e, "columns", index)}
        >
          <Typography variant="h5">2 To 1</Typography>
          {columns[index] > 0 && (
            <BetBox
              betValue={columns[index]}
              betType={`2 To 1 (row ${index + 1})`}
              onClick={(e) => placeBet(e, "columns", index)}
            />
          )}
        </Box>
      )}
    </ParentSize>
  );
}

function GridOutsideBet({ rightCard = false, active = false, ...props }) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
        cursor: "pointer",
        backgroundColor: (theme) => theme.palette.dark.button,
        borderBottom: (theme) => "10px solid " + theme.palette.dark.card,
        borderLeft: (theme) => "10px solid " + theme.palette.dark.card,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)"
        }
      }}
      {...props}
    >
      {props.children}
    </Box>
  );
}

const firstThird = [
  { val: 3, red: true },
  { val: 6 },
  { val: 9, red: true },
  { val: 12 },
  { val: 2 },
  { val: 5, red: true },
  { val: 8 },
  { val: 11 },
  { val: 1, red: true },
  { val: 4 },
  { val: 7, red: true },
  { val: 10 },
];
const secondThird = [
  { val: 15 },
  { val: 18, red: true },
  { val: 21, red: true },
  { val: 24 },
  { val: 14, red: true },
  { val: 17 },
  { val: 20 },
  { val: 23, red: true },
  { val: 13 },
  { val: 16, red: true },
  { val: 19, red: true },
  { val: 22 },
];
const thirdThird = [
  { val: 27, red: true },
  { val: 30, red: true },
  { val: 33 },
  { val: 36, red: true },
  { val: 26 },
  { val: 29 },
  { val: 32, red: true },
  { val: 35 },
  { val: 25, red: true },
  { val: 28 },
  { val: 31 },
  { val: 34, red: true },
];

const arrayReducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return new Array(state.length).fill(0);
    case "update":
      let updatedArr = [...state];
      updatedArr[action.ind] = action.val;
      return updatedArr;
    default:
      return state;
  }
};

const eventReducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return [];
    case "update":
      return action.payload;
    default:
      return state;
  }
};
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const notificationSteps = {
  PLACING_BET: 0,
  BET_PLACED: 1,
  GENERATING_VRF: 2,
  RESULT_READY: 3
};

// Custom animated wheel component for visual feedback
const RouletteWheel = ({ spinning, result, onSpinComplete, onSpinStart, onWin }) => {
  const wheelRef = useRef(null);
  const [spinComplete, setSpinComplete] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning && result >= 0) {
      // Calculate the rotation to land on the result number
      const segmentAngle = 360 / 37; // 37 segments (0-36)
      const baseRotation = 3600; // 10 full rotations for effect
      const resultPosition = segmentAngle * result;
      const finalRotation = baseRotation + resultPosition;
      
      setRotation(finalRotation);
      if (onSpinStart) onSpinStart();
      
      setTimeout(() => {
        setSpinComplete(true);
        if (onSpinComplete) onSpinComplete();
        if (onWin) onWin();
      }, 4200); // Slightly longer than animation
    } else if (!spinning) {
      setRotation(0);
      setSpinComplete(false);
    }
  }, [spinning, result, onSpinComplete, onSpinStart, onWin]);
  
  return (
    <Box 
      sx={{ 
        width: '200px', 
        height: '200px', 
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        margin: 'auto',
        display: result >= 0 ? 'block' : 'none'
      }}
    >
      <Box
        ref={wheelRef}
        sx={{
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/images/roulette-wheel.png)',
          backgroundSize: 'contain',
          transformOrigin: 'center',
          position: 'relative',
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
        }}
      />
      {spinComplete && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '2rem',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            zIndex: 10
          }}
        >
          {result}
        </Box>
      )}
    </Box>
  );
};

// Add betting statistics tracking
const BettingStats = ({ history }) => {
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    
    // Calculate win rate
    const winCount = history.filter(bet => bet.won).length;
    const winRate = history.length > 0 ? (winCount / history.length * 100).toFixed(1) : 0;
    
    // Calculate most common numbers
    const numberFrequency = {};
    history.forEach(bet => {
      if (bet.roll >= 0) {
        numberFrequency[bet.roll] = (numberFrequency[bet.roll] || 0) + 1;
      }
    });
    
    const mostCommonNumbers = Object.entries(numberFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([number, count]) => ({ number: parseInt(number), count }));
    
    // Calculate profit/loss
    const totalWagered = history.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWon = history.reduce((sum, bet) => sum + (bet.won ? bet.payout : 0), 0);
    const profitLoss = totalWon - totalWagered;
    
    return {
      winRate,
      mostCommonNumbers,
      totalWagered,
      totalWon,
      profitLoss,
      sessionBets: history.length
    };
  }, [history]);
  
  if (!stats) return null;
  
  return (
    <Box sx={{ 
      p: 2, 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.3)'
    }}>
      <Typography variant="h6" color="white" sx={{ mb: 2 }}>Session Statistics</Typography>
      <Grid container spacing={2}>
        <Grid xs={6} md={4}>
          <Typography variant="body2" color="text.secondary">Win Rate</Typography>
          <Typography variant="h5">{stats.winRate}%</Typography>
        </Grid>
        <Grid xs={6} md={4}>
          <Typography variant="body2" color="text.secondary">Total Bets</Typography>
          <Typography variant="h5">{stats.sessionBets}</Typography>
        </Grid>
        <Grid xs={6} md={4}>
          <Typography variant="body2" color="text.secondary">P/L</Typography>
          <Typography variant="h5" color={stats.profitLoss >= 0 ? 'success.main' : 'error.main'}>
            {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
          </Typography>
        </Grid>
        <Grid xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Hot Numbers</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {stats.mostCommonNumbers.map((item) => (
              <Box 
                key={item.number} 
                sx={{ 
                  width: 30, 
                  height: 30, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: item.number === 0 ? 'game.green' : 
                    [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(item.number) ? 'game.red' : 'dark.bg',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="caption" fontWeight="bold">{item.number}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Roulette Header Component moved inside the main component

export default function GameRoulette() {
  // Add a ref for scrolling past navbar
  const contentRef = useRef(null);
  
  // Add smooth scrolling to the entire document
  useEffect(() => {
    // Apply smooth scrolling to the html element
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      // Clean up when component unmounts
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  
  // Scroll past navbar on initial load
  useEffect(() => {
    const scrollPastNavbar = () => {
      if (contentRef.current) {
        // Add a small delay to ensure DOM is fully loaded
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 100);
      }
    };
    
    scrollPastNavbar();
  }, []);

  // Smooth scroll to element function
  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Add offset to account for fixed elements and prevent cutoff
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  // Roulette Header Component inside the main component to access scrollToElement
  const RouletteHeader = () => {
    // Sample statistics
    const gameStatistics = {
      totalBets: '1,856,342',
      totalVolume: '8.3M APTC',
      maxWin: '243,500 APTC'
    };
    
    return (
      <div className="relative text-white px-4 md:px-8 lg:px-20 mb-8 pt-20 md:pt-24 mt-4">
        {/* Background Elements */}
        <div className="absolute top-5 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-28 left-1/3 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-red-900/40 to-red-700/10 rounded-lg shadow-lg shadow-red-900/10 border border-red-800/20">
                  <GiRollingDices className="text-3xl text-red-300" />
                </div>
                <div>
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">Games / Roulette</p>
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded-full text-red-300 font-display">Classic</span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">Live</span>
                  </motion.div>
                  <motion.h1 
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    European Roulette
                  </motion.h1>
                </div>
              </div>
              <motion.p 
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Place your bets and experience the thrill of the spinning wheel. From simple red/black bets to complex number combinations, the choice is yours.
              </motion.p>
              
              {/* Game highlights */}
              <motion.div 
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">2.7% house edge</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <GiPokerHand className="mr-1.5 text-blue-400" />
                  <span className="font-sans">Multiple betting options</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair gaming</span>
                </div>
              </motion.div>
            </div>
            
            {/* Right Column - Stats and Controls */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-4 border border-red-800/20 shadow-lg shadow-red-900/10">
                {/* Quick stats in top row */}
                <motion.div 
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 mb-1">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Total Bets</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalBets}</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20 mb-1">
                      <FaCoins className="text-yellow-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Volume</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.totalVolume}</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 mb-1">
                      <FaTrophy className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">Max Win</div>
                    <div className="text-white font-display text-sm md:text-base">{gameStatistics.maxWin}</div>
                  </div>
                </motion.div>
                
                {/* Quick actions */}
                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button 
                    onClick={() => scrollToElement('strategy')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-800/40 to-red-900/20 rounded-lg text-white font-medium text-sm hover:from-red-700/40 hover:to-red-800/20 transition-all duration-300"
                  >
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button 
                    onClick={() => scrollToElement('payouts')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300"
                  >
                    <FaCoins className="mr-2" />
                    Payout Tables
                  </button>
                  <button 
                    onClick={() => scrollToElement('history')}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300"
                  >
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-red-600 via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };

  const [events, dispatchEvents] = useReducer(eventReducer, []);
  const [bet, setBet] = useState(0);
  const [inside, dispatchInside] = useReducer(arrayReducer, new Array(145).fill(0));
  const [red, setRed] = useState(0);
  const [black, setBlack] = useState(0);
  const [odd, setOdd] = useState(0);
  const [even, setEven] = useState(0);
  const [over, setOver] = useState(0);
  const [under, setUnder] = useState(0);
  const [dozens, dispatchDozens] = useReducer(arrayReducer, [0, 0, 0]);
  const [columns, dispatchColumns] = useReducer(arrayReducer, [0, 0, 0]);
  const [correctNetwork, setCorrectNetwork] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [winnings, setWinnings] = useState(-1);
  const [rollResult, setRollResult] = useState(-1);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessages] = useState([
    "Placing Bet...",
    "Bet Placed Successfully!",
    "Generating VRF Outcome...",
    "Result Ready!"
  ]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [currentBetType, setCurrentBetType] = useState(null);
  const [writeContractResult, setWriteContractResult] = useState(null);
  const [writeContractError, setWriteContractError] = useState(null);
  const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);
  const [transactionReceipt, setTransactionReceipt] = useState(null);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [showBettingStats, setShowBettingStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [recentResults, setRecentResults] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bettingHistory, setBettingHistory] = useState([]);
  const [isDev, setIsDev] = useState(false);
  const [error, setError] = useState(null);

  // Get wallet status and balance
  const { address, isConnected } = useWalletStatus();
  const { balance } = useToken(address);

  // Sound refs
  const spinSoundRef = useRef(null);
  const winSoundRef = useRef(null);
  const chipSelectRef = useRef(null);
  const chipPlaceRef = useRef(null);
  const menuClickRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const ambientSoundsRef = useRef(null);

  // Sound utility function
  const playSound = useCallback((ref) => {
    if (!ref?.current || ref.current.muted) return;
    ref.current.currentTime = 0;
    ref.current.play().catch(error => console.error("Sound play failed:", error));
  }, []);

  // Start background sounds as soon as component mounts
  useEffect(() => {
    let backgroundMusicAttempted = false;
    let ambientSoundsAttempted = false;

    const startBackgroundSounds = async () => {
      console.log("Attempting to start background sounds...");

      // Function to handle user interaction and start sounds
      const startSound = async (ref, volume, name) => {
        if (!ref.current) {
          console.log(`${name} ref not available`);
          return;
        }
        
        try {
          ref.current.volume = volume;
          // Load the audio
          await ref.current.load();
          console.log(`${name} loaded successfully`);
          
          // Try to play
          const playPromise = ref.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log(`${name} playing successfully`);
              })
              .catch((error) => {
                console.log(`${name} autoplay failed:`, error);
                // Add click event listener if not already attempted
                if (!backgroundMusicAttempted && name === "Background Music") {
                  backgroundMusicAttempted = true;
                  document.addEventListener('click', async () => {
                    try {
                      await ref.current.play();
                      console.log(`${name} started after user interaction`);
                    } catch (err) {
                      console.log(`${name} failed after user interaction:`, err);
                    }
                  }, { once: true });
                }
                if (!ambientSoundsAttempted && name === "Ambient Sounds") {
                  ambientSoundsAttempted = true;
                  document.addEventListener('click', async () => {
                    try {
                      await ref.current.play();
                      console.log(`${name} started after user interaction`);
                    } catch (err) {
                      console.log(`${name} failed after user interaction:`, err);
                    }
                  }, { once: true });
                }
              });
          }
        } catch (err) {
          console.log(`${name} error:`, err);
        }
      };

      await startSound(backgroundMusicRef, 0.3, "Background Music");
      await startSound(ambientSoundsRef, 0.2, "Ambient Sounds");
    };

    startBackgroundSounds();

    // Cleanup function
    return () => {
      console.log("Cleaning up sound effects...");
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
      if (ambientSoundsRef.current) {
        ambientSoundsRef.current.pause();
        ambientSoundsRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle muting of all sounds
  useEffect(() => {
    console.log("Mute status changed:", isMuted);
    const audioRefs = [
      spinSoundRef,
      winSoundRef,
      chipSelectRef,
      chipPlaceRef,
      menuClickRef,
      backgroundMusicRef,
      ambientSoundsRef
    ];

    audioRefs.forEach(ref => {
      if (ref?.current) {
        ref.current.muted = isMuted;
        console.log(`Set muted=${isMuted} for audio element`);
      }
    });
  }, [isMuted]);

  useEffect(() => {
    // Force production mode for contract interactions
    setIsDev(false);
    console.log('Development mode:', process.env.NODE_ENV);
  }, []);

  useEffect(() => {
    // Set up event listeners
    const setupEventListeners = () => {
      if (!address || !isConnected) {
        console.log('Wallet not connected, skipping event listeners');
        return;
      }

      console.log('Setting up contract event listeners...');
      console.log('Contract address:', rouletteContractAddress);
      console.log('Connected wallet:', address);

      const winningsListener = ViemClient.publicPharosSepoliaClient.watchContractEvent({
      address: rouletteContractAddress,
      abi: rouletteABI,
      eventName: "RandomNumberGenerated",
      onLogs: (logs) => {
          console.log('RandomNumberGenerated event received:', logs);
          try {
            // Safely parse the random number
            const randomNumberRaw = logs[0]?.args?.randomNumber;
            const randomNumber = typeof randomNumberRaw === 'object' 
              ? parseInt(randomNumberRaw.toString()) 
              : parseInt(randomNumberRaw);
            
            if (!isNaN(randomNumber)) {
        setRollResult(randomNumber);
              setNotificationIndex(notificationSteps.RESULT_READY);
              console.log(`Random Number Generated: ${randomNumber}`);
            } else {
              console.error("Invalid random number:", randomNumberRaw);
            }
          } catch (error) {
            console.error("Error processing random number:", error);
          }
      },
    });

      const betResultListener = ViemClient.publicPharosSepoliaClient.watchContractEvent({
      address: rouletteContractAddress,
      abi: rouletteABI,
      eventName: "BetResult",
      onLogs: (logs) => {
          console.log('BetResult event received:', logs);
          try {
            if (!logs || !logs[0] || !logs[0].args) {
              console.error("Invalid logs in BetResult event:", logs);
              return;
            }
            
            const { player, amount, won } = logs[0].args;
            
            // Safely compare addresses
            const playerAddress = player ? player.toLowerCase() : null;
            const userAddress = address ? address.toLowerCase() : null;
            
            if (userAddress && playerAddress === userAddress) {
              // Safely convert amount to number
              let amountNum = 0;
              try {
                const amountStr = typeof amount === 'object' ? amount.toString() : String(amount);
                amountNum = parseFloat(amountStr) / 1e18;
              } catch (e) {
                console.error("Error parsing amount:", e);
                amountNum = 0;
              }
              
              setWinnings(won ? amountNum : 0);
              
              // Add to betting history
              setBettingHistory(prev => [{
                type: currentBetType?.type || 'Unknown',
                amount: amountNum,
                won: Boolean(won),
                payout: won ? amountNum : 0,
                roll: rollResult,
                timestamp: new Date().toISOString()
              }, ...prev].slice(0, 10)); // Keep last 10 bets
              
              console.log(`Bet Result - Won: ${won}, Amount: ${amountNum}`);
            }
          } catch (error) {
            console.error("Error processing bet result:", error);
          }
        },
      });

      const vrfRequestListener = ViemClient.publicPharosSepoliaClient.watchContractEvent({
        address: rouletteContractAddress,
        abi: rouletteABI,
        eventName: "RandomNumberRequested",
        onLogs: (logs) => {
          console.log('RandomNumberRequested event received:', logs);
          try {
            setNotificationIndex(notificationSteps.GENERATING_VRF);
            
            // Handle the request ID safely
            if (logs && logs[0] && logs[0].args) {
              const requestId = logs[0].args.requestId;
              const safeRequestId = typeof requestId === 'object' 
                ? (requestId.toString ? requestId.toString() : JSON.stringify(requestId)) 
                : requestId;
              console.log("VRF Request ID:", safeRequestId);
      } else {
              console.log("VRF Request received but no request ID found");
            }
          } catch (error) {
            console.error("Error handling VRF request:", error);
          }
        },
      });

      return () => {
        if (typeof winningsListener === 'function') winningsListener();
        if (typeof betResultListener === 'function') betResultListener();
        if (typeof vrfRequestListener === 'function') vrfRequestListener();
      };
    };

    setupEventListeners();
  }, [address, isConnected, currentBetType, rollResult, setNotificationIndex, setRollResult, setWinnings, setBettingHistory, setCurrentBetType]);

  // Check screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Track recent results
  useEffect(() => {
    if (rollResult >= 0) {
      setRecentResults(prev => [rollResult, ...prev].slice(0, 10));
    }
  }, [rollResult]);

  // Handle wheel spin completion
  const handleSpinComplete = () => {
    setWheelSpinning(false);
  };

  // Add a function to toggle sound
  const toggleSound = () => {
    setIsMuted(!isMuted);
  };

  // Create theme using muiStyles
  const theme = createTheme(muiStyles["dark"]);

  // insert into events
  const insertEvent = (type, oldVal, newVal, ind = 0) => {
    let newArr = [...events];
    newArr.push({ type: type, oldVal: oldVal, newVal: newVal, ind: ind });
    dispatchEvents({ type: "update", payload: newArr });
  };

  // Update the revertEvent function
  const revertEvent = useCallback((e) => {
    if (events.length > 0) {
      playSound(menuClickRef);
      const lastEvent = events[events.length - 1];
      
      switch (lastEvent.type) {
        case "red":
          setRed(lastEvent.oldVal);
          break;
        case "black":
          setBlack(lastEvent.oldVal);
          break;
        case "odd":
          setOdd(lastEvent.oldVal);
          break;
        case "even":
          setEven(lastEvent.oldVal);
          break;
        case "over":
          setOver(lastEvent.oldVal);
          break;
        case "under":
          setUnder(lastEvent.oldVal);
          break;
        case "dozens":
          dispatchDozens({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
        case "columns":
          dispatchColumns({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
        case "inside":
          dispatchInside({ type: "update", ind: lastEvent.ind, val: lastEvent.oldVal });
          break;
      }
      
      // Remove the last event from history
      dispatchEvents({ type: "update", payload: events.slice(0, -1) });
    }
  }, [events, playSound, menuClickRef]);

  // Update the placeBet function to accumulate bets
  const placeBet = useCallback((e, type, ind = 0, newVal = bet, revert = false) => {
    if (e) {
    e.preventDefault();
    e.stopPropagation();
    }
    if (isNaN(newVal)) {
      return;
    }

    // Play chip sound when placing a bet
    if (!revert && newVal > 0) {
      playSound(chipPlaceRef);
    }

    let oldVal = 0;
    switch (type) {
      case "red":
        oldVal = red;
        const updatedRed = revert ? newVal : red + newVal;
        if (red !== updatedRed) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedRed, ind }] });
          }
          setRed(updatedRed);
        }
        break;
      case "black":
        oldVal = black;
        const updatedBlack = revert ? newVal : black + newVal;
        if (black !== updatedBlack) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedBlack, ind }] });
          }
          setBlack(updatedBlack);
        }
        break;
      case "odd":
        oldVal = odd;
        const updatedOdd = revert ? newVal : odd + newVal;
        if (odd !== updatedOdd) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedOdd, ind }] });
          }
          setOdd(updatedOdd);
        }
        break;
      case "even":
        oldVal = even;
        const updatedEven = revert ? newVal : even + newVal;
        if (even !== updatedEven) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedEven, ind }] });
          }
          setEven(updatedEven);
        }
        break;
      case "over":
        oldVal = over;
        const updatedOver = revert ? newVal : over + newVal;
        if (over !== updatedOver) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedOver, ind }] });
          }
          setOver(updatedOver);
        }
        break;
      case "under":
        oldVal = under;
        const updatedUnder = revert ? newVal : under + newVal;
        if (under !== updatedUnder) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedUnder, ind }] });
          }
          setUnder(updatedUnder);
        }
        break;
      case "dozens":
        oldVal = dozens[ind];
        const updatedDozen = revert ? newVal : dozens[ind] + newVal;
        if (dozens[ind] !== updatedDozen) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedDozen, ind }] });
          }
          dispatchDozens({ type: "update", ind, val: updatedDozen });
        }
        break;
      case "columns":
        oldVal = columns[ind];
        const updatedColumn = revert ? newVal : columns[ind] + newVal;
        if (columns[ind] !== updatedColumn) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedColumn, ind }] });
          }
          dispatchColumns({ type: "update", ind, val: updatedColumn });
        }
        break;
      case "inside":
        oldVal = inside[ind];
        const updatedInside = revert ? newVal : inside[ind] + newVal;
        if (inside[ind] !== updatedInside) {
        if (!revert) {
            dispatchEvents({ type: "update", payload: [...events, { type, oldVal, newVal: updatedInside, ind }] });
        }
          dispatchInside({ type: "update", ind, val: updatedInside });
      }
        break;
    }
  }, [bet, events, red, black, odd, even, over, under, dozens, columns, inside, playSound, chipPlaceRef]);

  // reset all the bets
  const reset = useCallback((e) => {
    if (e) e.preventDefault();
    playSound(menuClickRef);
    setRed(0);
    setBlack(0);
    setOdd(0);
    setEven(0);
    setOver(0);
    setUnder(0);
    dispatchDozens({ type: "reset" });
    dispatchColumns({ type: "reset" });
    dispatchInside({ type: "reset" });
    dispatchEvents({ type: "reset" });
    setRollResult(-1);
    setWinnings(-1);
  }, [playSound, menuClickRef]);

  // updating the bet size
  const handleBetChange = useCallback((e) => {
    setBet(parseFloat(e.target.value));
    playSound(chipSelectRef);
  }, [playSound, chipSelectRef]);

  // Function to close the notification
  const handleCloseNotification = () => {
    setShowNotification(false);
    setNotificationIndex(0);
  };

  const lockBet = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (total <= 0) {
      alert("Please place a bet first");
      return;
    }

    if (!correctNetwork) {
      alert("Please switch to Pharos Sepolia network");
      return;
    }

    setSubmitDisabled(true);
    setNotificationIndex(notificationSteps.PLACING_BET);
    setShowNotification(true);
    setWheelSpinning(true);

    try {
      setError(null);
      console.log('Placing bet with configuration:', {
        address,
        betType: currentBetType,
        betAmount: total,
        tokenAddress: tokenContractAddress,
        rouletteAddress: rouletteContractAddress
      });

      // Convert the bets into the format expected by the contract
      let betType, betValue, betAmount;
      
      // Handle different bet types
      if (red > 0) {
        betType = BetType.COLOR;
        betValue = 1; // Red
        betAmount = red;
      } else if (black > 0) {
        betType = BetType.COLOR;
        betValue = 0; // Black
        betAmount = black;
      } else if (odd > 0) {
        betType = BetType.ODDEVEN;
        betValue = 1; // Odd
        betAmount = odd;
      } else if (even > 0) {
        betType = BetType.ODDEVEN;
        betValue = 0; // Even
        betAmount = even;
      } else if (over > 0) {
        betType = BetType.HIGHLOW;
        betValue = 1; // High (19-36)
        betAmount = over;
      } else if (under > 0) {
        betType = BetType.HIGHLOW;
        betValue = 0; // Low (1-18)
        betAmount = under;
      } else if (dozens.some(d => d > 0)) {
        betType = BetType.DOZEN;
        betValue = dozens.findIndex(d => d > 0);
        betAmount = dozens[betValue];
      } else if (columns.some(c => c > 0)) {
        betType = BetType.COLUMN;
        betValue = columns.findIndex(c => c > 0);
        betAmount = columns[betValue];
      } else {
        // Handle straight up bets
        const straightUpIndex = inside.findIndex(val => val > 0);
        if (straightUpIndex >= 0) {
          betType = BetType.NUMBER;
          betValue = Math.floor(straightUpIndex / 4); // Convert to actual number
          betAmount = inside[straightUpIndex];
        } else {
          alert("Invalid bet configuration");
          setSubmitDisabled(false);
          setShowNotification(false);
          return;
        }
      }

      const amount = parseEther(betAmount.toString());

      console.log("Preparing transaction with:", {
        betType,
        betValue,
        amount: amount.toString(),
        tokenAddress: tokenContractAddress,
        rouletteAddress: rouletteContractAddress,
        playerAddress: address
      });

      // First approve the tokens
      console.log("Requesting token approval...");
      const approvalHash = await writeContract({
        address: tokenContractAddress,
        abi: tokenABI,
        functionName: "approve",
        args: [rouletteContractAddress, amount],
      });

      console.log("Token approval submitted, hash:", approvalHash);
      const approvalHashStr = typeof approvalHash === 'object' && approvalHash.hash ? approvalHash.hash : approvalHash;
      setWriteContractResult({ hash: approvalHashStr });
      setNotificationIndex(notificationSteps.BET_PLACED);

      // Wait for approval confirmation
      console.log("Waiting for approval confirmation...");
      const approvalReceipt = await waitForTransaction(approvalHashStr);
      console.log("Approval confirmed:", approvalReceipt);

      // Then place the bet
      console.log("Placing bet...");
      const betHash = await writeContract({
        address: rouletteContractAddress,
        abi: rouletteABI,
        functionName: "placeBet",
        args: [betType, betValue, amount, []],
      });

      console.log("Bet placed, hash:", betHash);
      const betHashStr = typeof betHash === 'object' && betHash.hash ? betHash.hash : betHash;
      setWriteContractResult({ hash: betHashStr });
      
      // Wait for bet confirmation
      console.log("Waiting for bet confirmation...");
      const betReceipt = await waitForTransaction(betHashStr);
      console.log("Bet confirmed:", betReceipt);

      // Reset roll result for the new bet
      setRollResult(-1);

    } catch (error) {
      console.error("Transaction failed:", error);
      setShowNotification(false);
      setWheelSpinning(false);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setSubmitDisabled(false);
    }
  };

  const handleWithdrawWinnings = useCallback(async (e) => {
    if (e) e.preventDefault();
    playSound(winSoundRef);

    if (!address) {
      console.error("Wallet not connected.");
      alert("Please connect your wallet.");
      return;
    }

    try {
      const amount = parseEther(winnings.toString()); // Use winnings as the amount to withdraw

      reset(e); // Reset the state after withdrawing

      // Simulate the contract interaction
      const withdrawSimulation =
        await ViemClient.publicPharosSepoliaClient.simulateContract({
          address: rouletteContractAddress,
          abi: rouletteABI,
          functionName: "withdrawTokens",
          args: [amount],
          account: address,
        });

      // Execute the contract transaction
      const withdrawResponse = await ViemClient.getWalletClient().writeContract(
        withdrawSimulation.request
      );

      if (withdrawResponse) {
        // Extract hash from response if it's an object
        const responseHash = typeof withdrawResponse === 'object' ? 
          (withdrawResponse.hash || String(withdrawResponse)) : 
          withdrawResponse;
          
        console.log("Winnings withdrawn successfully:", responseHash);
        alert("Winnings withdrawn successfully!");
      } else {
        throw new Error("Withdrawal transaction failed.");
      }
    } catch (error) {
      console.error("Error withdrawing winnings:", error);
      alert(`Failed to withdraw winnings: ${error.message}`);
    }
  }, [playSound, winnings, reset]);

  const writeContract = async (config) => {
    if (isDev) {
      // Simulate contract write in dev mode
      setIsWaitingForTransaction(true);
      
      // Simulate a delay for the transaction
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
          setWriteContractResult({ hash: mockTxHash });
          setIsWaitingForTransaction(false);
          resolve({ hash: mockTxHash });
        }, 2000);
      });
    }
    
    try {
      const { writeContract } = await import('wagmi');
      const result = await writeContract(config);
      setWriteContractResult(result);
      return result;
    } catch (error) {
      console.error("Contract write error:", error);
      setWriteContractError(error);
      throw error;
    }
  };

  const waitForTransaction = async (hash) => {
    if (isDev) {
      // Simulate transaction confirmation in dev mode
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockReceipt = {
            blockNumber: 12345678,
            status: 'success',
            transactionHash: hash
          };
          setTransactionReceipt(mockReceipt);
          resolve(mockReceipt);
        }, 3000);
      });
    }
    
    try {
      const { waitForTransactionReceipt } = await import('wagmi');
      // Ensure hash is a string, not an object
      const hashStr = typeof hash === 'object' && hash.hash ? hash.hash : hash;
      const receipt = await waitForTransactionReceipt({ hash: hashStr });
      setTransactionReceipt(receipt);
      return receipt;
    } catch (error) {
      console.error("Wait for transaction error:", error);
      throw error;
    }
  };

  const checkNetwork = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        // Support both Mantle Sepolia (0x138b) and Pharos Devnet (0xc352)
        setCorrectNetwork(chainId === "0x138b" || chainId === "0xc352");
      } catch (error) {
        console.error("Error checking network:", error);
        setCorrectNetwork(false);
      }
    }
  };
  
  useEffect(() => {
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on("chainChanged", checkNetwork);
      return () => {
        window.ethereum.removeListener("chainChanged", checkNetwork);
      };
    }
  }, []);

  const switchNetwork = async () => {
    if (typeof window !== "undefined") {
      try {
        // Try Mantle Sepolia first
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x138b" }],
        });
      } catch (switchError) {
        // If Mantle Sepolia fails, try Pharos Devnet
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x138b",
                  chainName: "Mantle Sepolia",
                  nativeCurrency: {
                    name: "Mantle",
                    symbol: "MNT",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
                  blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
                },
              ],
            });
            // After adding Mantle Sepolia, switch to it
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x138b" }],
            });
          } catch (addError) {
            console.error("Failed to add Mantle Sepolia:", addError);
            // If Mantle Sepolia fails, try Pharos Devnet
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xc352",
                    chainName: "Pharos Devnet",
                    nativeCurrency: {
                      name: "Pharos",
                      symbol: "PHR",
                      decimals: 18,
                    },
                    rpcUrls: ["https://devnet.dplabs-internal.com"],
                    blockExplorerUrls: ["https://pharosscan.xyz"],
                  },
                ],
              });
              // After adding Pharos Devnet, switch to it
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xc352" }],
              });
            } catch (pharosError) {
              console.error("Failed to add Pharos Devnet:", pharosError);
            }
          }
        } else {
          console.error("Failed to switch network:", switchError);
        }
      }
      window.location.reload();
    }
  };

  // Calculate total bet
  const total = useMemo(() => {
    let val = red + black + odd + even + over + under;
    val += dozens.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    val += columns.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    val += inside.reduce((acc, currVal) => {
      return acc + currVal;
    }, 0);
    return val;
  }, [red, black, odd, even, over, under, dozens, columns, inside]);

  // Update the clear bet function
  const clearBet = useCallback((e) => {
    if (e) e.preventDefault();
    playSound(menuClickRef);
    setRed(0);
    setBlack(0);
    setOdd(0);
    setEven(0);
    setOver(0);
    setUnder(0);
    dispatchDozens({ type: "reset" });
    dispatchColumns({ type: "reset" });
    dispatchInside({ type: "reset" });
    dispatchEvents({ type: "reset" });
  }, [playSound, menuClickRef]);

  return (
    <ThemeProvider theme={theme}>
      <div ref={contentRef} className="font-sans" style={{ backgroundColor: "#080005", minHeight: "100vh", overflowX: 'hidden', paddingTop: "30px" }}>
        {/* Audio elements */}
        <audio ref={spinSoundRef} src="/sounds/ball-spin.mp3" preload="auto" />
        <audio ref={winSoundRef} src="/sounds/win-chips.mp3" preload="auto" />
        <audio ref={chipSelectRef} src="/sounds/chip-select.mp3" preload="auto" />
        <audio ref={chipPlaceRef} src="/sounds/chip-put.mp3" preload="auto" />
        <audio ref={menuClickRef} src="/sounds/menu.mp3" preload="auto" />
        <audio ref={backgroundMusicRef} src="/sounds/background-music.mp3" preload="auto" loop />
        <audio ref={ambientSoundsRef} src="/sounds/ambient-sounds.mp3" preload="auto" loop />

        {/* Page Header */}
        <RouletteHeader />
        
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            pt: { xs: 0, md: 1 },
            position: "relative",
            zIndex: 1,
          }}
        >


          {/* Recent Results Bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflowX: 'auto',
              py: 0.75,
              mt: 1,
              mb: 2,
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              gap: 1,
              maxWidth: '90%',
              mx: 'auto'
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1.5, 
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '20px',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Recent Results:
            </Typography>
            {recentResults.length === 0 ? (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '20px',
                  opacity: 0.8
                }}
              >
                No results yet
              </Typography>
            ) : (
              recentResults.map((num, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    backgroundColor: num === 0 ? 'game.green' : 
                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'game.red' : 'dark.bg',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {num}
                </Box>
              ))
            )}
          </Box>
          
          {/* Responsive Grid Layout */}
          <Grid 
            container 
            sx={{ mt: { xs: 1.5, md: 4 }, mx: { xs: 1, sm: 5, md: 10 } }}
            columns={isSmallScreen ? 7 : 14}
          >
            <Grid md={1}>
              <GridZero inside={inside} placeBet={placeBet} />
            </Grid>
            <Grid md={4} container columns={12}>
              {firstThird.map((val, ind) => (
                <Grid md={3} key={`first-third-${val.val}`}>
                  <GridInside
                    insideNumber={val.val}
                    red={val?.red}
                    topEdge={ind < 4}
                    placeBet={placeBet}
                    straightup={inside[(val.val - 1) * 4 + 1]}
                    splitleft={inside[(val.val - 1) * 4 + 2]}
                    splitbottom={inside[(val.val - 1) * 4 + 3]}
                    corner={inside[(val.val - 1) * 4 + 4]}
                    isWinner={rollResult === val.val}
                  />
                </Grid>
              ))}
            </Grid>
            <Grid md={4} container columns={12}>
              {secondThird.map((val, ind) => (
                <Grid md={3} key={`second-third-${val.val}`}>
                  <GridInside
                    insideNumber={val.val}
                    red={val?.red}
                    topEdge={ind < 4}
                    placeBet={placeBet}
                    straightup={inside[(val.val - 1) * 4 + 1]}
                    splitleft={inside[(val.val - 1) * 4 + 2]}
                    splitbottom={inside[(val.val - 1) * 4 + 3]}
                    corner={inside[(val.val - 1) * 4 + 4]}
                    isWinner={rollResult === val.val}
                  />
                </Grid>
              ))}
            </Grid>
            <Grid md={4} container columns={12}>
              {thirdThird.map((val, ind) => (
                <Grid md={3} key={`third-third-${val.val}`}>
                  <GridInside
                    insideNumber={val.val}
                    red={val?.red}
                    topEdge={ind < 4}
                    placeBet={placeBet}
                    straightup={inside[(val.val - 1) * 4 + 1]}
                    splitleft={inside[(val.val - 1) * 4 + 2]}
                    splitbottom={inside[(val.val - 1) * 4 + 3]}
                    corner={inside[(val.val - 1) * 4 + 4]}
                    isWinner={rollResult === val.val}
                  />
                </Grid>
              ))}
            </Grid>
            <Grid md={1} sx={{ display: "flex", alignItems: "stretch" }}>
              <Box
                sx={{ display: "flex", flexDirection: "column", width: "100%" }}
              >
                <GridColumnBet
                  topCard={true}
                  columns={columns}
                  index={0}
                  bet={bet}
                  placeBet={placeBet}
                />
                <GridColumnBet
                  columns={columns}
                  index={1}
                  bet={bet}
                  placeBet={placeBet}
                />
                <GridColumnBet
                  bottomCard={true}
                  columns={columns}
                  index={2}
                  bet={bet}
                  placeBet={placeBet}
                />
              </Box>
            </Grid>

            <Grid md={1} />
            <Grid md={4}>
              <GridOutsideBet onClick={(e) => placeBet(e, "dozens", 0)}>
                <Typography variant="h5">1st 12</Typography>
                {dozens[0] > 0 && (
                  <BetBox
                    betValue={dozens[0]}
                    betType="1st 12"
                    onClick={(e) => placeBet(e, "dozens", 0)}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={4}>
              <GridOutsideBet onClick={(e) => placeBet(e, "dozens", 1)}>
                <Typography variant="h5">2nd 12</Typography>
                {dozens[1] > 0 && (
                  <BetBox
                    betValue={dozens[1]}
                    betType="2nd 12"
                    onClick={(e) => placeBet(e, "dozens", 1)}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={4}>
              <GridOutsideBet
                rightCard={true}
                onClick={(e) => placeBet(e, "dozens", 2)}
              >
                <Typography variant="h5">3rd 12</Typography>
                {dozens[2] > 0 && (
                  <BetBox
                    betValue={dozens[2]}
                    betType="3rd 12"
                    onClick={(e) => placeBet(e, "dozens", 2)}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid
              md={1}
              sx={{
                borderLeft: (theme) => `10px solid ${theme.palette.dark.card}`,
              }}
            />

            <Grid md={1} />
            <Grid md={2}>
              <GridOutsideBet onClick={(e) => placeBet(e, "under")}>
                <Typography variant="h5">1-18</Typography>
                {under > 0 && (
                  <BetBox
                    betValue={under}
                    betType="Under (1-18)"
                    onClick={(e) => placeBet(e, "under")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={2}>
              <GridOutsideBet onClick={(e) => placeBet(e, "even")}>
                <Typography variant="h5">Even</Typography>
                {even > 0 && (
                  <BetBox
                    betValue={even}
                    betType="Even"
                    onClick={(e) => placeBet(e, "even")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={2}>
              <GridOutsideBet onClick={(e) => placeBet(e, "red")}>
                <Box
                  sx={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: (theme) => theme.palette.game.red,
                  }}
                />
                {red > 0 && (
                  <BetBox
                    betValue={red}
                    betType="Red"
                    onClick={(e) => placeBet(e, "red")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={2}>
              <GridOutsideBet onClick={(e) => placeBet(e, "black")}>
                <Box
                  sx={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: (theme) => theme.palette.dark.bg,
                  }}
                />
                {black > 0 && (
                  <BetBox
                    betValue={black}
                    betType="Black"
                    onClick={(e) => placeBet(e, "black")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={2}>
              <GridOutsideBet onClick={(e) => placeBet(e, "odd")}>
                <Typography variant="h5">Odd</Typography>
                {odd > 0 && (
                  <BetBox
                    betValue={odd}
                    betType="Odd"
                    onClick={(e) => placeBet(e, "odd")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid md={2}>
              <GridOutsideBet
                rightCard={true}
                onClick={(e) => placeBet(e, "over")}
              >
                <Typography variant="h5">19-36</Typography>
                {over > 0 && (
                  <BetBox
                    betValue={over}
                    betType="Over (19-36)"
                    onClick={(e) => placeBet(e, "over")}
                  />
                )}
              </GridOutsideBet>
            </Grid>
            <Grid
              md={1}
              sx={{
                borderLeft: (theme) => `10px solid ${theme.palette.dark.card}`,
              }}
            />
          </Grid>



          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              justifyContent: "center",
              mb: 5,
              gap: 4,
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", mb: { xs: 3, md: 0 } }}
            >
              <Typography variant="h3" color="text.accent">
                Roulette
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TooltipWide title={<Typography>{rouletteTutorial}</Typography>}>
                <Box
                    sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }}
                  color="text.secondary"
                    onClick={() => setShowHelp(!showHelp)}
                >
                  <Typography variant="h6">Tutorial</Typography>
                  <InfoIcon sx={{ ml: 1 }} />
                </Box>
              </TooltipWide>
              <TooltipWide
                title={
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {rouletteOdds.map((v, ind) => (
                      <Typography key={`tutorial-odds-${ind}`}>{v}</Typography>
                    ))}
                  </Box>
                }
              >
                <Box
                    sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }}
                  color="text.secondary"
                >
                  <Typography variant="h6">Odds</Typography>
                  <InfoIcon sx={{ ml: 1 }} />
                </Box>
              </TooltipWide>
            </Box>
              
              {/* Animated Roulette Wheel */}
              <RouletteWheel 
                spinning={wheelSpinning} 
                result={rollResult} 
                onSpinComplete={handleSpinComplete}
                onSpinStart={() => playSound(spinSoundRef)}
                onWin={() => playSound(winSoundRef)}
              />
            </Box>
            
            {/* Betting Controls */}
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column",
              width: { xs: '100%', md: 'auto' },
              maxWidth: { xs: '400px', md: 'none' }
            }}>
              <TextFieldCurrency
                label="Bet Amount"
                variant="standard"
                value={bet}
                handleChange={handleBetChange}
              />
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body1" color="white">
                  Total Balance:{" "}
                  {balance === '0' ? (
                    <CircularProgress size={16} />
                  ) : (
                    `${currency(balance, { pattern: "#", precision: 4 }).format()} APTC`
                  )}
              </Typography>
            </Box>
              <Typography color="white" sx={{ opacity: 0.8 }}>
                Current Bet Total: {currency(total, { pattern: "#" }).format()} APTC
              </Typography>
              
              {/* Quick Bet Buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {[1, 5, 10, 25, 50, 100].map(amount => (
                  <Button 
                    key={amount}
                    onClick={() => setBet(amount)}
                    sx={{ 
                      minWidth: '40px', 
                      height: '30px', 
                      py: 0, 
                      backgroundColor: bet === amount ? 'primary.light' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    {amount}
                  </Button>
                ))}
              </Box>
            </Box>
            
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                ml: { xs: 0, md: 3 },
                mt: { xs: 0, md: 1 },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title={<Typography>Undo last bet</Typography>}>
                <span>
                  <IconButton
                    disabled={events.length === 0 || submitDisabled}
                    onClick={revertEvent}
                  >
                    <UndoIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={<Typography>Clear bet</Typography>}>
                <IconButton
                  disabled={submitDisabled}
                    onClick={clearBet}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
              
              <Box sx={{ mt: 3 }}>
              {rollResult >= 0 ? (
                <Box>
                  {winnings > 0 ? (
                      <Button 
                        onClick={() => handleWithdrawWinnings(winnings)}
                        sx={{
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                            '100%': { transform: 'scale(1)' },
                          }
                        }}
                      >
                        Collect {winnings} APTC
                      </Button>
                    ) : (
                      <Button onClick={() => placeBet(null, null, null, 0, true)}>Go Again</Button>
                    )}
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="h5">
                        Result: <span style={{ 
                          color: rollResult === 0 ? '#14D854' : 
                                 [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(rollResult) ? '#d82633' : 'white'
                        }}>{rollResult}</span>
                    </Typography>
                      {winnings > 0 ? (
                        <Typography variant="body1" color="success.main" sx={{ animation: 'fadeIn 1s', fontWeight: 'bold' }}>
                          You won {winnings} APTC!
                        </Typography>
                      ) : (
                        <Typography variant="body1" color="white" sx={{ opacity: 0.8 }}>
                          Better luck next time!
                        </Typography>
                      )}
                  </Box>
                </Box>
              ) : correctNetwork ? (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Button
                    disabled={total === 0}
                    loading={submitDisabled}
                      onClick={lockBet}
                  >
                    Submit Bet
                  </Button>
                  {submitDisabled && rollResult < 0 && (
                      <Typography color="white" sx={{ opacity: 0.8 }}>
                      Die being rolled, please wait...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Button onClick={() => switchNetwork()}>Switch Network</Button>
                </Box>
              )}
            </Box>
          </Box>
            
            {/* Toggle between History and Stats */}
            <Box sx={{ width: { xs: '100%', md: '300px' }, mt: { xs: 4, md: 0 } }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Button 
                  onClick={() => setShowBettingStats(false)}
                  sx={{ 
                    flex: 1, 
                    borderBottom: !showBettingStats ? '2px solid #681DDB' : '2px solid transparent'
                  }}
                >
                  History
                </Button>
                <Button 
                  onClick={() => setShowBettingStats(true)}
                  sx={{ 
                    flex: 1, 
                    borderBottom: showBettingStats ? '2px solid #681DDB' : '2px solid transparent'
                  }}
                >
                  Stats
                </Button>
        </Box>

              {showBettingStats ? (
                <BettingStats history={bettingHistory} />
              ) : (
                <BettingHistory history={bettingHistory} />
              )}
            </Box>
          </Box>
          
          {/* Help Modal for Mobile */}
          {showHelp && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}
              onClick={() => setShowHelp(false)}
            >
              <Box
                sx={{
                  backgroundColor: 'bg.light',
                  p: 3,
                  borderRadius: 2,
                  maxWidth: 600,
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Typography variant="h5" sx={{ mb: 2 }}>How to Play Roulette</Typography>
                <Typography paragraph>{rouletteTutorial}</Typography>
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Payout Odds</Typography>
                {rouletteOdds.map((odd, index) => (
                  <Typography key={index} paragraph>
                    {odd}
                  </Typography>
                ))}
                <Button 
                  onClick={() => setShowHelp(false)}
                  sx={{ mt: 2 }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
          
          {/* New enhanced sections */}
          <Box sx={{ 
            mt: 8, 
            px: { xs: 2, md: 8 },
            mx: 'auto',
            maxWidth: '1600px'
          }}>
            {/* Section Header */}
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 5, 
                textAlign: 'center', 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #d82633, #681DDB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '1px',
                textShadow: '0 4px 8px rgba(0,0,0,0.5)'
              }}
            >
              Master European Roulette
            </Typography>

            {/* Video and Description Section */}
            <Grid container spacing={4} sx={{ mb: 7 }}>
              {/* Video on left */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: { xs: '56.25%', md: '56.25%' },
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(104, 29, 219, 0.4)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
                      border: '2px solid rgba(216, 38, 51, 0.5)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-3px',
                      left: '-3px',
                      right: '-3px',
                      bottom: '-3px',
                      borderRadius: '20px',
                      background: 'linear-gradient(45deg, #d82633, #681DDB, #14D854, #d82633)',
                      backgroundSize: '400% 400%',
                      zIndex: -1,
                      filter: 'blur(10px)',
                      opacity: 0.7,
                      animation: 'gradient 15s ease infinite',
                      '@keyframes gradient': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '50%': { backgroundPosition: '100% 50%' },
                        '100%': { backgroundPosition: '0% 50%' }
                      }
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      py: 1.5,
                      background: 'linear-gradient(to bottom, rgba(9, 0, 5, 0.8), rgba(9, 0, 5, 0))',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 2
                    }}
                  >
                  </Box>
                  <iframe
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      zIndex: 1
                    }}
                    src={gameData.youtube}
                    title="Roulette Masterclass Tutorial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              </Grid>
              
              {/* Description on right */}
              <Grid item xs={12} md={6}>
                                 <Box
                   sx={{
                     background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.6) 0%, rgba(9, 0, 5, 0.3) 100%)',
                     backdropFilter: 'blur(10px)',
                     borderRadius: '16px',
                     p: { xs: 2.5, md: 3 },
                     minHeight: '280px',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'center',
                    border: '1px solid rgba(104, 29, 219, 0.2)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '5px',
                      height: '100%',
                      background: 'linear-gradient(to bottom, #d82633, #681DDB)',
                    }
                  }}
                >
                                     <Typography 
                     variant="h6" 
                     sx={{ 
                       mb: 2,
                       fontWeight: 'bold',
                       background: 'linear-gradient(90deg, #FFFFFF, #FFA500)',
                       WebkitBackgroundClip: 'text',
                       WebkitTextFillColor: 'transparent',
                       display: 'inline-block'
                     }}
                   >
                     European Roulette
                   </Typography>
                  
                                     {/* Only show first two paragraphs with condensed content */}
                   <Typography 
                     variant="body1" 
                     sx={{ 
                       mb: 2.5,
                       lineHeight: 1.8,
                       fontSize: '1rem',
                       color: 'rgba(255, 255, 255, 0.92)',
                       textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                     }}
                   >
                     European Roulette with a single zero and just 2.7% house edge - better odds than traditional casinos. Provably fair and powered by blockchain technology.
                   </Typography>
                   
                   <Typography 
                     variant="body1" 
                     sx={{ 
                       mb: 1,
                       lineHeight: 1.8,
                       fontSize: '1rem',
                       color: 'rgba(255, 255, 255, 0.92)',
                       textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                     }}
                   >
                     Bet on numbers, colors, or combinations for payouts up to 35:1. Every spin is secure and transparent on the blockchain.
                   </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* First row - Strategy Guide and Win Probabilities (most important for players) */}
            <Grid container spacing={4} sx={{ mb: 6, pt: 4 }}>
              <Grid item xs={12} md={7}>
                <div id="strategy" className="scroll-mt-16">
                  <StrategyGuide />
                </div>
              </Grid>
              <Grid item xs={12} md={5}>
                <WinProbabilities />
              </Grid>
            </Grid>
            
            {/* Second row - Roulette Payout (full width for clarity) */}
            <Grid container spacing={4} sx={{ mb: 6, pt: 4 }}>
              <Grid item xs={12}>
                <div id="payouts" className="scroll-mt-16">
                  <RoulettePayout />
                </div>
              </Grid>
            </Grid>
            
            {/* Third row - Roulette History and Leaderboard */}
            <Grid container spacing={4} sx={{ mb: 6, pt: 4 }}>
              <Grid item xs={12} md={7}>
                <div id="history" className="scroll-mt-16">
                  <RouletteHistory />
                </div>
              </Grid>
              <Grid item xs={12} md={5}>
                <RouletteLeaderboard />
              </Grid>
            </Grid>
            
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: '400px',
                left: '-50px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(104, 29, 219, 0.4) 0%, rgba(104, 29, 219, 0) 70%)',
                filter: 'blur(50px)',
                zIndex: -1,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '800px',
                right: '-100px',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(216, 38, 51, 0.3) 0%, rgba(216, 38, 51, 0) 70%)',
                filter: 'blur(70px)',
                zIndex: -1,
              }}
            />
          </Box>
        </Box>

        <Snackbar
          open={showNotification}
          autoHideDuration={notificationIndex === notificationSteps.RESULT_READY ? 5000 : null}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notificationIndex === notificationSteps.RESULT_READY ? (winnings > 0 ? "success" : "error") : "info"}
            sx={{ width: "100%" }}
          >
            {notificationMessages[notificationIndex]}
            {notificationIndex === notificationSteps.RESULT_READY && (
              <Typography>
                {winnings > 0
                  ? `You won ${winnings} APTC!`
                  : "Better luck next time!"}
              </Typography>
            )}
          </Alert>
        </Snackbar>

        {/* Sound control button - add near the top of the UI */}
        <Box sx={{ position: 'fixed', top: 15, right: 15, zIndex: 100 }}>
          <IconButton 
            onClick={toggleSound}
            sx={{ 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
            }}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </IconButton>
        </Box>
      </div>
    </ThemeProvider>
  );
}
