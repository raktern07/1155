/**
 * ERC1155 Stylus Constants
 */

import type { Address } from 'viem';

export const CHAIN_IDS = {
  'arbitrum': 42161,
  'arbitrum-sepolia': 421614,
} as const;

export type SupportedNetwork = keyof typeof CHAIN_IDS;

export const RPC_ENDPOINTS: Record<SupportedNetwork, string> = {
  'arbitrum': 'https://arb1.arbitrum.io/rpc',
  'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
};

export const FACTORY_ADDRESSES: Record<SupportedNetwork, Address> = {
  'arbitrum': '0xed088fd93517b0d0c3a3e4d2e2c419fb58570556' as Address,
  'arbitrum-sepolia': '0xed088fd93517b0d0c3a3e4d2e2c419fb58570556' as Address,
};

/**
 * Get RPC endpoint for network
 */


// ERC1155 Stylus Contract ABI
// Only includes functions and events that are actually implemented in the contract
export const ERC1155_ABI = [
  // View functions
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOfBatch',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  // State-changing functions
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'uint8[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'safeBatchTransferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'ids', type: 'uint256[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'data', type: 'uint8[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'TransferSingle',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferBatch',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'ids', type: 'uint256[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'approved', type: 'bool', indexed: false },
    ],
  },
] as const;

// Token Factory ABI (for future factory deployment)
export const TOKEN_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createMultiToken',
    inputs: [
      { name: 'baseUri', type: 'string' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getTotalContractsDeployed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'MultiTokenCreated',
    inputs: [
      { name: 'contractAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'baseUri', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
