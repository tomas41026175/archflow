import { useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { LayerGroupNode } from '../nodes/LayerGroupNode'
import { ModuleNode } from '../nodes/ModuleNode'

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick?: (nodeId: string) => void
}

export function FlowCanvas({ nodes, edges, onNodeClick }: FlowCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      layerGroup: LayerGroupNode,
      module: ModuleNode,
    }),
    [],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_event, node) => onNodeClick?.(node.id)}
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
