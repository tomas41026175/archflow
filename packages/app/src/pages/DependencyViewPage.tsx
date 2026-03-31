import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { analysisResultSchema, type AnalysisResult } from '../lib/schema'
import { analysisToDepNodes } from '../lib/transforms/analysisToDepNodes'
import { FlowCanvas } from '../components/canvas/FlowCanvas'
import { useProjectStore } from '../stores/useProjectStore'
import { cn } from '../lib/utils'

export function DependencyViewPage() {
  const config = useProjectStore((s) => s.config)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Auto-load from config.analysis if embedded
  useEffect(() => {
    if (analysis) return // already loaded from drop
    if (!config?.analysis) return

    const result = analysisResultSchema.safeParse(config.analysis)
    if (result.success) {
      setAnalysis(result.data)
    }
  }, [config?.analysis, analysis])

  const { nodes, edges } = useMemo(() => {
    if (!analysis) return { nodes: [], edges: [] }
    return analysisToDepNodes(analysis)
  }, [analysis])

  const loadAnalysis = useCallback((jsonString: string) => {
    try {
      const raw: unknown = JSON.parse(jsonString)
      const result = analysisResultSchema.safeParse(raw)
      if (!result.success) {
        setError('Invalid analysis JSON format')
        return
      }
      setAnalysis(result.data)
      setError(null)
    } catch {
      setError('Invalid JSON')
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.json')) {
        file.text().then(loadAnalysis)
      }
    },
    [loadAnalysis],
  )

  if (!analysis) {
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
              Or embed &quot;analysis&quot; in archflow.config.json
            </p>
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
        {analysis.metadata.nodeCount} files &middot; {analysis.metadata.edgeCount} dependencies
      </div>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={(id) => setSelectedNodeId((prev) => prev === id ? null : id)}
        onPaneClick={() => setSelectedNodeId(null)}
      />
    </div>
  )
}
