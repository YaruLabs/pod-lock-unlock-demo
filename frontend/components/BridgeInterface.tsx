'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, SEPOLIA_TOKEN_ABI, SEPOLIA_BRIDGE_ABI, COTI_TOKEN_ABI } from '../lib/contracts';
import CotiLogo from './CotiLogo';

interface BridgeInterfaceProps {
  account: string;
  network: string;
}

export default function BridgeInterface({ account, network }: BridgeInterfaceProps) {
  const [fromNetwork, setFromNetwork] = useState('sepolia');
  const [toNetwork, setToNetwork] = useState('coti');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bridgeFee, setBridgeFee] = useState('0');

  useEffect(() => {
    if (account) {
      loadBalance();
    }
  }, [account, network, fromNetwork]);

  const loadBalance = async () => {
    if (!account || typeof window.ethereum === 'undefined' || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      if (fromNetwork === 'sepolia' && network === 'Sepolia Testnet') {
        const contract = new ethers.Contract(CONTRACTS.sepolia.token, SEPOLIA_TOKEN_ABI, signer);
        const balanceWei = await contract.balanceOf(account);
        setBalance(ethers.formatUnits(balanceWei, 6));
      } else if (fromNetwork === 'coti' && network === 'COTI Testnet') {
        const contract = new ethers.Contract(CONTRACTS.coti.token, COTI_TOKEN_ABI, signer);
        const balanceWei = await contract.balanceOf(account);
        setBalance(ethers.formatUnits(balanceWei, 18));
      } else {
        setBalance('0');
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
      setBalance('0');
    }
  };

  const quoteBridgeFee = async () => {
    if (!amount || !account || fromNetwork !== 'sepolia') return;
    try {
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const bridge = new ethers.Contract(CONTRACTS.sepolia.bridge, SEPOLIA_BRIDGE_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 6);
      const feeWei = await bridge.quoteLockFee(amountWei);
      setBridgeFee(ethers.formatEther(feeWei));
    } catch (err) {
      console.error('Failed to quote fee:', err);
      setBridgeFee('0');
    }
  };

  useEffect(() => {
    if (amount && fromNetwork === 'sepolia') {
      quoteBridgeFee();
    }
  }, [amount, fromNetwork]);

  const switchNetworks = () => {
    const newFrom = toNetwork;
    const newTo = fromNetwork;
    setFromNetwork(newFrom);
    setToNetwork(newTo);
    setAmount('');
    setBridgeFee('0');
  };

  const handleBridge = async () => {
    if (!amount || !account) return;
    const expectedNetwork = fromNetwork === 'sepolia' ? 'Sepolia Testnet' : 'COTI Testnet';
    if (network !== expectedNetwork) {
      setError(`Please switch to ${expectedNetwork} to bridge tokens`);
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!window.ethereum) throw new Error('Ethereum provider not found');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      if (fromNetwork === 'sepolia') {
        const bridge = new ethers.Contract(CONTRACTS.sepolia.bridge, SEPOLIA_BRIDGE_ABI, signer);
        const token = new ethers.Contract(CONTRACTS.sepolia.token, SEPOLIA_TOKEN_ABI, signer);
        const amountWei = ethers.parseUnits(amount, 6);
        const feeWei = ethers.parseEther(bridgeFee);
        const allowance = await token.allowance(account, CONTRACTS.sepolia.bridge);
        if (allowance < amountWei) {
          setError('Please approve tokens first. Use "Get Test Tokens" to approve automatically.');
          setIsLoading(false);
          return;
        }
        const tx = await bridge.lock(amountWei, { value: feeWei });
        await tx.wait();
        setSuccess(`🎉 Successfully bridged ${amount} USDC to COTI! Tokens will appear in 2-5 minutes.`);
      } else {
        setError('COTI to Sepolia bridging not implemented in this demo');
      }
      setAmount('');
      setBridgeFee('0');
      await loadBalance();
    } catch (err: any) {
      setError('Bridge failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkDisplay = (networkKey: string) => {
    return networkKey === 'sepolia' 
      ? { name: 'Sepolia Testnet', symbol: 'ETH', color: 'blue' }
      : { name: 'COTI Testnet', symbol: 'COTI', color: 'purple' };
  };

  const fromNet = getNetworkDisplay(fromNetwork);
  const toNet = getNetworkDisplay(toNetwork);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
      <CotiLogo className="w-16 h-16 mb-6" />
      <div className="w-full max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Bridge</h2>
              <p className="text-slate-400 text-sm">Bridge your tokens across networks seamlessly</p>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400 text-sm font-medium">From</span>
                  <span className="text-slate-400 text-sm">
                    Balance: {parseFloat(balance).toFixed(4)} {fromNetwork === 'sepolia' ? 'sUSDC' : 'cpUSDC'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-white text-2xl font-semibold placeholder-slate-500 outline-none flex-1 mr-4"
                  />
                  <div className={`flex items-center space-x-2 bg-slate-600/50 rounded-lg px-3 py-2 border border-slate-500/50`}>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${fromNet.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-purple-600'} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {fromNet.symbol === 'ETH' ? 'E' : 'C'}
                      </span>
                    </div>
                    <span className="text-white font-medium text-sm">{fromNet.name}</span>
                  </div>
                </div>
                {amount && fromNetwork === 'sepolia' && (
                  <div className="mt-3 text-slate-400 text-xs">
                    Bridge fee: {parseFloat(bridgeFee).toFixed(6)} ETH
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={switchNetworks}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-2 transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transform group-hover:rotate-180 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400 text-sm font-medium">To</span>
                  <span className="text-slate-400 text-sm">
                    You will receive
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-white text-2xl font-semibold">
                    {amount || '0'}
                  </div>
                  <div className={`flex items-center space-x-2 bg-slate-600/50 rounded-lg px-3 py-2 border border-slate-500/50`}>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${toNet.color === 'blue' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-purple-600'} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {toNet.symbol === 'ETH' ? 'E' : 'C'}
                      </span>
                    </div>
                    <span className="text-white font-medium text-sm">{toNet.name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBridge}
                disabled={!amount || isLoading || !account}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Bridging...</span>
                  </div>
                ) : !account ? (
                  'Connect Wallet'
                ) : (
                  `Bridge to ${toNet.name}`
                )}
              </button>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-blue-300 font-medium text-sm mb-1">Bridge Information</h4>
                    <ul className="text-blue-200/80 text-xs space-y-1">
                      <li>• Cross-chain bridging via Hyperlane protocol</li>
                      <li>• Delivery time: 2-5 minutes typically</li>
                      <li>• COTI tokens are privacy-preserving</li>
                      {fromNetwork === 'sepolia' && <li>• Bridge fee: ~{bridgeFee} ETH</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-lg">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 