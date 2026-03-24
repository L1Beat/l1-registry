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
FOLDER_NAME=$(basename "$FOLDER")

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

# Data integrity checks
echo "4️⃣  Validating data integrity..."
python3 << EOF
import json
import re
import sys

TEMPLATE_STRINGS = [
    'subnet-id-here', 'blockchain-id-here', 'chain-slug',
    'vm-id-here', 'rpc-url-here', 'Chain Name', 'My Chain',
    'Describe your', 'https://your-', 'TEMPLATE',
]

URL_PATTERN = re.compile(r'^https?://[^\s/\$.?#].[^\s]*\$')

def has_template_value(obj, path=''):
    if isinstance(obj, str):
        for t in TEMPLATE_STRINGS:
            if t.lower() in obj.lower():
                return f"template placeholder at '{path}': {obj!r}"
    elif isinstance(obj, dict):
        for k, v in obj.items():
            r = has_template_value(v, f"{path}.{k}")
            if r: return r
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            r = has_template_value(v, f"{path}[{i}]")
            if r: return r
    return None

try:
    with open('$FOLDER/chain.json') as f:
        data = json.load(f)

    errors = []
    warnings = []
    folder = '$FOLDER_NAME' if '$FOLDER_NAME' else '$FOLDER'

    # Category casing
    for cat in data.get('categories', []):
        if isinstance(cat, str) and cat != cat.upper():
            errors.append(f"category '{cat}' must be uppercase - use '{cat.upper()}'")

    # Template value rejection
    result = has_template_value(data, folder)
    if result:
        errors.append(result)

    # URL format validation
    for field in ['logo', 'website']:
        url = data.get(field, '')
        if url and not URL_PATTERN.match(url):
            errors.append(f"'{field}' is not a valid URL: {url!r}")
    for social in data.get('socials', []):
        url = social.get('url', '')
        if url and not URL_PATTERN.match(url):
            errors.append(f"social url is not a valid URL: {url!r}")
    for chain in data.get('chains', []):
        for rpc in chain.get('rpcUrls', []):
            if rpc and not URL_PATTERN.match(rpc):
                errors.append(f"rpcUrl is not a valid URL: {rpc!r}")
        nt = chain.get('nativeToken', {})
        logo_uri = nt.get('logoUri', '') if isinstance(nt, dict) else ''
        if logo_uri and not URL_PATTERN.match(logo_uri):
            errors.append(f"nativeToken.logoUri is not a valid URL: {logo_uri!r}")

    # nativeToken completeness
    for idx, chain in enumerate(data.get('chains', [])):
        nt = chain.get('nativeToken', {})
        if not isinstance(nt, dict):
            continue
        for field in ['symbol', 'name', 'decimals']:
            val = nt.get(field)
            if val is None or val == '':
                errors.append(f"chains[{idx}].nativeToken.{field} required and cannot be empty")
        evm_id = chain.get('evmChainId')
        if evm_id is None:
            errors.append(f"chains[{idx}].evmChainId cannot be null")
        logo_uri = nt.get('logoUri', '')
        if logo_uri == '' or logo_uri is None:
            warnings.append(f"chains[{idx}].nativeToken.logoUri is empty (warning only)")

    if warnings:
        print("Warnings:")
        for w in warnings:
            print(f"  - {w}")

    if errors:
        print("Data integrity errors:")
        for e in errors:
            print(f"  ERROR: {e}")
        sys.exit(1)
    else:
        print("All integrity checks passed")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

echo ""

# Check folder naming
echo "5️⃣  Checking folder name..."
if [[ ! "$FOLDER_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Folder name must be lowercase and hyphenated (e.g., 'my-chain-name')"
    exit 1
fi
echo "Folder name follows convention"
echo ""

# Success
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Validation passed for $FOLDER!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
