#!/bin/bash

# Build verification script to prevent empty vendor chunks
# This script ensures that the Vite build produces proper chunk sizes

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

echo "🔍 Verifying build output..."

# Minimum size thresholds
MIN_VENDOR_SIZE=10000  # 10KB minimum for vendor chunks
MIN_MAIN_SIZE=500      # 500 bytes minimum for main chunk

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
shopt -s nullglob  # Make glob return empty if no matches
vendor_files=(dist/assets/vendor-*.js)
if [ ${#vendor_files[@]} -eq 0 ]; then
  echo "⚠️  Warning: No vendor chunks found"
else
  for file in "${vendor_files[@]}"; do
    # Get file size (works on both macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f%z "$file")
    else
      size=$(stat -c%s "$file")
    fi
    
    filename=$(basename "$file")
    
    if [ $size -lt $MIN_VENDOR_SIZE ]; then
      echo "❌ FAIL: $filename is too small ($size bytes)"
      ISSUES_FOUND=1
    else
      # Format size for human readability
      size_kb=$((size / 1024))
      echo "✅ PASS: $filename ($size_kb KB)"
    fi
  done
fi

# Check main index chunk
echo ""
echo "Checking main chunks..."
main_files=(dist/assets/index-*.js)
if [ ${#main_files[@]} -eq 0 ]; then
  echo "❌ Error: No main index chunks found"
  ISSUES_FOUND=1
else
  for file in "${main_files[@]}"; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
      size=$(stat -f%z "$file")
    else
      size=$(stat -c%s "$file")
    fi
    
    filename=$(basename "$file")
    
    if [ $size -lt $MIN_MAIN_SIZE ]; then
      echo "❌ FAIL: $filename is suspiciously small ($size bytes)"
      ISSUES_FOUND=1
    else
      size_kb=$((size / 1024))
      echo "✅ PASS: $filename ($size_kb KB)"
    fi
  done
fi

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
