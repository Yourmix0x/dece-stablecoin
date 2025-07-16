// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "./ERC20.sol";
import {DepositorCoin} from "./DepositorCoin.sol";
import {Oracle} from "./Oracle.sol";

contract StableCoin is ERC20 {
    DepositorCoin public depositorCoin;
    Oracle public oracle;
    uint256 public feeRatePercentage;

    constructor(
        string memory _name,
        string memory _symbol,
        Oracle _oracle,
        uint _feeRatePercentage
    ) ERC20(_name, _symbol, 18) {
        oracle = _oracle;
        feeRatePercentage = _feeRatePercentage;
    }

    function _getFee(uint256 ethAmount) private view returns (uint256) {
        return (ethAmount * feeRatePercentage) / 100;
    }

    function mint() external payable {
        uint256 fee = _getFee(msg.value);
        uint256 mintStableCoinAmount = (msg.value - fee) * oracle.getPrice();
        _mint(msg.sender, mintStableCoinAmount);
    }

    function burn(uint256 burnStableCoinAmount) external {
        _burn(msg.sender, burnStableCoinAmount);

        uint256 refundingEth = burnStableCoinAmount / oracle.getPrice();

        uint256 fee = _getFee(refundingEth);
        (bool success, ) = msg.sender.call{value: refundingEth - fee}("");
        require(success, "SCT: Burn refund transaction failed");
    }

    function depositorCollateralBuffer() external payable {
        uint256 surplusInUsd = _getSurplusInContractInUsd();

        uint256 usdInDpcPrice;

        if (surplusInUsd == 0) {
            usdInDpcPrice = 1;
        } else {
            // usdInDpcPrice = 200 / 500
            usdInDpcPrice = depositorCoin.totalSupply() / surplusInUsd;
        }

        // mintDepositorCoinAmount = 0.5e18 * 1000 * 0.5 = 250e18
        uint256 mintDepositorCoinAmount = msg.value *
            oracle.getPrice() *
            usdInDpcPrice;

        depositorCoin.mint(msg.sender, mintDepositorCoinAmount);
    }

    function withdrawCollateralBuffer(
        uint256 burnDepositorCoinAmount
    ) external {
        uint256 surplusInUsd = _getSurplusInContractInUsd();

        depositorCoin.burn(msg.sender, burnDepositorCoinAmount);

        // usdInDpcPrice = 250 / 500 = 0.5
        uint256 usdInDpcPrice = depositorCoin.totalSupply() / surplusInUsd;

        // 125 /0.5 = 250
        uint256 refundingUsd = burnDepositorCoinAmount / usdInDpcPrice;

        uint256 refundingEth = refundingUsd / oracle.getPrice();

        (bool success, ) = msg.sender.call{value: refundingEth}("");
        require(success, "SCT: Withdraw collateral buffer transaction failed");
    }

    function _getSurplusInContractInUsd() private view returns (uint256) {
        uint256 ethContractBalanceInUsd = (address(this).balance - msg.value) *
            oracle.getPrice();

        uint256 totalStableCoinBalanceInUsd = totalSupply;

        uint256 surplus = ethContractBalanceInUsd - totalStableCoinBalanceInUsd;

        return surplus;
    }
}
