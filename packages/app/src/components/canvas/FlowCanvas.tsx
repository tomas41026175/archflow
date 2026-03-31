import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
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
      minZoom={0.05}
      maxZoom={3}
      panOnScroll
      selectionOnDrag
      panOnDrag={[1, 2]}
      nodeDragThreshold={3}
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
      <Panel position="bottom-center">
        <div className="rounded-md bg-card/70 px-3 py-1 text-[10px] text-muted-foreground/60 backdrop-blur-sm">
          Scroll to zoom · Middle/Right click to pan · Left click to drag nodes
        </div>
      </Panel>
    </ReactFlow>
  )
}
