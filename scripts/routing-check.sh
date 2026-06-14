#!/bin/bash
# scripts/routing-check.sh — run after EVERY implementation step
# All checks must pass before moving to the next step.
set -e

echo "=== [1] Typecheck ==="
npm run typecheck

echo ""
echo "=== [2] Lint ==="
npm run lint

echo ""
echo "=== [3] Unit tests ==="
npm test -- --passWithNoTests

echo ""
echo "=== [4] No /shop/ remaining in source (except next.config.mjs redirect rule) ==="
SHOP_REFS=$(grep -rn '"/shop/' app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "Binary" | wc -l)
if [ "$SHOP_REFS" -gt 0 ]; then
  echo "FAIL: $SHOP_REFS hardcoded /shop/ references remain:"
  grep -rn '"/shop/' app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null
  exit 1
fi
echo "PASS: zero /shop/ references in source"

echo ""
echo "=== [5] Build ==="
npm run build

echo ""
echo "=== All checks passed ==="
