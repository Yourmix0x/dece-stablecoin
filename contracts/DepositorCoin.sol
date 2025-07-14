// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "./ERC20.sol";

contract DepositorCoin is ERC20 {
    address public owner;
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol, 18) {
        owner = msg.sender;
    }

    function mint(address to, uint256 value) external {
        require(msg.sender == owner, "DPC: Only owner can mint");
        _mint(to, value);
    }

    function burn(address from, uint256 value) external {
        require(msg.sender == owner, "DPC: Only owner can burn");
        _burn(from, value);
    }
}
