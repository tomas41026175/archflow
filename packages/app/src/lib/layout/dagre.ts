import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

interface LayoutOptions {
  direction: 'TB' | 'LR'
  nodeWidth: number
  nodeHeight: number
  nodesep?: number
  ranksep?: number
}

const DEFAULTS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 220,
  nodeHeight: 80,
  nodesep: 50,
  ranksep: 100,
}

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options?: Partial<LayoutOptions>,
): Node[] {
  const opts = { ...DEFAULTS, ...options }
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodesep,
    ranksep: opts.ranksep,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    g.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const dagreNode = g.node(node.id)
    return {
      ...node,
      position: {
        x: dagreNode.x - opts.nodeWidth / 2,
        y: dagreNode.y - opts.nodeHeight / 2,
      },
    }
  })
}
