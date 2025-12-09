#!/bin/bash

# Build verification script to prevent empty vendor chunks
# This script ensures that the Vite build produces proper chunk sizes

set -e  # Exit on error

echo "🔍 Verifying build output..."

# Minimum size for vendor chunks (10KB)
MIN_SIZE=10000

# Track if any issues found
ISSUES_FOUND=0

# Check if dist directory exists
if [ ! -d "dist/assets" ]; then
  echo "❌ Error: dist/assets directory not found"
  echo "   Run 'npm run build' first"
  exit 1
fi

# Check each vendor chunk
echo ""
echo "Checking vendor chunks..."
for file in dist/assets/vendor-*.js; do
  if [ -f "$file" ]; then
    # Get file size (works on both macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f%z "$file")
    else
      size=$(stat -c%s "$file")
    fi
    
    filename=$(basename "$file")
    
    if [ $size -lt $MIN_SIZE ]; then
      echo "❌ FAIL: $filename is too small ($size bytes)"
      ISSUES_FOUND=1
    else
      # Format size for human readability
      size_kb=$((size / 1024))
      echo "✅ PASS: $filename ($size_kb KB)"
    fi
  fi
done

# Check main index chunk
echo ""
echo "Checking main chunks..."
for file in dist/assets/index-*.js; do
  if [ -f "$file" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f%z "$file")
    else
      size=$(stat -c%s "$file")
    fi
    
    filename=$(basename "$file")
    
    if [ $size -lt 500 ]; then  # Main chunk should be at least 500 bytes
      echo "❌ FAIL: $filename is suspiciously small ($size bytes)"
      ISSUES_FOUND=1
    else
      size_kb=$((size / 1024))
      echo "✅ PASS: $filename ($size_kb KB)"
    fi
  fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ Build verification PASSED"
  echo "   All chunks have proper sizes"
  exit 0
else
  echo "❌ Build verification FAILED"
  echo "   Some chunks are too small"
  echo ""
  echo "This usually indicates an issue with tree-shaking"
  echo "configuration in vite.config.ts"
  echo ""
  echo "See: BLACK_SCREEN_FIX_TREESHAKE_2025-12-09.md"
  exit 1
fi
