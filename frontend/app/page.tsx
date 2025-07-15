'use client';

import { useState, useEffect } from 'react';
import ConnectWallet from '../components/ConnectWallet';
import SepoliaBridge from '../components/SepoliaBridge';
import CotiBridge from '../components/CotiBridge';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cross-Chain Token Bridge Demo
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Hyperlane-powered bridging between Sepolia and COTI testnet
          </p>
          <p className="text-sm text-gray-500">
            Lock USDC on Sepolia → Mint pUSDC on COTI → Unlock back to Sepolia
          </p>
        </div>

        <ConnectWallet 
          onConnect={(account, network) => {
            setAccount(account);
            setNetwork(network);
            setIsConnected(true);
          }}
          onDisconnect={() => {
            setAccount('');
            setNetwork('');
            setIsConnected(false);
          }}
        />

        {isConnected && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Connected Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account</p>
                  <p className="font-mono text-sm">{account}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Network</p>
                  <p className="font-mono text-sm">{network}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SepoliaBridge account={account} network={network} />
              <CotiBridge account={account} network={network} />
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to start bridging tokens between Sepolia and COTI testnet.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Lock USDC on Sepolia to mint pUSDC on COTI</p>
                <p>• Burn pUSDC on COTI to unlock USDC on Sepolia</p>
                <p>• All transactions are private on COTI using MPC</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 