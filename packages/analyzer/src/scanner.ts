import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { AnalysisResult } from './types.js'

// ─── Package.json scanning ───

interface PackageInfo {
  name: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

function readPackageJson(rootDir: string): PackageInfo | null {
  let dir = path.resolve(rootDir)
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'package.json')
    if (existsSync(candidate)) {
      const raw = JSON.parse(readFileSync(candidate, 'utf-8')) as Record<string, unknown>
      return {
        name: (raw['name'] as string) ?? path.basename(dir),
        dependencies: (raw['dependencies'] as Record<string, string>) ?? {},
        devDependencies: (raw['devDependencies'] as Record<string, string>) ?? {},
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

interface TechStack {
  framework?: string
  stateManagement: string[]
  httpClient?: string
  uiLibrary?: string
  styling?: string
  forms?: string
  testing: string[]
  other: string[]
}

const TECH_DETECTORS: { pkg: string; label: string; category: keyof TechStack }[] = [
  { pkg: 'next', label: 'Next.js', category: 'framework' },
  { pkg: 'react', label: 'React', category: 'framework' },
  { pkg: 'vue', label: 'Vue', category: 'framework' },
  { pkg: '@angular/core', label: 'Angular', category: 'framework' },
  { pkg: 'axios', label: 'Axios', category: 'httpClient' },
  { pkg: 'ky', label: 'Ky', category: 'httpClient' },
  { pkg: 'jotai', label: 'Jotai', category: 'stateManagement' },
  { pkg: 'zustand', label: 'Zustand', category: 'stateManagement' },
  { pkg: '@reduxjs/toolkit', label: 'Redux Toolkit', category: 'stateManagement' },
  { pkg: '@tanstack/react-query', label: 'TanStack Query', category: 'stateManagement' },
  { pkg: 'tailwindcss', label: 'Tailwind CSS', category: 'styling' },
  { pkg: '@chakra-ui/react', label: 'Chakra UI', category: 'uiLibrary' },
  { pkg: '@mui/material', label: 'MUI', category: 'uiLibrary' },
  { pkg: 'react-hook-form', label: 'React Hook Form', category: 'forms' },
  { pkg: 'lexical', label: 'Lexical', category: 'other' },
  { pkg: '@xyflow/react', label: 'React Flow', category: 'other' },
  { pkg: 'vitest', label: 'Vitest', category: 'testing' },
  { pkg: 'jest', label: 'Jest', category: 'testing' },
  { pkg: '@playwright/test', label: 'Playwright', category: 'testing' },
]

function detectTechStack(pkg: PackageInfo): TechStack {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  const stack: TechStack = { stateManagement: [], testing: [], other: [] }

  for (const detector of TECH_DETECTORS) {
    const version = allDeps[detector.pkg]
    if (!version) continue
    const label = `${detector.label} ${version.replace(/[\^~]/, '')}`
    const cat = detector.category
    if (cat === 'stateManagement' || cat === 'testing' || cat === 'other') {
      stack[cat].push(label)
    } else if (cat === 'framework') stack.framework = label
    else if (cat === 'httpClient') stack.httpClient = label
    else if (cat === 'uiLibrary') stack.uiLibrary = label
    else if (cat === 'styling') stack.styling = label
    else if (cat === 'forms') stack.forms = label
  }
  return stack
}

// ─── Layer inference ───

interface InferredModule {
  id: string
  name: string
  type: string
  description: string
  files: string[]
  tags: string[]
  dependsOn?: string[]
}

interface InferredLayer {
  id: string
  label: string
  color: string
  order: number
  modules: InferredModule[]
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '__tests__', '__mocks__', '__mock__', '_tests_', 'mocks'])

const LAYER_PATTERNS: {
  dirPattern: RegExp
  layerId: string
  label: string
  color: string
  order: number
  moduleType: string
}[] = [
  { dirPattern: /^(pages?|app|views?)$/, layerId: 'presentation', label: 'Presentation', color: '#3B82F6', order: 0, moduleType: 'page' },
  { dirPattern: /^(components?)$/, layerId: 'ui-components', label: 'UI Components', color: '#8B5CF6', order: 1, moduleType: 'component' },
  { dirPattern: /^(hooks?)$/, layerId: 'business-logic', label: 'Business Logic', color: '#10B981', order: 2, moduleType: 'hook' },
  { dirPattern: /^(feature|features|modules?)$/, layerId: 'features', label: 'Features', color: '#14B8A6', order: 2, moduleType: 'service' },
  { dirPattern: /^(api|services?)$/, layerId: 'data-access', label: 'Data Access', color: '#F59E0B', order: 3, moduleType: 'api' },
  { dirPattern: /^(store|stores?|context)$/, layerId: 'state', label: 'State Management', color: '#F97316', order: 4, moduleType: 'store' },
  { dirPattern: /^(utils?|lib|helpers?)$/, layerId: 'utilities', label: 'Utilities', color: '#6B7280', order: 5, moduleType: 'util' },
  { dirPattern: /^(types?|interfaces?)$/, layerId: 'types', label: 'Types', color: '#06B6D4', order: 6, moduleType: 'type' },
  { dirPattern: /^(constants?|config)$/, layerId: 'config', label: 'Configuration', color: '#84CC16', order: 7, moduleType: 'config' },
]

function inferLayers(rootDir: string): InferredLayer[] {
  if (!existsSync(rootDir)) return []
  const entries = readdirSync(rootDir)
  const layers = new Map<string, InferredLayer>()

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry)
    if (!statSync(fullPath).isDirectory()) continue
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue

    for (const pattern of LAYER_PATTERNS) {
      if (!pattern.dirPattern.test(entry)) continue

      const layer = layers.get(pattern.layerId) ?? {
        id: pattern.layerId,
        label: pattern.label,
        color: pattern.color,
        order: pattern.order,
        modules: [],
      }

      const subDirs = readdirSync(fullPath)
        .filter((c) => {
          const cp = path.join(fullPath, c)
          return statSync(cp).isDirectory() && !SKIP_DIRS.has(c) && !c.startsWith('.')
        })

      if (subDirs.length > 0) {
        for (const sub of subDirs) {
          layer.modules.push({
            id: `${entry}/${sub}`,
            name: sub,
            type: pattern.moduleType,
            description: `${pattern.label} — ${sub}`,
            files: [`src/${entry}/${sub}/**`],
            tags: [pattern.moduleType],
          })
        }
      } else {
        layer.modules.push({
          id: entry,
          name: entry,
          type: pattern.moduleType,
          description: pattern.label,
          files: [`src/${entry}/**`],
          tags: [pattern.moduleType],
        })
      }

      layers.set(pattern.layerId, layer)
      break
    }
  }

