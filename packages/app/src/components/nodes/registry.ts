import type { NodeTypes } from '@xyflow/react'
import { LayerGroupNode } from './LayerGroupNode'
import { ModuleNode } from './ModuleNode'
import { FileNode } from './FileNode'
import { RouteNode } from './RouteNode'
import { RouteGroupNode } from './RouteGroupNode'
import { StateStoreNode } from './StateStoreNode'
import { StateConsumerNode } from './StateConsumerNode'

export const nodeTypes: NodeTypes = {
  layerGroup: LayerGroupNode,
  module: ModuleNode,
  file: FileNode,
  route: RouteNode,
  routeGroup: RouteGroupNode,
  stateStore: StateStoreNode,
  stateConsumer: StateConsumerNode,
}
