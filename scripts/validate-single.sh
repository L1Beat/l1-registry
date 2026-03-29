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
if [[ "$FOLDER" =~ ^data/ ]]; then
    FOLDER=$(basename "$FOLDER")
fi

node "$(dirname "$0")/validate-all.js" --single "$FOLDER"
