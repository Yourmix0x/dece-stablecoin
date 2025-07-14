# ERC20 Token Implementation with Hardhat

This project demonstrates a custom ERC20 token implementation built with Hardhat. It includes a basic ERC20 contract, comprehensive tests, and deployment scripts.

## Features

- ✅ Custom ERC20 token implementation
- ✅ Standard ERC20 functions (transfer, approve, transferFrom)
- ✅ Minting and burning capabilities
- ✅ Comprehensive test suite
- ✅ Mock contract for testing
- ✅ Deployment scripts
- ✅ TypeChain integration for type-safe contract interactions

## Project Structure

```
contracts/
├── ERC20.sol           # Main ERC20 token contract
└── mocks/
    └── ERC20Mock.sol   # Mock contract for testing

test/
└── ERC20.ts           # Comprehensive test suite

scripts/
└── deploy.ts          # Deployment script

ignition/
└── modules/           # Hardhat Ignition modules
```

## Smart Contracts

### ERC20.sol
The main ERC20 token contract implementing:
- `transfer()` - Transfer tokens between addresses
- `approve()` - Approve spender allowance
- `transferFrom()` - Transfer tokens on behalf of another address
- `_mint()` - Internal function to mint new tokens
- `_burn()` - Internal function to burn tokens

### ERC20Mock.sol
A mock contract extending the main ERC20 contract with a public `mint()` function for testing purposes.

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

### Run Tests with Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

## Contract Details

The ERC20 token is deployed with the following parameters:
- **Name**: YOU
- **Symbol**: Yourmix0x
- **Decimals**: 18

## Testing

The test suite covers:
- ✅ Token transfers between accounts
- ✅ Balance updates after transfers
- ✅ Insufficient balance error handling
- ✅ Transfer event emissions
- ✅ Approval and allowance mechanisms

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
- Adding access controls
- Implementing pausable functionality
- Adding reentrancy guards
- Comprehensive security audits
- Using established libraries like OpenZeppelin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.