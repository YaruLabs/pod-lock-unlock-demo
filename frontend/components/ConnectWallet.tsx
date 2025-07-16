'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getNetworkName } from '../lib/contracts';

interface ConnectWalletProps {
  onConnect: (account: string, network: string) => void;
  onDisconnect: () => void;
}

export default function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];

      // Get network info
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      const networkName = getNetworkName(Number(network.chainId));

      onConnect(account, networkName);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onDisconnect();
  };

  const switchToSepolia = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia Ether',
              symbol: 'SEP',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
          }],
        });
      }
    }
  };

  const switchToCoti = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xfa2' }], // COTI testnet chainId
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xfa2',
            chainName: 'COTI Testnet',
            nativeCurrency: {
              name: 'COTI',
              symbol: 'COTI',
              decimals: 18,
            },
            rpcUrls: ['https://testnet-rpc.coti.io'],
            blockExplorerUrls: ['https://testnet-explorer.coti.io'],
          }],
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
      
      <div className="space-y-4">
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={switchToSepolia}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Switch to Sepolia
          </button>
          <button
            onClick={switchToCoti}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Switch to COTI
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 