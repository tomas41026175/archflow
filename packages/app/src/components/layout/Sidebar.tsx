import { useCallback } from 'react'
import { Layers, GitBranch, Activity, Network, FolderOpen, FolderCheck, FileUp, Sun, Moon } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { useFileSystemStore } from '../../stores/useFileSystemStore'
import { useConfigLoader } from '../../hooks/useConfigLoader'
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
  const theme = useProjectStore((s) => s.theme)
  const toggleTheme = useProjectStore((s) => s.toggleTheme)
  const rootName = useFileSystemStore((s) => s.rootName)
  const setDirectoryHandle = useFileSystemStore((s) => s.setDirectoryHandle)
  const { loadFromFile } = useConfigLoader()

  const handlePickDirectory = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setDirectoryHandle(handle)
    } catch {
      // User cancelled
    }
  }, [setDirectoryHandle])

  const handleSwitchConfig = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) await loadFromFile(file)
    }
    input.click()
  }, [loadFromFile])

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Archflow</h1>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={handleSwitchConfig}
            title="Load / switch config"
          >
            <FileUp className="h-4 w-4" />
          </button>
        </div>
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
            disabled={!config && item.id !== 'dependencies'}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              activeView === item.id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              !config && item.id !== 'dependencies' && 'opacity-50 cursor-not-allowed',
            )}
            onClick={() => setActiveView(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Project Root */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors',
            rootName
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          )}
          onClick={handlePickDirectory}
        >
          {rootName ? (
            <>
              <FolderCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{rootName}</span>
            </>
          ) : (
            <>
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              Set Project Root
            </>
          )}
        </button>
        {!rootName && (
          <p className="mt-1 px-3 text-[10px] text-muted-foreground">
            Enable in-app file viewing
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground">
          Archflow v0.1.0
        </p>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  )
}
