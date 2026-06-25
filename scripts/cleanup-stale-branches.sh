#!/bin/bash

# MusicVerse AI - Stale Branch Cleanup Script
# This script identifies and removes stale branches from the repository
#
# Usage:
#   ./cleanup-stale-branches.sh --dry-run    # Preview what would be deleted
#   ./cleanup-stale-branches.sh --execute    # Actually delete branches
#   ./cleanup-stale-branches.sh --force      # Force delete without confirmation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DAYS_THRESHOLD=30
DRY_RUN=true
FORCE=false
BACKUP_DIR=".git/refs/original-backup-$(date +%Y%m%d)"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --execute)
      DRY_RUN=false
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --days)
      DAYS_THRESHOLD="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run        Preview what would be deleted (default)"
      echo "  --execute        Actually delete branches"
      echo "  --force          Skip confirmation prompts"
      echo "  --days N         Set days threshold (default: 30)"
      echo "  --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --dry-run                 # Preview deletions"
      echo "  $0 --execute                 # Delete stale branches"
      echo "  $0 --execute --days 60       # Delete 60+ day old branches"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== MusicVerse AI - Stale Branch Cleanup ===${NC}"
echo ""
echo "Configuration:"
echo "  Days threshold: ${DAYS_THRESHOLD}"
echo "  Dry run: ${DRY_RUN}"
echo "  Force mode: ${FORCE}"
echo ""

# Create backup directory
if [ "$DRY_RUN" = false ]; then
  echo -e "${YELLOW}Creating backup directory: ${BACKUP_DIR}${NC}"
  mkdir -p "$BACKUP_DIR"
fi

# Identify stale branches
echo -e "${BLUE}Identifying stale branches (older than ${DAYS_THRESHOLD} days)...${NC}"

# Get cutoff date in Unix timestamp
CUTOFF_DATE=$(date -d "${DAYS_THRESHOLD} days ago" +%s)

# Find stale branches
STALE_BRANCHES=()
while IFS= read -r branch; do
  if [ -n "$branch" ]; then
    STALE_BRANCHES+=("$branch")
  fi
done < <(git branch -a --format='%(refname:short) %(committerdate:unix)' | \
  awk -v cutoff="$CUTOFF_DATE" '$2 < cutoff && $1 !~ /^(origin\/)?main$/ {print $1}')

TOTAL_STALE=${#STALE_BRANCHES[@]}
echo -e "${RED}Found ${TOTAL_STALE} stale branches${NC}"
echo ""

# Categorize branches
CLAUDE_BRANCHES=()
COPILOT_BRANCHES=()
FEATURE_BRANCHES=()
OTHER_BRANCHES=()

for branch in "${STALE_BRANCHES[@]}"; do
  if [[ $branch =~ ^claude/ ]]; then
    CLAUDE_BRANCHES+=("$branch")
  elif [[ $branch =~ ^copilot/ ]]; then
    COPILOT_BRANCHES+=("$branch")
  elif [[ $branch =~ ^00[0-9]- ]]; then
    FEATURE_BRANCHES+=("$branch")
  else
    OTHER_BRANCHES+=("$branch")
  fi
done

echo -e "${BLUE}Branch breakdown:${NC}"
echo "  Claude branches:   ${#CLAUDE_BRANCHES[@]}"
echo "  Copilot branches:  ${#COPILOT_BRANCHES[@]}"
echo "  Feature branches:  ${#FEATURE_BRANCHES[@]}"
echo "  Other branches:    ${#OTHER_BRANCHES[@]}"
echo ""

# Show sample of branches to be deleted
if [ ${#CLAUDE_BRANCHES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Sample Claude branches:${NC}"
  printf '%s\n' "${CLAUDE_BRANCHES[@]}" | head -5
  echo "  ... and $(( ${#CLAUDE_BRANCHES[@]} - 5 )) more"
  echo ""
fi

if [ ${#COPILOT_BRANCHES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Sample Copilot branches:${NC}"
  printf '%s\n' "${COPILOT_BRANCHES[@]}" | head -5
  echo "  ... and $(( ${#COPILOT_BRANCHES[@]} - 5 )) more"
  echo ""
fi

# Confirmation prompt
if [ "$FORCE" = false ] && [ "$DRY_RUN" = false ]; then
  echo -e "${RED}This will delete ${TOTAL_STALE} branches. Continue? (y/N)${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Aborted by user"
    exit 0
  fi
fi

# Delete branches
DELETED_COUNT=0
FAILED_COUNT=0

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}=== DRY RUN - No branches will be deleted ===${NC}"
  echo ""
  echo "Branches that would be deleted:"
  printf '%s\n' "${STALE_BRANCHES[@]}"
else
  echo -e "${BLUE}Starting branch cleanup...${NC}"

  for branch in "${STALE_BRANCHES[@]}"; do
    # Backup branch reference
    git show-ref "$branch" > "$BACKUP_DIR/$(echo $branch | tr / _).ref" 2>/dev/null || true

    # Try to delete local branch
    if git branch -D "$branch" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Deleted local branch: $branch"
      ((DELETED_COUNT++))
    elif git push origin --delete "$branch" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Deleted remote branch: $branch"
      ((DELETED_COUNT++))
    else
      echo -e "${RED}✗${NC} Failed to delete: $branch"
      ((FAILED_COUNT++))
    fi
  done

  echo ""
  echo -e "${GREEN}=== Cleanup Complete ===${NC}"
  echo "Deleted: ${DELETED_COUNT}"
  echo "Failed: ${FAILED_COUNT}"
  echo "Backup location: ${BACKUP_DIR}"
fi

# Summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo "Total branches before cleanup: $(git branch -a | wc -l)"
if [ "$DRY_RUN" = false ]; then
  echo "Total branches after cleanup:  $(git branch -a | wc -l)"
  echo "Branches deleted: ${DELETED_COUNT}"
fi
echo ""
echo -e "${GREEN}Active branches maintained:${NC}"
git branch -a --format='%(refname:short) %(committerdate:short)' | grep -E "2026-06" || echo "main (always active)"
