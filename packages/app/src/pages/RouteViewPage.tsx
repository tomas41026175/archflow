import { useCallback, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToRouteNodes } from '../lib/transforms/configToRouteNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { ViewToolbar } from '../components/canvas/ViewToolbar'

export default function RouteViewPage() {
  const config = useProjectStore((s) => s.config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  const { nodes: allNodes, edges: allEdges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] }
    return configToRouteNodes(config)
  }, [config])

  const { nodes, edges } = useMemo(() => {
    if (!focusNodeId) return { nodes: allNodes, edges: allEdges }

    const neighbors = new Set<string>([focusNodeId])
    const focusEdges = allEdges.filter((e) => {
      if (e.source === focusNodeId || e.target === focusNodeId) {
        neighbors.add(e.source)
        neighbors.add(e.target)
        return true
      }
      return false
    })
    return {
      nodes: allNodes.filter((n) => neighbors.has(n.id)),
      edges: focusEdges,
    }
  }, [allNodes, allEdges, focusNodeId])

  if (allNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No routes defined in config</p>
      </div>
    )
  }

  const stats = `${allNodes.length} routes · ${allEdges.length} edges`

  return (
    <div className="relative h-full w-full">
      <ViewToolbar
        stats={stats}
        focusNodeId={focusNodeId}
        onClearFocus={() => setFocusNodeId(null)}
      />
      {!focusNodeId && allNodes.length > 20 && (
        <div className="absolute left-4 bottom-4 z-10 rounded-md border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Double-click a route to focus on its connections
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
