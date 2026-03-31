import { describe, it, expect } from 'vitest'
import { configToLayerNodes } from '../configToLayerNodes'
import type { ArchflowConfig } from '../../schema'

const MINIMAL_CONFIG: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
}

const TWO_LAYER_CONFIG: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
  layers: [
    {
      id: 'ui',
      label: 'UI Layer',
      color: '#3B82F6',
      order: 0,
      modules: [
        { id: 'pages', name: 'Pages', dependsOn: ['hooks'] },
        { id: 'components', name: 'Components' },
      ],
    },
    {
      id: 'logic',
      label: 'Logic Layer',
      color: '#10B981',
      order: 1,
      modules: [
        { id: 'hooks', name: 'Hooks', dependsOn: ['api'] },
      ],
    },
    {
      id: 'data',
      label: 'Data Layer',
      color: '#F59E0B',
      order: 2,
      modules: [
        { id: 'api', name: 'API' },
      ],
    },
  ],
}

describe('configToLayerNodes', () => {
  it('returns empty nodes/edges for config without layers', () => {
    const { nodes, edges } = configToLayerNodes(MINIMAL_CONFIG)
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it('creates layer group nodes for each layer', () => {
    const { nodes } = configToLayerNodes(TWO_LAYER_CONFIG)
    const layerNodes = nodes.filter((n) => n.type === 'layerGroup')
    expect(layerNodes).toHaveLength(3)
    expect(layerNodes.map((n) => n.id)).toEqual([
      'layer-ui',
      'layer-logic',
      'layer-data',
    ])
  })

  it('creates module nodes inside each layer', () => {
    const { nodes } = configToLayerNodes(TWO_LAYER_CONFIG)
    const moduleNodes = nodes.filter((n) => n.type === 'module')
    expect(moduleNodes).toHaveLength(4)
    expect(moduleNodes.map((n) => n.id)).toEqual([
      'pages',
      'components',
      'hooks',
      'api',
    ])
  })

  it('assigns parentId to module nodes', () => {
    const { nodes } = configToLayerNodes(TWO_LAYER_CONFIG)
    const pagesNode = nodes.find((n) => n.id === 'pages')
    expect(pagesNode?.parentId).toBe('layer-ui')

    const hooksNode = nodes.find((n) => n.id === 'hooks')
    expect(hooksNode?.parentId).toBe('layer-logic')
  })

  it('creates edges from dependsOn', () => {
    const { edges } = configToLayerNodes(TWO_LAYER_CONFIG)
    expect(edges).toHaveLength(2)

    const pagesEdge = edges.find((e) => e.source === 'pages')
    expect(pagesEdge?.target).toBe('hooks')

    const hooksEdge = edges.find((e) => e.source === 'hooks')
    expect(hooksEdge?.target).toBe('api')
  })

  it('ignores dependsOn references to non-existent modules', () => {
    const config: ArchflowConfig = {
      version: 1,
      project: { name: 'Test' },
      layers: [
        {
          id: 'ui',
          label: 'UI',
          color: '#000000',
          order: 0,
          modules: [{ id: 'a', name: 'A', dependsOn: ['nonexistent'] }],
        },
      ],
    }
    const { edges } = configToLayerNodes(config)
    expect(edges).toHaveLength(0)
  })

  it('sorts layers by order', () => {
    const config: ArchflowConfig = {
      version: 1,
      project: { name: 'Test' },
      layers: [
        { id: 'b', label: 'B', color: '#000000', order: 1, modules: [] },
        { id: 'a', label: 'A', color: '#111111', order: 0, modules: [] },
      ],
    }
    const { nodes } = configToLayerNodes(config)
    const layerNodes = nodes.filter((n) => n.type === 'layerGroup')
    expect(layerNodes[0].id).toBe('layer-a')
    expect(layerNodes[1].id).toBe('layer-b')
    // First layer should have smaller x
    expect(layerNodes[0].position.x).toBeLessThan(layerNodes[1].position.x)
  })

  it('positions modules vertically within a layer', () => {
    const { nodes } = configToLayerNodes(TWO_LAYER_CONFIG)
    const pagesNode = nodes.find((n) => n.id === 'pages')
    const componentsNode = nodes.find((n) => n.id === 'components')
    // Both in same layer, components should be below pages
    expect(pagesNode!.position.y).toBeLessThan(componentsNode!.position.y)
  })

  it('stores module data in node', () => {
    const { nodes } = configToLayerNodes(TWO_LAYER_CONFIG)
    const pagesNode = nodes.find((n) => n.id === 'pages')
    expect(pagesNode?.data).toMatchObject({
      module: { id: 'pages', name: 'Pages' },
      layerColor: '#3B82F6',
      layerId: 'ui',
    })
  })
})
