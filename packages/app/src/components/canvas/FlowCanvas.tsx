import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from '../nodes/registry'

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
  onPaneClick?: () => void
}

/** Apply highlight styles to edges connected to the selected node */
function applyEdgeHighlight(
  edges: Edge[],
  selectedNodeId: string | null,
): Edge[] {
  if (!selectedNodeId) return edges

  return edges.map((edge) => {
    const isConnected =
      edge.source === selectedNodeId || edge.target === selectedNodeId
    return {
      ...edge,
      animated: isConnected,
      style: {
        ...edge.style,
        stroke: isConnected ? 'var(--color-primary)' : 'var(--color-border)',
        strokeWidth: isConnected ? 2 : 1,
        opacity: isConnected ? 1 : 0.3,
      },
    }
  })
}

/** Apply selected state to nodes */
function applyNodeSelection(
  nodes: Node[],
  selectedNodeId: string | null,
): Node[] {
  if (!selectedNodeId) return nodes

  return nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }))
}

export function FlowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
}: FlowCanvasProps) {
  const styledEdges = useMemo(
    () => applyEdgeHighlight(edges, selectedNodeId),
    [edges, selectedNodeId],
  )

  const styledNodes = useMemo(
    () => applyNodeSelection(nodes, selectedNodeId),
    [nodes, selectedNodeId],
  )

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'layerGroup') return
      onNodeClick?.(node.id)
    },
    [onNodeClick],
  )

  const [hasDragged, setHasDragged] = useState(false)

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={onNodeDoubleClick ? (_e, node) => onNodeDoubleClick(node.id) : undefined}
      onPaneClick={onPaneClick}
      onNodeDragStart={() => setHasDragged(true)}
      onMoveStart={() => setHasDragged(true)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Controls position="bottom-right" />
      {hasDragged && (
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          className="!bg-card !border-border"
        />
      )}
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
    </ReactFlow>
  )
}
