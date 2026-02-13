'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Layers,
  Send,
  Shield,
  RefreshCw,
  Check,
  Wallet,
  Package,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { cn } from './cn';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'viem/chains';
import type { Chain } from 'viem';

// Define custom Superposition chains
const superposition: Chain = {
  id: 55244,
  name: 'Superposition',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.superposition.so'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.superposition.so' },
  },
};

const superpositionTestnet: Chain = {
  id: 98985,
  name: 'Superposition Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SPN',
    symbol: 'SPN',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.superposition.so'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet-explorer.superposition.so' },
  },
  testnet: true,
};

// ERC1155 ABI matching the deployed Stylus contract (My1155 from lib.rs)
const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 value, uint8[] memory data) external",
  "function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory values, uint8[] memory data) external",
];

// Network-specific default contract addresses (only for networks where contracts are deployed)
const DEFAULT_CONTRACT_ADDRESSES: Record<string, string | undefined> = {
  'arbitrum-sepolia': '0xF5DfA3CC48b885fe7154e9877E6f2A805F723f29',
  'arbitrum': undefined, // No default contract deployed on mainnet
  'superposition': undefined, // No default contract deployed on mainnet
  'superposition-testnet': '0x7906e652e3F28aaF97e6a95E73016c38a3F7dD64',
};

// Network configurations
const NETWORKS = {
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    chainId: arbitrumSepolia.id,
    chain: arbitrumSepolia,
  },
  'arbitrum': {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    chainId: arbitrum.id,
    chain: arbitrum,
  },
  'superposition': {
    name: 'Superposition',
    rpcUrl: 'https://rpc.superposition.so',
    explorerUrl: 'https://explorer.superposition.so',
    chainId: 55244,
    chain: superposition,
  },
  'superposition-testnet': {
    name: 'Superposition Testnet',
    rpcUrl: 'https://testnet-rpc.superposition.so',
    explorerUrl: 'https://testnet-explorer.superposition.so',
    chainId: 98985,
    chain: superpositionTestnet,
  },
};

