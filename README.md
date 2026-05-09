# PolicyPilot

PolicyPilot is a comprehensive policy intelligence platform that helps healthcare organizations understand drug coverage across multiple payers. The application provides tools for policy comparison, change tracking, evidence exploration, and AI-powered policy chat.

## Features

- **Drug Coverage Search**: Search and compare drug coverage across multiple payers
- **Cross-Payer Comparison**: Side-by-side policy comparison with visual indicators
- **Policy Insights**: Analyze policy trends and coverage patterns
- **Change Tracking**: Monitor policy changes and updates over time
- **Data Management**: Upload and manage policy documents and formularies
- **Evidence Explorer**: Search policy documents by keywords
- **AI-Powered Chat**: Ask questions about policies using grounded AI chat
- **Patient Readiness Checking**: Check if patients meet prior authorization criteria via AI chat (see Chat Features below)

## Design System

PolicyPilot uses a modern cream theme design system built with CSS custom properties for consistent, maintainable styling across the application.

### Cream Theme

The application features a warm, inviting cream color palette that provides excellent readability and a professional appearance:

- **Base Background**: `#FAF9F6` - Warm cream for main application background
- **Card Backgrounds**: `#FFFFFF` - Pure white for elevated surfaces
- **Accent Color**: `#0A7EA4` - Teal/cyan for interactive elements and primary actions

### Design Principles

1. **Visual Hierarchy**: Card-based layouts with consistent spacing and shadows
2. **Accessibility**: WCAG AA compliant color contrast ratios (4.5:1 minimum)
3. **Responsive Design**: Adapts gracefully from desktop to mobile
4. **Smooth Interactions**: GPU-accelerated transitions and animations
5. **Keyboard Navigation**: Full keyboard accessibility with visible focus indicators

### Key Design Features

#### Typography
- **Font Family**: Inter (sans-serif) for UI, IBM Plex Mono for code
- **Scale**: 7 font sizes from 12px to 32px
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

#### Spacing
- **8px-based scale**: Consistent spacing from 4px to 48px
- **Card Padding**: 16px to 24px
- **Section Gaps**: 16px to 48px

#### Border Radius
- **Small Elements**: 4px to 8px
- **Cards**: 16px to 24px
- **Pills/Badges**: 9999px (fully rounded)

#### Shadows
- **Cards**: Subtle elevation with `0 4px 6px rgba(0, 0, 0, 0.1)`
- **Modals**: Stronger elevation with `0 10px 15px rgba(0, 0, 0, 0.1)`
- **Hover States**: Increased shadow for visual feedback

#### Transitions
- **Fast**: 150ms for buttons and quick interactions
- **Base**: 200ms for cards and standard transitions
- **Slow**: 300ms for layout changes

### Documentation

- **Design System Guide**: `docs/design-system.md` - Complete documentation of CSS custom properties, color palette, typography, spacing, and more
- **Component Usage Guide**: `docs/component-guide.md` - Practical examples and guidelines for using UI components

## Component Library

PolicyPilot includes a comprehensive set of reusable components:

### Card Components
- **Policy Card**: Display policy information in search results
- **Detail Card**: Show detailed information sections
- **Compare Highlight Card**: Display comparison highlights
- **Ingestion Source Card**: Show ingestion source information

### Button Components
- **Primary Button**: Main call-to-action buttons
- **Page Navigation Button**: Tab navigation between major sections
- **Tab Button**: Sub-navigation within panels

### Form Components
- **Text Input**: Single-line text input with focus states
- **Select Dropdown**: Dropdown selection with consistent styling
- **Textarea**: Multi-line text input
- **Search Input**: Search functionality with icon

### Status Badge Components
- **Coverage Status**: Covered, PA Required, Not Covered, Listed
- **Generic Status**: Success, Warning, Error, Neutral, Info
- **Ingestion Status**: Normalized, Partial, Stored, Rejected

### Navigation Components
- **Page Navigation**: Main application navigation with 7 tabs
- **Tab Bar**: Sub-navigation within panels

### Layout Components
- **Workspace Grid**: 3-column or 4-column responsive grid layout
- **Sidebar**: Left sidebar for filters and search
- **Workspace Column**: Content columns in the workspace grid
- **Panel Header**: Section headers within columns

