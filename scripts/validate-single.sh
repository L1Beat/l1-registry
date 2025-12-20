#!/bin/bash

# Validate a single L1 chain folder
# Usage: ./scripts/validate-single.sh <folder-name>
# Example: ./scripts/validate-single.sh dexalot
#          ./scripts/validate-single.sh data/dexalot

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/validate-single.sh <folder-name>"
    echo "Examples:"
    echo "  ./scripts/validate-single.sh dexalot"
    echo "  ./scripts/validate-single.sh data/dexalot"
    exit 1
fi

# Handle both "dexalot" and "data/dexalot" formats
FOLDER="$1"
if [[ ! "$FOLDER" =~ ^data/ ]]; then
    FOLDER="data/$FOLDER"
fi

if [ ! -d "$FOLDER" ]; then
    echo "❌ Error: Folder '$FOLDER' does not exist"
    exit 1
fi

echo "Validating $FOLDER..."
echo ""

# Check files exist
echo "1️⃣  Checking required files..."
if [ ! -f "$FOLDER/chain.json" ]; then
    echo "❌ Missing chain.json"
    exit 1
fi

if [ ! -f "$FOLDER/README.md" ]; then
    echo "❌ Missing README.md"
    exit 1
fi
echo "✅ Both chain.json and README.md exist"
echo ""

# Validate JSON syntax
echo "2️⃣  Validating JSON syntax..."
if ! python3 -m json.tool "$FOLDER/chain.json" > /dev/null 2>&1; then
    echo "❌ Invalid JSON syntax in chain.json"
    exit 1
fi
echo "✅ JSON syntax is valid"
echo ""

# Validate required fields
echo "3️⃣  Validating required fields..."
python3 << EOF
import json
import sys

try:
    with open('$FOLDER/chain.json') as f:
        data = json.load(f)

    errors = []
    required_fields = ['subnetId', 'network', 'categories', 'name', 'description', 'logo', 'website', 'socials', 'chains']
    required_chain_fields = ['blockchainId', 'name', 'evmChainId', 'vmName', 'vmId', 'rpcUrls']

    # Check required L1 fields
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    # Check network value
    if 'network' in data and data['network'] not in ['mainnet', 'fuji']:
        errors.append("network must be 'mainnet' or 'fuji'")

    # Check chains
    if 'chains' in data and isinstance(data['chains'], list):
        for idx, chain in enumerate(data['chains']):
            for field in required_chain_fields:
                if field not in chain:
                    errors.append(f"chains[{idx}] missing field: {field}")

    if errors:
        print("❌ Validation errors:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("✅ All required fields present")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
EOF

echo ""

# Check folder naming
echo "4️⃣  Checking folder name..."
# Extract just the folder name (remove data/ prefix if present)
FOLDER_NAME=$(basename "$FOLDER")
if [[ ! "$FOLDER_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Folder name must be lowercase and hyphenated (e.g., 'my-chain-name')"
    exit 1
fi
echo "✅ Folder name follows convention"
echo ""

# Success
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Validation passed for $FOLDER!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
