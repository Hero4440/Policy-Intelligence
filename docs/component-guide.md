# Component Usage Guide

## Overview

This guide provides practical examples and guidelines for using PolicyPilot UI components with the cream theme design system. All components use CSS custom properties defined in `src/frontend/styles.css` for consistent styling.

## Table of Contents

1. [Card Components](#card-components)
2. [Button Components](#button-components)
3. [Form Components](#form-components)
4. [Status Badge Components](#status-badge-components)
5. [Navigation Components](#navigation-components)
6. [Layout Components](#layout-components)
7. [Best Practices](#best-practices)

---

## Card Components

Cards are the primary content containers in the PolicyPilot UI. They provide visual grouping and hierarchy through consistent styling.

### Policy Card

**Purpose**: Display policy information in search results and lists

**CSS Class**: `.policy-card`

**Usage Example**:

```tsx
<button className="policy-card">
  <div className="policy-card-header">
    <span className="policy-pill">Policy</span>
    <span className="coverage-chip coverage-covered">Covered</span>
  </div>
  
  <h3>
    <span>Humana Gold Plus</span>
    Atorvastatin 20mg
  </h3>
  
  <p>Effective: January 1, 2024</p>
  
  <div className="policy-card-meta">
    <small>Last updated: 2 days ago</small>
  </div>
</button>
```

**Key Features**:
- Border radius: `var(--radius-xl)` (16px)
- Background: `var(--color-cream-light)`
- Border: `1px solid var(--color-gray-300)`
- Hover state: Lifts up 2px with primary border color
- Selected state: `.policy-card-selected` class

**States**:
```css
/* Default */
.policy-card { }

/* Hover */
.policy-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

/* Selected */
.policy-card-selected {
  /* Same as hover */
}

/* Focus */
.policy-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Detail Card

**Purpose**: Display detailed information sections

**CSS Class**: `.detail-card`

**Usage Example**:

```tsx
<div className="detail-card">
  <h4 className="detail-card-title">Prior Authorization Requirements</h4>
  <p>Prior authorization is required for quantities exceeding 30 tablets per 30 days.</p>
  <small>Source: Formulary Document v2.3</small>
</div>
```

**Key Features**:
- Border radius: `var(--radius-lg)` (12px)
- Padding: `var(--spacing-lg)` (16px)
- Background: `var(--color-cream-light)`
- Border: `1px solid var(--color-gray-300)`

### Compare Highlight Card

**Purpose**: Display comparison highlights and key differences

**CSS Class**: `.compare-highlight-card`

**Usage Example**:

```tsx
<div className="compare-highlight-card">
  <p>3 plans cover this drug</p>
  <small>Out of 5 selected plans</small>
</div>
```

**Variants**:
```tsx
/* Muted variant for less important information */
<div className="compare-highlight-card compare-highlight-muted">
  <p>No significant differences</p>
  <small>All plans have similar coverage</small>
</div>
```

### Ingestion Source Card

**Purpose**: Display ingestion source information

**CSS Class**: `.ingestion-source-card`

**Usage Example**:

```tsx
<div className="ingestion-source-card">
  <div className="ingestion-source-topline">
    <strong>Humana_Formulary_2024.pdf</strong>
    <span className="ingestion-status ingestion-status-normalized">Normalized</span>
  </div>
  <p className="ingestion-source-summary">Uploaded on Jan 15, 2024</p>
  <p className="ingestion-drugs">Contains 1,234 drugs</p>
</div>
```

**Status Variants**:
- `.ingestion-status-normalized` - Green (success)
- `.ingestion-status-partial` - Yellow (warning)
- `.ingestion-status-stored` - Gray (neutral)
- `.ingestion-status-rejected` - Gray (neutral)

---

## Button Components

Buttons provide interactive actions throughout the application.

### Primary Button

**Purpose**: Main call-to-action buttons

**CSS Class**: `.primary-button`

**Usage Example**:

```tsx
<button className="primary-button">
  Upload Document
</button>

<button className="primary-button" disabled>
  Processing...
</button>
```

**Key Features**:
- Border radius: `var(--radius-xl)` (16px)
- Background: `var(--color-primary)`
- Color: `var(--color-cream-light)`
- Padding: `var(--spacing-md) var(--spacing-lg)` (12px 16px)
- Font weight: `var(--font-weight-bold)` (700)

**States**:
```css
/* Default */
.primary-button {
  background: var(--color-primary);
  color: var(--color-cream-light);
}

/* Hover */
.primary-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Active/Pressed */
.primary-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Focus */
.primary-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Disabled */
.primary-button:disabled {
  opacity: 0.7;
  cursor: default;
}
```

### Page Navigation Button

**Purpose**: Tab navigation between major sections

**CSS Class**: `.page-nav-btn`

**Usage Example**:

```tsx
<nav className="page-nav">
  <button className="page-nav-btn page-nav-btn-active">
    Workspace
  </button>
  <button className="page-nav-btn">
    Compare
  </button>
  <button className="page-nav-btn">
    Insights
  </button>
</nav>
```

**Key Features**:
- Border radius: `var(--radius-full)` (pill shape)
- Padding: `var(--spacing-sm) var(--spacing-md)` (8px 12px)
- Font weight: `var(--font-weight-bold)` (700)
- Min dimensions: 44px × 44px (accessibility)

**States**:
```css
/* Default */
.page-nav-btn {
  background: transparent;
  color: var(--color-gray-600);
}

/* Hover */
.page-nav-btn:hover:not(.page-nav-btn-active) {
  background: var(--color-gray-200);
  color: var(--color-gray-900);
}

/* Active */
.page-nav-btn-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
```

### Tab Button

**Purpose**: Sub-navigation within a panel

**CSS Class**: `.tab-btn`

**Usage Example**:

```tsx
<div className="tab-bar">
  <button className="tab-btn tab-btn-active">
    Overview
  </button>
  <button className="tab-btn">
    Details
  </button>
  <button className="tab-btn">
    History
  </button>
</div>
```

**Key Features**:
- Border radius: `var(--radius-md)` (8px)
- Padding: `var(--spacing-sm) var(--spacing-md)` (8px 12px)
- Font weight: `var(--font-weight-semibold)` (600)
- Font size: `var(--font-size-sm)` (14px)

---

## Form Components

Form components provide user input functionality with consistent styling.

### Text Input

**Purpose**: Single-line text input

**CSS Class**: `.field-input`

**Usage Example**:

```tsx
<div>
  <label className="field-label" htmlFor="drug-name">
    Drug Name
  </label>
  <input
    id="drug-name"
    type="text"
    className="field-input"
    placeholder="Enter drug name..."
  />
</div>
```

**Key Features**:
- Border radius: `var(--radius-xl)` (16px)
- Padding: `var(--spacing-md)` (12px)
- Background: `var(--color-gray-100)` (inactive)
- Background: `var(--color-cream-light)` (focused)
- Border: `1px solid var(--color-gray-300)`

**States**:
```css
/* Default */
.field-input {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
}

/* Focus */
.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-cream-light);
}
```

### Select Dropdown

**Purpose**: Dropdown selection

**CSS Class**: `.field-select`

**Usage Example**:

```tsx
<div>
  <label className="field-label" htmlFor="payer">
    Select Payer
  </label>
  <select id="payer" className="field-select">
    <option value="">All Payers</option>
    <option value="humana">Humana</option>
    <option value="aetna">Aetna</option>
    <option value="cigna">Cigna</option>
  </select>
</div>
```

**Key Features**:
- Same styling as `.field-input`
- Border radius: `var(--radius-xl)` (16px)
- Padding: `var(--spacing-md)` (12px)

### Textarea

**Purpose**: Multi-line text input

**CSS Class**: `.field-textarea`

**Usage Example**:

```tsx
<div>
  <label className="field-label" htmlFor="notes">
    Notes
  </label>
  <textarea
    id="notes"
    className="field-textarea"
    placeholder="Enter notes..."
    rows={5}
  />
</div>
```

**Key Features**:
- Min height: 140px
- Resizable: vertical only
- Same border and focus states as `.field-input`

### Search Input

**Purpose**: Search functionality with icon

**CSS Class**: `.evidence-search-input`

**Usage Example**:

```tsx
<form className="evidence-search-form">
  <input
    type="search"
    className="evidence-search-input"
    placeholder="Search policies..."
  />
  <button type="submit" className="primary-button">
    Search
  </button>
</form>
```

**Key Features**:
- Border radius: `var(--radius-xl)` (16px)
- Max width: 480px
- Same focus states as `.field-input`

---

## Status Badge Components

Status badges provide visual indicators for states and categories.

### Coverage Status Badges

**Purpose**: Indicate drug coverage status

**CSS Classes**:
- `.coverage-chip` (base class)
- `.coverage-covered` (green)
- `.coverage-covered-with-pa` (yellow)
- `.coverage-not-covered` (red)
- `.coverage-listed` (blue)

**Usage Example**:

```tsx
{/* Covered */}
<span className="coverage-chip coverage-covered">
  Covered
</span>

{/* PA Required */}
<span className="coverage-chip coverage-covered-with-pa">
  PA Required
</span>

{/* Not Covered */}
<span className="coverage-chip coverage-not-covered">
  Not Covered
</span>

{/* Listed */}
<span className="coverage-chip coverage-listed">
  Listed
</span>
```

**Key Features**:
- Border radius: `var(--radius-full)` (pill shape)
- Padding: `var(--spacing-sm) var(--spacing-md)` (8px 12px)
- Font size: `var(--font-size-sm)` (14px)
- Font weight: `var(--font-weight-bold)` (700)

**Color Combinations**:
```css
/* Covered - Green */
.coverage-covered {
  background: var(--color-success-light);
  color: var(--color-success);
}

/* PA Required - Yellow */
.coverage-covered-with-pa {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

/* Not Covered - Red */
.coverage-not-covered {
  background: var(--color-error-light);
  color: var(--color-error);
}

/* Listed - Blue */
.coverage-listed {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
```

### Generic Status Badges

**Purpose**: General status indicators

**CSS Classes**:
- `.status-badge` (base class)
- `.status-green` (success)
- `.status-yellow` (warning)
- `.status-red` (error)
- `.status-gray` (neutral)
- `.status-blue` (info)

**Usage Example**:

```tsx
<span className="status-badge status-green">
  Active
</span>

<span className="status-badge status-yellow">
  Pending
</span>

<span className="status-badge status-red">
  Failed
</span>

<span className="status-badge status-gray">
  Inactive
</span>
```

**Key Features**:
- Border radius: `var(--radius-full)` (pill shape)
- Padding: `var(--spacing-xs) var(--spacing-sm)` (4px 8px)
- Font size: `var(--font-size-xs)` (12px)
- Font weight: `var(--font-weight-bold)` (700)
- Letter spacing: 0.02em

### Ingestion Status Badges

**Purpose**: Indicate ingestion processing status

**CSS Classes**:
- `.ingestion-status` (base class)
- `.ingestion-status-normalized` (green)
- `.ingestion-status-partial` (yellow)
- `.ingestion-status-stored` (gray)
- `.ingestion-status-rejected` (gray)

**Usage Example**:

```tsx
<span className="ingestion-status ingestion-status-normalized">
  Normalized
</span>

<span className="ingestion-status ingestion-status-partial">
  Partial
</span>
```

**Key Features**:
- Border radius: `var(--radius-full)` (pill shape)
- Padding: `var(--spacing-xs) var(--spacing-sm)` (4px 8px)
- Font size: `var(--font-size-xs)` (12px)
- Font weight: `var(--font-weight-bold)` (700)
- Text transform: uppercase
- Letter spacing: 0.04em

---

## Navigation Components

Navigation components provide wayfinding and page transitions.

### Page Navigation

**Purpose**: Main application navigation

**CSS Classes**:
- `.page-nav` (container)
- `.page-nav-btn` (button)
- `.page-nav-btn-active` (active state)

**Usage Example**:

```tsx
<nav className="page-nav">
  <button 
    className="page-nav-btn page-nav-btn-active"
    onClick={() => setActivePage('workspace')}
  >
    Workspace
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('compare')}
  >
    Compare
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('insights')}
  >
    Insights
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('changes')}
  >
    Changes
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('data')}
  >
    Data
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('evidence-explorer')}
  >
    Evidence Explorer
  </button>
  <button 
    className="page-nav-btn"
    onClick={() => setActivePage('chat')}
  >
    Chat
  </button>
</nav>
```

**Key Features**:
- Container has pill-shaped background with border
- Buttons are pill-shaped with hover and active states
- Active button has primary color background
- Minimum touch target: 44px × 44px

### Tab Bar

**Purpose**: Sub-navigation within panels

**CSS Classes**:
- `.tab-bar` (container)
- `.tab-btn` (button)
- `.tab-btn-active` (active state)

**Usage Example**:

```tsx
<div className="tab-bar">
  <button 
    className={`tab-btn ${activeTab === 'overview' ? 'tab-btn-active' : ''}`}
    onClick={() => setActiveTab('overview')}
  >
    Overview
  </button>
  <button 
    className={`tab-btn ${activeTab === 'details' ? 'tab-btn-active' : ''}`}
    onClick={() => setActiveTab('details')}
  >
    Details
  </button>
  <button 
    className={`tab-btn ${activeTab === 'history' ? 'tab-btn-active' : ''}`}
    onClick={() => setActiveTab('history')}
  >
    History
  </button>
</div>
```

**Key Features**:
- Container has rounded background
- Buttons have rounded corners
- Active button has primary light background
- Flex layout with equal width buttons

---

## Layout Components

Layout components provide structure and organization.

### Workspace Grid

**Purpose**: Main application layout structure

**CSS Classes**:
- `.workspace-grid` (3-column)
- `.workspace-grid-four` (4-column expanded)
- `.workspace-grid-four-collapsed` (4-column collapsed)

**Usage Example**:

```tsx
{/* Three-column layout */}
<div className="workspace-grid">
  <aside className="sidebar">
    {/* Left sidebar content */}
  </aside>
  <div className="workspace-column">
    {/* List pane content */}
  </div>
  <div className="workspace-column">
    {/* Detail pane content */}
  </div>
</div>

{/* Four-column layout with right sidebar */}
<div className="workspace-grid-four">
  <aside className="sidebar">
    {/* Left sidebar */}
  </aside>
  <div className="workspace-column">
    {/* List pane */}
  </div>
  <div className="workspace-column">
    {/* Detail pane */}
  </div>
  <div className="workspace-column workspace-column-right">
    {/* Right sidebar */}
  </div>
</div>
```

**Grid Configurations**:
```css
/* Three-column (no right sidebar) */
.workspace-grid {
  grid-template-columns: 280px minmax(320px, 1fr) minmax(420px, 1.2fr);
}

/* Four-column (expanded right sidebar) */
.workspace-grid-four {
  grid-template-columns: 280px minmax(280px, 0.8fr) minmax(380px, 1fr) minmax(280px, 0.6fr);
}

/* Four-column (collapsed right sidebar) */
.workspace-grid-four-collapsed {
  grid-template-columns: 280px minmax(300px, 0.9fr) minmax(400px, 1.1fr) 48px;
}
```

### Sidebar

**Purpose**: Left sidebar for filters and search

**CSS Class**: `.sidebar`

**Usage Example**:

```tsx
<aside className="sidebar">
  <h2 className="sidebar-title">Search Drugs</h2>
  <p className="sidebar-copy">
    Enter a drug name to search coverage across payers
  </p>
  
  <div className="sidebar-section">
    <label className="field-label" htmlFor="drug-search">
      Drug Name
    </label>
    <input
      id="drug-search"
      type="text"
      className="field-input"
      placeholder="e.g., Atorvastatin"
    />
  </div>
  
  <div className="sidebar-section">
    <label className="field-label" htmlFor="payer-filter">
      Filter by Payer
    </label>
    <select id="payer-filter" className="field-select">
      <option value="">All Payers</option>
      <option value="humana">Humana</option>
      <option value="aetna">Aetna</option>
    </select>
  </div>
</aside>
```

**Key Features**:
- Border radius: `var(--radius-2xl)` (24px)
- Padding: `var(--spacing-xl) var(--spacing-lg)` (24px 16px)
- Background: `var(--color-cream-light)`
- Border: `1px solid var(--color-gray-300)`
- Box shadow: `var(--shadow-lg)`

### Workspace Column

**Purpose**: Content columns in the workspace grid

**CSS Class**: `.workspace-column`

**Usage Example**:

```tsx
<div className="workspace-column">
  <div className="panel-header">
    <h2>Search Results</h2>
    <span className="panel-count">12</span>
  </div>
  
  <div className="policy-list">
    {/* Policy cards */}
  </div>
</div>
```

**Key Features**:
- Same styling as `.sidebar`
- Padding: `var(--spacing-xl)` (24px)
- Min height: 400px

### Panel Header

**Purpose**: Section headers within columns

**CSS Class**: `.panel-header`

**Usage Example**:

```tsx
<div className="panel-header">
  <h2>Policy Details</h2>
  <span className="panel-count">3</span>
</div>

{/* With spacing */}
<div className="panel-header panel-header-spaced">
  <h2>Related Policies</h2>
</div>
```

**Key Features**:
- Flexbox layout with space-between
- Margin bottom: `var(--spacing-lg)` (16px)
- H2 font size: `var(--font-size-2xl)` (24px)
- Letter spacing: -0.03em

---

## Best Practices

### Accessibility

**Keyboard Navigation**:
```tsx
{/* Always provide focus-visible styles */}
<button 
  className="primary-button"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
>
  Action
</button>
```

**ARIA Labels**:
```tsx
{/* Icon-only buttons need aria-label */}
<button 
  className="right-sidebar-toggle"
  aria-label="Toggle right sidebar"
>
  ☰
</button>
```

**Semantic HTML**:
```tsx
{/* Use semantic elements */}
<nav className="page-nav">
  {/* Navigation buttons */}
</nav>

<main className="workspace-column">
  {/* Main content */}
</main>

<aside className="sidebar">
  {/* Sidebar content */}
</aside>
```

### Responsive Design

**Mobile-First Approach**:
```tsx
{/* Use responsive grid classes */}
<div className="workspace-grid">
  {/* Automatically stacks on mobile */}
</div>
```

**Breakpoint Awareness**:
- 1400px: Right sidebar collapses by default
- 1120px: Grid columns stack vertically
- 768px: Mobile navigation (hamburger menu)
- 720px: Full mobile layout

### Performance

**Transition Properties**:
```css
/* Only animate GPU-accelerated properties */
.card {
  transition: 
    transform var(--transition-base),
    opacity var(--transition-base),
    box-shadow var(--transition-base);
}

/* Avoid animating layout properties */
/* ❌ Don't do this */
.card {
  transition: width 200ms, height 200ms, margin 200ms;
}
```

**Reduced Motion**:
```tsx
{/* Respect user preferences */}
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Consistency

**Use Design Tokens**:
```css
/* ✅ Good - Use CSS variables */
.my-component {
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  background: var(--color-cream-light);
}

/* ❌ Bad - Hardcoded values */
.my-component {
  padding: 16px;
  border-radius: 16px;
  background: #FFFFFF;
}
```

**Follow Naming Conventions**:
```css
/* Component-specific classes */
.policy-card { }
.policy-card-header { }
.policy-card-meta { }

/* State modifiers */
.policy-card-selected { }
.policy-card-active { }

/* Variant modifiers */
.coverage-chip { }
.coverage-covered { }
.coverage-not-covered { }
```

### Component Composition

**Build Complex UIs from Simple Components**:
```tsx
{/* Compose cards with badges and buttons */}
<div className="policy-card">
  <div className="policy-card-header">
    <span className="policy-pill">Policy</span>
    <span className="coverage-chip coverage-covered">Covered</span>
  </div>
  
  <h3>Policy Title</h3>
  
  <div className="policy-card-meta">
    <small>Last updated: 2 days ago</small>
    <button className="primary-button">View Details</button>
  </div>
</div>
```

---

## Resources

- **Design System Documentation**: `docs/design-system.md`
- **CSS File**: `src/frontend/styles.css`
- **Requirements**: `.kiro/specs/ui-redesign-dashboard-cream/requirements.md`
- **Design Document**: `.kiro/specs/ui-redesign-dashboard-cream/design.md`

---

## Changelog

### Version 1.0 (Current)
- Initial component usage guide
- Card components documentation
- Button components documentation
- Form components documentation
- Status badge components documentation
- Navigation components documentation
- Layout components documentation
- Best practices and guidelines

---

*Last updated: 2024*
