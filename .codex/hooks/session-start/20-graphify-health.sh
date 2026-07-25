#!/usr/bin/env bash
# =============================================================================
# SessionStart Hook: Graphify Knowledge Graph Health
# =============================================================================
# Checks the state of graphify-out/graph.json — whether it exists, how many
# nodes/communities it contains, and whether it's stale vs. the latest commit.
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

GRAPH="graphify-out/graph.json"

if [ ! -f "$GRAPH" ]; then
  echo -e "  graphify — ${YELLOW}no graph yet${NC}   run: graphify update ."
  exit 0
fi

# --- Graph stats ---
NODES=$(python3 -c "
import json
with open('$GRAPH') as f:
    g = json.load(f)
nodes = g.get('nodes', g) if isinstance(g, dict) else g
if isinstance(nodes, list):
    print(len(nodes))
elif isinstance(nodes, dict):
    print(len(nodes))
else:
    print('?')
" 2>/dev/null || echo "?")

COMMUNITIES=$(python3 -c "
import json
with open('$GRAPH') as f:
    g = json.load(f)
comms = g.get('communities', [])
print(len(comms) if isinstance(comms, list) else 0)
" 2>/dev/null || echo "0")

# --- Staleness check ---
GRAPH_MTIME=$(stat -c %Y "$GRAPH" 2>/dev/null || stat -f %m "$GRAPH" 2>/dev/null || echo "0")
LAST_COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null || echo "0")

echo -n "  graphify — ${GREEN}$NODES nodes${NC}, ${GREEN}$COMMUNITIES communities${NC}"

if [ "$LAST_COMMIT_TIME" != "0" ] && [ "$GRAPH_MTIME" != "0" ]; then
  DIFF=$((LAST_COMMIT_TIME - GRAPH_MTIME))
  if [ "$DIFF" -gt 3600 ]; then
    HOURS=$((DIFF / 3600))
    echo -e "  ${YELLOW}⚠ stale (~${HOURS}h behind last commit)${NC} run: graphify update ."
  elif [ "$DIFF" -gt 600 ]; then
    echo -e "  ${YELLOW}⚠ slightly stale (${DIFF}s)${NC}"
  else
    echo -e "  ${GREEN}✓ fresh${NC}"
  fi
else
  echo ""
fi

# --- Wiki index ---
if [ -f graphify-out/wiki/index.md ]; then
  echo -e "  wiki index — ${GREEN}available${NC}   use: graphify explain \"<concept>\""
fi
