import type { NodeProps } from '@xyflow/react'
import type { LayerGroupNodeData } from '../../types/canvas'

export function LayerGroupNode({ data }: NodeProps) {
  const { label, color, moduleCount } = data as LayerGroupNodeData

  return (
    <div
      className="h-full w-full rounded-lg border"
      style={{
        borderColor: `${color}4D`,
        borderStyle: 'dashed',
      }}
    >
      <div
        className="flex items-center justify-between rounded-t-lg px-3 py-2"
        style={{ backgroundColor: `${color}1A` }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color }}
        >
          {label}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: `${color}99` }}
        >
          {moduleCount} modules
        </span>
      </div>
    </div>
  )
}
