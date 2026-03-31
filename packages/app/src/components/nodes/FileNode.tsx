import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  FileCode,
  Component,
  Puzzle,
  Database,
  Globe,
  Wrench,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { FileNodeData } from '../../lib/transforms/analysisToDepNodes'

const TYPE_ICONS: Record<string, LucideIcon> = {
  page: FileCode,
  component: Component,
  hook: Puzzle,
  store: Database,
  api: Globe,
  util: Wrench,
}

const TYPE_COLORS: Record<string, string> = {
  page: 'text-blue-500',
  component: 'text-violet-500',
  hook: 'text-emerald-500',
  store: 'text-amber-500',
  api: 'text-rose-500',
  util: 'text-gray-500',
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-red-400 bg-red-50',
  warning: 'border-amber-300 bg-amber-50',
  ok: 'border bg-card',
}

export function FileNode({ data, selected }: NodeProps) {
  const { label, type, filePath, exportCount, fileCount, lineCount, anyCount, severity } = data as FileNodeData
  const Icon = TYPE_ICONS[type] ?? FileCode
  const colorClass = TYPE_COLORS[type] ?? 'text-muted-foreground'
  const borderStyle = SEVERITY_STYLES[severity ?? 'ok'] ?? SEVERITY_STYLES['ok']

  return (
    <div
      className={cn(
        'flex w-[160px] items-center gap-2 rounded-md px-2.5 py-2 shadow-sm transition-all',
        borderStyle,
        selected && 'ring-2 ring-primary/50',
      )}
      title={`${filePath}\n${lineCount ? `${lineCount} lines` : ''}${anyCount ? ` · ${anyCount} any` : ''}`}
    >
      {severity === 'critical' ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'truncate text-xs font-mono font-medium',
          severity === 'critical' && 'text-red-700',
        )}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {fileCount
            ? `${fileCount} files`
            : [
                lineCount ? `${lineCount}L` : null,
                anyCount ? `${anyCount} any` : null,
                !lineCount && !anyCount && exportCount > 0 ? `${exportCount} exports` : null,
              ].filter(Boolean).join(' · ') || ''
          }
        </p>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}
