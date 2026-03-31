import { useCallback, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToLayerNodes } from '../lib/transforms/configToLayerNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { DetailPanel } from '../components/panels/DetailPanel'

export default function LayerViewPage() {
  const config = useProjectStore((s) => s.config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] }
    return configToLayerNodes(config)
  }, [config])

  const selectedModule = useMemo(() => {
    if (!selectedNodeId || !config) return null
    for (const layer of config.layers ?? []) {
      const found = layer.modules.find((m) => m.id === selectedNodeId)
      if (found) return { module: found, layerLabel: layer.label, layerColor: layer.color }
    }
    return null
  }, [selectedNodeId, config])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
    },
    [],
  )

  return (
    <div className="relative h-full w-full">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
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
