// Contract Addresses from Deployment
export const CONTRACTS = {
  sepolia: {
    token: "0x451eAF863f6d45eaccCF2d9d7DEBDB9442f41D4D",
    bridge: "0xF1665b43dD132Cc1a0a41Ac991487c8905B06dE0",
    chainId: 11155111,
    name: "Sepolia Testnet"
  },
  coti: {
    token: "0xF5439Ca0cA5b8bD363c1Df36cd64404a02764137",
    bridge: "0x88D8275BB63faab01bE5bCC0a5e680a3895d34aD",
    chainId: 7082400,
    name: "COTI Testnet"
  }
};

// Network Configuration
export const NETWORKS = {
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/gxqgjNcTuhm4EoK_zMSn9hMtwpVLpAEZ",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  7082400: {
    name: "COTI Testnet",
    rpcUrl: "https://testnet.coti.io/rpc",
    blockExplorer: "https://explorer-testnet.coti.io"
  }
};

// SepoliaToken ABI
export const SEPOLIA_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

// SepoliaBridge ABI
export const SEPOLIA_BRIDGE_ABI = [
  "function lock(uint256 amount) payable returns (bytes32)",
  "function quoteLockFee(uint256 amount) view returns (uint256)",
  "function getLockedTokens(address user) view returns (uint256)",
  "function getContractTokenBalance() view returns (uint256)",
  "function updateCotiBridgeAddress(bytes32 newAddress)",
  "function emergencyWithdraw(address user, uint256 amount)",
  "function withdrawFees(address to, uint256 amount)",
  "event TokensLocked(address indexed user, uint256 amount, bytes32 messageId)",
  "event TokensUnlocked(address indexed user, uint256 amount)",
  "event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount)"
];

// CotiToken ABI
export const COTI_TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
  "function getPrivateBalance(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

// CotiBridge ABI
export const COTI_BRIDGE_ABI = [
  "function testDecode(bytes calldata message) view returns (address user, uint256 amount, bool isMint)",
  "function processedMessages(bytes32 messageHash) view returns (bool)",
  "function token() view returns (address)",
  "function mailbox() view returns (address)",
  "event BridgeAction(address indexed user, uint256 amount, bool isMint)",
  "event MessageReceived(uint32 origin, bytes32 sender, address user, uint256 amount, bool isMint)",
  "event MessageDecoded(address user, uint256 amount, bool isMint)",
  "event MintSuccess(address indexed user, uint256 amount)",
  "event MintFailed(address indexed user, uint256 amount, string reason)"
];

// Utility function to get network name
export function getNetworkName(chainId: number): string {
  const network = NETWORKS[chainId as keyof typeof NETWORKS];
  return network ? network.name : `Unknown Network (${chainId})`;
}

// Utility function to get contract addresses for a network
export function getContractAddresses(chainId: number) {
  if (chainId === 11155111) {
    return CONTRACTS.sepolia;
  } else if (chainId === 7082400) {
    return CONTRACTS.coti;
  }
  return null;
} 