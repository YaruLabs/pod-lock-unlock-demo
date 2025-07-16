'use client';

import { NETWORKS } from '../lib/contracts';

interface NetworkSwitcherProps {
  currentNetwork: string;
  onNetworkSwitch: () => void;
}

export default function NetworkSwitcher({ currentNetwork, onNetworkSwitch }: NetworkSwitcherProps) {
  const switchToSepolia = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
      });
      onNetworkSwitch();
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [NETWORKS[11155111].rpcUrl],
              blockExplorerUrls: [NETWORKS[11155111].blockExplorer]
            }]
          });
          onNetworkSwitch();
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
        }
      } else {
        console.error('Failed to switch to Sepolia:', error);
      }
    }
  };

  const switchToCoti = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x6c0a00' }], // COTI chainId in hex (7082400)
      });
      onNetworkSwitch();
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x6c0a00',
              chainName: 'COTI Testnet',
              nativeCurrency: {
                name: 'COTI',
                symbol: 'COTI',
                decimals: 18
              },
              rpcUrls: [NETWORKS[7082400].rpcUrl],
              blockExplorerUrls: [NETWORKS[7082400].blockExplorer]
            }]
          });
          onNetworkSwitch();
        } catch (addError) {
          console.error('Failed to add COTI network:', addError);
        }
      } else {
        console.error('Failed to switch to COTI:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Quick Network Switch</h3>
      <div className="flex space-x-4">
        <button
          onClick={switchToSepolia}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            currentNetwork === 'Sepolia Testnet'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Switch to Sepolia
        </button>
        <button
          onClick={switchToCoti}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            currentNetwork === 'COTI Testnet'
              ? 'bg-purple-500 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Switch to COTI
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Current network: <span className="font-medium">{currentNetwork}</span>
      </p>
    </div>
  );
} 