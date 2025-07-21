import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("StableCoin", function () {
  // Fixture to deploy contracts
  async function deployStableCoinFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy Oracle first (assuming you have one)
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy();

    // Set initial ETH price to $1000
    await oracle.setPrice(ethers.parseEther("1000"));

    // Deploy StableCoin
    const StableCoin = await ethers.getContractFactory("StableCoin");
    const stableCoin = await StableCoin.deploy(
      "Test Stable Coin",
      "TSC",
      await oracle.getAddress(),
      5, // 5% fee
      150, // 150% collateral ratio
      86400 // 1 day lock time
    );

    return { stableCoin, oracle, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { stableCoin } = await loadFixture(deployStableCoinFixture);

      expect(await stableCoin.name()).to.equal("Test Stable Coin");
      expect(await stableCoin.symbol()).to.equal("TSC");
    });

    it("Should have zero initial supply", async function () {
      const { stableCoin } = await loadFixture(deployStableCoinFixture);

      expect(await stableCoin.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint stablecoins when user sends ETH", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      const ethAmount = ethers.parseEther("1"); // 1 ETH
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const balance = await stableCoin.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should increase total supply when minting", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      const ethAmount = ethers.parseEther("0.5");
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const totalSupply = await stableCoin.totalSupply();
      expect(totalSupply).to.be.gt(0);
    });
  });

  describe("Burning", function () {
    it("Should burn stablecoins and refund ETH", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      // First mint some stablecoins
      const ethAmount = ethers.parseEther("1");
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const balance = await stableCoin.balanceOf(user1.address);
      expect(balance).to.be.gt(0);

      // Then burn half of them
      const burnAmount = balance / 2n;
      await expect(stableCoin.connect(user1).burn(burnAmount)).to.not.be.reverted;

      const newBalance = await stableCoin.balanceOf(user1.address);
      expect(newBalance).to.be.lt(balance);
    });

    it("Should fail when burning more than balance", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      const burnAmount = ethers.parseEther("100");
      await expect(stableCoin.connect(user1).burn(burnAmount)).to.be.reverted;
    });
  });

  describe("Fees", function () {
    it("Should charge fees on minting", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      const ethAmount = ethers.parseEther("1");
      const contractBalanceBefore = await ethers.provider.getBalance(await stableCoin.getAddress());
      
      await stableCoin.connect(user1).mint({ value: ethAmount });
      
      const contractBalanceAfter = await ethers.provider.getBalance(await stableCoin.getAddress());
      expect(contractBalanceAfter).to.equal(contractBalanceBefore + ethAmount);
    });
  });
});
