import { create } from 'zustand'
import type { ArchflowConfig } from '../lib/schema'
import type { ViewType } from '../types/canvas'

interface ProjectState {
  config: ArchflowConfig | null
  activeView: ViewType
  error: string | null
}

interface ProjectActions {
  loadConfig: (config: ArchflowConfig) => void
  setActiveView: (view: ViewType) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: ProjectState = {
  config: null,
  activeView: 'layers',
  error: null,
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  ...initialState,

  loadConfig: (config) =>
    set({ config, error: null }),

  setActiveView: (activeView) =>
    set({ activeView }),

  setError: (error) =>
    set({ error }),

  reset: () =>
    set(initialState),
}))
