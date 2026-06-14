#!/bin/bash
# scripts/route-audit.sh — run after all steps are complete
# Requires: dev server running on localhost:3000
# Usage: npm run dev & sleep 10 && bash scripts/route-audit.sh

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local url="$1"
  local expected_status="$2"
  local expected_location="$3"
  local actual_status
  actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$actual_status" != "$expected_status" ]; then
    echo "FAIL [$actual_status != $expected_status] $url"
    FAIL=$((FAIL + 1))
    return 1
  fi
  if [ -n "$expected_location" ]; then
    local actual_location
    actual_location=$(curl -s -o /dev/null -w "%{redirect_url}" "$url")
    if [[ "$actual_location" != *"$expected_location"* ]]; then
      echo "FAIL redirect $url → got $actual_location, want contains $expected_location"
      FAIL=$((FAIL + 1))
      return 1
    fi
  fi
  echo "PASS [$actual_status] $url"
  PASS=$((PASS + 1))
}

echo "=== New gender/category routes (must 200) ==="
check "$BASE/women"                  "200"
check "$BASE/women/sarees"           "200"
check "$BASE/women/dresses"          "200"
check "$BASE/women/lehengas"         "200"
check "$BASE/women/kurta-sets"       "200"
check "$BASE/women/co-ords"          "200"
check "$BASE/women/tops"             "200"
check "$BASE/women/bottoms"          "200"
check "$BASE/women/blouses"          "200"
check "$BASE/women/dress-material"   "200"
check "$BASE/women/fabrics"          "200"

echo ""
echo "=== Legacy /shop/ redirects (must 308 → /women/...) ==="
check "$BASE/shop"                                         "308" "/women"
check "$BASE/shop/sarees"                                  "308" "/women/sarees"
check "$BASE/shop/dresses"                                 "308" "/women/dresses"
check "$BASE/shop/lehengas"                                "308" "/women/lehengas"

echo ""
echo "=== Static editorial pages untouched (must 200) ==="
check "$BASE/festive"         "200"
check "$BASE/bridal"          "200"
check "$BASE/about"           "200"
check "$BASE/cart"            "200"
check "$BASE/made-to-measure" "200"
check "$BASE/lookbook"        "200"
check "$BASE/journal"         "200"
check "$BASE/size-guide"      "200"
check "$BASE/new-in"          "200"
check "$BASE/best-sellers"    "200"

echo ""
echo "=== Invalid gender (must 404) ==="
check "$BASE/xyz-invalid-gender"             "404"
check "$BASE/sarees"                         "404"

echo ""
echo "=== Sitemap uses new /women/ URLs ==="
SITEMAP=$(curl -s "$BASE/sitemap.xml")
if echo "$SITEMAP" | grep -q "/shop/"; then
  echo "FAIL: sitemap still contains /shop/ URLs"
  FAIL=$((FAIL + 1))
elif ! echo "$SITEMAP" | grep -q "/women/"; then
  echo "FAIL: sitemap has no /women/ URLs"
  FAIL=$((FAIL + 1))
else
  echo "PASS: sitemap uses /women/ URLs"
  PASS=$((PASS + 1))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
