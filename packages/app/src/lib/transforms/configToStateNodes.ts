import type { Node, Edge } from '@xyflow/react'
import type { ArchflowConfig, StateFlowDirection } from '../schema'
import { applyDagreLayout } from '../layout/dagre'

export interface StateStoreNodeData {
  id: string
  name: string
  library?: string
  atoms: string[]
  file?: string
  isStore: true
}

export interface StateConsumerNodeData {
  id: string
  name: string
  isStore: false
}

export type StateNodeData = StateStoreNodeData | StateConsumerNodeData

const DIRECTION_STYLES: Record<StateFlowDirection, {
  animated: boolean
  strokeDasharray?: string
  stroke: string
  label: string
}> = {
  read: { animated: true, stroke: '#3B82F6', label: '← read' },
  write: { animated: true, stroke: '#F59E0B', strokeDasharray: '6 4', label: 'write →' },
  'read-write': { animated: true, stroke: '#8B5CF6', label: '⇄ read-write' },
}

export interface StateViewResult {
  nodes: Node[]
  edges: Edge[]
}

export function configToStateNodes(config: ArchflowConfig): StateViewResult {
  const stateFlows = config.stateFlows
  if (!stateFlows) return { nodes: [], edges: [] }

  const nodeMap = new Map<string, Node<StateNodeData>>()

  // Create store nodes
  for (const store of stateFlows.stores) {
    nodeMap.set(store.id, {
      id: store.id,
      type: 'stateStore',
      position: { x: 0, y: 0 },
      data: {
        id: store.id,
        name: store.name,
        library: stateFlows.library,
        atoms: store.atoms ?? [],
        file: store.file,
        isStore: true,
      },
    })
  }

  // Create consumer nodes from flows (any target not already a store)
  for (const flow of stateFlows.flows) {
    for (const id of [flow.from, flow.to]) {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          type: 'stateConsumer',
          position: { x: 0, y: 0 },
          data: {
            id,
            name: id,
            isStore: false,
          },
        })
      }
    }
  }

  // Create edges
  const edges: Edge[] = stateFlows.flows.map((flow, i) => {
    const dirStyle = DIRECTION_STYLES[flow.direction]
    return {
      id: `state-edge-${i}`,
      source: flow.from,
      target: flow.to,
      type: 'smoothstep',
      animated: dirStyle.animated,
      label: dirStyle.label,
      labelStyle: { fontSize: 11, fontWeight: 500, fill: dirStyle.stroke },
      markerEnd: { type: 'arrowclosed' as const, color: dirStyle.stroke, width: 16, height: 16 },
      style: {
        stroke: dirStyle.stroke,
        strokeWidth: 2,
        strokeDasharray: dirStyle.strokeDasharray,
      },
      data: { description: flow.description },
    }
  })

  const nodes = [...nodeMap.values()]

  const layoutedNodes = applyDagreLayout(nodes, edges, {
    direction: 'LR',
    nodeWidth: 200,
    nodeHeight: 80,
    nodesep: 50,
    ranksep: 120,
  })

  return { nodes: layoutedNodes, edges }
}
