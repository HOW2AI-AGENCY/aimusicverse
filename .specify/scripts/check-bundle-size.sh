#!/bin/bash
# T002: Bundle Size Monitoring Script
# Checks if production bundle size exceeds 950KB limit (gzipped)

set -e

LIMIT_KB=950
DIST_DIR="dist/assets"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking bundle size..."

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}❌ Error: $DIST_DIR directory not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Calculate total gzipped JS bundle size
TOTAL_SIZE_BYTES=$(find "$DIST_DIR" -name "*.js.gz" -type f -exec stat -c%s {} \; | awk '{sum+=$1} END {print sum}')
TOTAL_SIZE_KB=$((TOTAL_SIZE_BYTES / 1024))

echo ""
echo "📦 Bundle Size Report:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total (gzipped): ${TOTAL_SIZE_KB} KB"
echo "Limit:           ${LIMIT_KB} KB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Top 10 largest chunks
echo ""
echo "📊 Top 10 Largest Chunks (gzipped):"
find "$DIST_DIR" -name "*.js.gz" -type f -exec stat -c'%s %n' {} \; | \
  sort -rn | head -10 | \
  awk '{printf "  %6d KB  %s\n", $1/1024, $2}' | \
  sed 's|dist/assets/||g'

echo ""

# Check if over limit
if [ "$TOTAL_SIZE_KB" -gt "$LIMIT_KB" ]; then
  OVER_BY=$((TOTAL_SIZE_KB - LIMIT_KB))
  PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($TOTAL_SIZE_KB/$LIMIT_KB - 1) * 100}")
  echo -e "${RED}❌ FAILED: Bundle size exceeds limit by ${OVER_BY} KB (+${PERCENTAGE}%)${NC}"
  echo ""
  echo "⚠️  Action Required:"
  echo "  1. Run 'npm run build' and check stats.html for analysis"
  echo "  2. Consider lazy loading heavy components"
  echo "  3. Check for duplicate dependencies"
  echo "  4. Review vendor chunk splitting strategy"
  exit 1
else
  UNDER_BY=$((LIMIT_KB - TOTAL_SIZE_KB))
  PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", (1 - $TOTAL_SIZE_KB/$LIMIT_KB) * 100}")
  echo -e "${GREEN}✅ PASSED: Bundle size is ${UNDER_BY} KB under limit (-${PERCENTAGE}%)${NC}"
  exit 0
fi
