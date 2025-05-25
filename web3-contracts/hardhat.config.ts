import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    mantleSepoliaTestnet: {
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: [process.env.PRIVATE_KEY || ""], // Add your private key in .env file
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
};

export default config;