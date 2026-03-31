import type { Module } from '../lib/schema'

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

/** View types available in Archflow */
export type ViewType = 'layers' | 'routes' | 'stateFlows' | 'dependencies'
