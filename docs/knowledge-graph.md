# Knowledge Graph Visualization

## Overview

The knowledge graph provides an interactive, professional-grade visualization of relationships between drugs, payers, policies, and rules using **ReactFlow** - a modern, highly customizable React library for building node-based UIs.

## Features

### Interactive Graph
- **Smooth animations**: Polished transitions and interactions
- **Drag and drop**: Click and drag nodes to reposition them
- **Zoom and pan**: Scroll to zoom in/out, click and drag background to pan
- **Click to explore**: Click any node to view associated evidence and details
- **Auto-layout**: Intelligent hierarchical layout organizing nodes by type
- **Mini-map**: Bird's-eye view for easy navigation in large graphs

### Visual Design
- **Color-coded nodes**: Each node type has a distinct, professional color scheme
  - **Drug nodes**: Light blue with blue border
  - **Policy nodes**: Light green with green border
  - **Rule nodes**: Light yellow with orange border
  - **Payer nodes**: Cream with brown border
- **Smooth edges**: Curved connections with directional arrows
- **Edge labels**: Relationship types displayed on connecting lines
- **Hover effects**: Subtle elevation and shadow on hover
- **Grid background**: Dotted grid for spatial reference

### Controls
- **Zoom controls**: +/- buttons for precise zoom control
- **Fit view**: Button to auto-fit all nodes in viewport
- **Lock/unlock**: Toggle node dragging
- **Mini-map**: Collapsible overview map in corner

## Technical Implementation

### Library
The graph uses **ReactFlow** (`@xyflow/react`), a production-ready library that provides:
- High-performance rendering with React 18+
- Built-in controls, minimap, and background components
- Customizable node and edge types
- Smooth animations and transitions
- TypeScript support
- MIT licensed and actively maintained

### Component Structure
```
KnowledgeGraph
├── ReactFlow (from @xyflow/react)
│   ├── Background (dotted grid)
│   ├── Controls (zoom, fit, lock)
│   └── MiniMap (overview)
├── Custom node styling
├── Hierarchical auto-layout
└── Event handlers for node clicks
```

### Data Format
The component expects:
```typescript
{
  nodes: Array<{
    id: string;
    label: string;
    kind: 'drug' | 'payer' | 'policy' | 'rule';
    evidence: PolicyEvidenceRef[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: string;
  }>;
}
```

### Auto-Layout Algorithm
Nodes are automatically arranged in a hierarchical layout:
1. **Layer 1 (Left)**: Drug nodes
2. **Layer 2**: Payer nodes
3. **Layer 3**: Policy nodes
4. **Layer 4 (Right)**: Rule nodes

Nodes within each layer are vertically distributed with equal spacing.

## Usage

The knowledge graph is integrated into the Policy Insights page and automatically updates based on:
- Selected drug family
- Selected payers
- Rule type filters
- Version filters

### User Interactions
1. **View relationships**: The graph automatically displays when insights are loaded
2. **Explore nodes**: Click any node to open the evidence panel
3. **Reposition**: Drag nodes to customize the layout
4. **Navigate**: Use mouse wheel to zoom, drag background to pan
5. **Use controls**: Click zoom buttons or fit-view button in bottom-left
6. **Check mini-map**: Use the mini-map in bottom-right for overview

## Performance

- Optimized for graphs with 10-100 nodes
- React 18+ concurrent rendering
- Smooth 60fps animations
- Efficient re-rendering with React hooks
- Responsive sizing based on container dimensions

## Accessibility

- Keyboard navigation support
- High contrast node colors for visibility
- Clear labels and tooltips
- Evidence panel provides text-based alternative to visual graph
- ARIA labels on interactive controls

## Styling

The graph integrates seamlessly with the application's design system:
- Uses CSS custom properties for colors
- Matches border radius and spacing tokens
- Consistent hover and focus states
- Smooth transitions matching app-wide timing

## Future Enhancements

Potential improvements for future versions:
- Custom node types with icons
- Collapsible node groups
- Search/highlight specific nodes
- Export graph as PNG/SVG
- Undo/redo for layout changes
- Animation of changes over time
- Different layout algorithms (radial, force-directed)
- Node filtering by type with toggle buttons
