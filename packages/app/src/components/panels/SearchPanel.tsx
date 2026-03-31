import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import { useNodeSearch, type SearchResult } from '../../hooks/useNodeSearch'
import { cn } from '../../lib/utils'

interface SearchPanelProps {
  onSelect: (id: string) => void
}

export function SearchPanel({ onSelect }: SearchPanelProps) {
  const config = useProjectStore((s) => s.config)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useNodeSearch(config, query)

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (item: SearchResult) => {
      onSelect(item.id)
      setIsOpen(false)
    },
    [onSelect],
  )

  if (!isOpen || !config) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="fixed left-1/2 top-[20%] z-50 w-[480px] -translate-x-1/2 rounded-lg border bg-card shadow-xl">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search modules, stores, routes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results found
            </p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => handleSelect(item)}
              >
                <TypeBadge type={item.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
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
                {item.layerLabel && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {item.layerLabel}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2">
          <p className="text-[10px] text-muted-foreground">
            <kbd className="rounded border bg-muted px-1 text-[10px]">⌘K</kbd> to toggle
          </p>
        </div>
      </div>
    </>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    module: 'bg-blue-100 text-blue-700',
    store: 'bg-amber-100 text-amber-700',
    route: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span
      className={cn(
        'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
        colors[type] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {type}
    </span>
  )
}
