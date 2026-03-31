import { useCallback, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { X, Save, Trash2, FileCode } from 'lucide-react'
import { useFileSystemStore } from '../../stores/useFileSystemStore'
import { cn } from '../../lib/utils'
import type { Extension } from '@codemirror/state'

function getLanguageExtension(filePath: string): Extension[] {
  const ext = filePath.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return [javascript({ typescript: true, jsx: ext === 'tsx' })]
    case 'js':
    case 'jsx':
      return [javascript({ jsx: ext === 'jsx' })]
    case 'json':
      return [json()]
    case 'css':
      return [css()]
    case 'html':
      return [html()]
    default:
      return []
  }
}

export function CodeEditor() {
  const openFilePath = useFileSystemStore((s) => s.openFilePath)
  const openFileContent = useFileSystemStore((s) => s.openFileContent)
  const isDirty = useFileSystemStore((s) => s.isDirty)
  const setOpenFileContent = useFileSystemStore((s) => s.setOpenFileContent)
  const saveFile = useFileSystemStore((s) => s.saveFile)
  const deleteFile = useFileSystemStore((s) => s.deleteFile)
  const closeFile = useFileSystemStore((s) => s.closeFile)

  // Cmd+S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && openFilePath) {
        e.preventDefault()
        saveFile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openFilePath, saveFile])

  const handleDelete = useCallback(async () => {
    if (!openFilePath) return
    const confirmed = window.confirm(`Delete ${openFilePath}?`)
    if (confirmed) {
      await deleteFile(openFilePath)
    }
  }, [openFilePath, deleteFile])

  if (!openFilePath || openFileContent === null) return null

  const extensions = getLanguageExtension(openFilePath)
  const fileName = openFilePath.split('/').pop() ?? openFilePath

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-sm font-mono">
            {fileName}
            {isDirty && <span className="text-amber-500 ml-1">*</span>}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {openFilePath}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-muted-foreground',
            )}
            disabled={!isDirty}
            onClick={saveFile}
            title="Save (⌘S)"
          >
            <Save className="h-3 w-3" />
            Save
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={handleDelete}
            title="Delete file"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={closeFile}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={openFileContent}
          height="100%"
          extensions={extensions}
          onChange={setOpenFileContent}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: false,
          }}
          className="h-full text-sm"
        />
      </div>
    </div>
  )
}
