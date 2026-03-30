import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/layout/Sidebar'
import { ConfigDropZone } from './components/panels/ConfigDropZone'
import { ErrorBanner } from './components/panels/ErrorBanner'
import { LayerViewPage } from './pages/LayerViewPage'
import { useProjectStore } from './stores/useProjectStore'

export default function App() {
  const config = useProjectStore((s) => s.config)
  const activeView = useProjectStore((s) => s.activeView)

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1">
        <ErrorBanner />
        {!config ? (
          <div className="flex h-full items-center justify-center p-8">
            <ConfigDropZone />
          </div>
        ) : (
          <ReactFlowProvider>
            {activeView === 'layers' && <LayerViewPage />}
            {activeView === 'routes' && <ComingSoon view="Routes" />}
            {activeView === 'stateFlows' && <ComingSoon view="State Flows" />}
            {activeView === 'dependencies' && <ComingSoon view="Dependencies" />}
          </ReactFlowProvider>
        )}
      </main>
    </div>
  )
}

function ComingSoon({ view }: { view: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">{view} — Coming in Phase 2</p>
    </div>
  )
}
