import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// ─── Package.json scanning ───

interface PackageInfo {
  name: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

function readPackageJson(rootDir: string): PackageInfo | null {
  // Walk up to find package.json
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
  // Frameworks
  { pkg: 'next', label: 'Next.js', category: 'framework' },
  { pkg: 'react', label: 'React', category: 'framework' },
  { pkg: 'vue', label: 'Vue', category: 'framework' },
  { pkg: '@angular/core', label: 'Angular', category: 'framework' },
  // HTTP
  { pkg: 'axios', label: 'Axios', category: 'httpClient' },
  { pkg: 'ky', label: 'Ky', category: 'httpClient' },
  // State
  { pkg: 'jotai', label: 'Jotai', category: 'stateManagement' },
  { pkg: 'zustand', label: 'Zustand', category: 'stateManagement' },
  { pkg: '@reduxjs/toolkit', label: 'Redux Toolkit', category: 'stateManagement' },
  { pkg: 'redux', label: 'Redux', category: 'stateManagement' },
  { pkg: '@tanstack/react-query', label: 'TanStack Query', category: 'stateManagement' },
  { pkg: 'swr', label: 'SWR', category: 'stateManagement' },
  // UI
  { pkg: 'tailwindcss', label: 'Tailwind CSS', category: 'styling' },
  { pkg: '@chakra-ui/react', label: 'Chakra UI', category: 'uiLibrary' },
  { pkg: '@mui/material', label: 'MUI', category: 'uiLibrary' },
  { pkg: 'antd', label: 'Ant Design', category: 'uiLibrary' },
  // Forms
  { pkg: 'react-hook-form', label: 'React Hook Form', category: 'forms' },
  { pkg: 'formik', label: 'Formik', category: 'forms' },
  // Rich editors
  { pkg: 'lexical', label: 'Lexical', category: 'other' },
  { pkg: '@xyflow/react', label: 'React Flow', category: 'other' },
  { pkg: 'reactflow', label: 'React Flow', category: 'other' },
  // Testing
  { pkg: 'vitest', label: 'Vitest', category: 'testing' },
  { pkg: 'jest', label: 'Jest', category: 'testing' },
  { pkg: '@playwright/test', label: 'Playwright', category: 'testing' },
]

function detectTechStack(pkg: PackageInfo): TechStack {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  const stack: TechStack = {
    stateManagement: [],
    testing: [],
    other: [],
  }

  for (const detector of TECH_DETECTORS) {
    const version = allDeps[detector.pkg]
    if (!version) continue

    const labelWithVersion = `${detector.label} ${version.replace(/[\^~]/, '')}`
    const cat = detector.category

    if (cat === 'stateManagement' || cat === 'testing' || cat === 'other') {
      stack[cat].push(labelWithVersion)
    } else if (cat === 'framework') {
      stack.framework = labelWithVersion
    } else if (cat === 'httpClient') {
      stack.httpClient = labelWithVersion
    } else if (cat === 'uiLibrary') {
      stack.uiLibrary = labelWithVersion
    } else if (cat === 'styling') {
      stack.styling = labelWithVersion
    } else if (cat === 'forms') {
      stack.forms = labelWithVersion
    }
  }

  return stack
}

// ─── Directory structure scanning ───

interface DirEntry {
  name: string
  isDir: boolean
  children?: DirEntry[]
}

function scanDir(dir: string, depth: number): DirEntry[] {
  if (depth <= 0 || !existsSync(dir)) return []

  const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '__tests__', '__mocks__', '__fixtures__'])

  return readdirSync(dir)
    .filter((name) => !SKIP.has(name) && !name.startsWith('.'))
    .map((name) => {
      const full = path.join(dir, name)
      const isDir = statSync(full).isDirectory()
      return {
        name,
        isDir,
        children: isDir ? scanDir(full, depth - 1) : undefined,
      }
    })
    .filter((e) => e.isDir || /\.(ts|tsx|js|jsx)$/.test(e.name))
}

// ─── Layer inference ───

interface InferredModule {
  id: string
  name: string
  type: string
  description: string
  files: string[]
  tags: string[]
}

interface InferredLayer {
  id: string
  label: string
  color: string
  order: number
  modules: InferredModule[]
}

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
  { dirPattern: /^(api|services?)$/, layerId: 'data-access', label: 'Data Access', color: '#F59E0B', order: 3, moduleType: 'api' },
  { dirPattern: /^(store|stores?|atoms?|lib\/jotai|lib\/zustand|lib\/redux)$/, layerId: 'state', label: 'State Management', color: '#F97316', order: 4, moduleType: 'store' },
  { dirPattern: /^(utils?|lib|helpers?)$/, layerId: 'utilities', label: 'Utilities', color: '#6B7280', order: 5, moduleType: 'util' },
  { dirPattern: /^(types?|interfaces?)$/, layerId: 'types', label: 'Types', color: '#06B6D4', order: 6, moduleType: 'type' },
  { dirPattern: /^(constants?|config)$/, layerId: 'config', label: 'Configuration', color: '#84CC16', order: 7, moduleType: 'config' },
]

