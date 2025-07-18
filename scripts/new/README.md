# Scripts in `scripts/new/` Folder

This folder contains utility and demo scripts for interacting with the COTI and Sepolia bridge/token contracts. Each script is designed to be run with Hardhat and can be used for testing, debugging, or demo purposes.

---

## 1. `mint-coti-token.ts`
**Description:**
Mints 1000 COTI tokens to the deployer address using the CotiToken contract on the COTI network. Prints balances before and after minting, and shows transaction details.

**Usage:**
```bash
npx hardhat run scripts/new/mint-coti-token.ts --network coti
```

---

## 2. `fetch-coti-tx-details.ts`
**Description:**
Fetches and prints the details of a transaction on the COTI network, including the transaction receipt and all logs/events. Attempts to decode events from the CotiBridge contract.

**Usage:**
```bash
npx hardhat run scripts/new/fetch-coti-tx-details.ts --network coti
```

You can change the transaction hash in the script to inspect a different transaction.

---

## 3. `test-burn-simple.ts`
**Description:**
Tests the burn flow for the COTI bridge. Approves the bridge to spend tokens, then calls the burn function and prints the result. Useful for verifying the burn and event emission logic.

**Usage:**
```bash
npx hardhat run scripts/new/test-burn-simple.ts --network coti
```

---

## General Notes
- All scripts are intended to be run with Hardhat and require the correct network configuration in `hardhat.config.ts`.
- Make sure your `.env` and deployment JSON files are up to date with the correct contract addresses.
- For COTI network scripts, ensure your RPC endpoint is working and synced.
- You may need to adjust gas settings or transaction parameters for your specific environment.

---

For more details on each script, read the comments at the top of each file or check the source code. 