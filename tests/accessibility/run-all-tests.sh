#!/bin/bash

# Color Contrast and Accessibility Test Suite
# Requirements: 3.6, 9.1

echo "🎨 Running Accessibility Test Suite"
echo "===================================="
echo ""

# Run contrast ratio tests
echo "1️⃣  Running color contrast ratio tests..."
echo ""
tsx tests/accessibility/contrast-test.ts
CONTRAST_EXIT=$?

echo ""
echo "===================================="
echo ""

# Display manual testing instructions
echo "2️⃣  Manual Testing Instructions"
echo ""
echo "For complete accessibility testing, please perform:"
echo ""
echo "📋 axe-core Testing:"
echo "   1. Open tests/accessibility/test-page.html in a browser"
echo "   2. Install axe DevTools browser extension"
echo "   3. Click 'Scan' to run accessibility audit"
echo "   4. Verify no WCAG AA violations"
echo ""
echo "📋 Lighthouse Testing:"
echo "   1. Start the frontend: npm run frontend:dev"
echo "   2. Open Chrome DevTools"
echo "   3. Go to Lighthouse tab"
echo "   4. Run accessibility audit"
echo "   5. Target score: 100"
echo ""
echo "📋 WAVE Testing:"
echo "   1. Install WAVE browser extension"
echo "   2. Open tests/accessibility/test-page.html"
echo "   3. Click WAVE icon"
echo "   4. Verify no contrast errors"
echo ""
echo "===================================="
echo ""

# Summary
if [ $CONTRAST_EXIT -eq 0 ]; then
  echo "✅ All automated tests passed!"
  echo ""
  echo "📊 Results:"
  echo "   - Color contrast: PASS"
  echo "   - Manual testing: Required (see above)"
  echo ""
  exit 0
else
  echo "⚠️  Some automated tests failed"
  echo ""
  echo "📊 Results:"
  echo "   - Color contrast: FAIL (see details above)"
  echo "   - Manual testing: Required (see above)"
  echo ""
  echo "📄 See tests/accessibility/CONTRAST_TEST_RESULTS.md for details"
  echo ""
  exit 1
fi
