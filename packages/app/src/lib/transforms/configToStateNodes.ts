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

const DIRECTION_STYLES: Record<StateFlowDirection, { animated: boolean; strokeDasharray?: string; label: string }> = {
  read: { animated: true, label: 'read' },
  write: { animated: true, strokeDasharray: '5 5', label: 'write' },
  'read-write': { animated: true, label: 'read-write' },
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
    const style = DIRECTION_STYLES[flow.direction]
    return {
      id: `state-edge-${i}`,
      source: flow.from,
      target: flow.to,
      animated: style.animated,
      label: style.label,
      style: {
        strokeDasharray: style.strokeDasharray,
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
