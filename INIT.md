# L1 Registry Initialization Guide

## Purpose

This guide provides comprehensive instructions for adding new Avalanche L1 chains to the registry. All submissions must contain accurate, verifiable data with proper sourcing.

## Data Integrity Requirements

### Verification Standards

**ALL data submitted must be:**
- Verifiable through official sources
- Accurate and up-to-date
- Free from manipulation or tampering
- Sourced from authoritative channels

**Prohibited Actions:**
- Submitting false or misleading information
- Tampering with blockchain IDs, subnet IDs, or technical identifiers
- Using unofficial or modified data
- Providing non-functional RPC endpoints
- Submitting placeholder or dummy data
- Misrepresenting chain capabilities or status

### Evidence Requirements

When adding a new chain, you must be able to provide:

1. **Official Documentation**: Link to official chain documentation
2. **Blockchain Explorer**: Live explorer showing chain activity
3. **RPC Verification**: Working RPC endpoints that respond to queries
4. **Social Verification**: Official social media accounts
5. **Subnet Verification**: Subnet ID verifiable on Avalanche network

## Step-by-Step Chain Addition

### 1. Gather Required Information

Before starting, collect the following from **official sources only**:

#### L1 Level Information
- `subnetId`: Avalanche subnet identifier (from Avalanche subnet registry)
- `network`: "mainnet" or "fuji" (verify on Avalanche network)
- `categories`: Chain focus areas (DeFi, Gaming, NFT, Infrastructure, etc.)
- `name`: Official chain name (from official documentation)
- `description`: Clear explanation of chain purpose (50-200 characters)
- `logo`: Official logo URL (must be publicly accessible, HTTPS preferred)
- `website`: Official website URL (must be live and functional)
- `socials`: Official social media links (verified accounts only)

#### Blockchain Level Information
- `blockchainId`: Avalanche blockchain identifier (from chain documentation)
- `name`: Blockchain name
- `evmChainId`: EVM chain ID (from chainlist.org or official docs)
- `vmName`: Virtual machine name (typically "EVM")
- `vmId`: VM identifier (from Avalanche documentation)
- `rpcUrls`: Working RPC endpoint URLs (must respond to eth_blockNumber)
- `nativeToken`: Token symbol, name, decimals, logoUri
- `sybilResistanceType`: "Proof of Stake" or "Proof of Authority"
- `explorerUrl`: Block explorer URL (must be live)

### 2. Verify Data Sources

**Critical**: Verify each piece of data against official sources:

| Field | Verification Method |
|-------|-------------------|
| `subnetId` | Check Avalanche subnet explorer or Glacier API |
| `blockchainId` | Verify on chain explorer or official docs |
| `evmChainId` | Test via RPC: `eth_chainId` call |
| `rpcUrls` | Test via RPC: `eth_blockNumber` call |
| `website` | Must load successfully (200 status) |
| `logo` | Must be accessible (200 status) |
| `explorerUrl` | Must be functional block explorer |
| `socials` | Verify accounts are official (check website links) |

### 3. Create Chain Directory

```bash
# Use lowercase, hyphenated naming
# Examples: "defi-kingdoms", "beam-subnet", "dexalot"
mkdir data/your-chain-name
```

**Naming Rules:**
- All lowercase letters
- Replace spaces with hyphens (-)
- Remove special characters
- No underscores or camelCase
- Match official branding (simplified)

### 4. Create chain.json

Copy the template and fill with verified data:

```bash
cp data/_TEMPLATE/chain.json data/your-chain-name/
```

**Example with proper sourcing:**

```json
{
  "subnetId": "2ebCneCbwthjQ1rYT41nhd7M76Hc6YmosMAQrTFhBq8qeqh6tt",
  "isL1": true,
  "network": "mainnet",
  "categories": ["DeFi", "Trading"],
  "name": "Dexalot",
  "description": "Decentralized exchange built on Avalanche with on-chain order books",
  "logo": "https://raw.githubusercontent.com/Dexalot/token-list/main/logos/dexalot.png",
  "website": "https://dexalot.com",
  "socials": [
    {
      "name": "twitter",
      "url": "https://twitter.com/dexalot"
    },
    {
      "name": "discord",
      "url": "https://discord.gg/dexalot"
    },
    {
      "name": "medium",
      "url": "https://medium.com/dexalot"
    }
  ],
  "chains": [
    {
      "blockchainId": "yjMd8AXe6mVkVYbH5H5MvGhizP1FHiLD6W8hNC5F5qJFZ52dh",
      "name": "Dexalot Subnet",
      "description": "High-performance DEX with on-chain order books",
      "evmChainId": 432204,
      "vmName": "SubnetEVM",
      "vmId": "srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy",
      "sybilResistanceType": "Proof of Stake",
      "explorerUrl": "https://subnets.avax.network/dexalot",
      "rpcUrls": [
        "https://subnets.avax.network/dexalot/mainnet/rpc"
      ],
      "nativeToken": {
        "symbol": "ALOT",
        "name": "Dexalot Token",
        "decimals": 18,
        "logoUri": "https://raw.githubusercontent.com/Dexalot/token-list/main/logos/alot.png"
      }
    }
  ]
}
```

