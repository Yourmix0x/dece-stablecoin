// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Oracle {
    uint256 private price;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }

    function setPrice(uint256 newPrice) external {
        require(msg.sender == owner, "Oracle: Only owner can set this price");
        price = newPrice;
    }
}
