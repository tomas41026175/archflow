import { useCallback } from 'react'
import {
  X, FileCode, ArrowDownToLine, ArrowUpFromLine, Eye,
  Component, Puzzle, Database, Globe, Wrench, type LucideIcon,
} from 'lucide-react'
import type {
  AnalysisDependencyNode,
  AnalysisDependencyEdge,
} from '../../lib/schema'
import { useFileSystemStore } from '../../stores/useFileSystemStore'

const TYPE_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  page: { icon: FileCode, label: 'Page', color: 'text-blue-600 bg-blue-50' },
  component: { icon: Component, label: 'Component', color: 'text-violet-600 bg-violet-50' },
  hook: { icon: Puzzle, label: 'Hook', color: 'text-emerald-600 bg-emerald-50' },
  store: { icon: Database, label: 'Store', color: 'text-amber-600 bg-amber-50' },
  api: { icon: Globe, label: 'API', color: 'text-rose-600 bg-rose-50' },
  util: { icon: Wrench, label: 'Utility', color: 'text-gray-600 bg-gray-50' },
  type: { icon: FileCode, label: 'Type', color: 'text-cyan-600 bg-cyan-50' },
  config: { icon: FileCode, label: 'Config', color: 'text-orange-600 bg-orange-50' },
  unknown: { icon: FileCode, label: 'File', color: 'text-gray-500 bg-gray-50' },
}

interface FileDetailPanelProps {
  node: AnalysisDependencyNode
  incomingEdges: AnalysisDependencyEdge[]
  outgoingEdges: AnalysisDependencyEdge[]
  onClose: () => void
}

export function FileDetailPanel({
  node,
  incomingEdges,
  outgoingEdges,
  onClose,
}: FileDetailPanelProps) {
  const rootName = useFileSystemStore((s) => s.rootName)
  const openFile = useFileSystemStore((s) => s.openFile)

  const meta = TYPE_META[node.type] ?? TYPE_META['unknown']
  const Icon = meta.icon

  const handleOpenFile = useCallback(async () => {
    const ok = await openFile(node.filePath)
    if (!ok) {
      alert(`File not found: ${node.filePath}\n\nSet Project Root first.`)
    }
  }, [openFile, node.filePath])

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-[360px] border-l border-border bg-card shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${meta.color.split(' ')[0]}`} />
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Name + Path */}
        <div>
          <h2 className="text-base font-semibold">{node.label}</h2>
          <div className="mt-1 flex items-center gap-1.5">
            <code className="text-xs font-mono text-muted-foreground">{node.filePath}</code>
            {rootName && (
              <button
                type="button"
                className="text-primary hover:text-primary/80"
                onClick={handleOpenFile}
                title="Open in editor"
              >
                <Eye className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Exports */}
        {node.exports.length > 0 && (
          <Section title="Exports" count={node.exports.length}>
            <div className="space-y-1">
              {node.exports.map((exp) => (
                <div key={exp.name} className="flex items-center gap-2 text-xs">
                  <span className="rounded border px-1 py-0.5 text-[10px] text-muted-foreground font-mono">
                    {exp.kind}
                  </span>
                  <span className="font-mono font-medium">{exp.name}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Imported by (incoming) */}
        {incomingEdges.length > 0 && (
          <Section
            title="Imported by"
            icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            count={incomingEdges.length}
          >
            <div className="space-y-1.5">
              {incomingEdges.map((edge) => (
                <div key={edge.source} className="text-xs">
                  <p className="font-mono text-foreground">{edge.source}</p>
                  <p className="text-muted-foreground">
                    {edge.imports.map((i) => i.name).join(', ')}
                    {edge.imports.some((i) => i.isTypeOnly) && (
                      <span className="ml-1 text-[10px] text-cyan-500">(type-only)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Depends on (outgoing) */}
        {outgoingEdges.length > 0 && (
          <Section
            title="Depends on"
            icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
            count={outgoingEdges.length}
          >
            <div className="space-y-1.5">
              {outgoingEdges.map((edge) => (
                <div key={edge.target} className="text-xs">
                  <p className="font-mono text-foreground">{edge.target}</p>
                  <p className="text-muted-foreground">
                    {edge.imports.map((i) => i.name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Stats */}
        <div className="flex gap-4 rounded-md bg-muted/50 px-3 py-2">
          <Stat label="Exports" value={node.exports.length} />
          <Stat label="Imported by" value={incomingEdges.length} />
          <Stat label="Depends on" value={outgoingEdges.length} />
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon?: React.ReactNode
  count?: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
        {icon}
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground">({count})</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
