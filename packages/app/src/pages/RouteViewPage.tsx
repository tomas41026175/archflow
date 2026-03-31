import { useCallback, useMemo, useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { configToRouteNodes } from '../lib/transforms/configToRouteNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'

export function RouteViewPage() {
  const config = useProjectStore((s) => s.config)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] }
    return configToRouteNodes(config)
  }, [config])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
    },
    [],
  )

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No routes defined in config</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedNodeId(null)}
      />
    </div>
  )
}
