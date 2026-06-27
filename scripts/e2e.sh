#!/usr/bin/env bash
# Run the Playwright smoke spec locally with the same projects + env
# that CI uses. Outputs land in test-results/smoke/<browser>/ — exactly
# what the CI artifact contains.
#
# Usage:
#   scripts/e2e.sh                       # chromium + firefox + webkit
#   scripts/e2e.sh chromium              # one project
#   scripts/e2e.sh chromium firefox      # explicit subset
#   BROWSERS="chromium webkit" scripts/e2e.sh
#
# Env:
#   PLAYWRIGHT_BASE_URL   override target URL (default: dev server)
#   HEADED=1              run with a visible browser
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$#" -gt 0 ]; then
  BROWSERS_ARR=("$@")
else
  read -r -a BROWSERS_ARR <<< "${BROWSERS:-chromium firefox webkit}"
fi

PROJECT_ARGS=()
for b in "${BROWSERS_ARR[@]}"; do
  PROJECT_ARGS+=(--project="$b")
done

EXTRA=()
if [ "${HEADED:-0}" = "1" ]; then
  EXTRA+=(--headed)
fi

echo "▶ Smoke: tests/e2e/smoke.app-boots.spec.ts  projects=${BROWSERS_ARR[*]}"
mkdir -p test-results/smoke

npx playwright test tests/e2e/smoke.app-boots.spec.ts \
  "${PROJECT_ARGS[@]}" \
  --reporter=list,html,json \
  "${EXTRA[@]}"

echo ""
echo "✓ Smoke artifacts:  test-results/smoke/"
echo "✓ HTML report:      npx playwright show-report"
