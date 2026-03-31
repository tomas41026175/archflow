import { create } from 'zustand'
import type { ArchflowConfig } from '../lib/schema'
import type { ViewType } from '../types/canvas'

const STORAGE_KEY = 'archflow:config'
const VIEW_KEY = 'archflow:activeView'
const THEME_KEY = 'archflow:theme'

export type Theme = 'light' | 'dark'

function loadPersistedTheme(): Theme {
  const raw = localStorage.getItem(THEME_KEY)
  return raw === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Apply on load
applyTheme(loadPersistedTheme())

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
  configVersion: number
  activeView: ViewType
  theme: Theme
  error: string | null
  pendingNodeId: string | null
}

interface ProjectActions {
  loadConfig: (config: ArchflowConfig) => void
  setActiveView: (view: ViewType) => void
  toggleTheme: () => void
  setError: (error: string | null) => void
  selectNode: (nodeId: string) => void
  consumePendingNode: () => string | null
  reset: () => void
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  config: loadPersistedConfig(),
  configVersion: 0,
  activeView: loadPersistedView(),
  theme: loadPersistedTheme(),
  error: null,
  pendingNodeId: null,

  loadConfig: (config) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    set((s) => ({ config, configVersion: s.configVersion + 1, error: null }))
  },

  setActiveView: (activeView) => {
    localStorage.setItem(VIEW_KEY, activeView)
    set({ activeView })
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
    set({ theme: next })
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
    set((s) => ({ config: null, configVersion: s.configVersion + 1, activeView: 'layers', error: null, pendingNodeId: null }))
  },
}))
