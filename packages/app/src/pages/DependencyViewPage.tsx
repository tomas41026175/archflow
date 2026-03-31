import { useCallback, useMemo, useState, type DragEvent } from 'react'
import { Upload, RefreshCw, AlertTriangle } from 'lucide-react'
import { analysisToDepNodes } from '../lib/transforms/analysisToDepNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { FileDetailPanel } from '../components/panels/FileDetailPanel'
import { useAnalysisLoader } from '../hooks/useAnalysisLoader'
import { cn } from '../lib/utils'

export default function DependencyViewPage() {
  const { entries, activeIndex, analysis, error, loadFromJson, switchTo } = useAnalysisLoader()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCycles, setShowCycles] = useState(false)

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
        {analysis?.circular && analysis.circular.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive shadow-sm hover:bg-destructive/20 transition-colors"
            onClick={() => setShowCycles((v) => !v)}
          >
            <AlertTriangle className="h-3 w-3" />
            {analysis.circular.length} circular
          </button>
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
      {showCycles && analysis?.circular && analysis.circular.length > 0 && (
        <div className="absolute left-4 top-16 z-10 w-[380px] rounded-lg border border-destructive/30 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-destructive/20 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Circular Dependencies ({analysis.circular.length})
              </span>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => setShowCycles(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              為了防止計算邏輯出現「互為因果」的錯誤，以下檔案存在循環依賴：
            </p>
            {analysis.circular.map((c, i) => (
              <div key={i} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
                  {c.cycle.map((id, j) => (
                    <span key={j} className="flex items-center gap-1">
                      {j > 0 && <span className="text-destructive">→</span>}
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                        {id.split('/').pop()?.replace(/\.\w+$/, '')}
                      </span>
                    </span>
                  ))}
                  <span className="text-destructive">→ ⟲</span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
