import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Lock } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { RouteNodeData } from '../../lib/transforms/configToRouteNodes'

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-violet-100 text-violet-700',
}

export function RouteNode({ data, selected }: NodeProps) {
  const { path, name, method, guard } = data as RouteNodeData
  const methodClass = method ? METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-700' : null

  return (
    <div
      className={cn(
        'flex w-[220px] flex-col rounded-md border bg-card px-3 py-2 shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
    >
      <div className="flex items-center gap-1.5">
        {guard && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
        {methodClass && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', methodClass)}>
            {method}
          </span>
        )}
        <span className="truncate text-xs font-mono text-muted-foreground">{path}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium">{name}</p>

      <Handle type="target" position={Position.Top} className="!bg-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}
