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
  fileCount?: number
  lineCount?: number
  anyCount?: number
  /** Severity: 'critical' | 'warning' | 'ok' */
  severity?: 'critical' | 'warning' | 'ok'
}

export interface DepViewOptions {
  /** 'file' = one node per file, 'directory' = group by parent directory */
  granularity: 'file' | 'directory'
  /** Only show these file types (empty = show all) */
  typeFilter: string[]
  /** Only show nodes connected to this node (null = show all) */
  focusNodeId: string | null
}

export interface DepViewResult {
  nodes: Node[]
  edges: Edge[]
  /** All unique file types present in the data */
  availableTypes: string[]
}

const DEFAULT_OPTIONS: DepViewOptions = {
  granularity: 'file',
  typeFilter: [],
  focusNodeId: null,
}

export function analysisToDepNodes(
  analysis: AnalysisResult,
  options?: Partial<DepViewOptions>,
): DepViewResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { nodes: rawNodes, edges: rawEdges } = analysis

  // Collect available types
  const availableTypes = [...new Set(rawNodes.map((n) => n.type))].sort()

  // Step 1: Apply type filter
  const typeSet = new Set(opts.typeFilter)
  const filteredNodes = typeSet.size > 0
    ? rawNodes.filter((n) => typeSet.has(n.type))
    : rawNodes

  const filteredIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = rawEdges.filter(
    (e) => filteredIds.has(e.source) && filteredIds.has(e.target),
  )

  // Step 2: Apply granularity
  if (opts.granularity === 'directory') {
    return buildDirectoryView(filteredNodes, filteredEdges, opts.focusNodeId, availableTypes)
  }

  return buildFileView(filteredNodes, filteredEdges, opts.focusNodeId, availableTypes)
}

