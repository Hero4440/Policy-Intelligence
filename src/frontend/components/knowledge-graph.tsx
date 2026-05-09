import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { PolicyEvidenceRef } from '../data/policies.js';

type GraphNode = {
  id: string;
  label: string;
  kind: 'drug' | 'payer' | 'policy' | 'rule';
  evidence: PolicyEvidenceRef[];
};

type GraphEdge = {
  from: string;
  to: string;
  label: string;
};

type KnowledgeGraphProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
};

// Color mapping for different node types
const NODE_STYLES = {
  drug: {
    background: '#E8F4F8',
    border: '#0288D1',
    color: '#01579B',
  },
  policy: {
    background: '#E8F5E9',
    border: '#388E3C',
    color: '#1B5E20',
  },
  rule: {
    background: '#FFF8E1',
    border: '#F57C00',
    color: '#E65100',
  },
  payer: {
    background: '#FFF9F0',
    border: '#8B7355',
    color: '#5D4037',
  },
};

export function KnowledgeGraph({ nodes: graphNodes, edges: graphEdges, onNodeClick }: KnowledgeGraphProps) {
  // Transform data for ReactFlow
  const initialNodes: Node[] = useMemo(() => {
    return graphNodes.map((node, index) => {
      const style = NODE_STYLES[node.kind];
      return {
        id: node.id,
        type: 'default',
        position: { x: 0, y: 0 }, // Will be auto-layouted
        data: { 
          label: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                {node.label}
              </div>
              <div style={{ 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                opacity: 0.7,
                fontWeight: 500
              }}>
                {node.kind}
              </div>
            </div>
          ),
          originalNode: node
        },
        style: {
          background: style.background,
          border: `2px solid ${style.border}`,
          borderRadius: '12px',
          padding: '16px 20px',
          color: style.color,
          fontSize: '13px',
          minWidth: '160px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
  }, [graphNodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return graphEdges.map((edge, index) => ({
      id: `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#999',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: '#555',
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#fff',
        fillOpacity: 0.9,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#999',
      },
    }));
  }, [graphEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Auto-layout nodes using a simple algorithm
  useMemo(() => {
    if (nodes.length === 0) return;

    // Simple hierarchical layout
    const nodesByKind: Record<string, Node[]> = {
      drug: [],
      payer: [],
      policy: [],
      rule: [],
    };

    nodes.forEach(node => {
      const kind = node.data.originalNode.kind;
      nodesByKind[kind].push(node);
    });

    const layers = ['drug', 'payer', 'policy', 'rule'];
    const layerSpacing = 300;
    const nodeSpacing = 150;

    layers.forEach((kind, layerIndex) => {
      const layerNodes = nodesByKind[kind];
      const startY = -(layerNodes.length - 1) * nodeSpacing / 2;

      layerNodes.forEach((node, nodeIndex) => {
        node.position = {
          x: layerIndex * layerSpacing,
          y: startY + nodeIndex * nodeSpacing,
        };
      });
    });

    setNodes([...nodes]);
  }, [graphNodes.length]);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    const originalNode = node.data.originalNode as GraphNode;
    if (originalNode) {
      onNodeClick(originalNode);
    }
  }, [onNodeClick]);

  if (graphNodes.length === 0) {
    return (
      <div className="knowledge-graph-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <p style={{ color: '#666', fontSize: '14px' }}>No graph data available</p>
      </div>
    );
  }

  return (
    <div className="knowledge-graph-container" style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#ddd" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const kind = node.data.originalNode?.kind;
            return kind ? NODE_STYLES[kind].border : '#999';
          }}
          maskColor="rgba(255, 249, 240, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
