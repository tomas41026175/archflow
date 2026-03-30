import type { Node, Edge } from '@xyflow/react'
import type { ArchflowConfig, Layer } from '../schema'
import type { LayerGroupNodeData, ModuleNodeData } from '../../types/canvas'

const LAYER_WIDTH = 280
const LAYER_PADDING = 24
const MODULE_WIDTH = 232
const MODULE_HEIGHT = 80
const MODULE_GAP = 16
const LAYER_GAP = 60
const LAYER_HEADER_HEIGHT = 44

function buildLayerGroupNode(
  layer: Layer,
  x: number,
  totalHeight: number,
): Node<LayerGroupNodeData> {
  return {
    id: `layer-${layer.id}`,
    type: 'layerGroup',
    position: { x, y: 0 },
    data: {
      label: layer.label,
      color: layer.color,
      layerId: layer.id,
      moduleCount: layer.modules.length,
    },
    style: {
      width: LAYER_WIDTH,
      height: totalHeight,
    },
  }
}

function buildModuleNode(
  module: {
    id: string
    name: string
    description?: string
    type?: string
    files?: string[]
    tags?: string[]
    dependsOn?: string[]
    endpoints?: string[]
    externalUrl?: string
  },
  layerColor: string,
  layerId: string,
  x: number,
  y: number,
): Node<ModuleNodeData> {
  return {
    id: module.id,
    type: 'module',
    position: { x, y },
    parentId: `layer-${layerId}`,
    extent: 'parent' as const,
    data: {
      module,
      layerColor,
      layerId,
    },
  }
}

export interface LayerViewResult {
  nodes: Node[]
  edges: Edge[]
}

export function configToLayerNodes(config: ArchflowConfig): LayerViewResult {
  const layers = config.layers ?? []
  const sortedLayers = [...layers].sort((a, b) => a.order - b.order)

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Calculate the max height needed across all layers
  const maxModules = Math.max(...sortedLayers.map((l) => l.modules.length), 1)
  const totalHeight =
    LAYER_HEADER_HEIGHT +
    LAYER_PADDING +
    maxModules * MODULE_HEIGHT +
    (maxModules - 1) * MODULE_GAP +
    LAYER_PADDING

  // Build layer group nodes and module nodes
  for (let i = 0; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i]
    const layerX = i * (LAYER_WIDTH + LAYER_GAP)

    // Layer container
    nodes.push(buildLayerGroupNode(layer, layerX, totalHeight))

    // Module nodes inside the layer
    const moduleX = (LAYER_WIDTH - MODULE_WIDTH) / 2
    for (let j = 0; j < layer.modules.length; j++) {
      const mod = layer.modules[j]
      const moduleY =
        LAYER_HEADER_HEIGHT + LAYER_PADDING + j * (MODULE_HEIGHT + MODULE_GAP)

      nodes.push(
        buildModuleNode(mod, layer.color, layer.id, moduleX, moduleY),
      )
    }
  }

  // Build edges from dependsOn references
  const allModuleIds = new Set(
    sortedLayers.flatMap((l) => l.modules.map((m) => m.id)),
  )

  for (const layer of sortedLayers) {
    for (const mod of layer.modules) {
      for (const depId of mod.dependsOn ?? []) {
        if (allModuleIds.has(depId)) {
          edges.push({
            id: `edge-${mod.id}-${depId}`,
            source: mod.id,
            target: depId,
            animated: false,
          })
        }
      }
    }
  }

  return { nodes, edges }
}