function buildFileView(
  depNodes: AnalysisResult['nodes'],
  depEdges: AnalysisResult['edges'],
  focusNodeId: string | null,
  availableTypes: string[],
): DepViewResult {
  // Apply focus filter
  const { nodes: visibleNodes, edges: visibleEdges } = applyFocus(
    depNodes.map((n) => n.id),
    depEdges.map((e) => ({ source: e.source, target: e.target })),
    focusNodeId,
  )

  const visibleSet = new Set(visibleNodes)

  const incomingCount = new Map<string, number>()
  for (const edge of depEdges) {
    if (visibleSet.has(edge.source) && visibleSet.has(edge.target)) {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1)
    }
  }

  const nodes: Node<FileNodeData>[] = depNodes
    .filter((n) => visibleSet.has(n.id))
    .map((node) => {
      const lines = node.metrics?.lineCount ?? 0
      const anys = node.metrics?.anyCount ?? 0
      const severity: 'critical' | 'warning' | 'ok' =
        lines > 800 || anys > 10 ? 'critical' :
        lines > 400 || anys > 3 ? 'warning' : 'ok'

      return {
        id: node.id,
        type: 'file',
        position: { x: 0, y: 0 },
        data: {
          filePath: node.filePath,
          label: node.label,
          type: node.type,
          exportCount: node.exports.length,
          importCount: incomingCount.get(node.id) ?? 0,
          lineCount: lines,
          anyCount: anys,
          severity,
        },
      }
    })

  const edgeIdSet = new Set(visibleEdges.map((e) => `${e.source}→${e.target}`))
  const edges: Edge[] = depEdges
    .filter((e) => edgeIdSet.has(`${e.source}→${e.target}`))
    .map((edge, i) => {
      const isTypeOnly = edge.imports.every((imp) => imp.isTypeOnly)
      return {
        id: `dep-${i}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed' as const, width: 12, height: 12 },
        style: {
          strokeDasharray: isTypeOnly ? '5 5' : undefined,
          strokeWidth: isTypeOnly ? 1 : 1.5,
          stroke: isTypeOnly
            ? 'var(--color-edge-type-only)'
            : 'var(--color-edge-default)',
        },
      }
    })

  const layoutedNodes = applyDagreLayout(nodes, edges, {
    direction: 'LR',
    nodeWidth: 180,
    nodeHeight: 60,
    nodesep: 50,
    ranksep: 120,
  })

  return { nodes: layoutedNodes, edges, availableTypes }
}

function buildDirectoryView(
  depNodes: AnalysisResult['nodes'],
  depEdges: AnalysisResult['edges'],
  focusNodeId: string | null,
  availableTypes: string[],
): DepViewResult {
  // Group files by parent directory
  const dirMap = new Map<string, { files: typeof depNodes; types: Set<string>; exports: number }>()

  for (const node of depNodes) {
    const parts = node.filePath.split('/')
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.'
    const entry = dirMap.get(dir) ?? { files: [], types: new Set(), exports: 0 }
    entry.files.push(node)
    entry.types.add(node.type)
    entry.exports += node.exports.length
    dirMap.set(dir, entry)
  }

  // Map file IDs to their directory
  const fileToDirMap = new Map<string, string>()
  for (const node of depNodes) {
    const parts = node.filePath.split('/')
    fileToDirMap.set(node.id, parts.length > 1 ? parts.slice(0, -1).join('/') : '.')
  }

  // Build directory-level edges (dedupe)
  const dirEdgeSet = new Set<string>()
  const dirEdges: { source: string; target: string }[] = []
  for (const edge of depEdges) {
    const srcDir = fileToDirMap.get(edge.source)
    const tgtDir = fileToDirMap.get(edge.target)
    if (srcDir && tgtDir && srcDir !== tgtDir) {
      const key = `${srcDir}→${tgtDir}`
      if (!dirEdgeSet.has(key)) {
        dirEdgeSet.add(key)
        dirEdges.push({ source: srcDir, target: tgtDir })
      }
    }
  }

  // Apply focus
  const { nodes: visibleDirs, edges: visibleDirEdges } = applyFocus(
    [...dirMap.keys()],
    dirEdges,
    focusNodeId,
  )
  const visibleSet = new Set(visibleDirs)

  // Count incoming
  const incomingCount = new Map<string, number>()
  for (const e of visibleDirEdges) {
    incomingCount.set(e.target, (incomingCount.get(e.target) ?? 0) + 1)
  }

  const nodes: Node<FileNodeData>[] = [...dirMap.entries()]
    .filter(([dir]) => visibleSet.has(dir))
    .map(([dir, data]) => ({
      id: dir,
      type: 'file',
      position: { x: 0, y: 0 },
      data: {
        filePath: dir,
        label: dir.split('/').pop() ?? dir,
        type: [...data.types][0] ?? 'unknown',
        exportCount: data.exports,
        importCount: incomingCount.get(dir) ?? 0,
        fileCount: data.files.length,
      },
    }))

  const edges: Edge[] = visibleDirEdges.map((e, i) => ({
    id: `dir-${i}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed' as const, width: 12, height: 12 },
    style: { strokeWidth: 1.5 },
  }))

  const layoutedNodes = applyDagreLayout(nodes, edges, {
    direction: 'LR',
    nodeWidth: 200,
    nodeHeight: 60,
    nodesep: 40,
    ranksep: 100,
  })

  return { nodes: layoutedNodes, edges, availableTypes }
}

/** Focus: keep only the target node + its direct neighbors */
function applyFocus(
  nodeIds: string[],
  edges: { source: string; target: string }[],
  focusId: string | null,
): { nodes: string[]; edges: { source: string; target: string }[] } {
  if (!focusId) return { nodes: nodeIds, edges }

  const neighbors = new Set<string>([focusId])
  const focusEdges: { source: string; target: string }[] = []

  for (const edge of edges) {
    if (edge.source === focusId || edge.target === focusId) {
      neighbors.add(edge.source)
      neighbors.add(edge.target)
      focusEdges.push(edge)
    }
  }

  return {
    nodes: nodeIds.filter((id) => neighbors.has(id)),
    edges: focusEdges,
  }
}
