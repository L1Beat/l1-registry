# Contributing to Avalanche L1 Chains Registry

Thank you for contributing to the Avalanche L1 Chains Registry! This guide will help you add or update L1 chain information.

## How to Contribute

### 1. Fork and Clone

```bash
git fork https://github.com/L1Beat/l1-registry
git clone https://github.com/YOUR_USERNAME/l1-registry
cd l1-registry
```

### 2. Create a New Branch

```bash
git checkout -b add-your-chain-name
```

### 3. Add or Update Chain Data

#### Adding a New L1

1. Create a new folder with your chain name (lowercase, hyphenated):
   ```bash
   mkdir data/your-chain-name
   ```

2. Copy the template files:
   ```bash
   cp data/_TEMPLATE/chain.json data/your-chain-name/
   cp data/_TEMPLATE/README.md data/your-chain-name/
   ```

3. Edit `data/your-chain-name/chain.json` with your chain's data:
   ```json
   {
     "subnetId": "your-subnet-id",
     "network": "mainnet",
     "categories": ["DeFi", "Gaming"],
     "name": "Your Chain Name",
     "description": "Clear description of your chain",
     "logo": "https://your-logo-url.png",
     "website": "https://yourchain.com",
     "socials": [
       { "name": "twitter", "url": "https://twitter.com/yourchain" },
       { "name": "discord", "url": "https://discord.gg/yourchain" }
     ],
     "chains": [
       {
         "blockchainId": "your-blockchain-id",
         "name": "Your Chain Name",
         "description": "Chain description",
         "evmChainId": 12345,
         "vmName": "EVM",
         "vmId": "your-vm-id",
         "sybilResistanceType": "Proof of Stake",
         "explorerUrl": "https://explorer.yourchain.com",
         "rpcUrls": ["https://rpc.yourchain.com"],
         "nativeToken": {
           "symbol": "TOKEN",
           "name": "Token Name",
           "decimals": 18,
           "logoUri": "https://yourchain.com/token-logo.png"
         }
       }
     ]
   }
   ```

4. Update `data/your-chain-name/README.md` with your chain's information

#### Updating an Existing L1

Simply edit the relevant files in the chain's folder:
- `data/chain-name/chain.json` - Update data
- `data/chain-name/README.md` - Update documentation

### 4. Validate Your Changes

Before submitting, make sure your data is valid:

```bash
# If you have Node.js installed
npm install
npm run validate

# Or check manually:
# - JSON is properly formatted
# - All required fields are present
# - URLs are valid
# - Folder name matches the chain name (lowercase, hyphenated)
```

### 5. Commit and Push

```bash
git add .
git commit -m "Add [Chain Name] to registry"
git push origin add-your-chain-name
```

### 6. Create a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Fill in the PR template with details about your changes
4. Submit!

## Data Format Requirements

### Required Fields

#### L1 Level
- `subnetId` (string) - Avalanche subnet ID
- `network` (string) - "mainnet" or "fuji"
- `categories` (array) - Categories like ["DeFi", "Gaming", "NFT"]
- `name` (string) - Chain name
- `description` (string) - Clear description
- `logo` (string) - Logo URL (preferably HTTPS)
- `website` (string) - Official website URL
- `socials` (array) - Social media links
- `chains` (array) - Blockchain details

#### Chain Level (inside chains array)
**Required:**
- `blockchainId` (string) - Avalanche blockchain ID
- `name` (string) - Blockchain name
- `evmChainId` (number) - EVM chain ID
- `vmName` (string) - Virtual machine name (usually "EVM")
- `vmId` (string) - Virtual machine ID
- `rpcUrls` (array) - Array of RPC endpoint URLs

**Optional:**
- `description` (string) - Blockchain description
- `sybilResistanceType` (string) - "Proof of Stake" or "Proof of Authority"
- `explorerUrl` (string) - Blockchain explorer URL
- `nativeToken` (object) - Native token details (symbol, name, decimals, logoUri)

### Folder Naming Convention

- Use lowercase letters
- Replace spaces with hyphens
- Remove special characters
- Examples:
  - "DeFi Kingdoms" → `defi-kingdoms`
  - "Beam Subnet" → `beam-subnet`
  - "XANA" → `xana`

### Social Media Names

Use these standardized names:
- `twitter` (not X)
- `discord`
- `telegram`
- `github`
- `medium`
- `linkedin`
- `youtube`

## Quality Guidelines

### Description
- Be clear and concise
- Explain what makes your chain unique
- Mention key features or use cases
- 1-3 sentences ideal

### Logo
- Must be publicly accessible (HTTPS preferred)
- PNG or SVG format
- Square aspect ratio preferred
- Minimum 200x200px

### Links
- All URLs must be valid and working
- Use HTTPS where possible
- Avoid redirect links

## Code of Conduct

- Be respectful and professional
- Provide accurate information
- Don't spam or submit duplicate entries
- Only submit chains you represent or have permission to add

## Questions?

If you need help, please:
- Check the `data/_TEMPLATE/` folder for examples
- Review existing chains in `data/` for reference
- Open an issue on GitHub
- Contact us on Discord

Thank you for contributing! 
