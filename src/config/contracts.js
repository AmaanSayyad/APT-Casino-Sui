// Chain IDs
export const CHAIN_IDS = {
    MANTLE_SEPOLIA: 5003,
    PHAROS_DEVNET: 50002,
    // Add more chains here as needed
    // ARBITRUM: 42161,
    // OPTIMISM: 10,
    // BSC: 56,
    // etc...
};

// RPC URLs
export const RPC_URLS = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: "https://rpc.sepolia.mantle.xyz",
    [CHAIN_IDS.PHAROS_DEVNET]: "https://devnet.dplabs-internal.com",
    // Add more RPCs here as needed
};

// Block Explorers
export const BLOCK_EXPLORERS = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: "https://sepolia.mantlescan.xyz",
    [CHAIN_IDS.PHAROS_DEVNET]: "https://pharosscan.xyz",
    // Add more explorers here as needed
};

// Token Contracts
export const TOKEN_CONTRACTS = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: {
        address: "0xf6b4c0dd3355103523F031C8a1EAE944a8145180",
        name: "APT-Casino",
        symbol: "APTC",
        decimals: 18
    },
    [CHAIN_IDS.PHAROS_DEVNET]: {
        address: "0xf6b4c0dd3355103523F031C8a1EAE944a8145180",
        name: "APT-Casino",
        symbol: "APTC",
        decimals: 18
    },
    // Add more chain configurations here as needed
};

// Roulette Contracts
export const ROULETTE_CONTRACTS = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: {
        address: "0x0BF9D7E4E7ee2d6c1e5B028EF14F1CBbaaC4856e",
        treasuryAddress: "0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6"
    },
    [CHAIN_IDS.PHAROS_DEVNET]: {
        address: "0x0BF9D7E4E7ee2d6c1e5B028EF14F1CBbaaC4856e",
        treasuryAddress: "0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6"
    },
    // Add more chain configurations here as needed
};

// ABIs will be stored here after your Remix deployment
export const ABIS = {
    TOKEN: null, // Will be filled with your Remix deployment ABI
    ROULETTE: null // Will be filled with your Remix deployment ABI
};

// Chain Names for UI
export const CHAIN_NAMES = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: "Mantle Sepolia",
    [CHAIN_IDS.PHAROS_DEVNET]: "Pharos Devnet",
    // Add more chain names here as needed
};

// Chain Native Currencies
export const NATIVE_CURRENCIES = {
    [CHAIN_IDS.MANTLE_SEPOLIA]: {
        name: "MNT",
        symbol: "MNT",
        decimals: 18
    },
    [CHAIN_IDS.PHAROS_DEVNET]: {
        name: "PHR",
        symbol: "PHR",
        decimals: 18
    },
    // Add more native currencies here as needed
};

// Supported Networks Configuration
export const SUPPORTED_NETWORKS = [
    {
        id: CHAIN_IDS.MANTLE_SEPOLIA,
        name: CHAIN_NAMES[CHAIN_IDS.MANTLE_SEPOLIA],
        rpcUrl: RPC_URLS[CHAIN_IDS.MANTLE_SEPOLIA],
        explorer: BLOCK_EXPLORERS[CHAIN_IDS.MANTLE_SEPOLIA],
        nativeCurrency: NATIVE_CURRENCIES[CHAIN_IDS.MANTLE_SEPOLIA],
        tokenContract: TOKEN_CONTRACTS[CHAIN_IDS.MANTLE_SEPOLIA],
        rouletteContract: ROULETTE_CONTRACTS[CHAIN_IDS.MANTLE_SEPOLIA]
    },
    {
        id: CHAIN_IDS.PHAROS_DEVNET,
        name: CHAIN_NAMES[CHAIN_IDS.PHAROS_DEVNET],
        rpcUrl: RPC_URLS[CHAIN_IDS.PHAROS_DEVNET],
        explorer: BLOCK_EXPLORERS[CHAIN_IDS.PHAROS_DEVNET],
        nativeCurrency: NATIVE_CURRENCIES[CHAIN_IDS.PHAROS_DEVNET],
        tokenContract: TOKEN_CONTRACTS[CHAIN_IDS.PHAROS_DEVNET],
        rouletteContract: ROULETTE_CONTRACTS[CHAIN_IDS.PHAROS_DEVNET]
    }
    // More networks will be added here as you deploy to them
];

