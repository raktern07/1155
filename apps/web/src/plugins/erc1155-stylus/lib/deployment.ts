/**
 * ERC1155 Multi-Token Deployment Functions
 */

import { ethers } from 'ethers';
import type { Address } from 'viem';
import { 
  FACTORY_ADDRESSES, 
  RPC_ENDPOINTS, 
  TOKEN_FACTORY_ABI, 
  ERC1155_ABI,
  type SupportedNetwork,
} from './constants';
import type { DeployMultiTokenParams, DeployMultiTokenResult } from './types';

/**
 * Deploy an ERC1155 multi-token via the deployment API
 * This calls the backend service which handles cargo-stylus deployment
 */
export async function deployERC1155CollectionViaAPI(
  params: DeployMultiTokenParams & {
    privateKey: string;
    rpcEndpoint: string;
    deploymentApiUrl: string;
  }
): Promise<DeployMultiTokenResult> {
  const { baseUri, factoryAddress, privateKey, rpcEndpoint, deploymentApiUrl } = params;

  const response = await fetch(`${deploymentApiUrl}/deploy-erc1155`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      baseUri,
      factoryAddress,
      privateKey,
      rpcEndpoint,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Deployment failed with status ${response.status}`);
  }

  const result = await response.json();
  
  return {
    contractAddress: result.contractAddress as Address,
    txHash: result.txHash || '0x',
    success: result.success,
    deployOutput: result.deployOutput,
    initOutput: result.initOutput,
    registerOutput: result.registerOutput,
  };
}

/**
 * Initialize an already deployed ERC1155 multi-token
 */
export async function initializeMultiToken(
  contractAddress: Address,
  baseUri: string,
  privateKey: string,
  rpcEndpoint: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);

  const tx = await contract.initialize(baseUri, wallet.address);
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Register multi-token in factory
 */
export async function registerMultiTokenInFactory(
  contractAddress: Address,
  baseUri: string,
  factoryAddress: Address,
  privateKey: string,
  rpcEndpoint: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const wallet = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, wallet);

  const tx = await factory.registerMultiToken(contractAddress, baseUri);
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Check if multi-token is already registered in factory
 */
export async function isMultiTokenRegistered(
  contractAddress: Address,
  factoryAddress: Address,
  rpcEndpoint: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);

  try {
    const allContracts = await factory.getAllDeployedContracts();
    return allContracts.some(
      (addr: string) => addr.toLowerCase() === contractAddress.toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Get factory address for network
 */
export function getFactoryAddress(network: SupportedNetwork): Address {
  return FACTORY_ADDRESSES[network];
}
/**
 * Get RPC endpoint for network
 */
export function getRpcEndpoint(network: SupportedNetwork): string {
  return RPC_ENDPOINTS[network];
}

