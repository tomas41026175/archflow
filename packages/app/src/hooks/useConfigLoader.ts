import { useCallback } from 'react'
import { archflowConfigSchema } from '../lib/schema'
import { useProjectStore } from '../stores/useProjectStore'
import type { ZodError, ZodIssue } from 'zod'

function formatIssue(issue: ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
  const code = issue.code
  let detail = issue.message

  if (code === 'invalid_type') {
    const typed = issue as ZodIssue & { expected: string; received: string }
    detail = `expected ${typed.expected}, got ${typed.received}`
  }

  return `  ${path}  →  ${detail}`
}

function formatZodError(error: ZodError): string {
  const count = error.issues.length
  const header = `${count} validation error${count > 1 ? 's' : ''} found:\n`
  const details = error.issues.map(formatIssue).join('\n')
  return header + details
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
      } catch (e) {
        const msg =
          e instanceof SyntaxError
            ? `JSON syntax error: ${e.message}`
            : 'Invalid JSON format'
        setError(msg)
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
