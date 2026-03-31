import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { LayerGroupNode } from '../nodes/LayerGroupNode'
import { ModuleNode } from '../nodes/ModuleNode'
import { FileNode } from '../nodes/FileNode'
import { RouteNode } from '../nodes/RouteNode'
import { RouteGroupNode } from '../nodes/RouteGroupNode'
import { StateStoreNode } from '../nodes/StateStoreNode'
import { StateConsumerNode } from '../nodes/StateConsumerNode'

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodeClick?: (nodeId: string) => void
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
  onPaneClick,
}: FlowCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      layerGroup: LayerGroupNode,
      module: ModuleNode,
      file: FileNode,
      route: RouteNode,
      routeGroup: RouteGroupNode,
      stateStore: StateStoreNode,
      stateConsumer: StateConsumerNode,
    }),
    [],
  )

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

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    // Ensure fitView runs after initial render so MiniMap renders correctly
    setTimeout(() => instance.fitView({ padding: 0.2 }), 50)
  }, [])

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={onPaneClick}
      onInit={handleInit}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Controls position="bottom-right" />
      <MiniMap
        position="bottom-left"
        pannable
        zoomable
        className="!bg-card !border-border"
      />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
    </ReactFlow>
  )
}
