#!/bin/bash
# Download Stitch screen images and HTML using curl
# Usage: ./download-stitch-assets.sh [path-to-stitch-urls.json]
# Fill imageUrl and htmlUrl in stitch-urls.json first (from Stitch MCP)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
URLS_FILE="${1:-$SCRIPT_DIR/stitch-urls.json}"
OUTPUT_DIR="$PROJECT_ROOT/frontend/public/stitch"

if [ ! -f "$URLS_FILE" ]; then
  echo "ERROR: $URLS_FILE not found"
  echo "Fill imageUrl and htmlUrl for each screen (from Stitch MCP), then run again."
  exit 1
fi

mkdir -p "$OUTPUT_DIR/images" "$OUTPUT_DIR/html"

echo "Downloading Stitch assets from $URLS_FILE..."
echo "Output: $OUTPUT_DIR"
echo ""

# Use jq to parse JSON, or fallback to basic parsing
if command -v jq &>/dev/null; then
  count=0
  for row in $(jq -c '.screens[]' "$URLS_FILE"); do
    id=$(echo "$row" | jq -r '.id')
    name=$(echo "$row" | jq -r '.name')
    imageUrl=$(echo "$row" | jq -r '.imageUrl')
    htmlUrl=$(echo "$row" | jq -r '.htmlUrl')

    if [ -n "$imageUrl" ] && [ "$imageUrl" != "null" ]; then
      echo "  [${count}] $name: image"
      curl -L -s -o "$OUTPUT_DIR/images/${id}.png" "$imageUrl" 2>/dev/null || \
        curl -L -s -o "$OUTPUT_DIR/images/${id}.webp" "$imageUrl" 2>/dev/null || true
    fi

    if [ -n "$htmlUrl" ] && [ "$htmlUrl" != "null" ]; then
      echo "  [${count}] $name: HTML"
      curl -L -s -o "$OUTPUT_DIR/html/${id}.html" "$htmlUrl" 2>/dev/null || true
    fi

    ((count++)) || true
  done
else
  echo "Note: Install 'jq' for JSON parsing. Using basic grep/sed fallback..."
  # Simple fallback: expect one URL per line in format "id|imageUrl|htmlUrl"
  # User can export manually or we skip - for now just echo instructions
  echo "Install jq: https://stedolan.github.io/jq/"
  echo "Or manually download each URL from stitch-urls.json"
  exit 1
fi

echo ""
echo "Done. Assets in $OUTPUT_DIR"
