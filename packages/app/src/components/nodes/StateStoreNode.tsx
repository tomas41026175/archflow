import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { StateStoreNodeData } from '../../lib/transforms/configToStateNodes'

export function StateStoreNode({ data, selected }: NodeProps) {
  const { name, library, atoms } = data as StateStoreNodeData

  return (
    <div
      className={cn(
        'flex w-[200px] flex-col rounded-lg border-2 border-amber-300/50 bg-amber-50 px-3 py-2.5 shadow-sm transition-all',
        selected && 'ring-2 ring-primary/50',
      )}
    >
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="truncate text-sm font-semibold text-amber-900">{name}</span>
      </div>
      {library && (
        <span className="mt-0.5 text-[10px] text-amber-600">{library}</span>
      )}
      {atoms.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {atoms.slice(0, 4).map((atom) => (
            <p key={atom} className="truncate text-[10px] font-mono text-amber-700/70">
              {atom}
            </p>
          ))}
          {atoms.length > 4 && (
            <p className="text-[10px] text-amber-600">
              +{atoms.length - 4} more
            </p>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!bg-amber-400" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400" />
    </div>
  )
}
