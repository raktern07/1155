/**
 * ERC-1155 Multi-Token Library
 * 
 * Utilities for interacting with the deployed multi-token
 */

import { 
  getCollectionInfo, 
  getBalance,
  getBalanceOfBatch,
  mint, 
  mintBatch,
  burn,
  burnBatch,
  type CollectionInfo,
} from '@cradle/erc1155-stylus';
import type { Address } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC1155_ADDRESS as Address;
const RPC_ENDPOINT = 'https://sepolia-rollup.arbitrum.io/rpc';

export async function fetchCollectionInfo(): Promise<CollectionInfo> {
  return getCollectionInfo(CONTRACT_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address, tokenId: bigint): Promise<string> {
  const balance = await getBalance(CONTRACT_ADDRESS, account, tokenId, RPC_ENDPOINT);
  return balance.formatted;
}

export async function fetchBalanceBatch(accounts: Address[], tokenIds: bigint[]): Promise<string[]> {
  const balances = await getBalanceOfBatch(CONTRACT_ADDRESS, accounts, tokenIds, RPC_ENDPOINT);
  return balances.map(b => b.formatted);
}

export async function mintTokens(
  to: Address, 
  tokenId: bigint,
  amount: string, 
  privateKey: string
): Promise<string> {
  return mint(CONTRACT_ADDRESS, to, tokenId, amount, privateKey, RPC_ENDPOINT);
}

export async function mintTokensBatch(
  to: Address, 
  tokenIds: bigint[],
  amounts: string[], 
  privateKey: string
): Promise<string> {
  return mintBatch(CONTRACT_ADDRESS, to, tokenIds, amounts, privateKey, RPC_ENDPOINT);
}

export async function burnTokens(
  tokenId: bigint,
  amount: string, 
  privateKey: string
): Promise<string> {
  return burn(CONTRACT_ADDRESS, tokenId, amount, privateKey, RPC_ENDPOINT);
}

export async function burnTokensBatch(
  tokenIds: bigint[],
  amounts: string[], 
  privateKey: string
): Promise<string> {
  return burnBatch(CONTRACT_ADDRESS, tokenIds, amounts, privateKey, RPC_ENDPOINT);
}

export const MULTITOKEN_CONFIG = {
  name: 'My Multi-Token Collection',
  baseUri: 'https://api.example.com/metadata/',
  network: 'arbitrum-sepolia',
  features: ["ownable","mintable","burnable","pausable","supply-tracking","batch-operations"],
} as const;