export const NETWORKS = {
    MANTLE_SEPOLIA: {
        id: CHAIN_IDS.MANTLE_SEPOLIA,
        name: CHAIN_NAMES[CHAIN_IDS.MANTLE_SEPOLIA],
        rpcUrl: RPC_URLS[CHAIN_IDS.MANTLE_SEPOLIA],
        explorer: BLOCK_EXPLORERS[CHAIN_IDS.MANTLE_SEPOLIA],
        nativeCurrency: NATIVE_CURRENCIES[CHAIN_IDS.MANTLE_SEPOLIA],
        tokenContract: TOKEN_CONTRACTS[CHAIN_IDS.MANTLE_SEPOLIA],
        rouletteContract: ROULETTE_CONTRACTS[CHAIN_IDS.MANTLE_SEPOLIA]
    },
    PHAROS_DEVNET: {
        id: CHAIN_IDS.PHAROS_DEVNET,
        name: CHAIN_NAMES[CHAIN_IDS.PHAROS_DEVNET],
        rpcUrl: RPC_URLS[CHAIN_IDS.PHAROS_DEVNET],
        explorer: BLOCK_EXPLORERS[CHAIN_IDS.PHAROS_DEVNET],
        nativeCurrency: NATIVE_CURRENCIES[CHAIN_IDS.PHAROS_DEVNET],
        tokenContract: TOKEN_CONTRACTS[CHAIN_IDS.PHAROS_DEVNET],
        rouletteContract: ROULETTE_CONTRACTS[CHAIN_IDS.PHAROS_DEVNET]
    }
};

export const CONTRACTS = {
  PHAROS_DEVNET: {
    chainId: CHAIN_IDS.PHAROS_DEVNET,
    chainName: 'Pharos Devnet',
    token: {
      address: '0xf6b4c0dd3355103523F031C8a1EAE944a8145180',
      abi: [
        // Token ABI
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "allowance",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "needed",
              "type": "uint256"
            }
          ],
          "name": "ERC20InsufficientAllowance",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "sender",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "balance",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "needed",
              "type": "uint256"
            }
          ],
          "name": "ERC20InsufficientBalance",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "approver",
              "type": "address"
            }
          ],
          "name": "ERC20InvalidApprover",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "receiver",
              "type": "address"
            }
          ],
          "name": "ERC20InvalidReceiver",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "sender",
              "type": "address"
            }
          ],
          "name": "ERC20InvalidSender",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            }
          ],
          "name": "ERC20InvalidSpender",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            }
          ],
          "name": "OwnableInvalidOwner",
          "type": "error"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "OwnableUnauthorizedAccount",
          "type": "error"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "OwnershipTransferred",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "Paused",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            }
          ],
          "name": "allowance",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "decimals",
          "outputs": [
            {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "transferFrom",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
    },
    roulette: {
      address: '0x0BF9D7E4E7ee2d6c1e5B028EF14F1CBbaaC4856e',
      abi: [
        // Roulette ABI
        {
          "inputs": [
            {
              "internalType": "contract IERC20",
              "name": "_token",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "enum Roulette.BetType",
              "name": "betType",
              "type": "uint8"
            },
            {
              "indexed": false,
              "internalType": "uint8",
              "name": "betValue",
              "type": "uint8"
            }
          ],
          "name": "BetPlaced",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "won",
              "type": "bool"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "winnings",
              "type": "uint256"
            }
          ],
          "name": "BetResult",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "randomNumber",
              "type": "uint256"
            }
          ],
          "name": "RandomGenerated",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "MIN_WAIT_BLOCK",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "TREASURY",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "TREASURY_FEE_RATE",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "enum Roulette.BetType",
              "name": "betType",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "betValue",
              "type": "uint8"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256[]",
              "name": "numbers",
              "type": "uint256[]"
            }
          ],
          "name": "placeBet",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "randomResult",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
    }
  }
}; 