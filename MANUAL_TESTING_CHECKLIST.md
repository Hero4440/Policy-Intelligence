# Manual Testing Checklist - UI Redesign Dashboard Cream Theme

**Spec**: ui-redesign-dashboard-cream  
**Date Created**: 2025-01-XX  
**Purpose**: Comprehensive manual testing checklist for verifying the cream theme implementation

**Validates Requirements**: 1.1, 1.2, 2.1, 2.2, 2.3, 4.2, 4.3, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 15.1, 15.2

---

## Overview

This checklist covers all visual aspects of the cream theme implementation that require manual verification. Automated tests cover functional behavior, but visual consistency, color accuracy, and user experience require human verification.

---

## 1. Visual Consistency

### 1.1 Background Colors
**Requirement**: 2.1, 2.2, 2.3

- [ ] Main application background uses cream base color (#FAF9F6)
- [ ] All card backgrounds use cream light color (#FFFFFF)
- [ ] Subtle background variations use cream dark color (#F5F5F0)
- [ ] No gray backgrounds remain from previous design
- [ ] Background colors are consistent across all pages

**How to Test**:
1. Navigate through all pages (Workspace, Compare, Insights, Changes, Data, Evidence Explorer, Chat)
2. Use browser DevTools to inspect background colors
3. Verify colors match the design tokens in `src/frontend/styles.css`

**Expected Result**: All backgrounds use the cream palette consistently

---

### 1.2 Card Styling
**Requirement**: 4.2, 4.3

- [ ] All policy cards have 16px or 24px border radius
- [ ] All detail cards have 16px or 24px border radius
- [ ] All cards have consistent shadow (lg for cards)
- [ ] Card borders are 1px solid gray-300
- [ ] Card backgrounds are cream-light (#FFFFFF)
- [ ] Cards have consistent internal padding (16px or 24px)

**How to Test**:
1. Navigate to Workspace page and view policy cards
2. Navigate to Compare page and view comparison cards
3. Navigate to Data page and view ingestion source cards
4. Use browser DevTools to inspect border-radius, box-shadow, padding
5. Verify values match design tokens

**Expected Result**: All cards have consistent styling with rounded corners and subtle shadows

---

### 1.3 Shadow Consistency
**Requirement**: 15.1, 15.2

- [ ] Policy cards use lg shadow (0 4px 6px rgba(0, 0, 0, 0.1))
- [ ] Detail cards use lg shadow
- [ ] Modals use xl shadow (0 10px 15px rgba(0, 0, 0, 0.1))
- [ ] Dropdowns use xl shadow
- [ ] Hover states increase shadow to xl
- [ ] Shadow transitions are smooth (200ms)

**How to Test**:
1. View cards in normal state
2. Hover over cards to see shadow increase
3. Open modals or dropdowns (if available)
4. Use browser DevTools to inspect box-shadow values
5. Verify smooth transitions

**Expected Result**: Shadows create visual depth and respond smoothly to interactions

---

## 2. Typography

### 2.1 Font Sizes
**Requirement**: 12.2, 12.3, 12.4

- [ ] Page headlines use 2rem (32px) font size
- [ ] Section headings use 1.5rem (24px) font size
- [ ] Body text uses 1rem (16px) font size
- [ ] Secondary text uses 0.875rem (14px) font size
- [ ] Badge text uses 0.75rem (12px) font size

**How to Test**:
1. Navigate to each page
2. Identify headlines, headings, body text, secondary text
3. Use browser DevTools to inspect font-size
4. Verify values match design tokens

**Expected Result**: Typography scale is consistent across all pages

---

### 2.2 Font Weights
**Requirement**: 12.2, 12.3

- [ ] Headlines use bold weight (700)
- [ ] Section headings use semibold weight (600)
- [ ] Body text uses normal weight (400)
- [ ] Badge text uses bold weight (700)

**How to Test**:
1. Navigate to each page
2. Identify different text elements
3. Use browser DevTools to inspect font-weight
4. Verify values match design tokens

**Expected Result**: Font weights create clear visual hierarchy

---

## 3. Spacing

### 3.1 Section Spacing
**Requirement**: 13.1, 13.2, 13.3

- [ ] Major sections have 48px vertical spacing
- [ ] Page padding is 32px
- [ ] Card internal padding is 24px
- [ ] Element groups have 16px spacing
- [ ] Grid gaps are 12px
- [ ] Inline elements have 8px spacing

**How to Test**:
1. Navigate to each page
2. Use browser DevTools to inspect padding and margin values
3. Measure spacing between sections, cards, and elements
4. Verify values match design tokens

**Expected Result**: Spacing is consistent and creates visual breathing room

---

## 4. Interactive States

### 4.1 Hover States
**Requirement**: 15.1, 15.2

- [ ] Policy cards increase shadow on hover
- [ ] Navigation buttons show visual feedback on hover
- [ ] Detail tabs show visual feedback on hover
- [ ] Buttons change background color on hover
- [ ] All hover transitions are smooth (150ms-200ms)

**How to Test**:
1. Hover over policy cards
2. Hover over navigation buttons
3. Hover over detail tabs
4. Hover over action buttons
5. Observe transition smoothness

**Expected Result**: All interactive elements provide clear hover feedback

---

### 4.2 Focus States
**Requirement**: 23.1, 23.2

- [ ] All interactive elements show 2px primary color outline on focus
- [ ] Focus indicators are clearly visible
- [ ] Tab key navigation works for all interactive elements
- [ ] Focus order follows visual order

**How to Test**:
1. Use Tab key to navigate through the page
2. Verify focus indicators are visible on each element
3. Verify focus order makes sense
4. Use browser DevTools to inspect outline styles

**Expected Result**: Focus indicators are visible and keyboard navigation works smoothly

---

### 4.3 Active States
**Requirement**: 3.2, 3.5

- [ ] Active navigation tab has primary-light background
- [ ] Active detail tab has distinct styling
- [ ] Selected policy card has distinct styling
- [ ] Active states are visually distinct from inactive states

**How to Test**:
1. Click through navigation tabs
2. Click through detail tabs
3. Select different policy cards
4. Verify active states are clearly visible

**Expected Result**: Active states are clearly distinguishable from inactive states

---

## 5. Navigation

### 5.1 Patients Tab Removal
**Requirement**: 1.1, 1.2

- [ ] Patients tab is NOT present in page navigation
- [ ] Only 7 tabs are visible: Workspace, Compare, Insights, Changes, Data, Evidence Explorer, Chat
- [ ] Navigation tabs are in correct order
- [ ] No broken links or references to Patients page

**How to Test**:
1. Load the application
2. Count navigation tabs
3. Verify Patients tab is not present
4. Try navigating to /patients URL (should redirect to /workspace)

**Expected Result**: Patients tab is completely removed from navigation

---

### 5.2 Navigation Functionality
**Requirement**: 1.2

- [ ] All remaining tabs are functional
- [ ] Clicking each tab navigates to correct page
- [ ] Active tab is visually highlighted
- [ ] Tab transitions are smooth
- [ ] URL updates correctly when switching tabs

**How to Test**:
1. Click each navigation tab
2. Verify correct page loads
3. Verify URL updates
4. Verify active tab highlighting
5. Use browser back/forward buttons

**Expected Result**: All navigation tabs work correctly and provide clear feedback

---

## 6. Responsive Behavior

### 6.1 Desktop Layout (1920px)
**Requirement**: 16.1, 16.2

- [ ] Three-column layout displays correctly
- [ ] Four-column layout displays when right sidebar is present
- [ ] All columns are visible and properly sized
- [ ] Content is readable and well-spaced

**How to Test**:
1. Set browser width to 1920px
2. Navigate to Workspace page (three columns)
3. Navigate to pages with right sidebar (four columns)
4. Verify layout looks correct

**Expected Result**: Desktop layout uses full width effectively

---

### 6.2 Laptop Layout (1400px)
**Requirement**: 16.3

- [ ] Right sidebar collapses by default
- [ ] Three main columns remain visible
- [ ] Content remains readable
- [ ] No horizontal scrolling

**How to Test**:
1. Set browser width to 1400px
2. Navigate through pages
3. Verify right sidebar is collapsed
4. Verify main content is accessible

**Expected Result**: Layout adapts gracefully to laptop screens

---

### 6.3 Tablet Layout (1120px)
**Requirement**: 16.4

- [ ] Columns stack vertically
- [ ] All content remains accessible
- [ ] No horizontal scrolling
- [ ] Touch targets are appropriately sized

**How to Test**:
1. Set browser width to 1120px
2. Navigate through pages
3. Verify columns stack
4. Verify content is readable

**Expected Result**: Layout stacks appropriately for tablet screens

---

### 6.4 Mobile Layout (768px)
**Requirement**: 16.5, 16.6

- [ ] Navigation remains accessible
- [ ] Content stacks vertically
- [ ] All features are accessible
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough (minimum 44x44px)

**How to Test**:
1. Set browser width to 768px
2. Navigate through pages
3. Verify all content is accessible
4. Test touch interactions (if on touch device)

**Expected Result**: Mobile layout is fully functional and accessible

---

## 7. Accessibility

### 7.1 Color Contrast
**Requirement**: 23.1

- [ ] Normal text has 4.5:1 contrast ratio minimum
- [ ] Large text has 3:1 contrast ratio minimum
- [ ] UI components have 3:1 contrast ratio minimum
- [ ] Status badges have sufficient contrast

**How to Test**:
1. Use browser DevTools or contrast checker tool
2. Test text on cream background
3. Test status badges
4. Test button text

**Expected Result**: All text meets WCAG AA contrast standards

---

### 7.2 Keyboard Navigation
**Requirement**: 23.2, 23.3

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Enter and Space keys activate buttons
- [ ] Escape key closes modals

**How to Test**:
1. Use only keyboard to navigate
2. Tab through all interactive elements
3. Activate buttons with Enter/Space
4. Test modal interactions

**Expected Result**: Complete keyboard accessibility

---

### 7.3 Screen Reader Support
**Requirement**: 23.4, 23.5, 23.6, 23.7

- [ ] Semantic HTML elements are used (nav, main, aside)
- [ ] ARIA labels are present on icon-only buttons
- [ ] Form inputs have associated labels
- [ ] Dynamic content changes are announced

**How to Test**:
1. Use screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through the application
3. Verify all content is announced
4. Verify labels are descriptive

**Expected Result**: Screen reader users can navigate and use the application

---

## 8. Cross-Browser Testing

### 8.1 Chrome
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] No console errors

### 8.2 Firefox
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] No console errors

### 8.3 Safari
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] No console errors

### 8.4 Edge
- [ ] All features work correctly
- [ ] Styling is consistent
- [ ] No console errors

**How to Test**:
1. Open application in each browser
2. Navigate through all pages
3. Test interactive features
4. Check browser console for errors

**Expected Result**: Consistent experience across all modern browsers

---

## 9. Performance

### 9.1 Page Load
- [ ] Initial page load is fast (< 3 seconds)
- [ ] No layout shift during load
- [ ] Smooth transitions between pages

**How to Test**:
1. Use browser DevTools Performance tab
2. Record page load
3. Check for layout shifts
4. Measure load time

**Expected Result**: Fast, smooth page loads

---

### 9.2 Interactions
- [ ] Hover transitions are smooth (60fps)
- [ ] Page transitions are smooth
- [ ] No lag when clicking buttons
- [ ] Scrolling is smooth

**How to Test**:
1. Interact with various elements
2. Monitor frame rate in DevTools
3. Test on lower-end devices if possible

**Expected Result**: Smooth, responsive interactions

---

## 10. Edge Cases

### 10.1 Empty States
- [ ] Empty policy list shows appropriate message
- [ ] Empty comparison shows appropriate message
- [ ] Empty states are styled consistently

**How to Test**:
1. Navigate to pages with no data
2. Verify empty state messages
3. Verify styling is consistent

**Expected Result**: Empty states are helpful and well-styled

---

### 10.2 Long Content
- [ ] Long policy names don't break layout
- [ ] Long text wraps appropriately
- [ ] Scrolling works correctly for long lists

**How to Test**:
1. Test with long policy names
2. Test with long text content
3. Verify layout remains intact

**Expected Result**: Layout handles long content gracefully

---

### 10.3 Error States
- [ ] Error messages are visible
- [ ] Error styling is consistent
- [ ] Errors don't break layout

**How to Test**:
1. Trigger error conditions (if possible)
2. Verify error messages
3. Verify styling

**Expected Result**: Errors are handled gracefully

---

## Testing Sign-Off

### Tester Information
- **Name**: ___________________________
- **Date**: ___________________________
- **Browser**: ___________________________
- **OS**: ___________________________
- **Screen Resolution**: ___________________________

### Overall Assessment
- [ ] All visual aspects pass inspection
- [ ] All interactive elements work correctly
- [ ] All accessibility requirements are met
- [ ] No critical issues found

### Issues Found
List any issues discovered during testing:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Notes
Additional observations or comments:

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Appendix: Design Tokens Reference

### Colors
```css
--color-cream-base: #FAF9F6
--color-cream-light: #FFFFFF
--color-cream-dark: #F5F5F0
--color-primary: #0A7EA4
--color-primary-light: #E6F4F8
```

### Typography
```css
--font-size-3xl: 2rem (32px)
--font-size-2xl: 1.5rem (24px)
--font-size-base: 1rem (16px)
--font-size-sm: 0.875rem (14px)
--font-size-xs: 0.75rem (12px)
```

### Spacing
```css
--spacing-3xl: 48px
--spacing-2xl: 32px
--spacing-xl: 24px
--spacing-lg: 16px
--spacing-md: 12px
--spacing-sm: 8px
```

### Border Radius
```css
--radius-2xl: 24px
--radius-xl: 16px
--radius-lg: 12px
--radius-full: 9999px
```

### Shadows
```css
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 10px 15px rgba(0, 0, 0, 0.1)
```

---

**End of Manual Testing Checklist**
