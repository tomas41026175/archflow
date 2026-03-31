import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { analysisResultSchema, type AnalysisResult } from '../lib/schema'
import { analysisToDepNodes } from '../lib/transforms/analysisToDepNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { FileDetailPanel } from '../components/panels/FileDetailPanel'
import { useProjectStore } from '../stores/useProjectStore'
import { cn } from '../lib/utils'

interface AnalysisEntry {
  label: string
  data: AnalysisResult
}

export default function DependencyViewPage() {
  const config = useProjectStore((s) => s.config)
  const configVersion = useProjectStore((s) => s.configVersion)
  const [entries, setEntries] = useState<AnalysisEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Reset entries when a new config is loaded, then load its analysis
  useEffect(() => {
    if (!config?.analysis) {
      setEntries([])
      setActiveIndex(0)
      return
    }
    const result = analysisResultSchema.safeParse(config.analysis)
    if (!result.success) return

    const configLabel = config.project.name ?? 'Config'
    setEntries([{ label: configLabel, data: result.data }])
    setActiveIndex(0)
    setSelectedNodeId(null)
  }, [configVersion]) // eslint-disable-line react-hooks/exhaustive-deps -- intentionally reset on config change

  const analysis = entries[activeIndex]?.data ?? null

  const { nodes, edges } = useMemo(() => {
    if (!analysis) return { nodes: [], edges: [] }
    return analysisToDepNodes(analysis)
  }, [analysis])

  const selectedDetail = useMemo(() => {
    if (!selectedNodeId || !analysis) return null
    const node = analysis.nodes.find((n) => n.id === selectedNodeId)
    if (!node) return null
    const incomingEdges = analysis.edges.filter((e) => e.target === selectedNodeId)
    const outgoingEdges = analysis.edges.filter((e) => e.source === selectedNodeId)
    return { node, incomingEdges, outgoingEdges }
  }, [selectedNodeId, analysis])

  const addAnalysis = useCallback((label: string, data: AnalysisResult) => {
    setEntries((prev) => {
      const existing = prev.findIndex((e) => e.label === label)
      if (existing >= 0) {
        setActiveIndex(existing)
        return prev.map((e, i) => i === existing ? { label, data } : e)
      }
      const next = [...prev, { label, data }]
      setActiveIndex(next.length - 1)
      return next
    })
    setSelectedNodeId(null)
  }, [])

  const loadAnalysis = useCallback((jsonString: string, fileName: string) => {
    try {
      const raw: unknown = JSON.parse(jsonString)
      const result = analysisResultSchema.safeParse(raw)
      if (!result.success) {
        setError('Invalid analysis JSON format')
        return
      }
      const label = fileName.replace(/\.json$/, '')
      addAnalysis(label, result.data)
      setError(null)
    } catch {
      setError('Invalid JSON')
    }
  }, [addAnalysis])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.json')) {
        file.text().then((text) => loadAnalysis(text, file.name))
      }
    },
    [loadAnalysis],
  )

  const handleBrowse = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) file.text().then((text) => loadAnalysis(text, file.name))
    }
    input.click()
  }, [loadAnalysis])

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
              <button
                type="button"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={handleBrowse}
              >
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
      {/* Top bar: project tabs + stats + add */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        {/* Project tabs */}
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
                i === entries.length - 1 && !entries[i + 1] && 'rounded-r-md',
              )}
              onClick={() => { setActiveIndex(i); setSelectedNodeId(null) }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {analysis && (
          <span className="rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm">
            {analysis.metadata.nodeCount} files &middot; {analysis.metadata.edgeCount} deps
          </span>
        )}

        {/* Add another project */}
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
