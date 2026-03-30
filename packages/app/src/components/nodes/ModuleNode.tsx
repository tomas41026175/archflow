import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '../../lib/utils'
import type { ModuleNodeData } from '../../types/canvas'

export function ModuleNode({ data, selected }: NodeProps) {
  const { module, layerColor } = data as ModuleNodeData
  const tags = module.tags ?? []

  return (
    <div
      className={cn(
        'relative flex min-w-[200px] max-w-[280px] flex-col rounded-md border bg-card shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
    >
      {/* Left color bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-md"
        style={{ backgroundColor: layerColor }}
      />

      <div className="py-2.5 pl-4 pr-3">
        <p className="text-sm font-medium leading-tight text-card-foreground truncate">
          {module.name}
        </p>
        {module.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {module.description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}
