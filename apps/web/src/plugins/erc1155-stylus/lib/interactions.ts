/**
 * ERC1155 Token Interaction Functions
 */

import { ethers } from 'ethers';
import type { Address, Hash } from 'viem';
import { ERC1155_ABI } from './constants';
import type { MultiTokenInfo, TokenTypeInfo, TokenBalance } from './types';

/**
 * Get contract information
 */
export async function getContractInfo(
  contractAddress: Address,
  rpcEndpoint: string
): Promise<MultiTokenInfo> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);

  const [owner, paused] = await Promise.all([
    contract.owner(),
    contract.isPaused(),
  ]);

  // Get base URI by querying for token ID 0
  const uri = await contract.uri(BigInt(0));
  const baseUri = uri.replace('0.json', '');

  return {
    address: contractAddress,
    baseUri,
    owner: owner as Address,
    paused,
  };
}

/**
 * Get token type information
 */
export async function getTokenTypeInfo(
  contractAddress: Address,
  tokenId: bigint,
  rpcEndpoint: string
): Promise<TokenTypeInfo> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);

  const [totalSupply, exists, uri] = await Promise.all([
    contract.totalSupply(tokenId),
    contract.exists(tokenId),
    contract.uri(tokenId),
  ]);

  return {
    id: tokenId,
    totalSupply: BigInt(totalSupply),
    exists,
    uri,
  };
}

/**
 * Get balance for a specific token ID
 */
export async function getBalance(
  contractAddress: Address,
  accountAddress: Address,
  tokenId: bigint,
  rpcEndpoint: string
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);

  const balance = await contract.balanceOf(accountAddress, tokenId);
  return BigInt(balance);
}

/**
 * Get balances for multiple token IDs
 */
export async function getBalanceBatch(
  contractAddress: Address,
  accountAddress: Address,
  tokenIds: bigint[],
  rpcEndpoint: string
): Promise<TokenBalance[]> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);

  const accounts = tokenIds.map(() => accountAddress);
  const balances = await contract.balanceOfBatch(accounts, tokenIds);

  return tokenIds.map((id, index) => ({
    id,
    balance: BigInt(balances[index]),
  }));
}

/**
 * Check if operator is approved for all
 */
export async function isApprovedForAll(
  contractAddress: Address,
  accountAddress: Address,
  operatorAddress: Address,
  rpcEndpoint: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);

  return contract.isApprovedForAll(accountAddress, operatorAddress);
}

/**
 * Set approval for all tokens for an operator
 */
export async function setApprovalForAll(
  contractAddress: Address,
  operator: Address,
  approved: boolean,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.setApprovalForAll(operator, approved);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Safe transfer a single token type
 */
export async function safeTransferFrom(
  contractAddress: Address,
  from: Address,
  to: Address,
  id: bigint,
  amount: bigint,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.safeTransferFrom(from, to, id, amount, '0x');
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Safe batch transfer multiple token types
 */
export async function safeBatchTransferFrom(
  contractAddress: Address,
  from: Address,
  to: Address,
  ids: bigint[],
  amounts: bigint[],
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.safeBatchTransferFrom(from, to, ids, amounts, '0x');
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Mint tokens (owner only)
 */
export async function mint(
  contractAddress: Address,
  to: Address,
  id: bigint,
  amount: bigint,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.mint(to, id, amount, '0x');
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Mint a new token type with auto-incremented ID (owner only)
 */
export async function mintNew(
  contractAddress: Address,
  to: Address,
  amount: bigint,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.mintNew(to, amount);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Batch mint multiple token types (owner only)
 */
export async function mintBatch(
  contractAddress: Address,
  to: Address,
  ids: bigint[],
  amounts: bigint[],
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.mintBatch(to, ids, amounts, '0x');
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Burn tokens from caller's balance
 */
export async function burn(
  contractAddress: Address,
  id: bigint,
  amount: bigint,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.burn(id, amount);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Batch burn multiple token types
 */
export async function burnBatch(
  contractAddress: Address,
  ids: bigint[],
  amounts: bigint[],
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.burnBatch(ids, amounts);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Set base URI (owner only)
 */
export async function setUri(
  contractAddress: Address,
  newUri: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.setUri(newUri);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Pause the contract (owner only)
 */
export async function pause(
  contractAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.pause();
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Unpause the contract (owner only)
 */
export async function unpause(
  contractAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.unpause();
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}

/**
 * Transfer ownership (owner only)
 */
export async function transferOwnership(
  contractAddress: Address,
  newOwner: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<Hash> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.transferOwnership(newOwner);
  const receipt = await tx.wait();
  
  return receipt.hash as Hash;
}
