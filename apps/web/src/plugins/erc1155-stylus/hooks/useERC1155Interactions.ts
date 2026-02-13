/**
 * React hook for interacting with ERC1155 tokens using wagmi
 */

import { useState, useCallback, useEffect } from 'react';
import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { ERC1155_ABI } from '../constants';
import type { 
  UseERC1155InteractionsOptions, 
  UseERC1155InteractionsReturn,
  AsyncState,
  TransactionState,
  MultiTokenInfo,
  TokenTypeInfo,
  TokenBalance,
} from '../types';

export function useERC1155Interactions(options: UseERC1155InteractionsOptions): UseERC1155InteractionsReturn {
  const { 
    contractAddress, 
    network,
    publicClient,
    walletClient,
    userAddress,
  } = options;

  const [contractInfo, setContractInfo] = useState<AsyncState<MultiTokenInfo>>({ status: 'idle' });
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });
  const [error, setError] = useState<Error | null>(null);

  // Fetch contract info
  const refetchContractInfo = useCallback(async () => {
    if (!publicClient) return;
    
    setContractInfo({ status: 'loading' });
    try {
      // Note: owner, paused, and uri functions are not available in this contract
      // Return minimal contract info with default values
      setContractInfo({
        status: 'success',
        data: {
          address: contractAddress,
          baseUri: '', // URI function not available in contract
          owner: '0x0000000000000000000000000000000000000000' as Address, // Owner function not available
          paused: false, // Paused function not available
        },
      });
    } catch (err) {
      setContractInfo({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [publicClient, contractAddress]);

  // Fetch on mount
  useEffect(() => {
    refetchContractInfo();
  }, [refetchContractInfo]);

  // Get token info
  const getTokenInfo = useCallback(async (tokenId: bigint): Promise<TokenTypeInfo> => {
    if (!publicClient) {
      throw new Error('Public client is required');
    }

    // Note: totalSupply, exists, and uri functions are not available in this contract
    // Return minimal token info with default values
    // Check if token exists by checking balance of zero address (if balance > 0, token exists)
    let exists = false;
    try {
      const balance = await publicClient.readContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000000' as Address, tokenId],
      }) as bigint;
      exists = balance > BigInt(0);
    } catch {
      exists = false;
    }

    return {
      id: tokenId,
      totalSupply: BigInt(0), // totalSupply function not available
      exists,
      uri: '', // URI function not available
    };
  }, [publicClient, contractAddress]);

  // Get balance
  const getBalance = useCallback(async (tokenId: bigint): Promise<bigint> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [userAddress, tokenId],
    }) as bigint;

    return balance;
  }, [publicClient, contractAddress, userAddress]);

  // Get batch balance
  const getBalanceBatch = useCallback(async (tokenIds: bigint[]): Promise<TokenBalance[]> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const accounts = tokenIds.map(() => userAddress);
    
    const balances = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOfBatch',
      args: [accounts, tokenIds],
    }) as bigint[];

    return tokenIds.map((id, index) => ({
      id,
      balance: balances[index],
    }));
  }, [publicClient, contractAddress, userAddress]);

  // Check approval
  const isApprovedForAll = useCallback(async (operator: Address): Promise<boolean> => {
    if (!publicClient || !userAddress) {
      throw new Error('Public client and user address are required');
    }

    const approved = await publicClient.readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'isApprovedForAll',
      args: [userAddress, operator],
    }) as boolean;

    return approved;
  }, [publicClient, contractAddress, userAddress]);

  // Helper to execute a write transaction
  const executeTransaction = useCallback(async (
    functionName: 'setApprovalForAll' | 'safeTransferFrom' | 'safeBatchTransferFrom',
    args: 
      | readonly [Address, boolean]
      | readonly [Address, Address, bigint, bigint, readonly number[]]
      | readonly [Address, Address, readonly bigint[], readonly bigint[], readonly number[]]
  ): Promise<Hash> => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet client is required for transactions');
    }

    setError(null);
    setTxState({ status: 'pending' });

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName,
        args,
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      setTxState({ status: 'confirming', hash });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash });

      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setTxState({ status: 'error', error });
      throw error;
    }
  }, [walletClient, publicClient, contractAddress]);

  // Set approval for all
  const setApprovalForAll = useCallback(async (operator: Address, approved: boolean): Promise<Hash> => {
    return executeTransaction('setApprovalForAll', [operator, approved]);
  }, [executeTransaction]);

  // Safe transfer
  const safeTransferFrom = useCallback(async (
    from: Address, to: Address, id: bigint, amount: bigint
  ): Promise<Hash> => {
    // Convert empty data to uint8[] (empty array)
    const data: readonly number[] = [];
    const hash = await executeTransaction('safeTransferFrom', [from, to, id, amount, data]);
    return hash;
  }, [executeTransaction]);

  // Safe batch transfer
  const safeBatchTransferFrom = useCallback(async (
    from: Address, to: Address, ids: bigint[], amounts: bigint[]
  ): Promise<Hash> => {
    // Convert empty data to uint8[] (empty array)
    const data: readonly number[] = [];
    const hash = await executeTransaction('safeBatchTransferFrom', [from, to, ids, amounts, data]);
    return hash;
  }, [executeTransaction]);

  // Mint - Not available in contract
  const mint = useCallback(async (): Promise<Hash> => {
    throw new Error('mint function is not available in this contract');
  }, []);

  // Mint new - Not available in contract
  const mintNew = useCallback(async (): Promise<{ hash: Hash; tokenId: bigint }> => {
    throw new Error('mintNew function is not available in this contract');
  }, []);

  // Mint batch - Not available in contract
  const mintBatch = useCallback(async (): Promise<Hash> => {
    throw new Error('mintBatch function is not available in this contract');
  }, []);

  // Burn - Not available in contract
  const burn = useCallback(async (): Promise<Hash> => {
    throw new Error('burn function is not available in this contract');
  }, []);

  // Burn batch - Not available in contract
  const burnBatch = useCallback(async (): Promise<Hash> => {
    throw new Error('burnBatch function is not available in this contract');
  }, []);

  // Set URI - Not available in contract
  const setUri = useCallback(async (): Promise<Hash> => {
    throw new Error('setUri function is not available in this contract');
  }, []);

  // Pause - Not available in contract
  const pause = useCallback(async (): Promise<Hash> => {
    throw new Error('pause function is not available in this contract');
  }, []);

  // Unpause - Not available in contract
  const unpause = useCallback(async (): Promise<Hash> => {
    throw new Error('unpause function is not available in this contract');
  }, []);

  // Transfer ownership - Not available in contract
  const transferOwnership = useCallback(async (): Promise<Hash> => {
    throw new Error('transferOwnership function is not available in this contract');
  }, []);

  return {
    contractInfo,
    refetchContractInfo,
    getTokenInfo,
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
    txState,
    isLoading: txState.status === 'pending' || txState.status === 'confirming',
    error,
  };
}
