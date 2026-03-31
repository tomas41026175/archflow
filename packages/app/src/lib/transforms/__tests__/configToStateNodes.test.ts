import { describe, it, expect } from 'vitest'
import { configToStateNodes } from '../configToStateNodes'
import type { ArchflowConfig } from '../../schema'

const NO_STATE: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
}

const WITH_STATE: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
  stateFlows: {
    library: 'jotai',
    stores: [
      { id: 'store-a', name: 'Store A', atoms: ['atom1', 'atom2'] },
      { id: 'store-b', name: 'Store B' },
    ],
    flows: [
      { from: 'store-a', to: 'component-x', direction: 'read' },
      { from: 'component-x', to: 'store-a', direction: 'write' },
      { from: 'store-b', to: 'component-y', direction: 'read-write' },
    ],
  },
}

describe('configToStateNodes', () => {
  it('returns empty for config without stateFlows', () => {
    const { nodes, edges } = configToStateNodes(NO_STATE)
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it('creates store nodes', () => {
    const { nodes } = configToStateNodes(WITH_STATE)
    const storeNodes = nodes.filter((n) => n.type === 'stateStore')
    expect(storeNodes).toHaveLength(2)
  })

  it('creates consumer nodes from flow references', () => {
    const { nodes } = configToStateNodes(WITH_STATE)
    const consumerNodes = nodes.filter((n) => n.type === 'stateConsumer')
    // component-x and component-y
    expect(consumerNodes).toHaveLength(2)
  })

  it('creates edges for all flows', () => {
    const { edges } = configToStateNodes(WITH_STATE)
    expect(edges).toHaveLength(3)
  })

  it('applies animated style to edges', () => {
    const { edges } = configToStateNodes(WITH_STATE)
    for (const edge of edges) {
      expect(edge.animated).toBe(true)
    }
  })

  it('stores atoms in store node data', () => {
    const { nodes } = configToStateNodes(WITH_STATE)
    const storeA = nodes.find((n) => n.id === 'store-a')
    expect((storeA?.data as { atoms: string[] }).atoms).toEqual(['atom1', 'atom2'])
  })

  it('does not duplicate nodes for bidirectional flows', () => {
    const { nodes } = configToStateNodes(WITH_STATE)
    // store-a, store-b, component-x, component-y = 4 total
    expect(nodes).toHaveLength(4)
  })
})
