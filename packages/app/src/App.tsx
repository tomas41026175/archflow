import { lazy, Suspense, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/layout/Sidebar'
import { ConfigDropZone } from './components/panels/ConfigDropZone'
import { ErrorBanner } from './components/panels/ErrorBanner'
import { SearchPanel } from './components/panels/SearchPanel'
import { CodeEditor } from './components/panels/CodeEditor'
import { useProjectStore } from './stores/useProjectStore'

const LayerViewPage = lazy(() => import('./pages/LayerViewPage'))
const RouteViewPage = lazy(() => import('./pages/RouteViewPage'))
const StateFlowViewPage = lazy(() => import('./pages/StateFlowViewPage'))
const DependencyViewPage = lazy(() => import('./pages/DependencyViewPage'))

function ViewLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading view...</p>
    </div>
  )
}

export default function App() {
  const config = useProjectStore((s) => s.config)
  const activeView = useProjectStore((s) => s.activeView)
  const selectNode = useProjectStore((s) => s.selectNode)

  const handleSearchSelect = useCallback(
    (id: string) => selectNode(id),
    [selectNode],
  )

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1">
        <ErrorBanner />
        <SearchPanel onSelect={handleSearchSelect} />
        <CodeEditor />
        {!config && activeView !== 'dependencies' ? (
          <div className="flex h-full items-center justify-center p-8">
            <ConfigDropZone />
          </div>
        ) : (
          <ReactFlowProvider>
            <Suspense fallback={<ViewLoading />}>
              {activeView === 'layers' && <LayerViewPage />}
              {activeView === 'routes' && <RouteViewPage />}
              {activeView === 'stateFlows' && <StateFlowViewPage />}
              {activeView === 'dependencies' && <DependencyViewPage />}
            </Suspense>
          </ReactFlowProvider>
        )}
      </main>
    </div>
  )
}
