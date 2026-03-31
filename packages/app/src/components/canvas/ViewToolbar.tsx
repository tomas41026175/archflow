import { Layers, File, Focus, X, Download } from 'lucide-react'
import { toPng, toSvg } from 'html-to-image'
import { cn } from '../../lib/utils'

const TYPE_COLORS: Record<string, string> = {
  page: 'bg-blue-100 text-blue-700',
  component: 'bg-violet-100 text-violet-700',
  hook: 'bg-emerald-100 text-emerald-700',
  store: 'bg-amber-100 text-amber-700',
  api: 'bg-rose-100 text-rose-700',
  util: 'bg-gray-100 text-gray-700',
  type: 'bg-cyan-100 text-cyan-700',
  config: 'bg-orange-100 text-orange-700',
  service: 'bg-teal-100 text-teal-700',
  unknown: 'bg-gray-100 text-gray-500',
}

interface ViewToolbarProps {
  /** Stats text (e.g., "43 files · 95 deps") */
  stats?: string
  /** Available granularity toggle */
  granularity?: 'file' | 'directory'
  onGranularityChange?: (g: 'file' | 'directory') => void
  /** Available type filters */
  availableTypes?: string[]
  activeTypes?: string[]
  onTypeToggle?: (type: string) => void
  /** Focus mode */
  focusNodeId?: string | null
  onClearFocus?: () => void
}

function handleExport(format: 'png' | 'svg'): void {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewport) return

  const fn = format === 'png' ? toPng : toSvg
  fn(viewport, { backgroundColor: 'white' })
    .then((dataUrl) => {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `archflow-export.${format}`
      a.click()
    })
    .catch(() => {
      // export failed silently
    })
}

export function ViewToolbar({
  stats,
  granularity,
  onGranularityChange,
  availableTypes,
  activeTypes,
  onTypeToggle,
  focusNodeId,
  onClearFocus,
}: ViewToolbarProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
      {/* Stats */}
      {stats && (
        <span className="rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          {stats}
        </span>
      )}

      {/* Granularity toggle */}
      {granularity && onGranularityChange && (
        <div className="flex items-center rounded-md border bg-card shadow-sm">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-l-md px-2 py-1.5 text-[11px] font-medium transition-colors',
              granularity === 'file'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onGranularityChange('file')}
          >
            <File className="h-3 w-3" />
            File
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-r-md px-2 py-1.5 text-[11px] font-medium transition-colors',
              granularity === 'directory'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onGranularityChange('directory')}
          >
            <Layers className="h-3 w-3" />
            Directory
          </button>
        </div>
      )}

      {/* Type filter chips */}
      {availableTypes && availableTypes.length > 0 && onTypeToggle && (
        <div className="flex flex-wrap items-center gap-1">
          {availableTypes.map((type) => {
            const isActive = !activeTypes || activeTypes.length === 0 || activeTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium transition-all',
                  isActive
                    ? TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-700'
                    : 'bg-muted/50 text-muted-foreground/40 line-through',
                )}
                onClick={() => onTypeToggle(type)}
              >
                {type}
              </button>
            )
          })}
        </div>
      )}

      {/* Focus indicator */}
      {focusNodeId && onClearFocus && (
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
          onClick={onClearFocus}
        >
          <Focus className="h-3 w-3" />
          Focus: {focusNodeId.split('/').pop()?.replace(/\.\w+$/, '')}
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Export */}
      <div className="flex items-center rounded-md border bg-card shadow-sm">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-l-md"
          onClick={() => handleExport('png')}
          title="Export as PNG"
        >
          <Download className="h-3 w-3" />
          PNG
        </button>
        <button
          type="button"
          className="px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-l rounded-r-md"
          onClick={() => handleExport('svg')}
          title="Export as SVG"
        >
          SVG
        </button>
      </div>
    </div>
  )
}
