import { AlertTriangle, X } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'

export function ErrorBanner() {
  const error = useProjectStore((s) => s.error)
  const setError = useProjectStore((s) => s.setError)

  if (!error) return null

  const [header, ...details] = error.split('\n')

  return (
    <div className="fixed top-4 right-4 z-50 w-[420px] rounded-lg border border-destructive/50 bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-destructive/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            {header || 'Config Validation Error'}
          </span>
        </div>
        <button
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setError(null)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Details */}
      {details.length > 0 && (
        <div className="max-h-48 overflow-auto px-4 py-3">
          {details.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 py-1 text-xs font-mono"
            >
              <span className="text-muted-foreground select-none">
                {i + 1}.
              </span>
              <span className="text-foreground">{line.trim()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
