import { X, ExternalLink, FileCode, Tag } from 'lucide-react'
import type { Module } from '../../lib/schema'

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
                <li key={file}>
                  <a
                    href={`vscode://file/${file}`}
                    className="block truncate text-xs font-mono text-primary hover:underline"
                  >
                    {file}
                  </a>
                </li>
              ))}
            </ul>
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
                <li
                  key={ep}
                  className="text-xs font-mono text-muted-foreground"
                >
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
                <li
                  key={dep}
                  className="text-xs text-muted-foreground"
                >
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
