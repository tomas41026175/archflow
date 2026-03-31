import type { Node, Edge } from '@xyflow/react'
import type { AnalysisResult } from '../schema'
import { applyDagreLayout } from '../layout/dagre'

/** Data for a FileNode */
export interface FileNodeData {
  filePath: string
  label: string
  type: string
  exportCount: number
  importCount: number
}

export interface DepViewResult {
  nodes: Node[]
  edges: Edge[]
}

export function analysisToDepNodes(analysis: AnalysisResult): DepViewResult {
  const { nodes: depNodes, edges: depEdges } = analysis

  // Count incoming edges per node
  const incomingCount = new Map<string, number>()
  for (const edge of depEdges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1)
  }

  // Build React Flow nodes
  const nodes: Node<FileNodeData>[] = depNodes.map((node) => ({
    id: node.id,
    type: 'file',
    position: { x: 0, y: 0 }, // Will be set by dagre
    data: {
      filePath: node.filePath,
      label: node.label,
      type: node.type,
      exportCount: node.exports.length,
      importCount: incomingCount.get(node.id) ?? 0,
    },
  }))

  // Build React Flow edges
  const edges: Edge[] = depEdges.map((edge, i) => {
    const isTypeOnly = edge.imports.every((imp) => imp.isTypeOnly)
    return {
      id: `dep-${i}`,
      source: edge.source,
      target: edge.target,
      style: {
        strokeDasharray: isTypeOnly ? '5 5' : undefined,
        stroke: isTypeOnly
          ? 'var(--color-edge-type-only)'
          : 'var(--color-edge-default)',
      },
      label: edge.imports.length > 1
        ? `${edge.imports.length} imports`
        : undefined,
    }
  })

  // Apply dagre layout
  const layoutedNodes = applyDagreLayout(nodes, edges, {
    direction: 'LR',
    nodeWidth: 180,
    nodeHeight: 60,
    nodesep: 30,
    ranksep: 80,
  })

  return { nodes: layoutedNodes, edges }
}
