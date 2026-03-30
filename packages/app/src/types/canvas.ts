import type { Layer, Module } from '../lib/schema'

/** Data attached to a LayerGroupNode in React Flow */
export interface LayerGroupNodeData {
  label: string
  color: string
  layerId: string
  moduleCount: number
}

/** Data attached to a ModuleNode in React Flow */
export interface ModuleNodeData {
  module: Module
  layerColor: string
  layerId: string
}

/** Data attached to a dependency edge */
export interface DependencyEdgeData {
  imports?: string[]
  isTypeOnly?: boolean
}

/** View types available in Archflow */
export type ViewType = 'layers' | 'routes' | 'stateFlows' | 'dependencies'

/** Represents a layer with positioning metadata for layout */
export interface PositionedLayer extends Layer {
  x: number
  y: number
  width: number
  height: number
}
