#!/bin/bash
# Renewly Deployment Sanity Check Script
# Verifies all critical fixes are applied

echo "🔍 Renewly Deployment Sanity Check"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: No @supabase/ssr imports
echo "✓ Checking for @supabase/ssr imports..."
RESULT=$(grep -r "@supabase/ssr" lib/ components/ app/ 2>/dev/null | grep -v ".md" | grep -v "node_modules" || true)
if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No @supabase/ssr imports found"
else
  echo -e "${RED}❌ FAIL${NC}: Found @supabase/ssr imports:"
  echo "$RESULT"
  FAILED=1
fi
echo ""

# Check 2: Verify @supabase/supabase-js is used
echo "✓ Checking for @supabase/supabase-js usage..."
RESULT=$(grep -r "@supabase/supabase-js" lib/supabase/ 2>/dev/null || true)
if [ ! -z "$RESULT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: @supabase/supabase-js properly imported"
else
  echo -e "${RED}❌ FAIL${NC}: @supabase/supabase-js not found"
  FAILED=1
fi
echo ""

# Check 3: No useReducedMotion() function calls
echo "✓ Checking for useReducedMotion() calls..."
RESULT=$(grep -r "useReducedMotion()" lib/ components/ app/ 2>/dev/null | grep -v ".md" | grep -v "node_modules" || true)
if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No useReducedMotion() function calls found"
else
  echo -e "${RED}❌ FAIL${NC}: Found useReducedMotion() calls:"
  echo "$RESULT"
  FAILED=1
fi
echo ""

# Check 4: Custom useReducedMotionMediaQuery exists
echo "✓ Checking for custom motion hook..."
RESULT=$(grep -r "useReducedMotionMediaQuery" components/ 2>/dev/null | grep -v ".md" || true)
if [ ! -z "$RESULT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Custom motion hook implementation found"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Custom motion hook not found (might be okay if not using it)"
fi
echo ""

# Check 5: Verify package.json doesn't have @supabase/ssr
echo "✓ Checking package.json dependencies..."
RESULT=$(grep "@supabase/ssr" package.json || true)
if [ -z "$RESULT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No @supabase/ssr in package.json"
else
  echo -e "${RED}❌ FAIL${NC}: @supabase/ssr found in package.json"
  FAILED=1
fi
echo ""

# Check 6: Verify client.ts is correct
echo "✓ Checking lib/supabase/client.ts..."
if grep -q "import { createClient } from '@supabase/supabase-js'" lib/supabase/client.ts; then
  echo -e "${GREEN}✅ PASS${NC}: client.ts correctly imports @supabase/supabase-js"
else
  echo -e "${RED}❌ FAIL${NC}: client.ts not properly configured"
  FAILED=1
fi
echo ""

# Check 7: Verify Hero component imports correct hook
echo "✓ Checking Hero component imports..."
if grep -q "useMotionPreferences" components/landing/hero.tsx; then
  echo -e "${GREEN}✅ PASS${NC}: Hero component imports useMotionPreferences"
else
  echo -e "${RED}❌ FAIL${NC}: Hero component doesn't import useMotionPreferences"
  FAILED=1
fi
echo ""

# Summary
echo "=================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo "Application is ready for deployment!"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
  echo "Please review the failures above and fix before deploying."
  exit 1
fi