interface ERC1155InteractionPanelProps {
  contractAddress?: string;
  network?: 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet';
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function ERC1155InteractionPanel({
  contractAddress: initialAddress,
  network: initialNetwork = 'arbitrum-sepolia',
}: ERC1155InteractionPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet'>(initialNetwork);
  const [contractAddress, setContractAddress] = useState(initialAddress || DEFAULT_CONTRACT_ADDRESSES[initialNetwork] || '');
  const [showCustomContract, setShowCustomContract] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const networkConfig = NETWORKS[selectedNetwork];
  const rpcUrl = networkConfig.rpcUrl;
  const explorerUrl = networkConfig.explorerUrl;

  // Wagmi hooks for wallet connection
  const { address: userAddress, isConnected: walletConnected, chain: currentChain } = useAccount();
  const publicClient = usePublicClient({ chainId: networkConfig.chainId });
  const { data: walletClient } = useWalletClient({ chainId: networkConfig.chainId });
  const { switchChainAsync } = useSwitchChain();

  // Token info
  const [userBalances, setUserBalances] = useState<Map<string, string>>(new Map());

  // Form inputs - Single Transfer
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Form inputs - Batch Transfer
  const [batchTransferFrom, setBatchTransferFrom] = useState('');
  const [batchTransferTo, setBatchTransferTo] = useState('');
  const [batchTokenIds, setBatchTokenIds] = useState('');
  const [batchAmounts, setBatchAmounts] = useState('');

  // Form inputs - Approval
  const [operatorAddress, setOperatorAddress] = useState('');
  const [operatorApproved, setOperatorApproved] = useState(true);

  // Read operations
  const [balanceCheckAddress, setBalanceCheckAddress] = useState('');
  const [balanceCheckTokenId, setBalanceCheckTokenId] = useState('');
  const [balanceCheckResult, setBalanceCheckResult] = useState<string | null>(null);

  const [approvalCheckOwner, setApprovalCheckOwner] = useState('');
  const [approvalCheckOperator, setApprovalCheckOperator] = useState('');
  const [approvalCheckResult, setApprovalCheckResult] = useState<boolean | null>(null);

  // Transaction status
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
  const [customAddressError, setCustomAddressError] = useState<string | null>(null);
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Check if using the default contract for the selected network
  const defaultAddress = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
  const isUsingDefaultContract = defaultAddress && contractAddress === defaultAddress;
  const hasDefaultContract = !!defaultAddress;
  const displayExplorerUrl = explorerUrl;

  // Update contract address when network changes
  useEffect(() => {
    const newDefault = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
    if (newDefault && (isUsingDefaultContract || !initialAddress)) {
      setContractAddress(newDefault);
    } else if (!newDefault && !initialAddress) {
      setContractAddress('');
    }
  }, [selectedNetwork]);

  // Validate if an address is a contract
  const validateContract = async (address: string): Promise<boolean> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const code = await provider.getCode(address);
      return code !== '0x' && code.length > 2;
    } catch (error) {
      return false;
    }
  };

  // Update contract address when using custom
  const handleUseCustomContract = async () => {
    if (!customAddress || !ethers.isAddress(customAddress)) {
      setCustomAddressError('Invalid address format');
      return;
    }

    setIsValidatingContract(true);
    setCustomAddressError(null);

    const isContract = await validateContract(customAddress);
    if (!isContract) {
      setCustomAddressError('Address is not a contract');
      setIsValidatingContract(false);
      return;
    }

    setContractAddress(customAddress);
    setIsValidatingContract(false);
  };

  // Reset to default contract for the selected network
  const handleUseDefaultContract = () => {
    const defaultAddr = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
    setContractAddress(defaultAddr || '');
    setCustomAddress('');
    setCustomAddressError(null);
    setShowCustomContract(false);
  };

  const getReadContract = useCallback(() => {
    if (!contractAddress || !rpcUrl) return null;
    // Create a fresh provider with the current RPC URL
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(contractAddress, ERC1155_ABI, provider);
  }, [contractAddress, rpcUrl, selectedNetwork]);

  const getWriteContract = useCallback(async () => {
    console.log('[ERC1155] getWriteContract called', { contractAddress, walletConnected, currentChainId: currentChain?.id, targetChainId: networkConfig.chainId });

    if (!contractAddress) {
      console.error('[ERC1155] No contract address');
      throw new Error('No contract address specified');
    }

    if (!walletConnected) {
      console.error('[ERC1155] Wallet not connected');
      throw new Error('Please connect your wallet first');
    }

    // Check if ethereum provider exists
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error('[ERC1155] No ethereum provider found');
      throw new Error('No wallet detected. Please install MetaMask.');
    }

    // Switch chain if necessary
    const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;
    console.log('[ERC1155] Current chain:', currentChain?.id, 'Target chain:', networkConfig.chainId);

    if (currentChain?.id !== networkConfig.chainId) {
      console.log('[ERC1155] Switching chain to', networkConfig.name);
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
        console.log('[ERC1155] Chain switched successfully');
      } catch (switchError: any) {
        console.log('[ERC1155] Switch error:', switchError.code, switchError.message);
        if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain') || switchError.message?.includes('wallet_addEthereumChain')) {
          console.log('[ERC1155] Chain not found, adding chain...');
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainIdHex,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.chain.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
              }],
            });
            console.log('[ERC1155] Chain added successfully');
          } catch (addError: any) {
            console.error('[ERC1155] Failed to add chain:', addError);
            throw new Error(`Failed to add ${networkConfig.name} to wallet: ${addError.message}`);
          }
        } else if (switchError.code === 4001) {
          throw new Error('User rejected chain switch');
        } else {
          throw switchError;
        }
      }
    }

    console.log('[ERC1155] Creating provider and signer...');
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    console.log('[ERC1155] Signer address:', await signer.getAddress());

    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
    console.log('[ERC1155] Contract created at:', contractAddress);
    return contract;
  }, [contractAddress, walletConnected, currentChain?.id, networkConfig]);

  // Helper to parse RPC/contract errors into user-friendly messages
  const parseContractError = useCallback((error: any): string => {
    const errorMessage = error?.message || error?.reason || String(error);

    if (errorMessage.includes('BAD_DATA') || errorMessage.includes('could not decode result data')) {
      return `Contract not found or not deployed on ${networkConfig.name}. The contract may only exist on a different network.`;
    }
    if (errorMessage.includes('call revert exception')) {
      return `Contract call failed. The contract may not support this function or is not properly deployed on ${networkConfig.name}.`;
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return `Network connection error. Please check your connection and try again.`;
    }
    if (errorMessage.includes('execution reverted')) {
      return `Transaction reverted: ${error?.reason || 'Unknown reason'}`;
    }

    return `Error: ${error?.reason || error?.shortMessage || errorMessage.slice(0, 100)}`;
  }, [networkConfig.name]);

  const fetchTokenInfo = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    setContractError(null);

    try {
      // Fetch user balances for common token IDs (0-10)
      if (userAddress) {
        const balances = new Map<string, string>();
        let hasError = false;

        for (let i = 0; i <= 10; i++) {
          try {
            const balance = await contract.balanceOf(userAddress, i);
            if (balance > 0n) {
              balances.set(i.toString(), balance.toString());
            }
          } catch (e: any) {
            // Check if this is a contract-not-found error vs token-doesn't-exist
            if (e?.message?.includes('BAD_DATA') || e?.message?.includes('could not decode result data')) {
              setContractError(parseContractError(e));
              hasError = true;
              break;
            }
            // Token ID might not exist, skip
          }
        }

        if (!hasError) {
          setUserBalances(balances);
        }
      }

      setIsConnected(true);
    } catch (error: any) {
      console.error('Error:', error);
      setContractError(parseContractError(error));
      setIsConnected(false);
    }
  }, [getReadContract, userAddress, networkConfig.name, parseContractError]);

  useEffect(() => {
    if (contractAddress && rpcUrl) {
      fetchTokenInfo();
    }
  }, [contractAddress, rpcUrl, fetchTokenInfo, userAddress]);

  const handleTransaction = async (
    operation: () => Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    console.log('[ERC1155] handleTransaction called, walletConnected:', walletConnected, 'txStatus:', txStatus.status);

    if (txStatus.status === 'pending') {
      console.log('[ERC1155] Transaction already pending, skipping');
      return;
    }

    if (!walletConnected) {
      console.log('[ERC1155] Wallet not connected');
      setTxStatus({ status: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirming...' });
      console.log('[ERC1155] Executing operation...');
      const tx = await operation();
      console.log('[ERC1155] Transaction submitted:', tx.hash);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', hash: tx.hash });
      await tx.wait();
      console.log('[ERC1155] Transaction confirmed');
      setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
      fetchTokenInfo();
    } catch (error: any) {
      console.error('[ERC1155] Transaction error:', error);
      const errorMsg = error.reason || error.message || error.shortMessage || 'Transaction failed';
      setTxStatus({ status: 'error', message: errorMsg });
    }
    setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
  };

  const handleSafeTransfer = async () => {
    console.log('[ERC1155] handleSafeTransfer called');
    try {
      const contract = await getWriteContract();
      if (!contract || !transferFrom || !transferTo || !transferTokenId || !transferAmount) return;
      handleTransaction(
        () => contract.safeTransferFrom(transferFrom, transferTo, transferTokenId, transferAmount, []),
        `Transferred ${transferAmount} of ID #${transferTokenId}!`
      );
    } catch (error: any) {
      console.error('[ERC1155] handleSafeTransfer error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleBatchTransfer = async () => {
    console.log('[ERC1155] handleBatchTransfer called');
    try {
      const contract = await getWriteContract();
      if (!contract || !batchTransferFrom || !batchTransferTo || !batchTokenIds || !batchAmounts) return;
      const ids = batchTokenIds.split(',').map(s => s.trim());
      const amounts = batchAmounts.split(',').map(s => s.trim());
      handleTransaction(
        () => contract.safeBatchTransferFrom(batchTransferFrom, batchTransferTo, ids, amounts, []),
        `Batch transfer completed!`
      );
    } catch (error: any) {
      console.error('[ERC1155] handleBatchTransfer error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleSetApprovalForAll = async () => {
    console.log('[ERC1155] handleSetApprovalForAll called');
    try {
      const contract = await getWriteContract();
      if (!contract || !operatorAddress) return;
      handleTransaction(
        () => contract.setApprovalForAll(operatorAddress, operatorApproved),
        `Operator ${operatorApproved ? 'approved' : 'revoked'}!`
      );
    } catch (error: any) {
      console.error('[ERC1155] handleSetApprovalForAll error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const checkBalance = async () => {
    const contract = getReadContract();
    if (!contract || !balanceCheckAddress || !balanceCheckTokenId) return;
    try {
      const balance = await contract.balanceOf(balanceCheckAddress, balanceCheckTokenId);
      setBalanceCheckResult(balance.toString());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkApprovalForAll = async () => {
    const contract = getReadContract();
    if (!contract || !approvalCheckOwner || !approvalCheckOperator) return;
    try {
      const isApproved = await contract.isApprovedForAll(approvalCheckOwner, approvalCheckOperator);
      setApprovalCheckResult(isApproved);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">ERC-1155 Multi-Token</span>
        </div>
        <p className="text-[10px] text-forge-muted">Stylus Contract Interaction</p>
      </div>

      {/* Network Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Network
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedNetwork('arbitrum-sepolia')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              selectedNetwork === 'arbitrum-sepolia'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-forge-bg border-forge-border/50 text-forge-muted hover:text-white hover:border-amber-500/50'
            )}
          >
            Arbitrum Sepolia
          </button>
          <button
            onClick={() => setSelectedNetwork('arbitrum')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              selectedNetwork === 'arbitrum'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-forge-bg border-forge-border/50 text-forge-muted hover:text-white hover:border-amber-500/50'
            )}
          >
            Arbitrum One
          </button>
          <button
            onClick={() => setSelectedNetwork('superposition')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              selectedNetwork === 'superposition'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-forge-bg border-forge-border/50 text-forge-muted hover:text-white hover:border-amber-500/50'
            )}
          >
            Superposition
          </button>
          <button
            onClick={() => setSelectedNetwork('superposition-testnet')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
              selectedNetwork === 'superposition-testnet'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-forge-bg border-forge-border/50 text-forge-muted hover:text-white hover:border-amber-500/50'
            )}
          >
            Superposition Testnet
          </button>
        </div>
      </div>

      {/* Wallet Status */}
      <div className={cn(
        'p-2.5 rounded-lg border',
        walletConnected ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'
      )}>
        <div className="flex items-center gap-2">
          <Wallet className={cn('w-3.5 h-3.5', walletConnected ? 'text-green-400' : 'text-amber-400')} />
          {walletConnected ? (
            <span className="text-[10px] text-green-300">
              Connected: <code className="text-green-400">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</code>
            </span>
          ) : (
            <span className="text-[10px] text-amber-300">Connect wallet via Wallet Auth node for write ops</span>
          )}
        </div>
      </div>

      {/* Contract Info */}
      <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-forge-muted">Contract:</span>
            {isUsingDefaultContract && (
              <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Default</span>
            )}
          </div>
          <a
            href={`${displayExplorerUrl}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1"
          >
            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Custom Contract Toggle */}
      <button
        onClick={() => setShowCustomContract(!showCustomContract)}
        className="w-full flex items-center justify-between px-3 py-2 bg-forge-bg/50 border border-forge-border/30 rounded-lg text-xs text-forge-muted hover:text-white transition-colors"
      >
        <span>Use Custom Contract</span>
        {showCustomContract ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showCustomContract && (
        <div className="p-3 rounded-lg bg-forge-bg/30 border border-forge-border/30 space-y-2">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => {
              setCustomAddress(e.target.value);
              setCustomAddressError(null);
            }}
            placeholder="0x..."
            className={cn(
              "w-full px-3 py-2 bg-forge-bg border rounded-lg text-xs text-white placeholder-forge-muted focus:outline-none",
              customAddressError ? "border-red-500/50" : "border-forge-border/50 focus:border-amber-500/50"
            )}
          />
          {customAddressError && (
            <p className="text-[10px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {customAddressError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleUseCustomContract}
              disabled={!customAddress || isValidatingContract}
              className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isValidatingContract ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Validating...
                </>
              ) : (
                'Use Custom'
              )}
            </button>
            <button
              onClick={handleUseDefaultContract}
              className="flex-1 py-1.5 bg-forge-border hover:bg-forge-muted/20 text-white rounded text-[10px] font-medium"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      <button
        onClick={fetchTokenInfo}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>

      {/* Contract Error Banner */}
      {/* {contractError && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-red-300 font-medium">Contract Error</p>
              <p className="text-[10px] text-red-400/80 mt-1">{contractError}</p>
            </div>
            <button
              onClick={() => setContractError(null)}
              className="text-red-400/60 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )} */}

      {/* Transaction Status */}
      {txStatus.status !== 'idle' && (
        <div className={cn(
          'rounded-lg p-2.5 border flex items-start gap-2',
          txStatus.status === 'pending' && 'bg-blue-500/10 border-blue-500/30',
          txStatus.status === 'success' && 'bg-emerald-500/10 border-emerald-500/30',
          txStatus.status === 'error' && 'bg-red-500/10 border-red-500/30'
        )}>
          {txStatus.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
          {txStatus.status === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {txStatus.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[10px] font-medium truncate',
              txStatus.status === 'pending' && 'text-blue-300',
              txStatus.status === 'success' && 'text-emerald-300',
              txStatus.status === 'error' && 'text-red-300'
            )}>{txStatus.message}</p>
            {txStatus.hash && (
              <a href={`${explorerUrl}/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-forge-muted hover:text-white flex items-center gap-1">
                Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Token Balances */}
      {isConnected && walletConnected && userBalances.size > 0 && (
        <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-3 h-3 text-teal-400" />
            <span className="text-[10px] text-forge-muted">Your Balances</span>
          </div>
          <div className="space-y-1">
            {Array.from(userBalances.entries()).map(([tokenId, balance]) => (
              <div key={tokenId} className="flex items-center justify-between text-[10px]">
                <span className="text-forge-muted">Token #{tokenId}:</span>
                <span className="text-white font-medium">{balance}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Operations */}
      {isConnected && walletConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-white">Write Operations</span>
          </div>

          {/* Safe Transfer */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-amber-400">Safe Transfer</span>
            <input type="text" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}
              placeholder="From (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
              placeholder="To (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={transferTokenId} onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleSafeTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Transfer
            </button>
          </div>

          {/* Batch Transfer */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-medium text-rose-400">Batch Transfer</span>
            </div>
            <input type="text" value={batchTransferFrom} onChange={(e) => setBatchTransferFrom(e.target.value)}
              placeholder="From (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchTransferTo} onChange={(e) => setBatchTransferTo(e.target.value)}
              placeholder="To (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchTokenIds} onChange={(e) => setBatchTokenIds(e.target.value)}
              placeholder="Token IDs (1, 2, 3)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchAmounts} onChange={(e) => setBatchAmounts(e.target.value)}
              placeholder="Amounts (10, 20, 30)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleBatchTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Batch Transfer
            </button>
          </div>

          {/* Set Approval For All */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium text-blue-400">Set Approval For All</span>
            </div>
            <input type="text" value={operatorAddress} onChange={(e) => setOperatorAddress(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={operatorApproved} onChange={(e) => setOperatorApproved(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-forge-bg border-forge-border" />
              <span className="text-[10px] text-forge-muted">Grant Approval</span>
            </label>
            <button onClick={handleSetApprovalForAll} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              {operatorApproved ? 'Grant' : 'Revoke'} Access
            </button>
          </div>
        </div>
      )}

      {/* Read Operations */}
      {isConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-white">Read Operations</span>
          </div>

          {/* Balance Of */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-amber-400">Balance Of</span>
            <input type="text" value={balanceCheckAddress} onChange={(e) => setBalanceCheckAddress(e.target.value)}
              placeholder="Account (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={balanceCheckTokenId} onChange={(e) => setBalanceCheckTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkBalance}
              className="w-full py-1.5 bg-amber-600/50 hover:bg-amber-600 text-white rounded text-[10px] font-medium">
              Check Balance
            </button>
            {balanceCheckResult !== null && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                <p className="text-[10px] text-amber-300">Balance: <span className="font-medium text-white">{balanceCheckResult}</span></p>
              </div>
            )}
          </div>

          {/* Is Approved For All */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium text-blue-400">Is Approved For All</span>
            </div>
            <input type="text" value={approvalCheckOwner} onChange={(e) => setApprovalCheckOwner(e.target.value)}
              placeholder="Account (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={approvalCheckOperator} onChange={(e) => setApprovalCheckOperator(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkApprovalForAll}
              className="w-full py-1.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded text-[10px] font-medium">
              Check Approval
            </button>
            {approvalCheckResult !== null && (
              <div className={cn(
                'p-2 rounded border',
                approvalCheckResult ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              )}>
                <p className={cn('text-[10px] font-medium', approvalCheckResult ? 'text-emerald-300' : 'text-red-300')}>
                  {approvalCheckResult ? '✓ Operator approved' : '✗ Operator not approved'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