  return [...layers.values()]
    .filter((l) => l.modules.length > 0)
    .sort((a, b) => a.order - b.order)
}

// ─── Route scanning (Next.js App Router) — tree structure ───

interface InferredRoute {
  path: string
  name: string
  handler?: string
  children?: InferredRoute[]
}

function scanNextAppRoutes(appDir: string, basePath: string = ''): InferredRoute[] {
  if (!existsSync(appDir)) return []

  const entries = readdirSync(appDir)
  const result: InferredRoute[] = []

  const pageFile = entries.find((e) => /^page\.(tsx?|jsx?)$/.test(e))
  const routeFile = entries.find((e) => /^route\.(tsx?|jsx?)$/.test(e))

  // Collect child directories
  const childDirs = entries.filter((e) => {
    const fp = path.join(appDir, e)
    return statSync(fp).isDirectory() && !e.startsWith('_') && e !== 'node_modules'
  })

  // Recurse and collect child routes
  const childRoutes: InferredRoute[] = []
  for (const dir of childDirs) {
    const isGroup = dir.startsWith('(') && dir.endsWith(')')
    const segment = isGroup ? '' : `/${dir}`
    const childPath = `${basePath}${segment}`
    const sub = scanNextAppRoutes(path.join(appDir, dir), childPath)
    childRoutes.push(...sub)
  }

  // Build current route node
  if (pageFile) {
    const handler = path.join(appDir, pageFile).replace(/.*\/src\//, 'src/')
    const name = basePath.split('/').filter(Boolean).pop() ?? 'Home'
    const route: InferredRoute = {
      path: basePath || '/',
      name,
      handler,
    }
    if (childRoutes.length > 0) {
      route.children = childRoutes
    }
    result.push(route)
  } else if (childRoutes.length > 0) {
    // No page at this level, but has children — pass through
    result.push(...childRoutes)
  }

  // API route
  if (routeFile) {
    const handler = path.join(appDir, routeFile).replace(/.*\/src\//, 'src/')
    result.push({
      path: basePath || '/',
      name: `${basePath.split('/').filter(Boolean).pop() ?? 'root'} (API)`,
      handler,
    })
  }

  return result
}

// ─── State flow scanning ───

interface InferredStore {
  id: string
  name: string
  file: string
  atoms: string[]
}

interface InferredFlow {
  from: string
  to: string
  direction: 'read' | 'write' | 'read-write'
  description: string
}

function scanStores(rootDir: string): { library?: string; stores: InferredStore[] } {
  const storesDirs = ['store', 'stores', 'lib/jotai', 'lib/zustand', 'lib/redux', 'context']
  const stores: InferredStore[] = []
  let library: string | undefined

  for (const dir of storesDirs) {
    const fullDir = path.join(rootDir, dir)
    if (!existsSync(fullDir)) continue

    if (dir.includes('jotai')) library = 'jotai'
    else if (dir.includes('zustand')) library = 'zustand'
    else if (dir.includes('redux')) library = 'redux'

    scanStoreFiles(fullDir, rootDir, stores)
  }

  return { library, stores }
}

function scanStoreFiles(dir: string, rootDir: string, stores: InferredStore[]): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      scanStoreFiles(fullPath, rootDir, stores)
      continue
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue
    if (/\.(test|spec|d)\.(ts|tsx)$/.test(entry)) continue

    const content = readFileSync(fullPath, 'utf-8')
    const relativePath = path.relative(rootDir, fullPath)
    const parentDir = path.basename(path.dirname(fullPath))
    const baseName = path.basename(entry, path.extname(entry))
    const id = baseName === 'index' ? parentDir : `${parentDir}/${baseName}`

    const atoms: string[] = []
    const exportRegex = /export\s+(?:const|function|let)\s+(\w+)/g
    let match: RegExpExecArray | null
    while ((match = exportRegex.exec(content)) !== null) {
      atoms.push(match[1])
    }

    if (atoms.length > 0) {
      stores.push({
        id,
        name: baseName === 'index' ? parentDir : baseName,
        file: `src/${relativePath}`,
        atoms,
      })
    }
  }
}

