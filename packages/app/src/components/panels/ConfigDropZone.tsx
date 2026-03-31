import { useCallback, useState, type DragEvent } from 'react'
import { Upload, Sparkles } from 'lucide-react'
import { useConfigLoader } from '../../hooks/useConfigLoader'
import { cn } from '../../lib/utils'

const EXAMPLE_CONFIG_URL = 'https://raw.githubusercontent.com/tomas41026175/archflow/main/examples/mayoform/archflow.config.json'

export function ConfigDropZone() {
  const { loadFromFile, loadFromJson } = useConfigLoader()
  const [isDragging, setIsDragging] = useState(false)
  const [loadingExample, setLoadingExample] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.json')) {
        await loadFromFile(file)
      }
    },
    [loadFromFile],
  )

  const handleFileSelect = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) {
        await loadFromFile(file)
      }
    }
    input.click()
  }, [loadFromFile])

  const handleLoadExample = useCallback(async () => {
    setLoadingExample(true)
    try {
      const resp = await fetch(EXAMPLE_CONFIG_URL)
      if (!resp.ok) throw new Error('fetch failed')
      const text = await resp.text()
      loadFromJson(text)
    } catch {
      // Fallback: try loading from local
      setLoadingExample(false)
    }
  }, [loadFromJson])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Drop zone */}
      <div
        className={cn(
          'flex w-[400px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-10 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={cn(
            'h-8 w-8',
            isDragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium">
            Drop archflow.config.json here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or{' '}
            <button
              type="button"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={handleFileSelect}
            >
              browse files
            </button>
          </p>
        </div>
      </div>

      {/* Quick start */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>No config yet?</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent transition-colors disabled:opacity-50"
          disabled={loadingExample}
          onClick={handleLoadExample}
        >
          <Sparkles className="h-3 w-3" />
          {loadingExample ? 'Loading...' : 'Load MAYOForm example'}
        </button>
      </div>

      {/* CLI hint */}
      <p className="max-w-sm text-center text-[11px] text-muted-foreground/60">
        Generate with CLI:{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
          archflow embed --verbose
        </code>
      </p>
    </div>
  )
}
