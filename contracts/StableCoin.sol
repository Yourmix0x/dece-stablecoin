// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "./ERC20.sol";
import {DepositorCoin} from "./DepositorCoin.sol";

contract StableCoin is ERC20 {
    DepositorCoin public depositorCoin;
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol, 18) {}

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

    function depositorCollateralBuffer() external payable {
        uint256 surplusInUsd = _getSurplusInContractInUsd();
        uint256 ethUsdPrice = 1000;

        // usdInDpcPrice = 200 / 500
        uint256 usdInDpcPrice = depositorCoin.totalSupply() / surplusInUsd;

        // mintDepositorCoinAmount = 0.5e18 * 1000 * 0.5 = 250e18
        uint256 mintDepositorCoinAmount = msg.value *
            ethUsdPrice *
            usdInDpcPrice;

        depositorCoin.mint(msg.sender, mintDepositorCoinAmount);
    }

    function withdrawCollateralBuffer(
        uint256 burnDepositorCoinAmount
    ) external {
        uint256 surplusInUsd = _getSurplusInContractInUsd();

        uint256 ethUsdPrice = 1000;

        depositorCoin.burn(msg.sender, burnDepositorCoinAmount);

        // usdInDpcPrice = 250 / 500 = 0.5
        uint256 usdInDpcPrice = depositorCoin.totalSupply() / surplusInUsd;

        // 125 /0.5 = 250
        uint256 refundingUsd = burnDepositorCoinAmount / usdInDpcPrice;

        uint256 refundingEth = refundingUsd / ethUsdPrice;

        (bool success, ) = msg.sender.call{value: refundingEth}("");
        require(success, "SCT: Withdraw collateral buffer transaction failed");
    }

    function _getSurplusInContractInUsd() private view returns (uint256) {
        uint256 ethUsdPrice = 1000;

        uint256 ethContractBalanceInUsd = (address(this).balance - msg.value) *
            ethUsdPrice;

        uint256 totalStableCoinBalanceInUsd = totalSupply;

        uint256 surplus = ethContractBalanceInUsd - totalStableCoinBalanceInUsd;

        return surplus;
    }
}
