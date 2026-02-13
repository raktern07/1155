/**
 * ERC-1155 Multi-Token Deployment Script
 * 
 * Usage: ts-node scripts/deploy-erc1155.ts
 */

import { deployERC1155CollectionViaAPI } from '@cradle/erc1155-stylus';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const apiUrl = process.env.ERC1155_DEPLOYMENT_API_URL || 'http://localhost:4002';
  const rpcEndpoint = process.env.RPC_ENDPOINT || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  console.log('Deploying ERC-1155 multi-token...');
  console.log('Name:', 'My Multi-Token Collection');
  console.log('Base URI:', 'https://api.example.com/metadata/');
  console.log('Network:', 'arbitrum-sepolia');

  const result = await deployERC1155CollectionViaAPI({
    name: 'My Multi-Token Collection',
    baseUri: 'https://api.example.com/metadata/',
    privateKey,
    rpcEndpoint,
    deploymentApiUrl: apiUrl,
  });

  console.log('\n✅ Multi-token deployed successfully!');
  console.log('Contract Address:', result.collectionAddress);
  console.log('Transaction Hash:', result.txHash);
  console.log('\nAdd this to your .env file:');
  console.log(`NEXT_PUBLIC_ERC1155_ADDRESS=${result.collectionAddress}`);
}

main().catch(console.error);
