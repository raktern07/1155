# @cradle/erc1155-stylus

ERC-1155 Multi-Token implementation and interaction utilities for Arbitrum Stylus.

## Features

- **Ownable** - Owner-controlled contract management
- **Mintable** - Owner can mint new tokens (single or batch)
- **Burnable** - Token holders can burn their tokens
- **Pausable** - Owner can pause/unpause transfers
- **Supply Tracking** - Track total supply per token ID
- **URI Management** - Flexible metadata URI system
- **Batch Operations** - Efficient batch transfers and minting
- Complete ERC-1155 standard implementation with metadata
- React hooks for easy frontend integration

## Installation

```bash
pnpm add @cradle/erc1155-stylus
```

## Smart Contract

The smart contract source code is located in the `contract/` directory. This is a Rust-based Stylus contract that can be deployed to Arbitrum.

### Prerequisites

1. Install Rust and Cargo:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install cargo-stylus:
   ```bash
   cargo install cargo-stylus
   ```

3. Add the WASM target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Building the Contract

```bash
cd contract

# Check the contract compiles correctly
cargo stylus check

# Build for deployment
cargo build --release --target wasm32-unknown-unknown
```

### Deploying to Arbitrum

#### Arbitrum Sepolia (Testnet)

```bash
cd contract
cargo stylus deploy \
  --private-key <YOUR_PRIVATE_KEY> \
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

#### Arbitrum One (Mainnet)

```bash
cd contract
cargo stylus deploy \
  --private-key <YOUR_PRIVATE_KEY> \
  --endpoint https://arb1.arbitrum.io/rpc
```

### Initializing the Contract

After deployment, call the `initialize` function with your parameters:

```rust
// Function signature:
initialize(
    base_uri: String,    // Base URI for metadata (e.g., "https://api.example.com/metadata/")
    owner: Address       // Owner address
)
```

### Contract Functions

#### ERC-1155 Standard
- `uri(id)` - Returns the metadata URI for a token ID
- `balanceOf(account, id)` - Returns the balance of a token for an account
- `balanceOfBatch(accounts, ids)` - Returns the balances for multiple account/id pairs
- `setApprovalForAll(operator, approved)` - Set operator approval for all tokens
- `isApprovedForAll(account, operator)` - Check if operator is approved
- `safeTransferFrom(from, to, id, amount, data)` - Transfer a token
- `safeBatchTransferFrom(from, to, ids, amounts, data)` - Batch transfer tokens

#### Supply Tracking
- `totalSupply(id)` - Returns total supply for a token ID
- `exists(id)` - Check if a token ID exists

#### Mintable (Owner Only)
- `mint(to, id, amount, data)` - Mint tokens of a specific ID
- `mintNew(to, amount)` - Mint a new token type with auto-incremented ID
- `mintBatch(to, ids, amounts, data)` - Batch mint multiple token types

#### Burnable
- `burn(id, amount)` - Burn caller's tokens
- `burnFrom(from, id, amount)` - Burn tokens (must be approved)
- `burnBatch(ids, amounts)` - Batch burn multiple token types

#### Pausable (Owner Only)
- `pause()` - Pause transfers
- `unpause()` - Unpause transfers
- `isPaused()` - Check if paused

#### Ownable
- `owner()` - Get current owner
- `setUri(newUri)` - Update base URI
- `transferOwnership(newOwner)` - Transfer ownership
- `renounceOwnership()` - Renounce ownership

#### ERC-165
- `supportsInterface(interfaceId)` - Check supported interfaces

## Frontend Usage

### Using React Hooks

```tsx
import { useERC1155Interactions, CHAIN_IDS } from '@cradle/erc1155-stylus';

function MultiTokenDashboard() {
  const token = useERC1155Interactions({
    contractAddress: '0x...', // Your deployed contract address
    network: 'arbitrum-sepolia',
    userAddress: '0x...',
  });

  return (
    <div>
      <p>Owner: {token.contractInfo.data?.owner}</p>
      <p>Base URI: {token.contractInfo.data?.baseUri}</p>
      <button onClick={() => token.mint('0x...', BigInt(1), BigInt(100))}>
        Mint 100 of Token ID 1
      </button>
    </div>
  );
}
```

### Using Interaction Functions Directly

```tsx
import { getContractInfo, getBalance, mint } from '@cradle/erc1155-stylus';

// Get contract information
const info = await getContractInfo({
  contractAddress: '0x...',
  network: 'arbitrum-sepolia',
});

console.log(info.owner, info.baseUri);

// Get balance for token ID 1
const balance = await getBalance({
  contractAddress: '0x...',
  network: 'arbitrum-sepolia',
  account: '0x...',
  tokenId: BigInt(1),
});

console.log('Balance:', balance.toString());
```

## API Reference

### Constants

- `ERC1155_ABI` - Full ABI for ERC1155 Stylus contract
- `CHAIN_IDS` - Chain IDs for supported networks
- `RPC_ENDPOINTS` - Default RPC endpoints
- `FACTORY_ADDRESSES` - Factory contract addresses

### Hooks

- `useERC1155Interactions` - Hook for interacting with deployed multi-token contracts

### Functions

- `getContractInfo` - Get contract information
- `getTokenTypeInfo` - Get info for a specific token ID
- `getBalance` - Get token balance for a specific ID
- `getBalanceBatch` - Get balances for multiple token IDs
- `isApprovedForAll` - Check operator approval
- `setApprovalForAll` - Set operator approval
- `safeTransferFrom` - Transfer tokens
- `safeBatchTransferFrom` - Batch transfer tokens
- `mint` - Mint tokens (owner only)
- `mintNew` - Mint a new token type (owner only)
- `mintBatch` - Batch mint tokens (owner only)
- `burn` - Burn tokens
- `burnBatch` - Batch burn tokens
- `setUri` - Update base URI (owner only)
- `pause` - Pause transfers (owner only)
- `unpause` - Unpause transfers (owner only)
- `transferOwnership` - Transfer contract ownership

## Metadata Structure

Your token metadata should follow the ERC-1155 metadata format. For token ID `1`, the URI would be:
`{base_uri}1.json`

Example metadata JSON:
```json
{
  "name": "Gold Coin",
  "description": "A shiny gold coin for in-game currency",
  "image": "https://example.com/images/gold-coin.png",
  "decimals": 0,
  "properties": {
    "rarity": "common",
    "type": "currency"
  }
}
```

## Use Cases for ERC-1155

1. **Gaming Assets** - Multiple item types (swords, potions, armor) in one contract
2. **Event Tickets** - Different ticket tiers with varying quantities
3. **Membership Tokens** - Multiple membership levels
4. **Collectibles** - Trading cards with varying rarity
5. **DeFi Positions** - LP tokens for multiple pools

## License

MIT OR Apache-2.0
