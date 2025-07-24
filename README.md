# Decentralized StableCoin (DECE) with Hardhat

This project implements a decentralized stablecoin system with collateral management and depositor rewards. It features an algorithmic stablecoin backed by ETH collateral with dynamic pricing through an oracle system.

## Features

- ✅ ETH-backed stablecoin with oracle price feeds
- ✅ Dynamic fee system for minting and burning
- ✅ Collateral buffer mechanism with DepositorCoin rewards
- ✅ Fixed-point arithmetic for precise calculations
- ✅ Deficit/surplus management system
- ✅ Comprehensive test suite
- ✅ TypeChain integration for type-safe contract interactions

## Project Structure

```
contracts/
├── StableCoin.sol       # Main stablecoin contract with minting/burning
├── DepositorCoin.sol    # Reward token for collateral providers
├── ERC20.sol           # Base ERC20 implementation
├── FixedPoint.sol      # Fixed-point arithmetic library
└── mocks/
    └── ERC20Mock.sol   # Mock contract for testing

test/
└── StableCoin.ts       # Comprehensive test suite for stablecoin

scripts/
└── deploy.ts          # Deployment script

ignition/
└── modules/           # Hardhat Ignition modules
```

## Smart Contracts

### StableCoin.sol
The main stablecoin contract implementing:
- `mint()` - Mint stablecoins by sending ETH (with oracle pricing)
- `burn()` - Burn stablecoins to redeem ETH (with fees)
- `depositorCollateralBuffer()` - Provide collateral and earn DepositorCoins
- `withdrawCollateralBuffer()` - Withdraw collateral by burning DepositorCoins
- Deficit/surplus calculation and management
- Oracle integration for dynamic ETH/USD pricing

### DepositorCoin.sol
A reward token for users who provide collateral to the system:
- Extends ERC20 with ownership controls
- Given to users who help stabilize the system
- Can be burned to withdraw collateral

### ERC20.sol
Base ERC20 implementation with:
- Standard transfer, approve, transferFrom functions
- Internal minting and burning capabilities
- Custom decimal support

### FixedPoint.sol
Library for precise decimal arithmetic:
- Custom FixedPoint type with 18 decimal precision
- Mathematical operations (add, sub, mul, div)
- Fraction conversion utilities
- Mixed operations with regular integers

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
- `SEPOLIA_RPC_URL` - Your Sepolia testnet RPC URL
- `PRIVATE_KEY` - Your wallet private key
- `ETHERSCAN_API_KEY` - Your Etherscan API key for verification

## How It Works

### StableCoin Mechanism
1. **Minting**: Users send ETH to mint stablecoins at current oracle price (minus fees)
2. **Burning**: Users burn stablecoins to redeem ETH at current oracle price (minus fees)
3. **Collateral Buffer**: When the system has a deficit, users can provide extra collateral and earn DepositorCoins
4. **Price Stability**: Oracle provides real-time ETH/USD pricing for accurate conversions

### Fee System
- Configurable fee percentage on all minting and burning operations
- Fees help maintain system stability and provide revenue

### Collateral Management
- System tracks deficit/surplus based on ETH holdings vs stablecoin supply
- DepositorCoin rewards incentivize users to provide additional collateral
- Minimum collateral ratio requirements ensure system stability

## Usage

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network
```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Interact with StableCoin
```bash
# Mint stablecoins (send ETH)
npx hardhat console --network localhost
> const StableCoin = await ethers.getContractFactory("StableCoin");
> const stableCoin = StableCoin.attach("DEPLOYED_ADDRESS");
> await stableCoin.mint({ value: ethers.parseEther("1.0") });

# Check balance
> await stableCoin.balanceOf("YOUR_ADDRESS");
```

### Run Tests with Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

## Contract Details

The StableCoin system is deployed with the following parameters:
- **Name**: Test Stable Coin
- **Symbol**: TSC
- **Decimals**: 18
- **Fee Rate**: 5% (configurable)
- **Initial Collateral Ratio**: 150% (configurable)
- **Depositor Coin Lock Time**: 24 hours (configurable)

## Testing

The test suite covers:
- ✅ StableCoin minting with ETH deposits
- ✅ StableCoin burning with ETH redemption
- ✅ Fee calculations and deductions
- ✅ Oracle price integration
- ✅ Collateral buffer mechanism
- ✅ DepositorCoin creation and management
- ✅ Error handling and edge cases
- ✅ Fixed-point arithmetic precision

Run the tests with:
```bash
npx hardhat test
```

## Networks

This project is configured for:
- **Local Hardhat Network** (for development)
- **Sepolia Testnet** (for testing)

## Security Considerations

⚠️ **Important**: This is a learning/demonstration project. For production use, consider:
- Professional smart contract audits
- Implementing emergency pause mechanisms
- Adding reentrancy guards
- Robust oracle manipulation protection
- Governance mechanisms for parameter updates
- Insurance mechanisms for extreme market events
- Comprehensive testing under various market conditions

## Key Concepts Demonstrated

- **Algorithmic Stablecoins**: Price stability through collateral backing
- **Oracle Integration**: Real-time price feeds for accurate conversions
- **Fixed-Point Arithmetic**: Precise decimal calculations in Solidity
- **Collateral Management**: Dynamic surplus/deficit handling
- **Incentive Mechanisms**: DepositorCoin rewards for system participation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.