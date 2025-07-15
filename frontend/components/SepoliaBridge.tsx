'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface SepoliaBridgeProps {
  account: string;
  network: string;
}

// SepoliaToken ABI
const SEPOLIA_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function burnFrom(address from, uint256 amount)"
];

// SepoliaBridge ABI
const SEPOLIA_BRIDGE_ABI = [
  "function lock(uint256 amount) payable returns (bytes32)",
  "function quoteLockFee(uint256 amount) view returns (uint256)",
  "function getLockedTokens(address user) view returns (uint256)",
  "function getContractTokenBalance() view returns (uint256)"
];

export default function SepoliaBridge({ account, network }: SepoliaBridgeProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [bridgeAddress, setBridgeAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [lockedTokens, setLockedTokens] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account && network === 'Sepolia Testnet') {
      loadContractData();
    }
  }, [account, network]);

  const loadContractData = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Load contract addresses from deployment (you'll need to update this)
      const tokenAddr = process.env.NEXT_PUBLIC_SEPOLIA_TOKEN_ADDRESS || '';
      const bridgeAddr = process.env.NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS || '';
      
      setTokenAddress(tokenAddr);
      setBridgeAddress(bridgeAddr);

      if (tokenAddr && bridgeAddr) {
        const tokenContract = new ethers.Contract(tokenAddr, SEPOLIA_TOKEN_ABI, signer);
        const bridgeContract = new ethers.Contract(bridgeAddr, SEPOLIA_BRIDGE_ABI, signer);
        
        // Load balance
        const balanceWei = await tokenContract.balanceOf(account);
        setBalance(ethers.formatUnits(balanceWei, 6)); // USDC has 6 decimals
        
        // Load locked tokens
        const lockedWei = await bridgeContract.getLockedTokens(account);
        setLockedTokens(ethers.formatUnits(lockedWei, 6));
        
        // Load allowance
        const allowanceWei = await tokenContract.allowance(account, bridgeAddr);
        setAllowance(ethers.formatUnits(allowanceWei, 6));
      }
    } catch (err: any) {
      setError('Failed to load contract data: ' + err.message);
    }
  };

  const approveTokens = async () => {
    if (!tokenAddress || !bridgeAddress) return;

    setIsLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, SEPOLIA_TOKEN_ABI, signer);
      
      const approveTx = await tokenContract.approve(bridgeAddress, ethers.MaxUint256);
      await approveTx.wait();
      
      setSuccess('Successfully approved bridge to spend tokens!');
      await loadContractData();
    } catch (err: any) {
      setError('Failed to approve tokens: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quoteFee = async () => {
    if (!amount || !bridgeAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const bridgeContract = new ethers.Contract(bridgeAddress, SEPOLIA_BRIDGE_ABI, signer);
      
      const amountWei = ethers.parseUnits(amount, 6);
      const feeWei = await bridgeContract.quoteLockFee(amountWei);
      setFee(ethers.formatEther(feeWei));
    } catch (err: any) {
      setError('Failed to quote fee: ' + err.message);
    }
  };

  const lockTokens = async () => {
    if (!amount || !bridgeAddress) {
      setError('Please enter an amount and ensure bridge is deployed');
      return;
    }

    if (parseFloat(allowance) < parseFloat(amount)) {
      setError('Please approve the bridge to spend your tokens first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const bridgeContract = new ethers.Contract(bridgeAddress, SEPOLIA_BRIDGE_ABI, signer);
      
      const amountWei = ethers.parseUnits(amount, 6);
      const feeWei = ethers.parseEther(fee);
      
      const tx = await bridgeContract.lock(amountWei, { value: feeWei });
      await tx.wait();
      
      setSuccess(`Successfully locked ${amount} USDC! Transaction: ${tx.hash}`);
      setAmount('');
      setFee('0');
      
      // Reload data
      await loadContractData();
    } catch (err: any) {
      setError('Failed to lock tokens: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const mintTokens = async () => {
    if (!tokenAddress) return;

    setIsLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, SEPOLIA_TOKEN_ABI, signer);
      
      const mintAmount = ethers.parseUnits('1000', 6); // Mint 1000 USDC
      const tx = await tokenContract.mint(account, mintAmount);
      await tx.wait();
      
      setSuccess('Successfully minted 1000 USDC!');
      await loadContractData();
    } catch (err: any) {
      setError('Failed to mint tokens: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (network !== 'Sepolia Testnet') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Sepolia Bridge</h2>
        <p className="text-gray-600">Switch to Sepolia Testnet to use this bridge.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Sepolia Bridge</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">USDC Balance</p>
            <p className="font-mono">{balance} USDC</p>
          </div>
          <div>
            <p className="text-gray-500">Locked Tokens</p>
            <p className="font-mono">{lockedTokens} USDC</p>
          </div>
          <div>
            <p className="text-gray-500">Bridge Allowance</p>
            <p className="font-mono">{allowance} USDC</p>
          </div>
        </div>

        {tokenAddress && bridgeAddress ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Lock (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={quoteFee}
                disabled={!amount}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Quote Fee
              </button>
              <button
                onClick={lockTokens}
                disabled={!amount || isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading ? 'Locking...' : 'Lock Tokens'}
              </button>
            </div>

            {fee !== '0' && (
              <div className="text-sm text-gray-600">
                Required fee: {fee} ETH
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={approveTokens}
                disabled={isLoading || parseFloat(allowance) > 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Approve Bridge
              </button>
              <button
                onClick={mintTokens}
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Mint 1000 USDC
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">Contracts not deployed</p>
            <p className="text-sm text-gray-500">Deploy SepoliaToken and SepoliaBridge contracts first</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
      </div>
    </div>
  );
} 