## Accessibility Features

PolicyPilot is built with accessibility as a core principle:

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Verified contrast ratios for all color combinations
- Color is never the only means of conveying information

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows visual order
- Focus indicators are clearly visible (2px primary color outline)
- Escape key closes modals and dropdowns

### Screen Reader Support
- Semantic HTML elements throughout (`nav`, `main`, `article`, `aside`)
- ARIA labels on icon-only buttons
- Dynamic content changes are announced
- Form inputs have associated labels

### Reduced Motion
- Respects `prefers-reduced-motion` media query
- Disables animations for users who prefer reduced motion
- Maintains functionality without animations

## Responsive Design

The application adapts to different screen sizes with responsive breakpoints:

### Desktop (1920px+)
- Four-column layout with expanded right sidebar
- Full navigation with all tabs visible
- Optimal spacing and card sizes

### Laptop (1400px - 1919px)
- Four-column layout with collapsed right sidebar by default
- Full navigation maintained
- Slightly tighter spacing

### Tablet (1120px - 1399px)
- Stacked column layout
- Full navigation maintained
- Cards adapt to single-column layout

### Mobile (768px - 1119px)
- Hamburger menu navigation
- Single-column layout
- Touch-optimized button sizes (44px minimum)

### Small Mobile (< 768px)
- Full mobile layout
- Stacked navigation
- Optimized for small screens

## Chat Features

The AI-powered chat interface provides intelligent policy assistance through natural language queries:

### Available Chat Capabilities

1. **Drug Coverage Queries**: Ask about coverage for specific drugs across payers
2. **Prior Authorization Criteria**: Get detailed PA requirements for drugs and plans
3. **Cross-Plan Comparisons**: Compare coverage across multiple payers
4. **Policy Changes**: Track and understand policy updates over time
5. **Patient Readiness Checking**: ⚠️ **TO BE IMPLEMENTED** - Check if a patient meets prior authorization criteria

### Patient Readiness via Chat

**Status**: Implementation pending

The chat interface will support patient readiness checking through natural language queries like:
- "Does Linda Washington meet the criteria for Humira under Aetna?"
- "Check if patient meets PA requirements for adalimumab"
- "Is Sarah Anderson ready for Enbrel approval?"

**Implementation Requirements**:
- Integrate `check_patient_readiness` MCP tool with chat interface
- Support patient context passing (FHIR data or demo patient selection)
- Display criteria matching results in chat responses
- Provide actionable feedback on missing criteria

**Current Workaround**: Use the MCP tool directly via the server API until chat integration is complete.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Development

The application uses:
- **React** for UI components
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Vitest** for testing

### Project Structure

```
src/
├── frontend/
│   ├── App.tsx                 # Main application component
│   ├── styles.css              # Design system CSS
│   └── components/             # Reusable components
├── backend/
│   └── server.ts               # Backend API server
docs/
├── design-system.md            # Design system documentation
└── component-guide.md          # Component usage guide
.kiro/
└── specs/                      # Feature specifications
```

## Testing

PolicyPilot includes comprehensive testing:

### Visual Regression Tests
- Snapshot tests for component rendering
- Theme consistency verification
- Responsive layout testing

### Accessibility Tests
- Color contrast ratio verification
- Keyboard navigation testing
- Focus indicator visibility
- ARIA label presence

### Integration Tests
- Navigation flow testing
- Search interaction testing
- Comparison builder testing

### Manual Testing
- Visual consistency checklist
- Interactive state verification
- Cross-browser compatibility

## Contributing

When contributing to PolicyPilot, please follow these guidelines:

### Code Style
- Use CSS custom properties for all colors, spacing, and typography
- Follow the established naming conventions for CSS classes
- Maintain consistent spacing using the spacing scale
- Use semantic HTML elements

### Accessibility
- Ensure all interactive elements are keyboard accessible
- Provide visible focus indicators
- Test with screen readers
- Verify color contrast ratios

### Testing
- Write tests for new components
- Update existing tests when modifying components
- Run the full test suite before submitting changes

## License

[License information to be added]

## Support

For questions or issues, please [contact information to be added]

---

*Built with ❤️ for better healthcare policy intelligence*
