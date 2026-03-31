/** Configuration for the analyzer CLI */
export interface AnalyzerConfig {
  rootDir: string
  tsconfigPath?: string
  include?: string[]
  exclude?: string[]
  output?: string
  verbose?: boolean
}

/** Information about an export */
export interface ExportInfo {
  name: string
  kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'unknown'
}

/** Information about an import detail */
export interface ImportDetail {
  name: string
  alias?: string
  isTypeOnly: boolean
}

/** A node in the dependency graph */
export interface DependencyNode {
  id: string
  label: string
  filePath: string
  type: 'page' | 'component' | 'hook' | 'util' | 'api' | 'store' | 'type' | 'config' | 'unknown'
  exports: ExportInfo[]
}

/** An edge (dependency) in the graph */
export interface DependencyEdge {
  source: string
  target: string
  imports: ImportDetail[]
}

/** A circular dependency cycle */
export interface CircularDependency {
  /** Ordered list of file IDs forming the cycle (last → first creates the loop) */
  cycle: string[]
  /** Human-readable description */
  description: string
}

/** Complete analysis output */
export interface AnalysisResult {
  metadata: {
    analyzedAt: string
    rootDir: string
    fileCount: number
    nodeCount: number
    edgeCount: number
    circularCount: number
  }
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  circular: CircularDependency[]
}