function inferLayers(rootDir: string): InferredLayer[] {
  const entries = scanDir(rootDir, 2)
  const layers = new Map<string, InferredLayer>()

  for (const entry of entries) {
    if (!entry.isDir) continue

    for (const pattern of LAYER_PATTERNS) {
      if (!pattern.dirPattern.test(entry.name)) continue

      const layer = layers.get(pattern.layerId) ?? {
        id: pattern.layerId,
        label: pattern.label,
        color: pattern.color,
        order: pattern.order,
        modules: [],
      }

      // Each subdirectory becomes a module
      const subDirs = entry.children?.filter((c) => c.isDir) ?? []

      if (subDirs.length > 0) {
        for (const sub of subDirs) {
          layer.modules.push({
            id: `${entry.name}-${sub.name}`,
            name: sub.name,
            type: pattern.moduleType,
            description: `${pattern.label} — ${sub.name}`,
            files: [`src/${entry.name}/${sub.name}/**`],
            tags: [pattern.moduleType],
          })
        }
      } else {
        // Directory itself is a module (no subdirs)
        layer.modules.push({
          id: entry.name,
          name: entry.name,
          type: pattern.moduleType,
          description: pattern.label,
          files: [`src/${entry.name}/**`],
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

// ─── Route scanning (Next.js App Router) ───

interface InferredRoute {
  path: string
  name: string
  handler?: string
  children?: InferredRoute[]
}

function scanNextAppRoutes(appDir: string, basePath: string = ''): InferredRoute[] {
  if (!existsSync(appDir)) return []

  const routes: InferredRoute[] = []
  const entries = readdirSync(appDir)

  // Check for page.tsx / route.ts in current dir
  const hasPage = entries.some((e) => /^page\.(tsx?|jsx?)$/.test(e))
  const hasRoute = entries.some((e) => /^route\.(tsx?|jsx?)$/.test(e))

  if (hasPage) {
    const pageFile = entries.find((e) => /^page\.(tsx?|jsx?)$/.test(e))
    routes.push({
      path: basePath || '/',
      name: basePath.split('/').pop() || 'Home',
      handler: path.join(appDir, pageFile!).replace(/.*\/src\//, 'src/'),
    })
  }

  if (hasRoute) {
    const routeFile = entries.find((e) => /^route\.(tsx?|jsx?)$/.test(e))
    routes.push({
      path: `${basePath} (API)`,
      name: `${basePath.split('/').pop()} API`,
      handler: path.join(appDir, routeFile!).replace(/.*\/src\//, 'src/'),
    })
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    const fullPath = path.join(appDir, entry)
    if (!statSync(fullPath).isDirectory()) continue
    if (entry.startsWith('_') || entry === 'node_modules') continue

    // Next.js route group: (groupName) → skip in path
    const isGroup = entry.startsWith('(') && entry.endsWith(')')
    const segment = isGroup ? '' : `/${entry}`
    const childPath = `${basePath}${segment}`

    const children = scanNextAppRoutes(fullPath, childPath)
    routes.push(...children)
  }

  return routes
}

// ─── State flow scanning ───

interface InferredStore {
  id: string
  name: string
  file: string
  atoms: string[]
}

function scanStores(rootDir: string): { library?: string; stores: InferredStore[] } {
  const storesDirs = ['store', 'stores', 'lib/jotai', 'lib/zustand', 'lib/redux']
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
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)

    if (statSync(fullPath).isDirectory()) {
      scanStoreFiles(fullPath, rootDir, stores)
      continue
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue
    if (/\.(test|spec|d)\.(ts|tsx)$/.test(entry)) continue

    const content = readFileSync(fullPath, 'utf-8')
    const relativePath = path.relative(rootDir, fullPath)
    const baseName = path.basename(entry, path.extname(entry))

    // Extract exported atom/store names
    const atoms: string[] = []
    const exportRegex = /export\s+(?:const|function|let)\s+(\w+)/g
    let match: RegExpExecArray | null
    while ((match = exportRegex.exec(content)) !== null) {
      atoms.push(match[1])
    }

    if (atoms.length > 0) {
      stores.push({
        id: baseName,
        name: baseName,
        file: `src/${relativePath}`,
        atoms,
      })
    }
  }
}

// ─── Main scan function ───

export interface ScanResult {
  projectName: string
  techStack: TechStack
  layers: InferredLayer[]
  routes: InferredRoute[]
  stateFlows: { library?: string; stores: InferredStore[] }
}

export function scanProject(rootDir: string): ScanResult {
  const resolvedRoot = path.resolve(rootDir)
  const pkg = readPackageJson(resolvedRoot)
  const projectName = pkg?.name ?? path.basename(resolvedRoot)
  const techStack = pkg ? detectTechStack(pkg) : {
    stateManagement: [],
    testing: [],
    other: [],
  }

  const layers = inferLayers(resolvedRoot)

  // Detect routes
  let routes: InferredRoute[] = []
  const appDir = path.join(resolvedRoot, 'app')
  if (existsSync(appDir)) {
    routes = scanNextAppRoutes(appDir)
  }

  const stateFlows = scanStores(resolvedRoot)

  // Auto-detect state library from package.json if not found from dirs
  if (!stateFlows.library && pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (allDeps['jotai']) stateFlows.library = 'jotai'
    else if (allDeps['zustand']) stateFlows.library = 'zustand'
    else if (allDeps['@reduxjs/toolkit'] || allDeps['redux']) stateFlows.library = 'redux'
  }

  return { projectName, techStack, layers, routes, stateFlows }
}

// ─── Config generation ───

export function generateConfig(
  scan: ScanResult,
  analysis?: unknown,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    version: 1,
    project: {
      name: scan.projectName,
      description: `Architecture of ${scan.projectName}`,
    },
  }

  if (scan.layers.length > 0) {
    config['layers'] = scan.layers
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
      flows: [], // Cannot auto-detect data flow direction
    }
  }

  if (analysis) {
    config['analysis'] = analysis
  }

  return config
}
