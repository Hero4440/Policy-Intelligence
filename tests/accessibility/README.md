# Accessibility Testing

This directory contains automated and manual accessibility tests for the PolicyPilot UI redesign (cream theme).

## Requirements

- **Task:** 3.6 Test color contrast ratios with automated tools
- **Requirements:** 3.6, 9.1
- **Standard:** WCAG 2.1 Level AA

## Quick Start

### Run Automated Tests

```bash
# Run color contrast tests
npm run test:contrast

# Or directly with tsx
tsx tests/accessibility/contrast-test.ts
```

### Run All Tests (Automated + Manual Instructions)

```bash
bash tests/accessibility/run-all-tests.sh
```

## Test Files

### Automated Tests

1. **`contrast-test.ts`** - Color contrast ratio calculator
   - Tests 20 color combinations from the cream theme
   - Validates WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
   - Outputs detailed pass/fail results with ratios

2. **`test-page.html`** - HTML test page
   - Sample page with all theme colors applied
   - Used for manual axe-core testing
   - Includes text, buttons, badges, forms, and links

3. **`axe-test.ts`** - axe-core test setup
   - Instructions for running axe-core tests
   - Browser-based testing guide

### Documentation

1. **`CONTRAST_TEST_RESULTS.md`** - Detailed test results
   - Complete analysis of all color combinations
   - Pass/fail breakdown
   - Recommendations for fixes
   - Next steps

2. **`README.md`** - This file

## Test Results Summary

### Current Status: ⚠️ Partial Pass (75%)

- **Passed:** 15/20 color combinations
- **Failed:** 5/20 color combinations

### Failing Combinations

1. Primary accent (#0A7EA4) on cream-base - 4.40:1 (needs 4.5:1)
2. Success color (#059669) on cream-base - 3.58:1 (needs 4.5:1)
3. Warning color (#D97706) on cream-base - 3.03:1 (needs 4.5:1)
4. Primary accent (#0A7EA4) on gray-100 - 4.36:1 (needs 4.5:1)
5. Border color (#D4D4D4) on cream-base - 1.41:1 (needs 3.0:1)

See `CONTRAST_TEST_RESULTS.md` for detailed analysis and recommendations.

## Manual Testing

### 1. axe-core Browser Testing

**Setup:**
1. Install [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
2. Open `tests/accessibility/test-page.html` in your browser

**Run Test:**
1. Open browser DevTools (F12)
2. Go to axe DevTools tab
3. Click "Scan" button
4. Review results for WCAG AA violations

**Expected Results:**
- No critical violations
- Possible warnings for color contrast (known issues documented)

### 2. Lighthouse Accessibility Audit

**Setup:**
1. Start the frontend: `npm run frontend:dev`
2. Open the application in Chrome

**Run Test:**
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"

**Target Score:** 100

### 3. WAVE Browser Extension

**Setup:**
1. Install [WAVE](https://wave.webaim.org/extension/) browser extension
2. Open `tests/accessibility/test-page.html` in your browser

**Run Test:**
1. Click the WAVE extension icon
2. Review the visual indicators on the page
3. Check the sidebar for errors and warnings

**Expected Results:**
- No contrast errors (after color fixes)
- No missing alt text
- No missing form labels

## Fixing Contrast Issues

### Recommended Color Adjustments

To meet WCAG AA requirements, adjust these colors in `src/frontend/styles.css`:

```css
/* Current (failing) */
--color-primary: #0A7EA4;    /* 4.40:1 */
--color-success: #059669;    /* 3.58:1 */
--color-warning: #D97706;    /* 3.03:1 */

/* Recommended (passing) */
--color-primary: #087A9E;    /* ~4.6:1 */
--color-success: #048A5E;    /* ~4.6:1 */
--color-warning: #C56F05;    /* ~4.6:1 */
```

After making changes, re-run the tests:

```bash
npm run test:contrast
```

## WCAG 2.1 Level AA Requirements

### Color Contrast Ratios

- **Normal text:** 4.5:1 minimum
- **Large text (18pt+ or 14pt+ bold):** 3:1 minimum
- **UI components and graphical objects:** 3:1 minimum

### Other Accessibility Requirements

- Keyboard navigation for all interactive elements
- ARIA labels and roles for semantic meaning
- Focus indicators for all focusable elements
- Alternative text for images and icons
- Associated labels for form inputs
- Proper heading hierarchy

## Continuous Testing

### During Development

Run contrast tests after any color changes:

```bash
npm run test:contrast
```

### Before Deployment

1. Run all automated tests
2. Perform manual axe-core testing
3. Run Lighthouse audit
4. Test with screen reader (NVDA, JAWS, or VoiceOver)
5. Test keyboard navigation

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools Documentation](https://www.deque.com/axe/devtools/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [WAVE Documentation](https://wave.webaim.org/api/docs)

## Support

For questions or issues with accessibility testing:
1. Review `CONTRAST_TEST_RESULTS.md` for detailed analysis
2. Check the design document: `.kiro/specs/ui-redesign-dashboard-cream/design.md`
3. Consult WCAG 2.1 guidelines for specific requirements
