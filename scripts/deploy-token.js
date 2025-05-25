const hre = require("hardhat");

async function main() {
  console.log("Deploying Token contract...");

  // Deploy Token contract
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);

  // Verify the contract on Mantle Sepolia Explorer
  console.log("Waiting for block confirmations...");
  await token.deploymentTransaction().wait(6); // wait for 6 block confirmations

  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (e) {
    console.log("Verification failed:", e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 