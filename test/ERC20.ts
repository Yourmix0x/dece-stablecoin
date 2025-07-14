import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("ERC20", function () {
  async function deployAndMockERC20() {
    const [alice, bob] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    const erc20Token = await ERC20.deploy("Yourmix", "YOM", 18);

    await erc20Token.mint(alice.address, 300);

    return { erc20Token, alice, bob };
  }

  it("transfer tokens correctly", async function () {
    const { erc20Token, alice, bob } = await loadFixture(deployAndMockERC20);

    // logging balances before transfer
    console.log(
      "Alice balance here is",
      (await erc20Token.balanceOf(alice.address)).toString()
    );

    expect(await erc20Token.transfer(bob.address, 100)).to.changeTokenBalance(
      erc20Token,
      [alice, bob],
      [-100, 100]
    );

    expect(
      await erc20Token.connect(bob).transfer(alice.address, 50)
    ).to.changeTokenBalance(erc20Token, [alice, bob], [50, -50]);
  });

  it("should revert if sender has insufficient balance", async function () {
    const { erc20Token, bob } = await loadFixture(deployAndMockERC20);

    await expect(erc20Token.transfer(bob.address, 400)).to.be.revertedWith(
      "ERC20: Insufficient sender balance"
    );
  });

  it("should emit Transfer event on transfers", async function () {
    const { erc20Token, bob } = await loadFixture(deployAndMockERC20);

    await expect(erc20Token.transfer(bob.address, 200)).to.emit(
      erc20Token,
      "Transfer"
    );
  });
});
