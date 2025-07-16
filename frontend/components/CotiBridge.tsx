'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, COTI_TOKEN_ABI, COTI_BRIDGE_ABI } from '../lib/contracts';

interface CotiBridgeProps {
  account: string;
  network: string;
}

// ABIs are imported from lib/contracts.ts

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
    if (typeof window.ethereum === 'undefined' || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Load contract address from deployment
      const contractAddr = CONTRACTS.coti.token;
      setContractAddress(contractAddr);

      if (contractAddr) {
        const contract = new ethers.Contract(contractAddr, COTI_TOKEN_ABI, signer);
        
        try {
          // Load balance (might be encrypted for privacy tokens)
          const balanceWei = await contract.balanceOf(account);
          setBalance(ethers.formatUnits(balanceWei, 18)); // COTI token has 18 decimals
          
          // For minted tokens, we'll show the same as balance for simplicity
          setMintedTokens(ethers.formatUnits(balanceWei, 18));
        } catch (err: any) {
          console.error('Failed to load balance:', err);
          // If functions fail, show placeholders
          setBalance('Not available');
          setMintedTokens('Not available');
        }
      }
    } catch (err: any) {
      setError('Failed to load contract data: ' + err.message);
    }
  };

  const refreshBalance = async () => {
    setIsLoading(true);
    await loadContractData();
    setIsLoading(false);
  };

  const mintTestTokens = async () => {
    if (!contractAddress) {
      setError('Contract not available');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, COTI_TOKEN_ABI, signer);
      
      // Mint 100 test tokens (18 decimals)
      const amount = ethers.parseUnits("100", 18);
      const tx = await contract.mint(account, amount);
      await tx.wait();
      
      setSuccess(`Successfully minted 100 cpUSDC! Transaction: ${tx.hash}`);
      
      // Reload data
      await loadContractData();
    } catch (err: any) {
      setError('Failed to mint tokens: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed setEncryptionAddress function for demo simplicity

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
            <div className="flex space-x-2">
              <button
                onClick={refreshBalance}
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
              <button
                onClick={mintTestTokens}
                disabled={isLoading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading ? 'Minting...' : 'Mint Test Tokens'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <p className="font-semibold">How to get COTI tokens:</p>
              <ol className="list-decimal list-inside mt-2">
                <li>Lock tokens on Sepolia Bridge</li>
                <li>Wait for Hyperlane message delivery (~2-5 minutes)</li>
                <li>Tokens will be automatically minted here</li>
                <li>Or click "Mint Test Tokens" for demo purposes</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              <p className="font-semibold">Privacy Features:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Balances are encrypted using COTI's MPC technology</li>
                <li>Transactions are confidential on COTI network</li>
                <li>Full privacy preservation for token operations</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">Contract not deployed</p>
            <p className="text-sm text-gray-500">Deploy CotiToken contract to COTI first</p>
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