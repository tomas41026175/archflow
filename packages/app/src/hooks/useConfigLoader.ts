import { useCallback } from 'react'
import { archflowConfigSchema } from '../lib/schema'
import { useProjectStore } from '../stores/useProjectStore'
import type { ZodError } from 'zod'

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `[${path}] ${issue.message}`
    })
    .join('\n')
}

export function useConfigLoader() {
  const loadConfig = useProjectStore((s) => s.loadConfig)
  const setError = useProjectStore((s) => s.setError)

  const loadFromJson = useCallback(
    (jsonString: string) => {
      try {
        const raw: unknown = JSON.parse(jsonString)
        const result = archflowConfigSchema.safeParse(raw)

        if (!result.success) {
          setError(formatZodError(result.error))
          return false
        }

        loadConfig(result.data)
        return true
      } catch {
        setError('Invalid JSON format')
        return false
      }
    },
    [loadConfig, setError],
  )

  const loadFromFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      return loadFromJson(text)
    },
    [loadFromJson],
  )

  return { loadFromJson, loadFromFile }
}
