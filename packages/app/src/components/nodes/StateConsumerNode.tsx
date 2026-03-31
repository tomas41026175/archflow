import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Box } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { StateConsumerNodeData } from '../../lib/transforms/configToStateNodes'

export function StateConsumerNode({ data, selected }: NodeProps) {
  const { name } = data as StateConsumerNodeData

  return (
    <div
      className={cn(
        'flex w-[180px] items-center gap-2 rounded-md border bg-card px-3 py-2.5 shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
    >
      <Box className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate text-sm font-medium">{name}</span>

      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}
