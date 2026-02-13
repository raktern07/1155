/**
 * @cradle/erc1155-stylus
 *
 * ERC-1155 Multi-Token interaction utilities for Arbitrum Stylus
 *
 * @example
 * ```tsx
 * import { useERC1155Interactions, CHAIN_IDS } from '@cradle/erc1155-stylus';
 *
 * function MultiTokenPanel() {
 *   const token = useERC1155Interactions({
 *     contractAddress: '0x...',
 *     network: 'arbitrum-sepolia',
 *   });
 *
 *   return (
 *     <div>
 *       <p>Owner: {token.contractInfo.data?.owner}</p>
 *       <p>Base URI: {token.contractInfo.data?.baseUri}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// Constants
export {
  CHAIN_IDS,
  RPC_ENDPOINTS,
  FACTORY_ADDRESSES,
  ERC1155_ABI,
  TOKEN_FACTORY_ABI,
  type SupportedNetwork,
} from './constants';

// Types
export type {
  DeployMultiTokenParams,
  DeployMultiTokenResult,
  MultiTokenInfo,
  TokenTypeInfo,
  TokenBalance,
  BatchBalanceInfo,
  TransactionState,
  DeploymentState,
  AsyncState,
  UseERC1155DeployOptions,
  UseERC1155InteractionsOptions,
  UseERC1155DeployReturn,
  UseERC1155InteractionsReturn,
  ERC1155Feature,
  ERC1155Requirements,
} from './types';

// Interaction functions
export {
  getContractInfo,
  getTokenTypeInfo,
  getBalance,
  getBalanceBatch,
  isApprovedForAll,
  setApprovalForAll,
  safeTransferFrom,
  safeBatchTransferFrom,
  mint,
  mintNew,
  mintBatch,
  burn,
  burnBatch,
  setUri,
  pause,
  unpause,
  transferOwnership,
} from './interactions';

// Deployment functions
export {
  deployERC1155CollectionViaAPI,
  initializeMultiToken,
  registerMultiTokenInFactory,
  isMultiTokenRegistered,
  getFactoryAddress,
  getRpcEndpoint,
} from './deployment';

// React Hooks
export {
  useERC1155Deploy,
  useERC1155Interactions,
} from './hooks';

// Interaction Panel Component
export { ERC1155InteractionPanel } from './ERC1155InteractionPanel';

// Utilities
export { cn } from './cn';
