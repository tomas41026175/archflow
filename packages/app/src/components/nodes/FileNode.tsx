import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  FileCode,
  Component,
  Puzzle,
  Database,
  Globe,
  Wrench,
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

export function FileNode({ data, selected }: NodeProps) {
  const { label, type, filePath, exportCount } = data as FileNodeData
  const Icon = TYPE_ICONS[type] ?? FileCode
  const colorClass = TYPE_COLORS[type] ?? 'text-muted-foreground'

  return (
    <div
      className={cn(
        'flex w-[160px] items-center gap-2 rounded-md border bg-card px-2.5 py-2 shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
      title={filePath}
    >
      <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-mono font-medium">{label}</p>
        {exportCount > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {exportCount} export{exportCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}
