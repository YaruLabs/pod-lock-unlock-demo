# 🌉 Cross-Chain Bridge: Sepolia ↔ COTI

A production-ready bidirectional token bridge between Sepolia testnet and COTI blockchain using Hyperlane for cross-chain messaging.

## 🎯 Project Overview

This bridge enables seamless token transfers between:
- **Sepolia Network** (Ethereum testnet) 
- **COTI Network** (Privacy-preserving blockchain)

### Key Features
- ✅ **Bidirectional transfers** (both directions working)
- ✅ **18-decimal precision** (clean 1:1 ratios)
- ✅ **Privacy-preserving tokens** (COTI MPC integration)
- ✅ **Professional error handling** (no silent failures)
- ✅ **Hyperlane messaging** (reliable cross-chain delivery)
- ✅ **Production-ready** smart contracts

## 🏗️ Architecture

### Smart Contracts
```
Sepolia Side:
├── SepoliaToken.sol     # 18-decimal ERC20 token (sUSDC)
└── SepoliaBridge.sol    # Lock/unlock bridge contract

COTI Side:
├── CotiToken.sol        # 18-decimal privacy token (cpUSDC)
└── CotiBridge.sol       # Burn/mint bridge contract
```

### Cross-Chain Flow
```
Sepolia → COTI:  Lock sUSDC → Hyperlane → Mint cpUSDC
COTI → Sepolia:  Burn cpUSDC → Hyperlane → Unlock sUSDC
```

## 🚀 Current Status

### ✅ **FULLY OPERATIONAL**
- **Both directions tested** and working
- **Real transactions confirmed** on both networks
- **Error handling improved** (no more silent failures)
- **Production-ready** code quality

### Latest Test Results
- **Sepolia Lock**: [0xde446e776286e069923e9248750223d17df90fa6585f888aa1ce3a0a74bd0038](https://sepolia.etherscan.io)
- **COTI Burn**: [0xed11c2e712c2c13723de62d23836ef4f39784373d063d17fb7bfd27b520e2cb1](https://explorer.coti.io)

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd pod-lock-unlock-demo

# Install dependencies
npm install

# Copy environment variables
cp env.example .env
# Edit .env with your private keys and RPC URLs
```

## 🛠️ Deployment

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy-fixed-contracts.ts --network sepolia
```

### Deploy to COTI
```bash
npx hardhat run scripts/deploy-fixed-contracts.ts --network coti
```

## 🧪 Testing

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Check Bridge Status
```bash
npx hardhat run scripts/quick-check-status.ts --network sepolia
```

## 📋 Contract Addresses

### Sepolia Testnet (Latest)
- **Token**: `0xe7c71B5D1cebCa1A08d9E2a4F88eCf0fc60b46Cf`
- **Bridge**: `0xF4188FC4FD2Ab2e3cDb6F6B58329eDA714a589e5`

### COTI Testnet (Working)
- **Token**: `0xa4661A5B5DF03840024e144D123a274969DdeBA2`
- **Bridge**: `0x52221191a3565eda7124c7690500Afa4e066a196`

## 💡 Key Improvements Made

### ✅ **Error Handling Fixes**
- **Before**: Silent failures with `catch { /* ignore */ }`
- **After**: Comprehensive error events with specific reasons
- **Events Added**: `ConfirmationFailed`, `MessageProcessingFailed`

### ✅ **18-Decimal System**
- **No conversion needed** between networks
- **Clean 1:1 ratios** for user experience
- **Simplified mathematics** in smart contracts

### ✅ **Privacy Integration**
- **COTI MPC tokens** for privacy-preserving transfers
- **Bridge compatibility** with privacy features
- **Production-ready** privacy token support

## 🔧 Configuration

### Environment Variables
```bash
# Sepolia
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=your_private_key

# COTI
COTI_URL=https://testnet.coti.io/rpc
COTI_PRIVATE_KEY=your_private_key

# Optional: Etherscan verification
ETHERSCAN_API_KEY=your_api_key
```

### Network Configuration
The `hardhat.config.ts` includes pre-configured networks:
- **Sepolia**: Chain ID 11155111
- **COTI**: Chain ID 7082400

## 📖 Documentation

### Essential Documentation
- **[Test Results](REDEPLOY_AND_TEST_RESULTS.md)**: Complete testing results
- **[Error Handling Fixes](SILENT_FAILURE_FIXES.md)**: Improvements made
- **[Scripts README](scripts/README.md)**: Available scripts

### Frontend Application
The `frontend/` directory contains a Next.js application with:
- Wallet connection (MetaMask support)
- Bridge interface for token transfers
- Real-time transaction monitoring
- Error handling and user feedback

## 🔒 Security Features

- ✅ **Access Control**: Owner-only administrative functions
- ✅ **Input Validation**: Comprehensive parameter checking  
- ✅ **Error Handling**: No silent failures, all errors logged
- ✅ **Event Logging**: Complete audit trail
- ✅ **Reentrancy Protection**: Standard OpenZeppelin patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the documentation files
2. Review test results for examples
3. Open an issue on GitHub

## 🎉 Achievements

- ✅ **Bidirectional bridge** working in both directions
- ✅ **Real cross-chain transfers** demonstrated
- ✅ **Privacy token support** integrated
- ✅ **Professional error handling** implemented
- ✅ **Production-ready** smart contracts
- ✅ **Clean codebase** ready for production deployment

---

**Status: 🟢 PRODUCTION READY** | **Last Updated: 2024** | **Bridge: FULLY OPERATIONAL** 