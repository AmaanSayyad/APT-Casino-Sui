const { ethers } = require("hardhat");

async function main() {
  const amount = ethers.parseEther("1000"); // Add 1000 tokens
  
  const tokenAddress = "0xf6b4c0dd3355103523F031C8a1EAE944a8145180";
  const rouletteAddress = "0x0BF9D7E4E7ee2d6c1e5B028EF14F1CBbaaC4856e";

  const Token = await ethers.getContractFactory("Token");
  const token = Token.attach(tokenAddress);

  console.log("Transferring tokens to roulette contract...");
  const tx = await token.transfer(rouletteAddress, amount);
  await tx.wait();
  
  const balance = await token.balanceOf(rouletteAddress);
  console.log("New roulette contract balance:", ethers.formatEther(balance), "tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });