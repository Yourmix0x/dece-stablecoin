import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  // Deploy Oracle first (you'll need this contract)
  console.log("\n1. Deploying Oracle...");
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  console.log("Oracle deployed to:", await oracle.getAddress());

  // Set initial ETH price to $1000 (you can adjust this)
  console.log("Setting initial ETH price to $1000...");
  await oracle.setPrice(ethers.parseEther("1000"));
  console.log("Oracle price set successfully");

  // Deploy StableCoin
  console.log("\n2. Deploying StableCoin...");
  const StableCoin = await ethers.getContractFactory("StableCoin");
  const stableCoin = await StableCoin.deploy(
    "DECE StableCoin", // name
    "DECE", // symbol
    await oracle.getAddress(), // oracle address
    5, // 5% fee rate
    150, // 150% initial collateral ratio
    86400 // 24 hours lock time (in seconds)
  );
  await stableCoin.waitForDeployment();
  console.log("StableCoin deployed to:", await stableCoin.getAddress());

  // Verify deployment
  console.log("\n3. Verifying deployment...");
  console.log("StableCoin name:", await stableCoin.name());
  console.log("StableCoin symbol:", await stableCoin.symbol());
  console.log("Fee rate:", await stableCoin.feeRatePercentage(), "%");
  console.log(
    "Initial collateral ratio:",
    await stableCoin.initialCollateralRatioPercentage(),
    "%"
  );
  console.log("Oracle address:", await stableCoin.oracle());
  console.log(
    "Current ETH price from oracle:",
    ethers.formatEther(await oracle.getPrice()),
    "USD"
  );

  // Display contract addresses for future reference
  console.log("\n🎉 Deployment Summary:");
  console.log("=====================");
  console.log("Oracle:", await oracle.getAddress());
  console.log("StableCoin:", await stableCoin.getAddress());
  console.log("\n📝 Save these addresses for interaction!");

  console.log("\n💡 Quick test commands:");
  console.log("npx hardhat console --network sepolia");
  console.log(
    `const stableCoin = await ethers.getContractAt("StableCoin", "${await stableCoin.getAddress()}");`
  );
  console.log('await stableCoin.mint({ value: ethers.parseEther("0.01") });');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
