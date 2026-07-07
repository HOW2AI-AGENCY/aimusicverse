#!/usr/bin/env bash
# =============================================================================
# Stop Hook: Uncommitted Changes Reminder
# =============================================================================
# At session end, checks for uncommitted changes and prints a summary.
# Does NOT auto-commit — just reminds so the user can decide.
# =============================================================================
set -euo pipefail

YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)

TOTAL=$((STAGED + UNSTAGED + UNTRACKED))

if [ "$TOTAL" -gt 0 ]; then
  echo ""
  echo -e "${WHITE}╔══════════════════════════════════════╗${NC}"
  echo -e "${WHITE}║${NC}  ${YELLOW}⚠ Uncommitted changes — session end${NC} ${WHITE}║${NC}"
  echo -e "${WHITE}╚══════════════════════════════════════╝${NC}"

  if [ "$STAGED" -gt 0 ]; then
    echo -e "  ${YELLOW}$STAGED staged${NC} files"
    git diff --cached --name-only 2>/dev/null | head -5 | while read -r f; do
      echo -e "    • $f"
    done
  fi

  if [ "$UNSTAGED" -gt 0 ]; then
    [ "$STAGED" -gt 0 ] && echo ""
    echo -e "  ${YELLOW}$UNSTAGED modified${NC} files"
    git diff --name-only 2>/dev/null | head -5 | while read -r f; do
      echo -e "    • $f"
    done
  fi

  if [ "$UNTRACKED" -gt 0 ]; then
    [ "$STAGED" -gt 0 ] || [ "$UNSTAGED" -gt 0 ] && echo ""
    echo -e "  ${YELLOW}$UNTRACKED untracked${NC} files"
    git ls-files --others --exclude-standard 2>/dev/null | head -5 | while read -r f; do
      echo -e "    • $f"
    done
  fi

  echo ""
  echo -e "  Total: ${YELLOW}$TOTAL files${NC} — consider committing."
else
  echo "  ✓ working tree clean"
fi
