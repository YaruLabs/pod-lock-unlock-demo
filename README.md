# Cross-Chain Token Bridge Demo

A minimalistic Web3 demo showcasing cross-chain token bridging between **Sepolia testnet** and **COTI testnet** using Hyperlane for interchain communication.

## 🚀 Overview

This project demonstrates a complete cross-chain token bridging solution with **separate token and bridge contracts** for each network:

- **Sepolia**: SepoliaToken (USDC) + SepoliaBridge (locking mechanism)
- **COTI**: CotiToken (pUSDC) + CotiBridge (minting/unlocking mechanism)  
- **Hyperlane**: Handles cross-chain message passing between networks
- **Frontend**: Next.js interface for interacting with both bridges

## 🏗️ Architecture

```
Sepolia Testnet                    COTI Testnet
┌─────────────────┐               ┌─────────────────┐
│  SepoliaToken   │               │   CotiToken     │
│   (USDC)        │               │   (pUSDC)       │
└─────────────────┘               └─────────────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│ SepoliaBridge   │◄──────────────►│  CotiBridge     │
│   (Lock)        │   Hyperlane   │  (Mint/Unlock)  │
│                 │   Messages    │                 │
└─────────────────┘               └─────────────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│   Frontend      │               │   Frontend      │
│   Interface     │               │   Interface     │
└─────────────────┘               └─────────────────┘
```

## 🔧 Smart Contracts

### Sepolia Network

#### SepoliaToken.sol
- **Purpose**: Standard ERC20 USDC token for Sepolia testnet
- **Key Functions**:
  - `mint()`: Admin function to mint tokens
  - `burn()`: User function to burn tokens
  - `burnFrom()`: Admin function to burn from specific address
- **Features**:
  - ERC20 standard implementation
  - 6 decimals (like real USDC)
  - Initial supply of 1M tokens

#### SepoliaBridge.sol
- **Purpose**: Bridge contract that handles cross-chain locking
- **Key Functions**:
  - `lock()`: Locks USDC and sends message to COTI
  - `handle()`: Receives unlock messages from COTI
  - `emergencyWithdraw()`: Admin function for emergencies
- **Features**:
  - Token approval mechanism
  - Replay attack protection
  - Fee estimation and collection

### COTI Network

#### CotiToken.sol
- **Purpose**: Privacy-preserving USDC token using COTI's MPC
- **Key Functions**:
  - `privateMint()`: Mint private tokens (encrypted/GT)
  - `privateBurn()`: Burn private tokens
  - `privateTransfer()`: Transfer private tokens
  - `setEncryptionAddress()`: Set user encryption address
- **Features**:
  - COTI MPC library integration
  - Private token operations
  - Encrypted balance tracking

#### CotiBridge.sol
- **Purpose**: Bridge contract that handles cross-chain minting/unlocking
- **Key Functions**:
  - `handle()`: Receives lock messages from Sepolia
  - `unlock()`: Burns pUSDC and sends message to Sepolia
  - `getMintedTokens()`: Track minted tokens per user
- **Features**:
  - Private token minting on lock
  - Private token burning on unlock
  - Cross-chain message handling

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **OpenZeppelin**: ^5.0.0 (ERC20, Ownable)
- **COTI Contracts**: ^1.0.9 (MPC, PrivateERC20)
- **Hardhat**: Development and testing framework

### Frontend
- **Next.js**: 14+ with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Ethers.js**: ^6.8.0 (Web3 interactions)
- **COTI Ethers**: ^1.0.5 (COTI blockchain integration)

### Cross-Chain Infrastructure
- **Hyperlane**: Interchain messaging protocol
- **Mailbox Contracts**:
  - Sepolia: `0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766`
  - COTI: `0x7FE7EA170cf08A25C2ff315814D96D93C311E692`

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH
- COTI testnet tokens
- Private key for contract deployment

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd pod-lock-unlock-demo
npm install
cd frontend && npm install
cd ..
```

### 2. Environment Setup

```bash
cp env.example .env
```

Edit `.env` with your configuration:
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=ce785e1d3f790d1e8d67ea8e811741dbcb6f9d02c9dd0a232539b51d386beb03

# Public key
PUBLIC_KEY=0x30a6C9D1d70d41756673Cce044189577F0953a75

# User keys
USER_KEYS=783e264738a445372c60333b0f19f282

# Sepolia Network
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/gxqgjNcTuhm4EoK_zMSn9hMtwpVLpAEZ
ETHERSCAN_API_KEY=your_etherscan_api_key

# COTI Network
COTI_RPC_URL=https://testnet-rpc.coti.io

# Hyperlane Mailbox Addresses (already configured)
SEPOLIA_MAILBOX=0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766
COTI_MAILBOX=0x7FE7EA170cf08A25C2ff315814D96D93C311E692

# Network Domain IDs
SEPOLIA_DOMAIN=11155111
COTI_DOMAIN=7082400
```

