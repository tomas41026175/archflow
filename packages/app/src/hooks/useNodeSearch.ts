import { useMemo } from 'react'
import type { ArchflowConfig, Module } from '../lib/schema'

export interface SearchResult {
  id: string
  name: string
  type: 'module' | 'route' | 'store'
  description?: string
  tags?: string[]
  layerLabel?: string
}

function collectSearchableItems(config: ArchflowConfig): SearchResult[] {
  const items: SearchResult[] = []

  // Modules from layers
  for (const layer of config.layers ?? []) {
    for (const mod of layer.modules) {
      items.push({
        id: mod.id,
        name: mod.name,
        type: 'module',
        description: mod.description,
        tags: mod.tags,
        layerLabel: layer.label,
      })
    }
  }

  // Stores from stateFlows
  for (const store of config.stateFlows?.stores ?? []) {
    items.push({
      id: store.id,
      name: store.name,
      type: 'store',
    })
  }

  return items
}

export function useNodeSearch(config: ArchflowConfig | null, query: string): SearchResult[] {
  const allItems = useMemo(() => {
    if (!config) return []
    return collectSearchableItems(config)
  }, [config])

  return useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10)

    const lower = query.toLowerCase()
    return allItems.filter((item) => {
      const searchable = [
        item.name,
        item.description ?? '',
        item.id,
        ...(item.tags ?? []),
        item.layerLabel ?? '',
      ].join(' ').toLowerCase()

      return searchable.includes(lower)
    })
  }, [allItems, query])
}
