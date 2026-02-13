'use client';

/**
 * ERC-1155 Multi-Token Interaction Panel
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useERC1155Interactions } from '@cradle/erc1155-stylus';
import type { Address } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC1155_ADDRESS as Address;

export function ERC1155MultiTokenPanel() {
  const { address: userAddress } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('0');

  const multitoken = useERC1155Interactions({
    contractAddress: CONTRACT_ADDRESS,
    network: 'arbitrum-sepolia',
    userAddress,
  });

  const collectionInfo = multitoken.collectionInfo.status === 'success' ? multitoken.collectionInfo.data : null;
  const balance = multitoken.balance.status === 'success' ? multitoken.balance.data : null;

  // Fetch balance when token ID changes
  useEffect(() => {
    if (selectedTokenId && userAddress) {
      multitoken.refetchBalance(BigInt(selectedTokenId));
    }
  }, [selectedTokenId, userAddress]);

  const handleTransfer = async () => {
    if (!transferTo || !transferTokenId || !transferAmount) return;
    try {
      await multitoken.safeTransferFrom(
        userAddress as Address,
        transferTo as Address,
        BigInt(transferTokenId),
        BigInt(transferAmount)
      );
      setTransferTo('');
      setTransferTokenId('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          Multi-token not deployed yet. Run <code>pnpm deploy:multitoken</code> to deploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collection Info */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {collectionInfo?.name || 'My Multi-Token Collection'}
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Base URI: {collectionInfo?.baseUri || 'https://api.example.com/metadata/'}</p>
          <p className="text-xs font-mono truncate">{CONTRACT_ADDRESS}</p>
        </div>
      </div>

      {/* Balance Check */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Check Balance</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Token ID"
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <p className="text-sm text-gray-400">
            Balance: {balance?.balance?.toString() || '0'}
          </p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Transfer Tokens</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Token ID"
            value={transferTokenId}
            onChange={(e) => setTransferTokenId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleTransfer}
            disabled={multitoken.isLoading || !transferTo || !transferTokenId || !transferAmount}
            className="w-full px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
          >
            {multitoken.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {multitoken.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {multitoken.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {multitoken.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{multitoken.error.message}</p>
        </div>
      )}
    </div>
  );
}
