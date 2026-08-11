#!/bin/bash
BASE="http://localhost:5000"
PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL + 1))
  local label="$1"
  local expected_status="$2"
  local actual_status="$3"
  local body="$4"

  if [ "$actual_status" -eq "$expected_status" ]; then
    PASS=$((PASS + 1))
    echo "✅ [$actual_status] $label"
  else
    FAIL=$((FAIL + 1))
    echo "❌ [$actual_status] $label (expected $expected_status)"
    echo "   Response: $body"
  fi
}

echo "========================================="
echo "  GROCERY APP BACKEND - ROUTE TESTS"
echo "========================================="
echo ""

echo "--- 1. AUTH ROUTES ---"
echo ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/customer/login" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999900001"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/auth/customer/login" 200 "$STATUS" "$BODY"

CUSTOMER_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
CUSTOMER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['customer']['_id'])" 2>/dev/null)
REFRESH_TKN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TKN\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/auth/refresh-token" 200 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": ""}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/auth/refresh-token (empty token → 401)" 401 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/auth/user" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/auth/user (with token)" 200 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/auth/user")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/auth/user (no token → 401)" 401 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/api/auth/user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@grocery.com",
    "address": "42 MG Road, Delhi",
    "liveLocation": { "latitude": 28.6139, "longitude": 77.2090 }
  }')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PUT /api/auth/user (update profile)" 200 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/delivery/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "noexist@test.com", "password": "wrong"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/auth/delivery/login (not found → 404)" 404 "$STATUS" "$BODY"

echo ""
echo "--- 2. CATEGORY ROUTES ---"
echo ""

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/category")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/category" 200 "$STATUS" "$BODY"

CATEGORY_ID=$(echo "$BODY" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['_id'] if data else '')" 2>/dev/null)

echo ""
echo "--- 3. PRODUCT ROUTES ---"
echo ""

if [ -n "$CATEGORY_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/product/$CATEGORY_ID")
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  check "GET /api/product/:categoryId (real ID)" 200 "$STATUS" "$BODY"
else
  echo "⚠️  No categories in DB — skipping product-by-category test"
fi

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/product/000000000000000000000000")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/product/:categoryId (fake ID → 200 empty)" 200 "$STATUS" "$BODY"

echo ""
echo "--- 4. ORDER ROUTES ---"
echo ""

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/order")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/order (list all)" 200 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/order?status=available")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/order?status=available (filtered)" 200 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/order" \
  -H "Content-Type: application/json" \
  -d '{"items": [], "branch": "000000000000000000000000", "totalPrice": 100}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/order (no auth → 401)" 401 "$STATUS" "$BODY"

BRANCH_ID=""
PRODUCT_ID=""

if [ -n "$CATEGORY_ID" ]; then
  PRODUCT_ID=$(curl -s -X GET "$BASE/api/product/$CATEGORY_ID" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['_id'] if data else '')" 2>/dev/null)
fi

BRANCH_ID=$(curl -s -X GET "$BASE/api/order" | python3 -c "
import sys, json
orders = json.load(sys.stdin)
if orders:
    b = orders[0].get('branch')
    if isinstance(b, dict):
        print(b.get('_id', ''))
    elif isinstance(b, str):
        print(b)
    else:
        print('')
else:
    print('')
" 2>/dev/null)

if [ -z "$BRANCH_ID" ]; then
  BRANCH_ID=$(curl -s -X GET "$BASE/admin/api/resources/Branch/actions/list" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    records = data.get('records', [])
    if records:
        print(records[0]['id'])
    else:
        print('')
except:
    print('')
" 2>/dev/null)
fi

if [ -n "$BRANCH_ID" ] && [ -n "$PRODUCT_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/order" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d "{
      \"items\": [{\"id\": \"$PRODUCT_ID\", \"item\": \"$PRODUCT_ID\", \"count\": 2}],
      \"branch\": \"$BRANCH_ID\",
      \"totalPrice\": 250
    }")
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  check "POST /api/order (create order with auth)" 201 "$STATUS" "$BODY"

  ORDER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('order',{}).get('_id',''))" 2>/dev/null)

  if [ -n "$ORDER_ID" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/order/$ORDER_ID")
    STATUS=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    check "GET /api/order/:orderId" 200 "$STATUS" "$BODY"
  fi
else
  echo "⚠️  No Branch or Product in DB — skipping order creation test"
  echo "   BRANCH_ID=$BRANCH_ID  PRODUCT_ID=$PRODUCT_ID"

  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/order" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d '{"items": [{"id": "000000000000000000000000", "item": "000000000000000000000000", "count": 1}], "branch": "000000000000000000000000", "totalPrice": 100}')
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  check "POST /api/order (with auth, fake branch → 404)" 404 "$STATUS" "$BODY"
fi

RESP=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/order/000000000000000000000000")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/order/:orderId (not found → 404)" 404 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/order/000000000000000000000000" \
  -H "Content-Type: application/json" \
  -d '{"status": "arriving"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PATCH /api/order/:orderId (no auth → 401)" 401 "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/order/000000000000000000000000/confirm" \
  -H "Content-Type: application/json" \
  -d '{}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /api/order/:orderId/confirm (no auth → 401)" 401 "$STATUS" "$BODY"

echo ""
echo "========================================="
echo "  RESULTS: $PASS passed / $FAIL failed / $TOTAL total"
echo "========================================="
