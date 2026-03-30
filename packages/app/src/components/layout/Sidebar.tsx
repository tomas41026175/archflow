import { Layers, GitBranch, Activity, Network } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { cn } from '../../lib/utils'
import type { ViewType } from '../../types/canvas'

const VIEW_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'layers', label: 'Architecture', icon: <Layers className="h-4 w-4" /> },
  { id: 'routes', label: 'Routes', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'stateFlows', label: 'State Flows', icon: <Activity className="h-4 w-4" /> },
  { id: 'dependencies', label: 'Dependencies', icon: <Network className="h-4 w-4" /> },
]

export function Sidebar() {
  const config = useProjectStore((s) => s.config)
  const activeView = useProjectStore((s) => s.activeView)
  const setActiveView = useProjectStore((s) => s.setActiveView)

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-semibold">Archflow</h1>
        {config && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {config.project.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {VIEW_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!config}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              activeView === item.id && config
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              !config && 'opacity-50 cursor-not-allowed',
            )}
            onClick={() => setActiveView(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-[10px] text-muted-foreground">
          Archflow v0.1.0
        </p>
      </div>
    </aside>
  )
}
