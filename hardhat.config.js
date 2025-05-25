require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";
const PHAROS_DEVNET_RPC = "https://devnet.dplabs-internal.com";

const MANTLE_SEPOLIA_EXPLORER_API = process.env.MANTLE_SEPOLIA_EXPLORER_API;
const PHAROS_DEVNET_EXPLORER_API = process.env.PHAROS_DEVNET_EXPLORER_API;

const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    mantleSepolia: {
      url: MANTLE_SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 5003,
    },
    pharosDevnet: {
      url: PHAROS_DEVNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 50002,
    },
  },
  etherscan: {
    apiKey: {
      mantleSepolia: MANTLE_SEPOLIA_EXPLORER_API,
      pharosDevnet: PHAROS_DEVNET_EXPLORER_API,
    },
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "pharosDevnet",
        chainId: 50002,
        urls: {
          apiURL: "https://pharosscan.xyz/api",
          browserURL: "https://pharosscan.xyz",
        },
      },
    ],
  },
}; 