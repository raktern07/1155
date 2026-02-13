# ERC-1155 Multi-Token

# My Multi-Token Collection

An ERC-1155 multi-token deployed on Arbitrum Sepolia using Stylus.

## Collection Details

- **Name:** My Multi-Token Collection
- **Base URI:** https://api.example.com/metadata/
- **Network:** arbitrum-sepolia
- **Features:** ownable, mintable, burnable, pausable, supply-tracking, batch-operations

## Deployment

```bash
pnpm deploy:multitoken
```

This will deploy the multi-token contract and output the contract address.

## Usage

### Get Collection Info

```typescript
import { fetchCollectionInfo } from '@/lib/erc1155-multitoken';

const info = await fetchCollectionInfo();
console.log(info.name, info.baseUri);
```

### Check Balance

```typescript
import { fetchBalance } from '@/lib/erc1155-multitoken';

const balance = await fetchBalance('0x...', 1n); // Check balance of token ID 1
console.log(balance);
```

### Mint Tokens (Owner Only)

```typescript
import { mintTokens } from '@/lib/erc1155-multitoken';

await mintTokens('0x...', 1n, '100', privateKey); // Mint 100 of token ID 1
```

### Batch Mint

```typescript
import { mintTokensBatch } from '@/lib/erc1155-multitoken';

await mintTokensBatch('0x...', [1n, 2n, 3n], ['100', '50', '25'], privateKey);
```

### Transfer Tokens

Use the `safeTransferFrom` function through the interaction panel or SDK.

## Contract Features

- **ownable**: Enabled
- **mintable**: Enabled
- **burnable**: Enabled
- **pausable**: Enabled
- **supply-tracking**: Enabled
- **batch-operations**: Enabled

## ERC-1155 Standard

ERC-1155 is a multi-token standard that allows:
- Multiple token types (fungible and non-fungible) in a single contract
- Batch operations for efficiency
- Safe transfer mechanisms
- Metadata URIs per token type
