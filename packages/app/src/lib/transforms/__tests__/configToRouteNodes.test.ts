import { describe, it, expect } from 'vitest'
import { configToRouteNodes } from '../configToRouteNodes'
import type { ArchflowConfig } from '../../schema'

const NO_ROUTES: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
}

const WITH_ROUTES: ArchflowConfig = {
  version: 1,
  project: { name: 'Test' },
  routes: {
    framework: 'nextjs',
    entries: [
      { path: '/login', name: 'Login' },
      {
        path: '/',
        name: 'App Shell',
        guard: 'Auth',
        children: [
          { path: '/home', name: 'Home' },
          { path: '/settings', name: 'Settings' },
        ],
      },
      { path: '/api/users', name: 'Users API', method: 'POST' },
    ],
  },
}

describe('configToRouteNodes', () => {
  it('returns empty for config without routes', () => {
    const { nodes, edges } = configToRouteNodes(NO_ROUTES)
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it('creates nodes for all routes including nested', () => {
    const { nodes } = configToRouteNodes(WITH_ROUTES)
    // /login + / (group) + /home + /settings + /api/users = 5
    expect(nodes).toHaveLength(5)
  })

  it('creates edges from parent to children', () => {
    const { edges } = configToRouteNodes(WITH_ROUTES)
    // / -> /home, / -> /settings = 2 edges
    expect(edges).toHaveLength(2)
  })

  it('sets routeGroup type for nodes with children', () => {
    const { nodes } = configToRouteNodes(WITH_ROUTES)
    const groupNode = nodes.find((n) => (n.data as { name: string }).name === 'App Shell')
    expect(groupNode?.type).toBe('routeGroup')
  })

  it('sets route type for leaf nodes', () => {
    const { nodes } = configToRouteNodes(WITH_ROUTES)
    const loginNode = nodes.find((n) => (n.data as { name: string }).name === 'Login')
    expect(loginNode?.type).toBe('route')
  })

  it('preserves method in route data', () => {
    const { nodes } = configToRouteNodes(WITH_ROUTES)
    const apiNode = nodes.find((n) => (n.data as { name: string }).name === 'Users API')
    expect((apiNode?.data as { method?: string }).method).toBe('POST')
  })

  it('positions nodes via dagre layout', () => {
    const { nodes } = configToRouteNodes(WITH_ROUTES)
    // All nodes should have numeric positions (set by dagre)
    for (const node of nodes) {
      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
    }
  })
})
