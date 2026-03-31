import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FolderTree } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { RouteNodeData } from '../../lib/transforms/configToRouteNodes'

export function RouteGroupNode({ data, selected }: NodeProps) {
  const { path, name, childCount, guard } = data as RouteNodeData

  return (
    <div
      className={cn(
        'flex w-[240px] flex-col rounded-lg border-2 border-dashed border-border bg-card/50 px-3 py-2.5 shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
    >
      <div className="flex items-center gap-2">
        <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate text-sm font-semibold">{name}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{path}</span>
        {guard && <span className="text-amber-500">({guard})</span>}
      </div>
      <span className="mt-1 text-[10px] text-muted-foreground">
        {childCount} route{childCount > 1 ? 's' : ''}
      </span>

      <Handle type="target" position={Position.Top} className="!bg-border" />
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}
