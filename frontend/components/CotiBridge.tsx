'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface CotiBridgeProps {
  account: string;
  network: string;
}

// PrivateUSDC ABI (simplified for demo)
const PRIVATE_USDC_ABI = [
  "function getPrivateBalance(address account) view returns (tuple)",
  "function getMintedTokens(address user) view returns (tuple)",
  "function unlock(tuple amount) payable returns (bytes32)",
  "function quoteUnlockFee(tuple amount) view returns (uint256)",
  "function setEncryptionAddress(address offBoardAddress) returns (bool)",
  "event TokensBurned(address indexed user, tuple amount)",
  "event UnlockRequested(address indexed user, tuple amount, bytes32 messageId)"
];

export default function CotiBridge({ account, network }: CotiBridgeProps) {
  const [contractAddress, setContractAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [mintedTokens, setMintedTokens] = useState('0');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account && network === 'COTI Testnet') {
      loadContractData();
    }
  }, [account, network]);

  const loadContractData = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Load contract address from deployment (you'll need to update this)
      const contractAddr = process.env.NEXT_PUBLIC_COTI_CONTRACT_ADDRESS || '';
      setContractAddress(contractAddr);

      if (contractAddr) {
        const contract = new ethers.Contract(contractAddr, PRIVATE_USDC_ABI, signer);
        
        try {
          // Load private balance (encrypted)
          const balanceData = await contract.getPrivateBalance(account);
          // For demo purposes, we'll show a placeholder since we can't decrypt
          setBalance('Encrypted');
          
          // Load minted tokens (GT value)
          const mintedData = await contract.getMintedTokens(account);
          // For demo purposes, we'll show a placeholder since we can't decrypt
          setMintedTokens('Encrypted');
        } catch (err) {
          // If private functions fail, show placeholders
          setBalance('Not available');
          setMintedTokens('Not available');
        }
      }
    } catch (err: any) {
      setError('Failed to load contract data: ' + err.message);
    }
  };

  const quoteFee = async () => {
    if (!amount || !contractAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVATE_USDC_ABI, signer);
      
      // For demo purposes, we'll use a placeholder encrypted amount
      // In a real implementation, you'd need to create an actual encrypted value
      const placeholderAmount = {
        ciphertext: "0x0000000000000000000000000000000000000000000000000000000000000000",
        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
      };
      
      const feeWei = await contract.quoteUnlockFee(placeholderAmount);
      setFee(ethers.formatEther(feeWei));
    } catch (err: any) {
      setError('Failed to quote fee: ' + err.message);
    }
  };

  const unlockTokens = async () => {
    if (!amount || !contractAddress) {
      setError('Please enter an amount and ensure contract is deployed');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVATE_USDC_ABI, signer);
      
      // For demo purposes, we'll use a placeholder encrypted amount
      // In a real implementation, you'd need to create an actual encrypted value
      const placeholderAmount = {
        ciphertext: "0x0000000000000000000000000000000000000000000000000000000000000000",
        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
      };
      
      const feeWei = ethers.parseEther(fee);
      
      const tx = await contract.unlock(placeholderAmount, { value: feeWei });
      await tx.wait();
      
      setSuccess(`Successfully initiated unlock of ${amount} pUSDC! Transaction: ${tx.hash}`);
      setAmount('');
      setFee('0');
      
      // Reload data
      await loadContractData();
    } catch (err: any) {
      setError('Failed to unlock tokens: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setEncryptionAddress = async () => {
    if (!contractAddress) return;

    setIsLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVATE_USDC_ABI, signer);
      
      const tx = await contract.setEncryptionAddress(account);
      await tx.wait();
      
      setSuccess('Successfully set encryption address!');
    } catch (err: any) {
      setError('Failed to set encryption address: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (network !== 'COTI Testnet') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-600">COTI Bridge</h2>
        <p className="text-gray-600">Switch to COTI Testnet to use this bridge.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">COTI Bridge</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">pUSDC Balance</p>
            <p className="font-mono">{balance}</p>
          </div>
          <div>
            <p className="text-gray-500">Minted Tokens</p>
            <p className="font-mono">{mintedTokens}</p>
          </div>
        </div>

        {contractAddress ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Unlock (pUSDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                onClick={unlockTokens}
                disabled={!amount || isLoading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading ? 'Unlocking...' : 'Unlock Tokens'}
              </button>
            </div>

            {fee !== '0' && (
              <div className="text-sm text-gray-600">
                Required fee: {fee} COTI
              </div>
            )}

            <button
              onClick={setEncryptionAddress}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Set Encryption Address
            </button>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
              <p className="font-semibold">Note:</p>
              <p>This is a demo implementation. In a real scenario, you would need:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Proper COTI wallet integration</li>
                <li>Encrypted value creation using COTI's MPC library</li>
                <li>User key generation and management</li>
                <li>Private transaction handling</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">Contract not deployed</p>
            <p className="text-sm text-gray-500">Deploy PrivateUSDC contract to COTI first</p>
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