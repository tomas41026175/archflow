import { useCallback, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToRouteNodes, type RouteNodeData } from '../lib/transforms/configToRouteNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { ViewToolbar } from '../components/canvas/ViewToolbar'

export default function RouteViewPage() {
  const config = useProjectStore((s) => s.config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])

  const { nodes: allNodes, edges: allEdges, availableTags } = useMemo(() => {
    if (!config) return { nodes: [], edges: [], availableTags: [] }
    const result = configToRouteNodes(config)

    // Collect available tags
    const tags = new Set<string>()
    for (const node of result.nodes) {
      const data = node.data as RouteNodeData
      for (const t of data.tags ?? []) tags.add(t)
      if (data.method) tags.add(data.method)
      if (data.guard) tags.add('protected')
      if (!data.guard && !data.isGroup) tags.add('public')
    }
    return { ...result, availableTags: [...tags].sort() }
  }, [config])

  // Apply tag filter
  const filteredNodes = useMemo(() => {
    if (tagFilter.length === 0) return allNodes
    const tagSet = new Set(tagFilter)
    const matchingIds = new Set<string>()

    for (const node of allNodes) {
      const data = node.data as RouteNodeData
      const nodeTags = new Set(data.tags ?? [])
      if (data.method) nodeTags.add(data.method)
      if (data.guard) nodeTags.add('protected')
      if (!data.guard && !data.isGroup) nodeTags.add('public')

      if ([...tagSet].some((t) => nodeTags.has(t))) {
        matchingIds.add(node.id)
      }
    }

    // Keep matching + their parent groups
    const keepIds = new Set(matchingIds)
    for (const edge of allEdges) {
      if (matchingIds.has(edge.target)) keepIds.add(edge.source)
    }
    return allNodes.filter((n) => keepIds.has(n.id))
  }, [allNodes, allEdges, tagFilter])

  // Apply focus
  const { nodes, edges } = useMemo(() => {
    const filteredIds = new Set(filteredNodes.map((n) => n.id))
    const visibleEdges = allEdges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target))

    if (!focusNodeId) return { nodes: filteredNodes, edges: visibleEdges }

    const neighbors = new Set<string>([focusNodeId])
    const focusEdges = visibleEdges.filter((e) => {
      if (e.source === focusNodeId || e.target === focusNodeId) {
        neighbors.add(e.source)
        neighbors.add(e.target)
        return true
      }
      return false
    })
    return {
      nodes: filteredNodes.filter((n) => neighbors.has(n.id)),
      edges: focusEdges,
    }
  }, [filteredNodes, allEdges, focusNodeId])

  const handleTypeToggle = useCallback((type: string) => {
    setTagFilter((prev) => {
      if (prev.length === 0) return [type]
      if (prev.includes(type)) return prev.filter((t) => t !== type)
      return [...prev, type]
    })
  }, [])

  if (allNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No routes defined in config</p>
      </div>
    )
  }

  const stats = `${nodes.length} routes · ${edges.length} edges`

  return (
    <div className="relative h-full w-full">
      <ViewToolbar
        stats={stats}
        availableTypes={availableTags}
        activeTypes={tagFilter}
        onTypeToggle={handleTypeToggle}
        focusNodeId={focusNodeId}
        onClearFocus={() => setFocusNodeId(null)}
      />
      {!focusNodeId && allNodes.length > 20 && (
        <div className="absolute left-4 bottom-4 z-10 rounded-md border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Double-click a route to focus
        </div>
      )}
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={(id) => setSelectedNodeId((prev) => prev === id ? null : id)}
        onNodeDoubleClick={(id) => { setFocusNodeId((prev) => prev === id ? null : id); setSelectedNodeId(null) }}
        onPaneClick={() => setSelectedNodeId(null)}
      />
    </div>
  )
}
