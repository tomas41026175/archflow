import { useCallback, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { useConfigLoader } from '../../hooks/useConfigLoader'
import { cn } from '../../lib/utils'

export function ConfigDropZone() {
  const { loadFromFile } = useConfigLoader()
  const [isDragging, setIsDragging] = useState(false)

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

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors',
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
          'h-10 w-10',
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
  )
}