### 5. Create README.md

Copy template and document the chain:

```bash
cp data/_TEMPLATE/README.md data/your-chain-name/
```

Update with accurate information from official sources. Include last updated date.

### 6. Validate Before Submission

**Required validation steps:**

```bash
# 1. Check JSON syntax
cat data/your-chain-name/chain.json | jq .

# 2. Test RPC endpoint
curl -X POST https://your-rpc-url \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 3. Verify URLs are accessible
curl -I https://your-website.com
curl -I https://your-logo-url.png

# 4. Validate chain ID via RPC
curl -X POST https://your-rpc-url \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### 7. Source Documentation

**Best Practice**: Include sources in your PR description:

```markdown
## Data Sources

- Subnet ID: https://subnets.avax.network/
- Chain Documentation: https://docs.yourchain.com
- RPC Endpoints: https://chainlist.org/chain/12345
- Social Media: https://yourchain.com (footer links)
- Token Info: https://yourchain.com/tokenomics
```

## Common Data Sources

### Official Sources (Trusted)
- Avalanche Subnet Explorer: https://subnets.avax.network/
- Glacier API: https://glacier-api.avax.network/
- ChainList: https://chainlist.org/
- Official chain documentation
- Official chain websites
- Verified social media accounts

### Verification Tools
```bash
# Test RPC endpoint responds
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Verify chain ID matches
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check URL accessibility
curl -I YOUR_URL
```

## Automated Validation

All PRs are automatically validated for:

1. **JSON Validity**: Proper JSON syntax
2. **Required Fields**: All mandatory fields present
3. **URL Testing**: Website, logo, social links must load
4. **RPC Validation**: RPC endpoints must respond
5. **Folder Structure**: Correct naming and file presence
6. **Data Quality**: Description length, subnet ID format
7. **Duplicate Detection**: No duplicate subnet IDs

## Red Flags - Automatic Rejection

Submissions will be rejected if they contain:

- Non-functional RPC endpoints
- Inaccessible URLs (404, 403, timeouts)
- Invalid subnet or blockchain IDs
- Mismatched chain IDs (JSON vs RPC response)
- Placeholder or template data unchanged
- Unverifiable social media accounts
- Missing required fields
- Invalid JSON syntax
- Incorrect folder naming

## Data Enrichment

After approval, the following fields may be auto-populated via Glacier API:

- `isL1`: Determined from subnet type
- `nativeToken.logoUri`: Extracted from chain data if not provided
- `sybilResistanceType`: Mapped from known subnets

**Do not** manually set these unless you have definitive information.

## Contribution Workflow

```bash
# 1. Fork repository
git clone https://github.com/YOUR_USERNAME/l1-registry
cd l1-registry

# 2. Create branch
git checkout -b add-your-chain

# 3. Add chain data (following this guide)
mkdir data/your-chain
# ... create chain.json and README.md

# 4. Validate locally
cat data/your-chain/chain.json | jq .

# 5. Commit with clear message
git add data/your-chain/
git commit -m "add: Your Chain Name"

# 6. Push and create PR
git push origin add-your-chain
```

## PR Template Checklist

When creating your PR, ensure:

- [ ] All data sourced from official channels
- [ ] RPC endpoints tested and functional
- [ ] All URLs accessible (website, logo, socials)
- [ ] Chain ID verified via RPC call
- [ ] Subnet ID verified on Avalanche network
- [ ] Folder name follows naming convention
- [ ] Both chain.json and README.md created
- [ ] JSON syntax valid
- [ ] No placeholder data remaining
- [ ] Data sources documented in PR description

## Security and Trust

### Why Data Integrity Matters

The L1 Registry serves as a trusted source for:
- Analytics platforms (L1Beat)
- Wallet integrations
- Developer tools
- Community resources

Inaccurate data can:
- Break integrations
- Mislead users
- Compromise security
- Damage ecosystem trust

### Reporting Issues

If you discover inaccurate data in existing entries:

1. Open an issue with evidence
2. Reference official sources
3. Provide corrected data
4. Submit PR with fixes

## Questions and Support

- Review existing chains in `data/` for examples
- Check `data/_TEMPLATE/` for structure
- Consult CONTRIBUTING.md for process details
- Open GitHub issue for questions
- Join community Discord for support

## Version History

- 1.2.2: Current version with Glacier enrichment
- 1.2.1: Added isL1, logoUri, sybilResistanceType support
- 1.2.0: Enhanced RPC validation
- 1.0.0: Initial registry release

---

**Remember**: Quality over speed. Take time to verify all data before submission.
