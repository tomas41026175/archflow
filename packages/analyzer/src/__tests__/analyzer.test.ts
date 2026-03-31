import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { analyze } from '../analyzer.js'

const FIXTURES_DIR = path.resolve(import.meta.dirname, '../__fixtures__')
const SIMPLE_PROJECT = path.join(FIXTURES_DIR, 'simple-project')

describe('analyze', () => {
  it('detects all source files in simple project', { timeout: 15000 }, () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    expect(result.metadata.nodeCount).toBe(4)
    expect(result.nodes.map((n) => n.id).sort()).toEqual([
      'index.ts',
      'service.ts',
      'types.ts',
      'utils.ts',
    ])
  })

  it('detects dependency edges', () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    // service imports from utils and types
    const serviceEdges = result.edges.filter((e) => e.source === 'service.ts')
    expect(serviceEdges).toHaveLength(2)

    const utilsEdge = serviceEdges.find((e) => e.target === 'utils.ts')
    expect(utilsEdge).toBeDefined()
    expect(utilsEdge!.imports).toContainEqual(
      expect.objectContaining({ name: 'add', isTypeOnly: false }),
    )

    const typesEdge = serviceEdges.find((e) => e.target === 'types.ts')
    expect(typesEdge).toBeDefined()
    expect(typesEdge!.imports).toContainEqual(
      expect.objectContaining({ name: 'User', isTypeOnly: true }),
    )
  })

  it('detects re-exports from barrel file', () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    const indexEdges = result.edges.filter((e) => e.source === 'index.ts')
    expect(indexEdges.length).toBeGreaterThanOrEqual(2)
  })

  it('extracts export info', () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    const utilsNode = result.nodes.find((n) => n.id === 'utils.ts')
    expect(utilsNode).toBeDefined()
    expect(utilsNode!.exports).toContainEqual(
      expect.objectContaining({ name: 'add', kind: 'function' }),
    )
    expect(utilsNode!.exports).toContainEqual(
      expect.objectContaining({ name: 'PI', kind: 'variable' }),
    )

    const typesNode = result.nodes.find((n) => n.id === 'types.ts')
    expect(typesNode).toBeDefined()
    expect(typesNode!.exports).toContainEqual(
      expect.objectContaining({ name: 'User', kind: 'interface' }),
    )
  })

  it('populates metadata correctly', () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    expect(result.metadata.rootDir).toBe(SIMPLE_PROJECT)
    expect(result.metadata.fileCount).toBeGreaterThanOrEqual(4)
    expect(result.metadata.nodeCount).toBe(4)
    expect(result.metadata.edgeCount).toBeGreaterThanOrEqual(4)
    expect(result.metadata.analyzedAt).toBeTruthy()
  })

  it('assigns readable labels', () => {
    const result = analyze({ rootDir: SIMPLE_PROJECT })

    const utilsNode = result.nodes.find((n) => n.id === 'utils.ts')
    expect(utilsNode!.label).toBe('utils')

    // index.ts at root should label as 'index'
    const indexNode = result.nodes.find((n) => n.id === 'index.ts')
    expect(indexNode!.label).toBe('index')
  })
})
