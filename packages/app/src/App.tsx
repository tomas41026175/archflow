import { useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/layout/Sidebar'
import { ConfigDropZone } from './components/panels/ConfigDropZone'
import { ErrorBanner } from './components/panels/ErrorBanner'
import { SearchPanel } from './components/panels/SearchPanel'
import { LayerViewPage } from './pages/LayerViewPage'
import { RouteViewPage } from './pages/RouteViewPage'
import { StateFlowViewPage } from './pages/StateFlowViewPage'
import { DependencyViewPage } from './pages/DependencyViewPage'
import { useProjectStore } from './stores/useProjectStore'

export default function App() {
  const config = useProjectStore((s) => s.config)
  const activeView = useProjectStore((s) => s.activeView)
  const setActiveView = useProjectStore((s) => s.setActiveView)

  const handleSearchSelect = useCallback(
    (id: string) => {
      // Navigate to layers view when selecting from search
      if (activeView !== 'layers') {
        setActiveView('layers')
      }
      // The layer view will handle the selection via its own state
      // For now, just switch to the right view
    },
    [activeView, setActiveView],
  )

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1">
        <ErrorBanner />
        <SearchPanel onSelect={handleSearchSelect} />
        {!config && activeView !== 'dependencies' ? (
          <div className="flex h-full items-center justify-center p-8">
            <ConfigDropZone />
          </div>
        ) : (
          <ReactFlowProvider>
            {activeView === 'layers' && <LayerViewPage />}
            {activeView === 'routes' && <RouteViewPage />}
            {activeView === 'stateFlows' && <StateFlowViewPage />}
            {activeView === 'dependencies' && <DependencyViewPage />}
          </ReactFlowProvider>
        )}
      </main>
    </div>
  )
}
