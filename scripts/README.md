# Scripts Directory

This directory contains the essential scripts for the COTI-Sepolia bridge demo.

## 🎯 Main Demo Scripts

### `demo-burn-unlock.ts`
**Main demo script** - Demonstrates the complete burn and unlock flow
- Burns cpUSDC on COTI
- Shows cross-chain message delivery via Hyperlane  
- Unlocks sUSDC on Sepolia
- **Usage:** `npx hardhat run scripts/demo-burn-unlock.ts --network coti`

### `check-sepolia-unlock-status.ts`
Check unlock status and token balances on Sepolia
- Shows locked tokens, user balance, bridge balance
- **Usage:** `npx hardhat run scripts/check-sepolia-unlock-status.ts --network sepolia`

### `setup-new-bridge-with-tokens.ts`
Setup script to lock tokens on Sepolia bridge for testing
- Locks sUSDC tokens on Sepolia bridge
- Creates cross-chain mint message to COTI
- **Usage:** `npx hardhat run scripts/setup-new-bridge-with-tokens.ts --network sepolia`

## 🔧 Deployment Scripts

### `deploy-coti-fixed.ts`
Deploy COTI token contract
- Deploys CotiToken with burn functionality
- **Usage:** `npx hardhat run scripts/deploy-coti-fixed.ts --network coti`

### `deploy-coti-bridge-fixed.ts`
Deploy COTI bridge contract
- Deploys CotiBridge without replay protection
- **Usage:** `npx hardhat run scripts/deploy-coti-bridge-fixed.ts --network coti`

### `deploy-fixed-sepolia-bridge.ts`
Deploy Sepolia bridge contract
- Deploys SepoliaBridge with decimal conversion fix
- No replay protection for demo purposes
- **Usage:** `npx hardhat run scripts/deploy-fixed-sepolia-bridge.ts --network sepolia`

### `deploy-sepolia.ts`
Deploy Sepolia token contract
- Deploys SepoliaToken (sUSDC)
- **Usage:** `npx hardhat run scripts/deploy-sepolia.ts --network sepolia`

## ⚙️ Configuration Scripts

### `update-bridge-addresses-no-replay.ts`
Update bridge configurations to connect COTI ↔ Sepolia
- Sets bridge addresses on both chains
- Configures cross-chain communication
- **Usage:** `npx hardhat run scripts/update-bridge-addresses-no-replay.ts`

## 📊 Status & Monitoring Scripts

### `check-current-balances.ts`
Check token balances and bridge status across both chains
- Shows balances on both COTI and Sepolia
- Displays bridge configurations
- **Usage:** `npx hardhat run scripts/check-current-balances.ts --network sepolia`

### `quick-check-status.ts`
Quick status check for unlock results
- Shows locked tokens and balance changes
- **Usage:** `npx hardhat run scripts/quick-check-status.ts --network sepolia`

## 🚀 Quick Start

1. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy-sepolia.ts --network sepolia
   npx hardhat run scripts/deploy-fixed-sepolia-bridge.ts --network sepolia
   npx hardhat run scripts/deploy-coti-fixed.ts --network coti
   npx hardhat run scripts/deploy-coti-bridge-fixed.ts --network coti
   ```

2. **Configure bridges:**
   ```bash
   npx hardhat run scripts/update-bridge-addresses-no-replay.ts
   ```

3. **Setup for demo:**
   ```bash
   npx hardhat run scripts/setup-new-bridge-with-tokens.ts --network sepolia
   ```

4. **Run demo:**
   ```bash
   npx hardhat run scripts/demo-burn-unlock.ts --network coti
   ```

5. **Check results:**
   ```bash
   npx hardhat run scripts/check-sepolia-unlock-status.ts --network sepolia
   ```

## 📋 Contract Addresses (Current)

- **COTI Token:** `0xa4661A5B5DF03840024e144D123a274969DdeBA2`
- **COTI Bridge:** `0x52221191a3565eda7124c7690500Afa4e066a196`
- **Sepolia Token:** `0x9d422b5ef943517eBdF5B4b5F36a9748B77D3e37`
- **Sepolia Bridge:** `0x1F623C0A0487F1da20BcB5fb1BD48C0f296E0CE5`

## ⚠️ Note

These contracts have **replay protection disabled** for demo purposes. For production use, re-enable the `processedMessages` checks in both bridge contracts. 