#!/usr/bin/env bash
# Run the Playwright smoke spec locally with the same projects + env
# that CI uses. Outputs land in test-results/smoke/<browser>/ — exactly
# what the CI artifact contains.
#
# Usage:
#   scripts/e2e.sh                       # serial: chromium + firefox + webkit
#   scripts/e2e.sh --parallel            # parallel matrix (1 worker per project)
#   scripts/e2e.sh chromium              # one project
#   scripts/e2e.sh chromium firefox      # explicit subset
#   scripts/e2e.sh --parallel chromium firefox webkit
#   BROWSERS="chromium webkit" scripts/e2e.sh
#
# Env:
#   PLAYWRIGHT_BASE_URL   override target URL (default: dev server)
#   HEADED=1              run with a visible browser (serial mode only)
set -euo pipefail

cd "$(dirname "$0")/.."

PARALLEL=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --parallel|-p) PARALLEL=1 ;;
    *) ARGS+=("$a") ;;
  esac
done

if [ "${#ARGS[@]}" -gt 0 ]; then
  BROWSERS_ARR=("${ARGS[@]}")
else
  read -r -a BROWSERS_ARR <<< "${BROWSERS:-chromium firefox webkit}"
fi

EXTRA=()
if [ "${HEADED:-0}" = "1" ]; then
  EXTRA+=(--headed)
fi

mkdir -p test-results/smoke

if [ "$PARALLEL" = "1" ]; then
  # Parallel matrix: spawn one playwright process per browser so each
  # gets its own dev-server pickup and per-browser stdout file.
  echo "▶ Smoke (parallel): projects=${BROWSERS_ARR[*]}"
  pids=()
  for b in "${BROWSERS_ARR[@]}"; do
    (
      LOG="test-results/smoke/${b}.stdout.log"
      echo "  → ${b} (log: ${LOG})"
      npx playwright test tests/e2e/smoke.app-boots.spec.ts \
        --project="${b}" \
        --reporter=list,json \
        --output="test-results/smoke/pw-output-${b}" \
        "${EXTRA[@]}" \
        > "${LOG}" 2>&1
    ) &
    pids+=("$!")
  done

  fail=0
  for i in "${!pids[@]}"; do
    if ! wait "${pids[$i]}"; then
      echo "✖ ${BROWSERS_ARR[$i]} failed — see test-results/smoke/${BROWSERS_ARR[$i]}.stdout.log"
      fail=1
    else
      echo "✓ ${BROWSERS_ARR[$i]} passed"
    fi
  done

  echo ""
  echo "Artifacts: test-results/smoke/"
  exit "$fail"
else
  PROJECT_ARGS=()
  for b in "${BROWSERS_ARR[@]}"; do
    PROJECT_ARGS+=(--project="$b")
  done

  echo "▶ Smoke (serial): projects=${BROWSERS_ARR[*]}"
  npx playwright test tests/e2e/smoke.app-boots.spec.ts \
    "${PROJECT_ARGS[@]}" \
    --reporter=list,html,json \
    "${EXTRA[@]}"

  echo ""
  echo "✓ Smoke artifacts:  test-results/smoke/"
  echo "✓ HTML report:      npm run test:smoke:report"
fi