### 3. Deploy Contracts

```bash
# Deploy to Sepolia (Token + Bridge)
npm run deploy:sepolia

# Deploy to COTI (Token + Bridge)
npm run deploy:coti

# Update bridge addresses (after both deployments)
npx hardhat run scripts/update-bridge-addresses.ts --network sepolia
```

### 4. Update Frontend Configuration

Create `.env.local` in the frontend directory:
```bash
NEXT_PUBLIC_SEPOLIA_TOKEN_ADDRESS=your_deployed_sepolia_token_address
NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS=your_deployed_sepolia_bridge_address
NEXT_PUBLIC_COTI_TOKEN_ADDRESS=your_deployed_coti_token_address
NEXT_PUBLIC_COTI_BRIDGE_ADDRESS=your_deployed_coti_bridge_address
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to use the bridge interface.

## 🔄 Bridge Flow

### Sepolia → COTI (Lock → Mint)
1. User approves SepoliaBridge to spend SepoliaToken
2. User calls `lock(amount)` on SepoliaBridge
3. Bridge transfers tokens from user and sends message to COTI
4. CotiBridge receives message and calls `privateMint()` on CotiToken
5. User now has private pUSDC tokens on COTI

### COTI → Sepolia (Unlock → Mint)
1. User calls `unlock(amount)` on CotiBridge
2. Bridge calls `privateBurn()` on CotiToken and sends message to Sepolia
3. SepoliaBridge receives message and transfers tokens back to user
4. User now has USDC tokens back on Sepolia

## 🧪 Testing

### Run Contract Tests
```bash
npm test
```

### Test on Local Network
```bash
npx hardhat node
npx hardhat test --network localhost
```

## 📁 Project Structure

```
pod-lock-unlock-demo/
├── contracts/                 # Smart contracts
│   ├── SepoliaToken.sol      # Sepolia USDC token
│   ├── SepoliaBridge.sol     # Sepolia bridge contract
│   ├── CotiToken.sol         # COTI private USDC token
│   └── CotiBridge.sol        # COTI bridge contract
├── scripts/                   # Deployment scripts
│   ├── deploy-sepolia.ts     # Sepolia deployment
│   ├── deploy-coti.ts        # COTI deployment
│   └── update-bridge-addresses.ts
├── test/                      # Contract tests
│   └── MockUSDC.test.ts      # Test cases
├── frontend/                  # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   │   ├── ConnectWallet.tsx
│   │   ├── SepoliaBridge.tsx
│   │   └── CotiBridge.tsx
│   └── package.json
├── deployments/              # Deployment artifacts
├── hardhat.config.ts         # Hardhat configuration
├── package.json              # Root dependencies
└── README.md
```

## 🔐 Security Considerations

### Smart Contracts
- ✅ Replay attack protection via message ID tracking
- ✅ Access control for admin functions
- ✅ Input validation and error handling
- ✅ OpenZeppelin standard implementations
- ✅ Token approval mechanism for Sepolia
- ⚠️ Demo implementation - not production ready

### Frontend
- ✅ Input validation
- ✅ Error handling for wallet connections
- ✅ Loading states for transactions
- ✅ Token approval flow
- ⚠️ Demo implementation - placeholder encrypted values

## 🚨 Limitations

This is a **demo implementation** with the following limitations:

1. **COTI Integration**: Uses placeholder encrypted values instead of real COTI MPC operations
2. **Security**: Minimal security checks for demo purposes
3. **Error Handling**: Basic error handling for demonstration
4. **Production Readiness**: Not suitable for production use without significant enhancements

## 🔮 Future Enhancements

- [ ] Full COTI MPC integration with real encrypted values
- [ ] User key management and encryption
- [ ] Advanced security features (multi-sig, timelocks)
- [ ] Gas optimization and batch operations
- [ ] Event monitoring and notifications
- [ ] Mobile wallet support
- [ ] Analytics and monitoring dashboard

## 📚 Resources

- [Hyperlane Documentation](https://docs.hyperlane.xyz/)
- [COTI Documentation](https://docs.coti.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This project is for educational and demonstration purposes only. It is not intended for production use without significant security enhancements and audits. 