// ─── Enrich with analysis edges ───

function enrichWithAnalysis(
  rootDir: string,
  layers: InferredLayer[],
  storeFlows: { library?: string; stores: InferredStore[] },
  analysis: AnalysisResult,
): { layers: InferredLayer[]; flows: InferredFlow[] } {
  // Build module → files mapping (glob to set of file prefixes)
  const moduleFileMap = new Map<string, string[]>()
  for (const layer of layers) {
    for (const mod of layer.modules) {
      // Convert "src/hooks/api/**" → "hooks/api/"
      const prefixes = mod.files.map((f) =>
        f.replace(/^src\//, '').replace(/\/?\*\*$/, '/'),
      )
      moduleFileMap.set(mod.id, prefixes)
    }
  }

  // For each analysis edge, find which module the source and target belong to
  function findModuleForFile(filePath: string): string | null {
    for (const [modId, prefixes] of moduleFileMap) {
      if (prefixes.some((p) => filePath.startsWith(p))) {
        return modId
      }
    }
    return null
  }

  // Build module-level dependency edges
  const moduleDeps = new Map<string, Set<string>>()
  for (const edge of analysis.edges) {
    const srcMod = findModuleForFile(edge.source)
    const tgtMod = findModuleForFile(edge.target)
    if (srcMod && tgtMod && srcMod !== tgtMod) {
      const deps = moduleDeps.get(srcMod) ?? new Set()
      deps.add(tgtMod)
      moduleDeps.set(srcMod, deps)
    }
  }

  // Apply dependsOn to modules
  const enrichedLayers = layers.map((layer) => ({
    ...layer,
    modules: layer.modules.map((mod) => {
      const deps = moduleDeps.get(mod.id)
      return deps ? { ...mod, dependsOn: [...deps] } : mod
    }),
  }))

  // Build store flows by scanning source files for store import statements
  // (analysis edges may miss alias imports like @/lib/jotai/...)
  const flows = scanStoreFlows(rootDir, storeFlows.stores, moduleFileMap)

  return { layers: enrichedLayers, flows }
}

// ─── Main ───

export interface ScanResult {
  projectName: string
  techStack: TechStack
  layers: InferredLayer[]
  routes: InferredRoute[]
  stateFlows: { library?: string; stores: InferredStore[] }
  rootDir: string
}

export function scanProject(rootDir: string): ScanResult {
  const resolvedRoot = path.resolve(rootDir)
  const pkg = readPackageJson(resolvedRoot)
  const projectName = pkg?.name ?? path.basename(resolvedRoot)
  const techStack = pkg ? detectTechStack(pkg) : { stateManagement: [], testing: [], other: [] }

  const layers = inferLayers(resolvedRoot)

  let routes: InferredRoute[] = []
  const appDir = path.join(resolvedRoot, 'app')
  if (existsSync(appDir)) {
    routes = scanNextAppRoutes(appDir)
  }

  const stateFlows = scanStores(resolvedRoot)

  if (!stateFlows.library && pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (allDeps['jotai']) stateFlows.library = 'jotai'
    else if (allDeps['zustand']) stateFlows.library = 'zustand'
    else if (allDeps['@reduxjs/toolkit'] || allDeps['redux']) stateFlows.library = 'redux'
  }

  return { projectName, techStack, layers, routes, stateFlows, rootDir: resolvedRoot }
}

/** Scan source files for import statements that reference store paths */
function scanStoreFlows(
  rootDir: string,
  stores: InferredStore[],
  moduleFileMap: Map<string, string[]>,
): InferredFlow[] {
  const flows: InferredFlow[] = []

  // Build import path patterns from store files
  // "src/lib/jotai/designer/index.ts" → ["@/lib/jotai/designer", "lib/jotai/designer", "jotai/designer"]
  const storePatterns = stores.map((s) => {
    const p = s.file
      .replace(/^src\//, '')
      .replace(/\/index\.(ts|tsx|js|jsx)$/, '')
      .replace(/\.(ts|tsx|js|jsx)$/, '')
    return { storeId: s.id, patterns: [p, `@/${p}`] }
  })

  function findModuleForFile(filePath: string): string | null {
    for (const [modId, prefixes] of moduleFileMap) {
      if (prefixes.some((p) => filePath.startsWith(p))) return modId
    }
    return null
  }

  const storeConsumers = new Map<string, Set<string>>()
  const resolvedRoot = path.resolve(rootDir)

  // Recursively scan source files
  function walkAndScan(dir: string): void {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue
      const fullPath = path.join(dir, entry)
      if (statSync(fullPath).isDirectory()) {
        walkAndScan(fullPath)
        continue
      }
      if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue
      if (/\.(test|spec|d)\.(ts|tsx)$/.test(entry)) continue

      const relativePath = path.relative(resolvedRoot, fullPath)

      // Skip files that ARE store files
      const isStoreFile = stores.some((s) => s.file === `src/${relativePath}`)
      if (isStoreFile) continue

      const content = readFileSync(fullPath, 'utf-8')
      const mod = findModuleForFile(relativePath)
      if (!mod) continue

      // Check import statements
      for (const sp of storePatterns) {
        for (const pattern of sp.patterns) {
          if (content.includes(`from '${pattern}'`) || content.includes(`from "${pattern}"`)) {
            const consumers = storeConsumers.get(sp.storeId) ?? new Set()
            consumers.add(mod)
            storeConsumers.set(sp.storeId, consumers)
          }
        }
      }
    }
  }

  walkAndScan(resolvedRoot)

  for (const [storeId, consumers] of storeConsumers) {
    for (const consumer of consumers) {
      flows.push({
        from: storeId,
        to: consumer,
        direction: 'read',
        description: `${consumer} imports from ${storeId}`,
      })
    }
  }

  return flows
}

export function generateConfig(
  scan: ScanResult,
  analysis?: AnalysisResult,
): Record<string, unknown> {
  let layers = scan.layers
  let flows: InferredFlow[] = []

  // Enrich with analysis if available
  if (analysis) {
    const enriched = enrichWithAnalysis(scan.rootDir, layers, scan.stateFlows, analysis)
    layers = enriched.layers
    flows = enriched.flows
  }

  const config: Record<string, unknown> = {
    version: 1,
    project: {
      name: scan.projectName,
      description: `Architecture of ${scan.projectName}`,
    },
  }

  if (layers.length > 0) {
    config['layers'] = layers
  }

  if (scan.routes.length > 0) {
    config['routes'] = {
      framework: 'nextjs',
      entries: scan.routes,
    }
  }

  if (scan.stateFlows.stores.length > 0) {
    config['stateFlows'] = {
      library: scan.stateFlows.library ?? 'unknown',
      stores: scan.stateFlows.stores,
      flows,
    }
  }

  if (analysis) {
    config['analysis'] = analysis
  }

  return config
}
