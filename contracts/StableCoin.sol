// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "./ERC20.sol";
import {DepositorCoin} from "./DepositorCoin.sol";

contract StableCoin is ERC20 {
    DepositorCoin public depositorCoin;
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimal
    ) ERC20(_name, _symbol, _decimal) {}

    function mint() external payable {
        uint256 ethUsdPrice = 1000;
        uint256 mintStableCoinAmount = msg.value * ethUsdPrice;
        _mint(msg.sender, mintStableCoinAmount);
    }

    function burn(uint256 burnStableCoinAmount) external {
        _burn(msg.sender, burnStableCoinAmount);

        uint256 ethUsdPrice = 1000;
        uint256 refundingEth = burnStableCoinAmount / ethUsdPrice;
        (bool success, ) = msg.sender.call{value: refundingEth}("");
        require(success, "SCT: Burn refund transaction failed");
    }
}
