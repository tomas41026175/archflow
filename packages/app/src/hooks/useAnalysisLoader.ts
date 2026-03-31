import { useCallback, useEffect, useState } from 'react'
import { archflowConfigSchema, analysisResultSchema, type AnalysisResult } from '../lib/schema'
import { useProjectStore } from '../stores/useProjectStore'

interface AnalysisEntry {
  label: string
  data: AnalysisResult
}

export function useAnalysisLoader() {
  const config = useProjectStore((s) => s.config)
  const configVersion = useProjectStore((s) => s.configVersion)
  const loadConfig = useProjectStore((s) => s.loadConfig)

  const [entries, setEntries] = useState<AnalysisEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Reset when config changes
  useEffect(() => {
    if (!config?.analysis) {
      setEntries([])
      setActiveIndex(0)
      return
    }
    const result = analysisResultSchema.safeParse(config.analysis)
    if (!result.success) return

    const label = config.project.name ?? 'Config'
    setEntries([{ label, data: result.data }])
    setActiveIndex(0)
  }, [configVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  const analysis = entries[activeIndex]?.data ?? null

  const addEntry = useCallback((label: string, data: AnalysisResult) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.label === label)
      if (idx >= 0) {
        setActiveIndex(idx)
        return prev.map((e, i) => (i === idx ? { label, data } : e))
      }
      const next = [...prev, { label, data }]
      setActiveIndex(next.length - 1)
      return next
    })
  }, [])

  const loadFromJson = useCallback(
    (jsonString: string, fileName: string) => {
      try {
        const raw = JSON.parse(jsonString) as Record<string, unknown>

        // Try 1: raw analysis JSON
        const direct = analysisResultSchema.safeParse(raw)
        if (direct.success) {
          addEntry(fileName.replace(/\.json$/, ''), direct.data)
          setError(null)
          return
        }

        // Try 2: full config JSON
        const configResult = archflowConfigSchema.safeParse(raw)
        if (configResult.success) {
          loadConfig(configResult.data)
          setError(null)
          return
        }

        setError('No valid analysis data found.')
      } catch {
        setError('Invalid JSON file')
      }
    },
    [addEntry, loadConfig],
  )

  const switchTo = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  return { entries, activeIndex, analysis, error, loadFromJson, switchTo }
}
