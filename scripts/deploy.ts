import { ethers } from "hardhat";

async function main() {
  const ERC20 = await ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy("YOU", "Yourmix0x", 18);
  await erc20.waitForDeployment();

  console.log("ERC20 deployed to:", await erc20.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
