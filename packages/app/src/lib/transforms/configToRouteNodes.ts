import type { Node, Edge } from '@xyflow/react'
import type { ArchflowConfig, RouteEntry } from '../schema'
import { applyDagreLayout } from '../layout/dagre'

export interface RouteNodeData {
  path: string
  name: string
  handler?: string
  method?: string
  guard?: string | null
  description?: string
  tags?: string[]
  isGroup: boolean
  childCount: number
}

export interface RouteViewResult {
  nodes: Node[]
  edges: Edge[]
}

let nodeCounter = 0

function flattenRoutes(
  entries: RouteEntry[],
  parentId: string | null,
  nodes: Node<RouteNodeData>[],
  edges: Edge[],
): void {
  for (const entry of entries) {
    const id = `route-${nodeCounter++}`
    const hasChildren = (entry.children?.length ?? 0) > 0

    nodes.push({
      id,
      type: hasChildren ? 'routeGroup' : 'route',
      position: { x: 0, y: 0 },
      data: {
        path: entry.path,
        name: entry.name,
        handler: entry.handler,
        method: entry.method,
        guard: entry.guard,
        description: entry.description,
        tags: entry.tags,
        isGroup: hasChildren,
        childCount: entry.children?.length ?? 0,
      },
    })

    if (parentId) {
      edges.push({
        id: `route-edge-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
      })
    }

    if (entry.children) {
      flattenRoutes(entry.children, id, nodes, edges)
    }
  }
}

export function configToRouteNodes(config: ArchflowConfig): RouteViewResult {
  const routes = config.routes
  if (!routes) return { nodes: [], edges: [] }

  nodeCounter = 0
  const nodes: Node<RouteNodeData>[] = []
  const edges: Edge[] = []

  flattenRoutes(routes.entries, null, nodes, edges)

  const layoutedNodes = applyDagreLayout(nodes, edges, {
    direction: 'TB',
    nodeWidth: 240,
    nodeHeight: 70,
    nodesep: 40,
    ranksep: 80,
  })

  return { nodes: layoutedNodes, edges }
}
