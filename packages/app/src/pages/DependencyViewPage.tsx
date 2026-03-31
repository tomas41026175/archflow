import { useCallback, useEffect, useMemo, useState, useTransition, type DragEvent } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { analysisToDepNodes } from '../lib/transforms/analysisToDepNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { ViewToolbar } from '../components/canvas/ViewToolbar'
import { FileDetailPanel } from '../components/panels/FileDetailPanel'
import { useAnalysisLoader } from '../hooks/useAnalysisLoader'
import { cn } from '../lib/utils'

export default function DependencyViewPage() {
  const { entries, activeIndex, analysis, error, loadFromJson, switchTo } = useAnalysisLoader()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [granularity, setGranularity] = useState<'file' | 'directory'>('directory')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [layoutResult, setLayoutResult] = useState<{ nodes: import('@xyflow/react').Node[]; edges: import('@xyflow/react').Edge[]; availableTypes: string[] }>({ nodes: [], edges: [], availableTypes: [] })

  useEffect(() => {
    if (!analysis) {
      setLayoutResult({ nodes: [], edges: [], availableTypes: [] })
      return
    }
    startTransition(() => {
      const result = analysisToDepNodes(analysis, { granularity, typeFilter, focusNodeId })
      setLayoutResult(result)
    })
  }, [analysis, granularity, typeFilter, focusNodeId])

  const { nodes, edges, availableTypes } = layoutResult

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

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id))
  }, [])

  const handleNodeDoubleClick = useCallback((id: string) => {
    setFocusNodeId((prev) => (prev === id ? null : id))
    setSelectedNodeId(null)
  }, [])

  const handleTypeToggle = useCallback((type: string) => {
    setTypeFilter((prev) => {
      if (prev.length === 0) {
        // Nothing filtered → filter to only this type
        return [type]
      }
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type)
        return next // empty = show all
      }
      return [...prev, type]
    })
  }, [])

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

  const stats = analysis
    ? isPending
      ? 'Computing layout...'
      : `${nodes.length} ${granularity === 'directory' ? 'dirs' : 'files'} · ${edges.length} deps`
    : undefined

  return (
    <div className="relative h-full w-full">
      {/* Project tabs */}
      {entries.length > 1 && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
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
                onClick={() => { switchTo(i); setSelectedNodeId(null); setFocusNodeId(null) }}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rounded-md border bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground hover:bg-accent transition-colors"
            onClick={handleBrowse}
            title="Load another project"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <ViewToolbar
        stats={stats}
        granularity={granularity}
        onGranularityChange={(g) => { setGranularity(g); setFocusNodeId(null); setSelectedNodeId(null) }}
        availableTypes={availableTypes}
        activeTypes={typeFilter}
        onTypeToggle={handleTypeToggle}
        focusNodeId={focusNodeId}
        onClearFocus={() => setFocusNodeId(null)}
      />

      {/* Hint */}
      {!focusNodeId && nodes.length > 50 && (
        <div className="absolute left-4 bottom-4 z-10 rounded-md border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Double-click a node to focus on its connections
        </div>
      )}

      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
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
