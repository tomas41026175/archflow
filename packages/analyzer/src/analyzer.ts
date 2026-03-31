import { Project, type SourceFile, SyntaxKind } from 'ts-morph'
import path from 'node:path'
import type {
  AnalyzerConfig,
  AnalysisResult,
  CircularDependency,
  DependencyNode,
  DependencyEdge,
  ExportInfo,
  ImportDetail,
} from './types.js'

/** Infer file type from path */
function inferFileType(filePath: string): DependencyNode['type'] {
  const lower = filePath.toLowerCase()
  if (/\/(pages?|app|views?)\//.test(lower)) return 'page'
  if (/\/(components?)\//.test(lower)) return 'component'
  if (/\/(hooks?)\//.test(lower)) return 'hook'
  if (/\/(api|services?)\//.test(lower)) return 'api'
  if (/\/(store|atoms?|slices?|reducers?)\//.test(lower)) return 'store'
  if (/\/(types?|interfaces?)\//.test(lower)) return 'type'
  if (/\/(utils?|lib|helpers?)\//.test(lower)) return 'util'
  if (/\/(config|constants?)\//.test(lower)) return 'config'
  return 'unknown'
}

/** Extract a readable label from file path */
function extractLabel(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath))
  if (base === 'index') {
    const dir = path.dirname(filePath)
    return dir === '.' ? 'index' : path.basename(dir)
  }
  return base
}

/** Extract export info from a source file */
function extractExports(sourceFile: SourceFile): ExportInfo[] {
  const exports: ExportInfo[] = []

  for (const decl of sourceFile.getExportedDeclarations()) {
    const [name, declarations] = decl
    for (const d of declarations) {
      let kind: ExportInfo['kind'] = 'unknown'
      const nodeKind = d.getKind()

      if (nodeKind === SyntaxKind.FunctionDeclaration || nodeKind === SyntaxKind.ArrowFunction) {
        kind = 'function'
      } else if (nodeKind === SyntaxKind.ClassDeclaration) {
        kind = 'class'
      } else if (nodeKind === SyntaxKind.VariableDeclaration) {
        kind = 'variable'
      } else if (nodeKind === SyntaxKind.TypeAliasDeclaration) {
        kind = 'type'
      } else if (nodeKind === SyntaxKind.InterfaceDeclaration) {
        kind = 'interface'
      } else if (nodeKind === SyntaxKind.EnumDeclaration) {
        kind = 'enum'
      }

      exports.push({ name, kind })
    }
  }

  return exports
}

/** Check if a file should be included based on glob patterns */
function shouldInclude(
  filePath: string,
  include: string[],
  exclude: string[],
): boolean {
  if (exclude.some((pattern) => filePath.includes(pattern))) return false
  if (include.length === 0) return true
  return include.some((pattern) => filePath.includes(pattern))
}

export function analyze(config: AnalyzerConfig): AnalysisResult {
  const rootDir = path.resolve(config.rootDir)
  const include = config.include ?? []
  const exclude = config.exclude ?? [
    'node_modules',
    '.next',
    'dist',
    '__tests__',
    '__mocks__',
    '.test.',
    '.spec.',
    '.d.ts',
  ]

  // Create ts-morph project
  const projectOptions: ConstructorParameters<typeof Project>[0] = {}

  if (config.tsconfigPath) {
    projectOptions.tsConfigFilePath = path.resolve(config.tsconfigPath)
  } else {
    projectOptions.compilerOptions = {
      rootDir,
      allowJs: true,
      jsx: 4, // JsxEmit.ReactJSX
    }
  }

  const project = new Project(projectOptions)

  // Add source files if no tsconfig was provided
  if (!config.tsconfigPath) {
    project.addSourceFilesAtPaths([
      path.join(rootDir, '**/*.{ts,tsx,js,jsx}'),
    ])
  }

  const sourceFiles = project.getSourceFiles()
  const nodesMap = new Map<string, DependencyNode>()
  const edges: DependencyEdge[] = []

  // First pass: build nodes
  for (const sf of sourceFiles) {
    const filePath = path.relative(rootDir, sf.getFilePath())

    if (!shouldInclude(filePath, include, exclude)) continue

    const id = filePath
    nodesMap.set(sf.getFilePath(), {
      id,
      label: extractLabel(filePath),
      filePath,
      type: inferFileType(filePath),
      exports: extractExports(sf),
    })
  }

  // Second pass: build edges from imports
  for (const sf of sourceFiles) {
    const sourceNode = nodesMap.get(sf.getFilePath())
    if (!sourceNode) continue

    for (const importDecl of sf.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue()

      // Skip external packages
      if (
        !moduleSpecifier.startsWith('.') &&
        !moduleSpecifier.startsWith('/')
      ) {
        continue
      }

      const resolvedModule = importDecl.getModuleSpecifierSourceFile()
      if (!resolvedModule) continue

      const targetNode = nodesMap.get(resolvedModule.getFilePath())
      if (!targetNode) continue

      const isTypeOnly = importDecl.isTypeOnly()
      const imports: ImportDetail[] = []

      // Default import
      const defaultImport = importDecl.getDefaultImport()
      if (defaultImport) {
        imports.push({
          name: 'default',
          alias: defaultImport.getText(),
          isTypeOnly,
        })
      }

      // Named imports
      for (const named of importDecl.getNamedImports()) {
        imports.push({
          name: named.getName(),
          alias: named.getAliasNode()?.getText(),
          isTypeOnly: isTypeOnly || named.isTypeOnly(),
        })
      }

      // Namespace import
      const namespaceImport = importDecl.getNamespaceImport()
      if (namespaceImport) {
        imports.push({
          name: '*',
          alias: namespaceImport.getText(),
          isTypeOnly,
        })
      }

      if (imports.length > 0) {
        edges.push({
          source: sourceNode.id,
          target: targetNode.id,
          imports,
        })
      }
    }

    // Also handle re-exports: export { x } from './module'
    for (const exportDecl of sf.getExportDeclarations()) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue()
      if (!moduleSpecifier) continue

      if (
        !moduleSpecifier.startsWith('.') &&
        !moduleSpecifier.startsWith('/')
      ) {
        continue
      }

      const resolvedModule = exportDecl.getModuleSpecifierSourceFile()
      if (!resolvedModule) continue

      const targetNode = nodesMap.get(resolvedModule.getFilePath())
      if (!targetNode) continue

      const isTypeOnly = exportDecl.isTypeOnly()
      const imports: ImportDetail[] = []

      for (const named of exportDecl.getNamedExports()) {
        imports.push({
          name: named.getName(),
          alias: named.getAliasNode()?.getText(),
          isTypeOnly: isTypeOnly || named.isTypeOnly(),
        })
      }

      if (imports.length > 0) {
        edges.push({
          source: sourceNode.id,
          target: targetNode.id,
          imports,
        })
      }
    }
  }

  const nodes = [...nodesMap.values()]
  const circular = detectCircularDependencies(edges)

  return {
    metadata: {
      analyzedAt: new Date().toISOString(),
      rootDir,
      fileCount: sourceFiles.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      circularCount: circular.length,
    },
    nodes,
    edges,
    circular,
  }
}

/** Detect circular dependencies using DFS cycle detection */
function detectCircularDependencies(edges: DependencyEdge[]): CircularDependency[] {
  // Build adjacency list
  const graph = new Map<string, string[]>()
  for (const edge of edges) {
    const targets = graph.get(edge.source) ?? []
    targets.push(edge.target)
    graph.set(edge.source, targets)
  }

  const cycles: CircularDependency[] = []
  const visited = new Set<string>()
  const inStack = new Set<string>()
  const seenCycles = new Set<string>()

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(node)
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart)
        // Normalize: start from the lexically smallest node to dedupe
        const minIdx = cycle.indexOf(
          cycle.reduce((min, id) => (id < min ? id : min), cycle[0]),
        )
        const normalized = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)]
        const key = normalized.join(' → ')

        if (!seenCycles.has(key)) {
          seenCycles.add(key)
          const short = normalized.map((f) => f.split('/').pop()?.replace(/\.\w+$/, ''))
          cycles.push({
            cycle: normalized,
            description: `無法互為來源：${short.join(' ⇄ ')} 存在互相計算的衝突`,
          })
        }
      }
      return
    }

    if (visited.has(node)) return

    inStack.add(node)
    path.push(node)

    for (const neighbor of graph.get(node) ?? []) {
      dfs(neighbor, path)
    }

    path.pop()
    inStack.delete(node)
    visited.add(node)
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, [])
    }
  }

  return cycles
}
