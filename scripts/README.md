# 🛠️ Scripts Directory

Essential deployment and utility scripts for the cross-chain bridge project.

## 📋 Available Scripts

### 🚀 **deploy-fixed-contracts.ts**
**Purpose**: Main deployment script for both networks
- Deploys SepoliaToken and SepoliaBridge to Sepolia
- Deploys CotiToken and CotiBridge to COTI  
- Includes improved error handling (no silent failures)
- Automatically detects network and deploys appropriate contracts

**Usage**:
```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-fixed-contracts.ts --network sepolia

# Deploy to COTI  
npx hardhat run scripts/deploy-fixed-contracts.ts --network coti
```

**Features**:
- ✅ Automatic network detection
- ✅ 18-decimal token deployment
- ✅ Fixed error handling implementation
- ✅ Comprehensive deployment logging
- ✅ Contract verification ready

### 📊 **quick-check-status.ts**
**Purpose**: Check current bridge status and token balances
- Shows locked tokens for a user
- Displays bridge balances
- Calculates unlock statistics
- Monitors bridge health

**Usage**:
```bash
npx hardhat run scripts/quick-check-status.ts --network sepolia
```

**Output**:
- Current locked tokens amount
- User token balance
- Bridge contract balance
- Total unlocked tokens (calculated)
- Bridge operation status

## 🏗️ Script Architecture

### Deployment Flow
```
deploy-fixed-contracts.ts
├── Network Detection (Sepolia/COTI)
├── Contract Deployment
│   ├── Token Contract (18 decimals)
│   └── Bridge Contract (with fixed error handling)
├── Verification
│   ├── Decimal check
│   └── Configuration validation
└── Summary Report
```

### Status Monitoring
```
quick-check-status.ts
├── Contract Connection
├── Balance Queries
│   ├── User balances
│   ├── Locked tokens
│   └── Bridge holdings
├── Calculations
│   └── Unlock statistics
└── Status Report
```

## 🔧 Configuration

### Environment Variables Required
```bash
# For Sepolia deployment
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=your_private_key

# For COTI deployment  
COTI_URL=https://testnet.coti.io/rpc
COTI_PRIVATE_KEY=your_private_key

# Optional: For contract verification
ETHERSCAN_API_KEY=your_api_key
```

### Network Configuration
Pre-configured in `hardhat.config.ts`:
- **Sepolia**: Chain ID 11155111, Hyperlane domain 11155111
- **COTI**: Chain ID 7082400, Hyperlane domain 7082400

## ✅ Features Implemented

### Error Handling Improvements
- **No Silent Failures**: All error paths emit events
- **Specific Error Messages**: Clear reasons for each failure
- **Event-Based Monitoring**: `ConfirmationFailed`, `MessageProcessingFailed`
- **Professional Patterns**: Production-ready error handling

### 18-Decimal System
- **Consistent Precision**: Both networks use 18 decimals
- **No Conversion**: Clean 1:1 token ratios
- **Simplified Math**: No complex decimal conversion logic

### Production Quality
- **Comprehensive Logging**: Detailed deployment information
- **Status Monitoring**: Real-time bridge health checks
- **Error Recovery**: Graceful handling of network issues
- **Documentation**: Clear usage instructions

## 🧪 Testing Commands

### Deployment Testing
```bash
# Test Sepolia deployment
npx hardhat run scripts/deploy-fixed-contracts.ts --network sepolia

# Test COTI deployment (may need retries due to network)
npx hardhat run scripts/deploy-fixed-contracts.ts --network coti
```

### Status Monitoring
```bash
# Check Sepolia bridge status
npx hardhat run scripts/quick-check-status.ts --network sepolia

# Monitor bridge operations
watch -n 30 "npx hardhat run scripts/quick-check-status.ts --network sepolia"
```

## 📊 Expected Output

### Successful Deployment
```
🚀 Deploying Fixed Bridge Contracts
===================================
With improved error handling - no more silent failures!

🔵 Deploying to Sepolia Network
===============================
✅ SepoliaToken deployed: 0x...
✅ SepoliaBridge deployed: 0x...
Token decimals: 18
✅ Fixed error handling implemented

🎉 Deployment Successful!
```

### Status Check Output
```
🔍 Quick Status Check
=====================

💰 Current Status:
Locked tokens: 100.0 sUSDC
User balance: 999,900.0 sUSDC  
Bridge balance: 100.0 sUSDC

📊 Analysis:
Total unlocked: 0.0 sUSDC
✅ Bridge operational
```

## 🎯 Key Benefits

- **Simplified Deployment**: One script handles both networks
- **Real-time Monitoring**: Quick status checks available
- **Error Transparency**: No more hidden failures
- **Production Ready**: Professional code quality
- **Easy Maintenance**: Clean, documented scripts

## 🔮 Future Enhancements

- **Automated Testing**: Script validation before deployment
- **Multi-network Support**: Additional blockchain integrations
- **Advanced Monitoring**: Comprehensive health checks
- **Automated Recovery**: Self-healing bridge operations

---

**Status: ✅ PRODUCTION READY** | **All scripts tested and functional** 