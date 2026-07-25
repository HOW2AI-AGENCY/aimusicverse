#!/usr/bin/env bash
# =============================================================================
# SessionStart Hook: Project Dashboard
# =============================================================================
# Shows a quick summary of the project state: branch, uncommitted changes,
# recent commits, and whether tests are passing.
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

echo ""
echo -e "${WHITE}╔══════════════════════════════════════╗${NC}"
echo -e "${WHITE}║${NC}        ${CYAN}MusicVerse AI — Dashboard${NC}       ${WHITE}║${NC}"
echo -e "${WHITE}╚══════════════════════════════════════╝${NC}"

# --- Branch ---
BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
echo -e "  ${GREEN}branch${NC}    ${MAGENTA}$BRANCH${NC}"

# --- Uncommitted changes ---
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)

if [ "$STAGED" -gt 0 ]; then
  echo -e "  ${GREEN}staged${NC}    ${YELLOW}$STAGED files${NC}"
fi
if [ "$UNSTAGED" -gt 0 ]; then
  echo -e "  ${GREEN}modified${NC}  ${YELLOW}$UNSTAGED files${NC}"
fi
if [ "$UNTRACKED" -gt 0 ]; then
  echo -e "  ${GREEN}untracked${NC} ${YELLOW}$UNTRACKED files${NC}"
fi
if [ "$STAGED" -eq 0 ] && [ "$UNSTAGED" -eq 0 ] && [ "$UNTRACKED" -eq 0 ]; then
  echo -e "  ${GREEN}status${NC}   clean working tree"
fi

# --- Recent commits ---
echo ""
echo -e "  ${WHITE}Recent commits:${NC}"
git log --oneline -3 2>/dev/null | while read -r line; do
  echo -e "    ${CYAN}○${NC} $line"
done

# --- Test status (cached) ---
if [ -f node_modules/.cache/test-status  ]; then
  echo ""
  echo -e "  ${GREEN}tests${NC}     $(cat node_modules/.cache/test-status)"
fi

echo ""
