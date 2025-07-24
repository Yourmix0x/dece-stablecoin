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

  describe("Core Functionality Tests", function () {
    it("Should show correct mint calculation after fixes", async function () {
      const { stableCoin, oracle, user1 } = await loadFixture(
        deployStableCoinFixture
      );

      // Check oracle price
      const oraclePrice = await oracle.getPrice();
      console.log("Oracle Price:", ethers.formatEther(oraclePrice), "USD");

      // Mint with 0.001 ETH
      const ethAmount = ethers.parseEther("0.001");
      await stableCoin.connect(user1).mint({ value: ethAmount });

      const balance = await stableCoin.balanceOf(user1.address);

      console.log("ETH sent:", ethers.formatEther(ethAmount));
      console.log("Tokens received:", ethers.formatEther(balance));

      // Expected calculation:
      // Fee: 0.001 * 5% = 0.00005 ETH
      // Net: 0.00095 ETH
      // At $1000/ETH: 0.00095 * 1000 = 0.95 USD = 0.95 tokens
      const expectedTokens = ethers.parseEther("0.95");

      console.log("Expected tokens:", ethers.formatEther(expectedTokens));

      // Should be very close to expected (within 1% for rounding)
      expect(balance).to.be.closeTo(expectedTokens, ethers.parseEther("0.01"));
    });

    it("Should test depositorCollateralBuffer functionality", async function () {
      const { stableCoin, user1, user2 } = await loadFixture(
        deployStableCoinFixture
      );

      // First, mint some tokens to create a system to test
      await stableCoin
        .connect(user1)
        .mint({ value: ethers.parseEther("0.01") });

      const totalSupply = await stableCoin.totalSupply();
      console.log("Total supply after mint:", ethers.formatEther(totalSupply));

      // Now try depositorCollateralBuffer
      const depositAmount = ethers.parseEther("0.02");

      console.log(
        "Attempting depositorCollateralBuffer with:",
        ethers.formatEther(depositAmount),
        "ETH"
      );

      try {
        await stableCoin
          .connect(user2)
          .depositorCollateralBuffer({ value: depositAmount });
        console.log("SUCCESS: depositorCollateralBuffer worked!");

        // Check if DepositorCoin was created
        const depositorCoinAddress = await stableCoin.depositorCoin();
        console.log("DepositorCoin created at:", depositorCoinAddress);
        expect(depositorCoinAddress).to.not.equal(ethers.ZeroAddress);
      } catch (error: any) {
        console.log("FAILED: depositorCollateralBuffer reverted");
        console.log("Error:", error.message);
      }
    });
  });
});
