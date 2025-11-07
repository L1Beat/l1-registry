# Avalanche L1 Chains Registry

A comprehensive, community-maintained registry of Avalanche L1 chains with detailed metadata, social links, and technical specifications.

[![Validate Chain Data](https://github.com/l1beat/chains-registry/actions/workflows/validate-pr.yml/badge.svg)](https://github.com/l1beat/chains-registry/actions/workflows/validate-pr.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

##  Stats

- **Total L1 Chains**: 116
- **Networks**: Mainnet, Fuji
- **Last Updated**: 2025-11-06

##  Structure

Each L1 chain has its own folder containing:

- `chain.json` - Structured chain data
- `README.md` - Human-readable documentation

```
chains-registry/
├── README.md (this file)
├── CONTRIBUTING.md (contribution guide)
├── LICENSE
├── .github/ (GitHub workflows & PR templates)
├── scripts/ (validation scripts)
└── data/ (all chain data)
    ├── _TEMPLATE/ (format reference)
    │   ├── chain.json
    │   └── README.md
    ├── dexalot/
    │   ├── chain.json
    │   └── README.md
    ├── beam/
    │   ├── chain.json
    │   └── README.md
    └── ... (116 L1 chains)
```

##  Data Format

### chain.json

```json
{
  "subnetId": "subnet-id-here",
  "network": "mainnet",
  "categories": ["DeFi", "Gaming"],
  "name": "Chain Name",
  "description": "Description of the chain",
  "logo": "https://cdn.example.com/logo.png",
  "website": "https://example.com",
  "socials": [
    { "name": "twitter", "url": "https://twitter.com/example" },
    { "name": "discord", "url": "https://discord.gg/example" }
  ],
  "chains": [
    {
      "blockchainId": "blockchain-id-here",
      "name": "Blockchain Name",
      "description": "Blockchain description",
      "evmChainId": 12345,
      "vmName": "EVM",
      "vmId": "vm-id-here",
      "rpcUrls": ["https://rpc.example.com"],
      "assets": [
        {
          "symbol": "TOKEN",
          "name": "Token Name",
          "decimals": 18
        }
      ]
    }
  ]
}
```

## Quick Start

### Browse Chains

Simply browse the folders to explore different L1 chains. Each folder contains:

- **chain.json** - Machine-readable data
- **README.md** - Human-friendly documentation

### Use the Data

```bash
# Clone the repository
git clone https://github.com/l1beat/chains-registry.git

# Access any chain's data
cat chains-registry/data/dexalot/chain.json

# Use in your application
import chainData from './chains-registry/data/dexalot/chain.json';
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

### Quick Contribution Guide

1. **Fork** this repository
2. **Create** a branch: `git checkout -b add-your-chain`
3. **Add/Update** chain data in a folder (lowercase, hyphenated name)
4. **Validate** your changes: `./scripts/validate-single.sh your-chain`
5. **Commit**: `git commit -m "Add Your Chain to registry"`
6. **Push**: `git push origin add-your-chain`
7. **Create** a Pull Request

### Validation

Before submitting a PR, validate your chain data:

```bash
# Validate a single chain
./scripts/validate-single.sh data/your-chain-name

# Or validate everything (if you have Node.js)
npm run validate
```

## Folder Naming Convention

Folder names must be:

- **Lowercase**
- **Hyphenated** (no spaces or special characters)
- **Descriptive**

Examples:

- ✅ `defi-kingdoms`
- ✅ `beam-subnet`
- ✅ `dexalot`
- ❌ `DeFi Kingdoms`
- ❌ `Beam_Subnet`
- ❌ `DEXALOT`

## Search & Filter

You can search for chains by:

- **Name**: Check folder names or `name` field in chain.json
- **Category**: Filter by categories like "DeFi", "Gaming", "NFT"
- **Network**: Mainnet or Fuji
- **Subnet ID**: Unique Avalanche subnet identifier

## Categories

Available categories:

- DeFi
- Gaming
- NFT
- Metaverse
- Infrastructure
- Finance
- Social
- Identity
- And many more...

## Data Source

Initial data generated from [SnowPeer AMDB API](https://api.snowpeer.io/v1). Community contributions keep it up-to-date.

## Data Quality

- ✅ Automated validation via GitHub Actions
- ✅ JSON schema validation
- ✅ Required fields enforcement
- ✅ Folder naming convention checks
- ✅ Community review process

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Data sourced from [SnowPeer](https://snowpeer.io)
- Built for the Avalanche L1 ecosystem
- Maintained by [L1Beat](https://l1beat.io)

## Contact

- **Website**: [l1beat.io](https://l1beat.io)
- **Issues**: [GitHub Issues](https://github.com/l1beat/chains-registry/issues)
- **Discussions**: [GitHub Discussions](https://github.com/l1beat/chains-registry/discussions)

---

**Made with ❤️ for the Avalanche community**
