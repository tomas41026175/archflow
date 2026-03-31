import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const RC_FILENAME = '.archflowrc.json'

export interface RcConfig {
  analyzer?: {
    root?: string
    tsconfig?: string
    output?: string
    include?: string[]
    exclude?: string[]
  }
  config?: string
}

/** Walk up from cwd to find .archflowrc.json (max 5 levels) */
export function findRcFile(startDir: string = process.cwd()): string | null {
  let current = path.resolve(startDir)
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(current, RC_FILENAME)
    if (existsSync(candidate)) return candidate
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

/** Load and parse .archflowrc.json, returns null if not found */
export function loadRcConfig(startDir?: string): RcConfig | null {
  const rcPath = findRcFile(startDir)
  if (!rcPath) return null

  try {
    const content = readFileSync(rcPath, 'utf-8')
    return JSON.parse(content) as RcConfig
  } catch {
    return null
  }
}

/** Merge rc config with CLI options (CLI wins) */
export function mergeWithRc(
  cliOpts: {
    root?: string
    tsconfig?: string
    include?: string[]
    exclude?: string[]
    output?: string
  },
  rc: RcConfig | null,
): {
  root: string
  tsconfig?: string
  include?: string[]
  exclude?: string[]
  output?: string
} {
  const analyzer = rc?.analyzer

  return {
    root: cliOpts.root ?? analyzer?.root ?? '.',
    tsconfig: cliOpts.tsconfig ?? analyzer?.tsconfig,
    include: cliOpts.include ?? analyzer?.include,
    exclude: cliOpts.exclude ?? analyzer?.exclude,
    output: cliOpts.output ?? analyzer?.output,
  }
}
