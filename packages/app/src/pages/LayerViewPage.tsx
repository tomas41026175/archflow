import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToLayerNodes } from '../lib/transforms/configToLayerNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { Legend } from '../components/canvas/Legend'
import { ViewToolbar } from '../components/canvas/ViewToolbar'
import { DetailPanel } from '../components/panels/DetailPanel'

export default function LayerViewPage() {
  const config = useProjectStore((s) => s.config)
  const consumePendingNode = useProjectStore((s) => s.consumePendingNode)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  useEffect(() => {
    const pending = consumePendingNode()
    if (pending) setSelectedNodeId(pending)
  }, [consumePendingNode])

  const { nodes: allNodes, edges: allEdges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] }
    return configToLayerNodes(config)
  }, [config])

  // Apply focus filter
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

    // Keep focused nodes + their parent layers
    const focusNodes = allNodes.filter((n) =>
      neighbors.has(n.id) || n.type === 'layerGroup',
    )

    return { nodes: focusNodes, edges: focusEdges }
  }, [allNodes, allEdges, focusNodeId])

  const legendItems = useMemo(() => {
    return (config?.layers ?? [])
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ color: l.color, label: l.label }))
  }, [config])

  const selectedModule = useMemo(() => {
    if (!selectedNodeId || !config) return null
    for (const layer of config.layers ?? []) {
      const found = layer.modules.find((m) => m.id === selectedNodeId)
      if (found) return { module: found, layerLabel: layer.label, layerColor: layer.color }
    }
    return null
  }, [selectedNodeId, config])

  const moduleCount = allNodes.filter((n) => n.type === 'module').length
  const stats = `${moduleCount} modules · ${allEdges.length} deps`

  return (
    <div className="relative h-full w-full">
      <Legend items={legendItems} />
      <ViewToolbar
        stats={stats}
        focusNodeId={focusNodeId}
        onClearFocus={() => setFocusNodeId(null)}
      />
      {!focusNodeId && moduleCount > 20 && (
        <div className="absolute left-4 bottom-4 z-10 rounded-md border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Double-click a module to focus on its connections
        </div>
      )}
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={(id) => setSelectedNodeId((prev) => prev === id ? null : id)}
        onNodeDoubleClick={(id) => { if (id.startsWith('layer-')) return; setFocusNodeId((prev) => prev === id ? null : id); setSelectedNodeId(null) }}
        onPaneClick={() => setSelectedNodeId(null)}
      />
      {selectedModule && (
        <DetailPanel
          module={selectedModule.module}
          layerLabel={selectedModule.layerLabel}
          layerColor={selectedModule.layerColor}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}
