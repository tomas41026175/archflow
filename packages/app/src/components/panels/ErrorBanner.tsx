import { X } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'

export function ErrorBanner() {
  const error = useProjectStore((s) => s.error)
  const setError = useProjectStore((s) => s.setError)

  if (!error) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">
            Config Validation Error
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-destructive/80 font-mono">
            {error}
          </pre>
        </div>
        <button
          type="button"
          className="text-destructive/60 hover:text-destructive"
          onClick={() => setError(null)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
