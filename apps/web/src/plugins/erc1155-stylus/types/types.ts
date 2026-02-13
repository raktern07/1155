/**
 * ERC1155 Stylus Types
 */

import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import type { SupportedNetwork } from './constants';

/**
 * Multi-token deployment parameters
 */
export interface DeployMultiTokenParams {
  baseUri: string;
  factoryAddress?: Address;
}

/**
 * Multi-token deployment result
 */
export interface DeployMultiTokenResult {
  contractAddress: Address;
  txHash: Hash;
  success: boolean;
  deployOutput?: string;
  initOutput?: string;
  registerOutput?: string;
}

/**
 * Multi-token contract information
 */
export interface MultiTokenInfo {
  address: Address;
  baseUri: string;
  owner: Address;
  paused: boolean;
}

/**
 * Token type information (for a specific token ID)
 */
export interface TokenTypeInfo {
  id: bigint;
  totalSupply: bigint;
  exists: boolean;
  uri: string;
}

/**
 * Balance information for a specific token ID
 */
export interface TokenBalance {
  id: bigint;
  balance: bigint;
}

/**
 * Batch balance information
 */
export interface BatchBalanceInfo {
  balances: TokenBalance[];
}

/**
 * Transaction state
 */
export type TransactionState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'confirming'; hash: Hash }
  | { status: 'success'; hash: Hash }
  | { status: 'error'; error: Error };

/**
 * Deployment state
 */
export type DeploymentState =
  | { status: 'idle' }
  | { status: 'deploying' }
  | { status: 'activating' }
  | { status: 'initializing' }
  | { status: 'registering' }
  | { status: 'success'; result: DeployMultiTokenResult }
  | { status: 'error'; error: Error };

/**
 * Async state for data fetching
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Configuration for deployment hook (uses wagmi)
 */
export interface UseERC1155DeployOptions {
  network: SupportedNetwork;
  privateKey?: string;
  rpcEndpoint?: string;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  userAddress?: Address;
  deploymentApiUrl?: string;
}

/**
 * Configuration for interactions hook (uses wagmi)
 */
export interface UseERC1155InteractionsOptions {
  contractAddress: Address;
  network: SupportedNetwork;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  userAddress?: Address;
}

/**
 * Return type for deployment hook
 */
export interface UseERC1155DeployReturn {
  deployMultiToken: (params: DeployMultiTokenParams) => Promise<DeployMultiTokenResult>;
  deploymentState: DeploymentState;
  isDeploying: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Return type for interactions hook
 */
export interface UseERC1155InteractionsReturn {
  // Contract info
  contractInfo: AsyncState<MultiTokenInfo>;
  refetchContractInfo: () => Promise<void>;
  
  // Token type info
  getTokenInfo: (tokenId: bigint) => Promise<TokenTypeInfo>;
  
  // Balance
  getBalance: (tokenId: bigint) => Promise<bigint>;
  getBalanceBatch: (tokenIds: bigint[]) => Promise<TokenBalance[]>;
  
  // Approval
  isApprovedForAll: (operator: Address) => Promise<boolean>;
  
  // Transactions (uses wallet popup)
  setApprovalForAll: (operator: Address, approved: boolean) => Promise<Hash>;
  safeTransferFrom: (from: Address, to: Address, id: bigint, amount: bigint) => Promise<Hash>;
  safeBatchTransferFrom: (from: Address, to: Address, ids: bigint[], amounts: bigint[]) => Promise<Hash>;
  mint: (to: Address, id: bigint, amount: bigint) => Promise<Hash>;
  mintNew: (to: Address, amount: bigint) => Promise<{ hash: Hash; tokenId: bigint }>;
  mintBatch: (to: Address, ids: bigint[], amounts: bigint[]) => Promise<Hash>;
  burn: (id: bigint, amount: bigint) => Promise<Hash>;
  burnBatch: (ids: bigint[], amounts: bigint[]) => Promise<Hash>;
  setUri: (newUri: string) => Promise<Hash>;
  pause: () => Promise<Hash>;
  unpause: () => Promise<Hash>;
  transferOwnership: (newOwner: Address) => Promise<Hash>;
  
  // Transaction state
  txState: TransactionState;
  isLoading: boolean;
  error: Error | null;
}

/**
 * ERC-1155 Features for the UI
 */
export interface ERC1155Feature {
  value: string;
  label: string;
  description: string;
  required?: boolean;
}

/**
 * ERC-1155 Deployment Requirements
 */
export interface ERC1155Requirements {
  prerequisites: string[];
  buildSteps: string[];
  deploymentCommands: {
    testnet: string;
    mainnet: string;
  };
  estimatedGas: string;
  features: ERC1155Feature[];
}
