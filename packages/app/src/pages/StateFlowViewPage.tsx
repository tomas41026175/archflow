import { useCallback, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToStateNodes } from '../lib/transforms/configToStateNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { ViewToolbar } from '../components/canvas/ViewToolbar'

const DIRECTION_TYPES = ['read', 'write', 'read-write']

export default function StateFlowViewPage() {
  const config = useProjectStore((s) => s.config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [dirFilter, setDirFilter] = useState<string[]>([])

  const { nodes: allNodes, edges: allEdges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] }
    return configToStateNodes(config)
  }, [config])

  // Apply direction filter on edges, then remove orphan nodes
  const { nodes, edges } = useMemo(() => {
    let visibleEdges = allEdges
    if (dirFilter.length > 0) {
      const dirSet = new Set(dirFilter)
      visibleEdges = allEdges.filter((e) => {
        const label = (e.label as string) ?? ''
        return dirSet.some((d) => label.includes(d))
      })
    }

    // Keep only nodes connected by visible edges
    const connectedIds = new Set<string>()
    for (const e of visibleEdges) {
      connectedIds.add(e.source)
      connectedIds.add(e.target)
    }
    // If no filter, show all
    const visibleNodes = dirFilter.length > 0
      ? allNodes.filter((n) => connectedIds.has(n.id))
      : allNodes

    // Apply focus
    if (!focusNodeId) return { nodes: visibleNodes, edges: visibleEdges }

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
      nodes: visibleNodes.filter((n) => neighbors.has(n.id)),
      edges: focusEdges,
    }
  }, [allNodes, allEdges, dirFilter, focusNodeId])

  const handleDirToggle = useCallback((dir: string) => {
    setDirFilter((prev) => {
      if (prev.length === 0) return [dir]
      if (prev.includes(dir)) return prev.filter((d) => d !== dir)
      return [...prev, dir]
    })
  }, [])

  if (allNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No state flows defined in config</p>
      </div>
    )
  }

  const storeCount = nodes.filter((n) => n.type === 'stateStore').length
  const consumerCount = nodes.filter((n) => n.type === 'stateConsumer').length
  const stats = `${storeCount} stores · ${consumerCount} consumers · ${edges.length} flows`

  return (
    <div className="relative h-full w-full">
      <ViewToolbar
        stats={stats}
        availableTypes={DIRECTION_TYPES}
        activeTypes={dirFilter}
        onTypeToggle={handleDirToggle}
        focusNodeId={focusNodeId}
        onClearFocus={() => setFocusNodeId(null)}
      />
      {!focusNodeId && allNodes.length > 15 && (
        <div className="absolute left-4 bottom-4 z-10 rounded-md border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Double-click a node to focus
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
