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

      const ethAmount = ethers.parseEther("0.01"); // Smaller test amount
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const balance = await stableCoin.balanceOf(user1.address);
      const totalSupply = await stableCoin.totalSupply();

      expect(balance).to.be.gt(0);
      expect(totalSupply).to.equal(balance);
    });
  });

  describe("Burning", function () {
    it("Should burn stablecoins and refund ETH", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      // First mint some stablecoins
      const ethAmount = ethers.parseEther("0.01");
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const balance = await stableCoin.balanceOf(user1.address);
      expect(balance).to.be.gt(0);

      // Then burn half of them
      const burnAmount = balance / 2n;
      await expect(stableCoin.connect(user1).burn(burnAmount)).to.not.be
        .reverted;

      const newBalance = await stableCoin.balanceOf(user1.address);
      expect(newBalance).to.be.lt(balance);
    });

    it("Should fail when burning more than balance", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      const burnAmount = ethers.parseEther("100");
      await expect(stableCoin.connect(user1).burn(burnAmount)).to.be.reverted;
    });
  });

  describe("DepositorCollateralBuffer Edge Cases", function () {
    it("Should handle depositorCollateralBuffer when system has small surplus", async function () {
      const { stableCoin, oracle, user1, user2 } = await loadFixture(
        deployStableCoinFixture
      );

      // Step 1: Create the exact scenario you have
      await stableCoin
        .connect(user1)
        .mint({ value: ethers.parseEther("0.01") });

      // Check current state
      const totalSupply = await stableCoin.totalSupply();
      const contractBalance = await ethers.provider.getBalance(
        await stableCoin.getAddress()
      );

      console.log("Total supply:", ethers.formatEther(totalSupply));
      console.log("Contract balance:", ethers.formatEther(contractBalance));

      // Step 2: Try depositorCollateralBuffer (this should reveal your bug)
      await expect(
        stableCoin
          .connect(user2)
          .depositorCollateralBuffer({ value: ethers.parseEther("0.02") })
      ).to.not.be.reverted;

      // Step 3: Verify DepositorCoin was created
      const depositorCoinAddress = await stableCoin.depositorCoin();
      expect(depositorCoinAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should handle the case where DepositorCoin doesn't exist yet", async function () {
      const { stableCoin, user1 } = await loadFixture(deployStableCoinFixture);

      // Mint just enough to create small surplus
      await stableCoin
        .connect(user1)
        .mint({ value: ethers.parseEther("0.01") });

      // DepositorCoin should be zero address initially
      expect(await stableCoin.depositorCoin()).to.equal(ethers.ZeroAddress);

      // This should NOT revert even with surplus + no DepositorCoin
      await expect(
        stableCoin
          .connect(user1)
          .depositorCollateralBuffer({ value: ethers.parseEther("0.02") })
      ).to.not.be.reverted;
    });
  });
});
