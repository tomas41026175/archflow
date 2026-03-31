import { create } from 'zustand'
import type { ArchflowConfig } from '../lib/schema'
import type { ViewType } from '../types/canvas'

const STORAGE_KEY = 'archflow:config'
const VIEW_KEY = 'archflow:activeView'

function loadPersistedConfig(): ArchflowConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ArchflowConfig) : null
  } catch {
    return null
  }
}

function loadPersistedView(): ViewType {
  const raw = localStorage.getItem(VIEW_KEY)
  if (raw === 'layers' || raw === 'routes' || raw === 'stateFlows' || raw === 'dependencies') {
    return raw
  }
  return 'layers'
}

interface ProjectState {
  config: ArchflowConfig | null
  activeView: ViewType
  error: string | null
  pendingNodeId: string | null
}

interface ProjectActions {
  loadConfig: (config: ArchflowConfig) => void
  setActiveView: (view: ViewType) => void
  setError: (error: string | null) => void
  selectNode: (nodeId: string) => void
  consumePendingNode: () => string | null
  reset: () => void
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  config: loadPersistedConfig(),
  activeView: loadPersistedView(),
  error: null,
  pendingNodeId: null,

  loadConfig: (config) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    set({ config, error: null })
  },

  setActiveView: (activeView) => {
    localStorage.setItem(VIEW_KEY, activeView)
    set({ activeView })
  },

  setError: (error) =>
    set({ error }),

  selectNode: (nodeId) =>
    set({ pendingNodeId: nodeId, activeView: 'layers' }),

  consumePendingNode: () => {
    const id = get().pendingNodeId
    if (id) set({ pendingNodeId: null })
    return id
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(VIEW_KEY)
    set({ config: null, activeView: 'layers', error: null, pendingNodeId: null })
  },
}))
