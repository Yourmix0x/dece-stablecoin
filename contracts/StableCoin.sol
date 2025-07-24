// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "./ERC20.sol";
import {DepositorCoin} from "./DepositorCoin.sol";
import {Oracle} from "./Oracle.sol";
import {FixedPoint, fromFraction, mulFixed, divFixed} from "./FixedPoint.sol";

contract StableCoin is ERC20 {
    DepositorCoin public depositorCoin;
    Oracle public oracle;
    uint256 public feeRatePercentage;
    uint256 public initialCollateralRatioPercentage;
    uint256 public depositorCoinLockTime;

    uint256 private constant PRECISION = 1e18;

    error InitialCollateralRatioError(
        string message,
        uint256 minimumDepositAmount
    );

    constructor(
        string memory _name,
        string memory _symbol,
        Oracle _oracle,
        uint _feeRatePercentage,
        uint256 _initialCollateralRatioPercentage,
        uint256 _depositorCoinLockTime
    ) ERC20(_name, _symbol, 18) {
        oracle = _oracle;
        feeRatePercentage = _feeRatePercentage;
        initialCollateralRatioPercentage = _initialCollateralRatioPercentage;
        depositorCoinLockTime = _depositorCoinLockTime;
    }

    function _getFee(uint256 ethAmount) private view returns (uint256) {
        return (ethAmount * feeRatePercentage) / 100;
    }

    function mint() external payable {
        uint256 fee = _getFee(msg.value);
        uint256 mintStableCoinAmount = ((msg.value - fee) * oracle.getPrice()) /
            PRECISION;
        _mint(msg.sender, mintStableCoinAmount);
    }

    function burn(uint256 burnStableCoinAmount) external {
        _burn(msg.sender, burnStableCoinAmount);

        uint256 refundingEth = (burnStableCoinAmount * PRECISION) /
            oracle.getPrice();

        uint256 fee = _getFee(refundingEth);
        (bool success, ) = msg.sender.call{value: refundingEth - fee}("");
        require(success, "SCT: Burn refund transaction failed");
    }

    function depositorCollateralBuffer() external payable {
        int256 deficitOrSurplusInUsd = _getDeficitOrSurplusInContractInUsd();

        // FIX: Check if DepositorCoin exists OR if there's a deficit
        if (
            address(depositorCoin) == address(0) || deficitOrSurplusInUsd <= 0
        ) {
            // Handle first-time deposit or deficit scenario
            uint256 deficitInUsd = deficitOrSurplusInUsd <= 0
                ? uint256(deficitOrSurplusInUsd * -1)
                : 0;
            uint256 deficitInEth = (deficitInUsd * PRECISION) /
                oracle.getPrice();

            uint256 addedSurplusEth = msg.value - deficitInEth;

            uint256 requiredInitialSurplusInUsd = (initialCollateralRatioPercentage *
                    (totalSupply / PRECISION)) / 100;
            uint256 requiredInitialSurplusInEth = (requiredInitialSurplusInUsd *
                PRECISION) / oracle.getPrice();

            require(
                addedSurplusEth >= requiredInitialSurplusInEth,
                "STC: Initial collateral ratio not met"
            );

            uint256 initialDepositorSupply = (addedSurplusEth *
                oracle.getPrice()) / PRECISION;

            depositorCoin = new DepositorCoin(
                "Depositor Coin",
                "DPC",
                depositorCoinLockTime,
                msg.sender,
                initialDepositorSupply
            );
            return;
        }

        // Handle existing DepositorCoin + surplus scenario
        uint256 surplusInUsd = uint256(deficitOrSurplusInUsd);

        FixedPoint usdInDpcPrice = fromFraction(
            depositorCoin.totalSupply(),
            surplusInUsd
        );

        uint256 mintDepositorCoinAmount = mulFixed(
            (msg.value * oracle.getPrice()) / PRECISION,
            usdInDpcPrice
        );

        depositorCoin.mint(msg.sender, mintDepositorCoinAmount);
    }

    function withdrawCollateralBuffer(
        uint256 burnDepositorCoinAmount
    ) external {
        int256 deficitOrSurplusInUsd = _getDeficitOrSurplusInContractInUsd();

        require(
            deficitOrSurplusInUsd > 0,
            "STC: No depositor funds to withdraw"
        );

        uint256 surplusInUsd = uint256(deficitOrSurplusInUsd);

        depositorCoin.burn(msg.sender, burnDepositorCoinAmount);

        // usdInDpcPrice = 250 / 500 = 0.5e18
        FixedPoint usdInDpcPrice = fromFraction(
            depositorCoin.totalSupply(),
            surplusInUsd
        );

        // 125 /0.5 = 250
        uint256 refundingUsd = divFixed(burnDepositorCoinAmount, usdInDpcPrice);

        uint256 refundingEth = (refundingUsd * PRECISION) / oracle.getPrice();

        (bool success, ) = msg.sender.call{value: refundingEth}("");
        require(success, "SCT: Withdraw collateral buffer transaction failed");
    }

    function _getDeficitOrSurplusInContractInUsd()
        private
        view
        returns (int256)
    {
        uint256 ethContractBalanceInUsd = ((address(this).balance - msg.value) *
            oracle.getPrice()) / PRECISION;

        // Convert wei to tokens
        uint256 totalStableCoinBalanceInUsd = totalSupply / PRECISION;

        int256 deficitOrSurplus = int256(ethContractBalanceInUsd) -
            int256(totalStableCoinBalanceInUsd);

        return deficitOrSurplus;
    }
}
