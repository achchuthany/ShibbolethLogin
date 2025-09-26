#!/bin/bash

echo "🧪 Testing Shibboleth Authentication Application"
echo "================================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" "$url")
    http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        return 1
    fi
}

test_json_endpoint() {
    local name=$1
    local url=$2
    local expected_key=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print('$expected_key' in data)" 2>/dev/null | grep -q "True"; then
        echo -e "${GREEN}✅ PASS${NC} (JSON contains '$expected_key')"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (JSON missing '$expected_key')"
        echo "Response: $response"
        return 1
    fi
}

# Start testing
echo "1. Backend Health Check"
test_json_endpoint "Health Endpoint" "http://localhost:5001/api/health" "status"

echo
echo "2. Configuration Tests"
test_json_endpoint "Config Endpoint" "http://localhost:5001/api/config" "saml"
test_json_endpoint "Debug Endpoint" "http://localhost:5001/api/debug/saml" "loginUrl"

echo
echo "3. SAML Endpoints"
test_endpoint "Metadata Generation" "http://localhost:5001/api/auth/metadata" "200"
test_endpoint "Login Redirect" "http://localhost:5001/api/auth/login" "302"

echo
echo "4. Authentication Tests"
test_json_endpoint "Auth Status (Unauthenticated)" "http://localhost:5001/api/auth/status" "authenticated"

echo
echo "5. Protected Endpoints (Should Fail Without Auth)"
test_endpoint "Protected Profile" "http://localhost:5001/api/protected/profile" "401"
test_endpoint "Protected Dashboard" "http://localhost:5001/api/protected/dashboard" "401"

echo
echo "6. Frontend Test"
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo -e "Frontend Server... ${GREEN}✅ RUNNING${NC} (http://localhost:3001)"
else
    echo -e "Frontend Server... ${RED}❌ NOT RUNNING${NC}"
fi

echo
echo "📊 Test Summary"
echo "==============="
echo -e "${YELLOW}Backend API:${NC} http://localhost:5001"
echo -e "${YELLOW}Frontend:${NC} http://localhost:3001"
echo -e "${YELLOW}SAML Login:${NC} http://localhost:5001/api/auth/login"
echo -e "${YELLOW}SP Metadata:${NC} http://localhost:5001/api/auth/metadata"

echo
echo "🔐 Authentication Flow Test"
echo "==========================="
echo "1. Open browser to: http://localhost:3001"
echo "2. Click 'Login with Shibboleth IdP'"
echo "3. Should redirect to: https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO"
echo "4. Login with JFN credentials"
echo "5. Should redirect back to dashboard"

echo
echo -e "${GREEN}✅ Application is ready for testing!${NC}"
