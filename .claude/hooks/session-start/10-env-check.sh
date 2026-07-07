#!/usr/bin/env bash
# =============================================================================
# SessionStart Hook: Environment Check
# =============================================================================
# Runs at session start. Verifies required tools are available and reports
# their versions. Non-blocking — warns but never fails the session.
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS="${GREEN}✓${NC}"
WARN="${YELLOW}⚠${NC}"
FAIL="${RED}✗${NC}"

ISSUES=()

# --- Python3 ---
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
  echo -e "$PASS python3 $PY_VER"
else
  echo -e "$FAIL python3 not found — graphify hooks will be disabled"
  ISSUES+=("python3 missing")
fi

# --- Node.js ---
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    echo -e "$PASS node $NODE_VER"
  else
    echo -e "$WARN node $NODE_VER (project needs ≥18)"
    ISSUES+=("node version <18")
  fi
else
  echo -e "$FAIL node not found"
  ISSUES+=("node missing")
fi

# --- Git ---
if command -v git &>/dev/null; then
  GIT_VER=$(git --version 2>&1 | awk '{print $3}')
  echo -e "$PASS git $GIT_VER"
else
  echo -e "$FAIL git not found"
  ISSUES+=("git missing")
fi

# --- npm ---
if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version)
  echo -e "$PASS npm $NPM_VER"
fi

# --- Graphify CLI ---
if command -v graphify &>/dev/null; then
  echo -e "$PASS graphify CLI available"
elif python3 -c "import graphify" 2>/dev/null; then
  echo -e "$PASS graphify (Python module)"
else
  echo -e "$WARN graphify not installed — knowledge graph unavailable"
  ISSUES+=("graphify not installed")
fi

# --- Summary ---
if [ ${#ISSUES[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}── Environment issues (${#ISSUES[@]}) ──${NC}"
  for issue in "${ISSUES[@]}"; do
    echo -e "  $WARN $issue"
  done
else
  echo ""
  echo -e "${GREEN}── All checks passed ──${NC}"
fi
