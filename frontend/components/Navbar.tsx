'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, SEPOLIA_TOKEN_ABI, COTI_TOKEN_ABI } from '../lib/contracts';
import CotiLogo from './CotiLogo';

interface NavbarProps {
  isConnected: boolean;
  account: string;
  network: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Navbar({ isConnected, account, network, onConnect, onDisconnect }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const mintSepoliaTokens = async () => {
    if (!isConnected || network !== 'Sepolia Testnet') {
      setError('Please connect to Sepolia Testnet first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.sepolia.token, SEPOLIA_TOKEN_ABI, signer);
      
      const amount = ethers.parseUnits("1000", 6); // 1000 USDC with 6 decimals
      
      // Mint tokens
      const mintTx = await contract.mint(account, amount);
      await mintTx.wait();
      
      // Auto-approve bridge to spend tokens
      const approveTx = await contract.approve(CONTRACTS.sepolia.bridge, ethers.MaxUint256);
      await approveTx.wait();
      
      setSuccess('✅ Minted 1000 sUSDC on Sepolia & approved bridge!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to mint tokens: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const mintCotiTokens = async () => {
    if (!isConnected || network !== 'COTI Testnet') {
      setError('Please connect to COTI Testnet first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.coti.token, COTI_TOKEN_ABI, signer);
      
      const amount = ethers.parseUnits("1000", 18); // 1000 cpUSDC with 18 decimals
      const tx = await contract.mint(account, amount);
      await tx.wait();
      
      setSuccess('✅ Minted 1000 cpUSDC on COTI!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to mint tokens: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <CotiLogo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">COTI Bridge</h1>
                <p className="text-xs text-blue-200">Cross-Chain Token Bridge</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-6">
              {/* Get Test Tokens Dropdown */}
              {isConnected && (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>Get Test Tokens</span>
                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Free Test Tokens</h3>
                        
                        <div className="space-y-3">
                          <button
                            onClick={mintSepoliaTokens}
                            disabled={isLoading || network !== 'Sepolia Testnet'}
                            className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Sepolia USDC</p>
                                <p className="text-sm text-gray-500">1000 sUSDC tokens</p>
                              </div>
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">ETH</span>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={mintCotiTokens}
                            disabled={isLoading || network !== 'COTI Testnet'}
                            className="w-full text-left p-3 rounded-lg border hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">COTI Private USDC</p>
                                <p className="text-sm text-gray-500">1000 cpUSDC tokens</p>
                              </div>
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-sm">COTI</span>
                              </div>
                            </div>
                          </button>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Need ETH/COTI for gas? Visit{' '}
                            <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              Sepolia Faucet
                            </a>{' '}
                            or{' '}
                            <a href="https://faucet.coti.io" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                              COTI Faucet
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Connect Wallet Button */}
              {!isConnected ? (
                <button
                  onClick={onConnect}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-white font-medium">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                    <p className="text-xs text-blue-200">{network}</p>
                  </div>
                  <button
                    onClick={onDisconnect}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Success/Error Notifications */}
      {(success || error) && (
        <div className="fixed top-20 right-4 z-50">
          {success && (
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg mb-2">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
} 