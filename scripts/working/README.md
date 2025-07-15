# COTI Cross-Chain Bridge - Working Scripts

This folder contains the clean, working scripts for COTI cross-chain bridge testing and balance verification.

## 📁 Files

- `cross-chain-test.ts` - Complete cross-chain bridge test (lock tokens on Sepolia)
- `decrypt-balance.ts` - Decrypt and check COTI private token balances

## 🚀 Usage

### From the project root directory:

```bash
# Test cross-chain bridge (lock tokens on Sepolia)
npx hardhat run scripts/working/cross-chain-test.ts --network sepolia

# Check COTI balance (decrypt private tokens)
npx hardhat run scripts/working/decrypt-balance.ts
```

### Or using npm scripts:

```bash
# Test cross-chain bridge
npm run test:cross-chain

# Check balance
npm run check:balance
```

## ✅ What this script does:

1. **Connects** to COTI testnet using coti-ethers
2. **Creates** a wallet and generates AES key for decryption
3. **Calls** the `balanceOf` function on the COTI private token contract
4. **Decrypts** the encrypted balance result
5. **Displays** the readable token amount

## 🔧 Configuration

The script uses these default values:
- **Target Address**: `0x30a6C9D1d70d41756673Cce044189577F0953a75` (deployer address)
- **Token Contract**: `0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59` (COTI Private USDC)
- **Private Key**: Uses `COTI_PRIVATE_KEY` env var or fallback key

## 📊 Expected Output

```
🔓 COTI Balance Decryption - Using Only coti-ethers
===================================================
💰 Target Address: 0x30a6C9D1d70d41756673Cce044189577F0953a75
🎯 Token Contract: 0xC41bb5D7fec4aE9AE4f76C3300248b85EeA8Fe59
🌐 Connecting to COTI testnet...
✅ Connected to COTI testnet
📝 Wallet address: 0x30a6C9D1d70d41756673Cce044189577F0953a75
🔑 Generating AES key for decryption...
✅ AES key generated and ready

📦 Method 1: Using coti-ethers Contract interface...
🔍 Calling balanceOf function...
🔒 Encrypted balance (raw): 31831575808674744937167190240984786620601351034640441278242123551997859894646
🔒 Encrypted balance (hex): 0x4660088fc18f4e70aaa3ff2ad707fb2560e10975983810614d34589807029576
🔓 Attempting to decrypt contract result...
🎉 SUCCESS! Decrypted balance: 151000105
💰 Balance: 151.000105 cpUSDC
```

## 🎯 Success Indicators

- ✅ Connection to COTI testnet established
- ✅ Wallet created and AES key generated
- ✅ Contract call successful (encrypted balance retrieved)
- ✅ Decryption successful (readable balance displayed)
- ✅ Cross-chain bridge confirmed working (tokens present)

## 🔐 Technical Notes

- Uses **only** `@coti-io/coti-ethers` library (no SDK dependencies)
- Properly handles BigInt conversion for decryption
- Supports both contract interface calls and low-level provider calls
- Includes comprehensive error handling and diagnostics
- Automatically converts 6-decimal cpUSDC to human-readable format

## 🚨 Troubleshooting

If decryption fails:
1. Ensure the wallet address matches the token recipient
2. Verify AES key generation completed successfully
3. Check that the contract address is correct
4. Confirm COTI testnet connectivity

The script includes fallback methods and detailed error analysis to help diagnose issues. 