'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from '../components/Navbar';
import BridgeInterface from '../components/BridgeInterface';
import { getNetworkName } from '../lib/contracts';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

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

      setAccount(account);
      setNetwork(networkName);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      alert('Failed to connect wallet: ' + err.message);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setNetwork('');
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  return (
    <main>
      <Navbar 
        isConnected={isConnected}
        account={account}
        network={network}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
      
      {isConnected ? (
        <BridgeInterface account={account} network={network} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">COTI Bridge</h1>
            <p className="text-xl text-slate-300 mb-8">
              Bridge your tokens across networks seamlessly
            </p>
            
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 inline-flex items-center space-x-3"
            >
              <span>Connect Wallet</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700/50">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Fast & Secure</h4>
                  <p className="text-slate-400 text-sm">Cross-chain bridging powered by Hyperlane protocol</p>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700/50">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Privacy First</h4>
                  <p className="text-slate-400 text-sm">COTI's MPC technology ensures complete transaction privacy</p>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700/50">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Easy to Use</h4>
                  <p className="text-slate-400 text-sm">Simple interface for seamless token bridging experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 