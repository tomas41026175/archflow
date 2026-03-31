import { describe, it, expect } from 'vitest'
import { archflowConfigSchema } from '../config'
import { layerSchema, moduleSchema } from '../layer'
import { routeEntrySchema } from '../route'
import { stateFlowSchema } from '../stateFlow'

describe('moduleSchema', () => {
  it('validates a minimal module', () => {
    const result = moduleSchema.safeParse({ id: 'mod-1', name: 'My Module' })
    expect(result.success).toBe(true)
  })

  it('validates a full module', () => {
    const result = moduleSchema.safeParse({
      id: 'api-layer',
      name: 'API Layer',
      description: 'HTTP client',
      type: 'api',
      files: ['src/api/**'],
      tags: ['http'],
      dependsOn: ['store'],
      endpoints: ['GET /api/users'],
      externalUrl: 'https://docs.example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = moduleSchema.safeParse({ name: 'No ID' })
    expect(result.success).toBe(false)
  })

  it('rejects empty id', () => {
    const result = moduleSchema.safeParse({ id: '', name: 'Empty' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = moduleSchema.safeParse({
      id: 'm', name: 'M', type: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid externalUrl', () => {
    const result = moduleSchema.safeParse({
      id: 'm', name: 'M', externalUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('layerSchema', () => {
  it('validates a layer with modules', () => {
    const result = layerSchema.safeParse({
      id: 'presentation',
      label: 'Presentation',
      color: '#3B82F6',
      order: 0,
      modules: [{ id: 'page', name: 'Pages' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const result = layerSchema.safeParse({
      id: 'x', label: 'X', color: 'red', order: 0, modules: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative order', () => {
    const result = layerSchema.safeParse({
      id: 'x', label: 'X', color: '#000000', order: -1, modules: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('routeEntrySchema', () => {
  it('validates a minimal route', () => {
    const result = routeEntrySchema.safeParse({
      path: '/login',
      name: 'Login',
    })
    expect(result.success).toBe(true)
  })

  it('validates nested routes', () => {
    const result = routeEntrySchema.safeParse({
      path: '/',
      name: 'Root',
      children: [
        { path: '/home', name: 'Home' },
        { path: '/about', name: 'About', children: [] },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('validates API route with method', () => {
    const result = routeEntrySchema.safeParse({
      path: '/api/users',
      name: 'Users API',
      method: 'POST',
      handler: 'src/api/users.ts',
    })
    expect(result.success).toBe(true)
  })
})

describe('stateFlowSchema', () => {
  it('validates a read flow', () => {
    const result = stateFlowSchema.safeParse({
      from: 'store-a',
      to: 'component-b',
      direction: 'read',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid direction', () => {
    const result = stateFlowSchema.safeParse({
      from: 'a', to: 'b', direction: 'bidirectional',
    })
    expect(result.success).toBe(false)
  })
})

describe('archflowConfigSchema', () => {
  it('validates minimal config', () => {
    const result = archflowConfigSchema.safeParse({
      version: 1,
      project: { name: 'Test' },
    })
    expect(result.success).toBe(true)
  })

  it('validates full config', () => {
    const result = archflowConfigSchema.safeParse({
      version: 1,
      project: { name: 'Full', description: 'A full config' },
      layers: [
        {
          id: 'ui',
          label: 'UI',
          color: '#FF0000',
          order: 0,
          modules: [{ id: 'pages', name: 'Pages', dependsOn: ['hooks'] }],
        },
        {
          id: 'logic',
          label: 'Logic',
          color: '#00FF00',
          order: 1,
          modules: [{ id: 'hooks', name: 'Hooks' }],
        },
      ],
      routes: {
        framework: 'nextjs',
        entries: [{ path: '/', name: 'Home' }],
      },
      stateFlows: {
        library: 'zustand',
        stores: [{ id: 'main', name: 'Main Store' }],
        flows: [{ from: 'main', to: 'pages', direction: 'read' }],
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects wrong version', () => {
    const result = archflowConfigSchema.safeParse({
      version: 2,
      project: { name: 'Test' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing project name', () => {
    const result = archflowConfigSchema.safeParse({
      version: 1,
      project: {},
    })
    expect(result.success).toBe(false)
  })
})
