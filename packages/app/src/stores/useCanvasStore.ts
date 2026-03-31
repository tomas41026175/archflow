import { create } from 'zustand'

interface CanvasState {
  selectedNodeId: string | null
  highlightedEdgeIds: Set<string>
}

interface CanvasActions {
  selectNode: (nodeId: string | null) => void
  setHighlightedEdges: (edgeIds: string[]) => void
  clearSelection: () => void
}

const initialState: CanvasState = {
  selectedNodeId: null,
  highlightedEdgeIds: new Set(),
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set) => ({
  ...initialState,

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId }),

  setHighlightedEdges: (edgeIds) =>
    set({ highlightedEdgeIds: new Set(edgeIds) }),

  clearSelection: () =>
    set(initialState),
}))
