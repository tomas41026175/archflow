import { useCallback } from 'react'
import { X, ExternalLink, FileCode, Tag, Eye } from 'lucide-react'
import type { Module } from '../../lib/schema'
import { useFileSystemStore } from '../../stores/useFileSystemStore'
import { cn } from '../../lib/utils'

interface DetailPanelProps {
  module: Module
  layerLabel: string
  layerColor: string
  onClose: () => void
}

export function DetailPanel({
  module,
  layerLabel,
  layerColor,
  onClose,
}: DetailPanelProps) {
  const files = module.files ?? []
  const tags = module.tags ?? []
  const endpoints = module.endpoints ?? []
  const dependsOn = module.dependsOn ?? []
  const rootName = useFileSystemStore((s) => s.rootName)
  const openFile = useFileSystemStore((s) => s.openFile)

  const handleFileClick = useCallback(
    (filePath: string) => {
      // Strip glob patterns for opening (e.g., src/api/** → can't open directly)
      if (filePath.includes('*')) return
      openFile(filePath)
    },
    [openFile],
  )

  const isOpenable = (filePath: string): boolean =>
    !!rootName && !filePath.includes('*')

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-[360px] border-l border-border bg-card shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: layerColor }}
          />
          <span className="text-xs text-muted-foreground">{layerLabel}</span>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Name & Type */}
        <div>
          <h2 className="text-base font-semibold">{module.name}</h2>
          {module.type && (
            <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              {module.type}
            </span>
          )}
        </div>

        {/* Description */}
        {module.description && (
          <p className="text-sm text-muted-foreground">{module.description}</p>
        )}

        {/* Files */}
        {files.length > 0 && (
          <Section title="Files" icon={<FileCode className="h-3.5 w-3.5" />}>
            <ul className="space-y-1">
              {files.map((file) => (
                <li key={file} className="flex items-center gap-1">
                  {isOpenable(file) ? (
                    <button
                      type="button"
                      className="group flex items-center gap-1.5 truncate text-xs font-mono text-primary hover:underline"
                      onClick={() => handleFileClick(file)}
                    >
                      <Eye className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {file}
                    </button>
                  ) : (
                    <span className="truncate text-xs font-mono text-muted-foreground">
                      {file}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!rootName && files.some((f) => !f.includes('*')) && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Set Project Root in sidebar to view files
              </p>
            )}
          </Section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Section title="Tags" icon={<Tag className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Endpoints */}
        {endpoints.length > 0 && (
          <Section title="API Endpoints" icon={<ExternalLink className="h-3.5 w-3.5" />}>
            <ul className="space-y-1">
              {endpoints.map((ep) => (
                <li key={ep} className="text-xs font-mono text-muted-foreground">
                  {ep}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Dependencies */}
        {dependsOn.length > 0 && (
          <Section title="Depends On">
            <ul className="space-y-1">
              {dependsOn.map((dep) => (
                <li key={dep} className="text-xs text-muted-foreground">
                  {dep}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* External URL */}
        {module.externalUrl && (
          <a
            href={module.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open external link
          </a>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}
