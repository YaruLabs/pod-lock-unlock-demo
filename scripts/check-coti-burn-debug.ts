import { ethers } from "hardhat";

const COTI_BRIDGE_ADDRESS = "0x52221191a3565eda7124c7690500Afa4e066a196";
const USER_ADDRESS = "0x30a6C9D1d70d41756673Cce044189577F0953a75";

const COTI_BRIDGE_ABI = [
  "function getUserBurnTransactions(address user) view returns (bytes32[] memory)",
  "function getBurnTransactionStatus(bytes32 messageId) view returns (bool exists, bool success)",
  "event TokensBurned(address indexed user, uint256 amount, bytes32 messageId)",
  "event UnlockConfirmationReceived(address indexed user, uint256 amount, bool success)"
];

async function main() {
  const provider = ethers.provider;
  const bridge = new ethers.Contract(COTI_BRIDGE_ADDRESS, COTI_BRIDGE_ABI, provider);

  console.log(`Checking burns for user: ${USER_ADDRESS}`);
  const burnTxs: string[] = await bridge.getUserBurnTransactions(USER_ADDRESS);
  if (burnTxs.length === 0) {
    console.log("No burn transactions found for user.");
    return;
  }

  for (const messageId of burnTxs) {
    console.log(`\n--- Burn messageId: ${messageId}`);
    const [exists, success] = await bridge.getBurnTransactionStatus(messageId);
    console.log(`Status: exists=${exists}, success=${success}`);

    // Find TokensBurned event for this messageId
    const burnEvents = await bridge.queryFilter(
      bridge.filters.TokensBurned(USER_ADDRESS, null, messageId)
    );
    for (const evt of burnEvents) {
      console.log(`TokensBurned: user=${evt.args?.user}, amount=${evt.args?.amount}, messageId=${evt.args?.messageId}`);
      console.log(`  txHash: ${evt.transactionHash}`);
    }

    // Find UnlockConfirmationReceived event for this user and messageId
    const unlockEvents = await bridge.queryFilter(
      bridge.filters.UnlockConfirmationReceived(USER_ADDRESS)
    );
    for (const evt of unlockEvents) {
      console.log(`UnlockConfirmationReceived: user=${evt.args?.user}, amount=${evt.args?.amount}, success=${evt.args?.success}`);
      console.log(`  txHash: ${evt.transactionHash}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 