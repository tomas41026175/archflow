import { useCallback, useMemo, useState, type DragEvent } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { analysisToDepNodes } from '../lib/transforms/analysisToDepNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { FileDetailPanel } from '../components/panels/FileDetailPanel'
import { useAnalysisLoader } from '../hooks/useAnalysisLoader'
import { cn } from '../lib/utils'

export default function DependencyViewPage() {
  const { entries, activeIndex, analysis, error, loadFromJson, switchTo } = useAnalysisLoader()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { nodes, edges } = useMemo(() => {
    if (!analysis) return { nodes: [], edges: [] }
    return analysisToDepNodes(analysis)
  }, [analysis])

  const selectedDetail = useMemo(() => {
    if (!selectedNodeId || !analysis) return null
    const node = analysis.nodes.find((n) => n.id === selectedNodeId)
    if (!node) return null
    return {
      node,
      incomingEdges: analysis.edges.filter((e) => e.target === selectedNodeId),
      outgoingEdges: analysis.edges.filter((e) => e.source === selectedNodeId),
    }
  }, [selectedNodeId, analysis])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.json')) {
        file.text().then((text) => loadFromJson(text, file.name))
      }
    },
    [loadFromJson],
  )

  const handleBrowse = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) file.text().then((text) => loadFromJson(text, file.name))
    }
    input.click()
  }, [loadFromJson])

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div
          className={cn(
            'flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border',
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop analysis JSON here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or{' '}
              <button type="button" className="text-primary underline underline-offset-2 hover:text-primary/80" onClick={handleBrowse}>
                browse files
              </button>
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <div className="flex items-center rounded-md border bg-card shadow-sm">
          {entries.map((entry, i) => (
            <button
              key={entry.label}
              type="button"
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                i === activeIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                i === 0 && 'rounded-l-md',
                i === entries.length - 1 && 'rounded-r-md',
              )}
              onClick={() => { switchTo(i); setSelectedNodeId(null) }}
            >
              {entry.label}
            </button>
          ))}
        </div>
        {analysis && (
          <span className="rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm">
            {analysis.metadata.nodeCount} files &middot; {analysis.metadata.edgeCount} deps
          </span>
        )}
        <button
          type="button"
          className="rounded-md border bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground hover:bg-accent transition-colors"
          onClick={handleBrowse}
          title="Load another project's analysis"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={(id) => setSelectedNodeId((prev) => prev === id ? null : id)}
        onPaneClick={() => setSelectedNodeId(null)}
      />
      {selectedDetail && (
        <FileDetailPanel
          node={selectedDetail.node}
          incomingEdges={selectedDetail.incomingEdges}
          outgoingEdges={selectedDetail.outgoingEdges}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}
