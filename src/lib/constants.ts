import { TuringEdge } from "@/pages/machine/TuringEdge";
import { TuringNode } from "@/pages/machine/TuringNode";
import {
  DefaultEdgeOptions,
  Edge,
  FitViewOptions,
  MarkerType,
  Node,
  NodeTypes,
} from "@xyflow/react";

export const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

export const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};

export const nodeTypes: NodeTypes = {
  turing: TuringNode,
};

export const edgeTypes = {
  turing: TuringEdge,
};

export const initialNodes: Node[] = [
  {
    id: "1",
    type: "turing",
    data: { isStart: true, isFinal: false, isActive: false },
    position: { x: -200, y: 0 },
  },
  {
    id: "2",
    type: "turing",
    data: { isStart: false, isFinal: false, isActive: false },
    position: { x: 0, y: 0 },
  },
  {
    id: "3",
    type: "turing",
    data: { isStart: false, isFinal: true, isActive: false },
    position: { x: 200, y: 0 },
  },
];

export const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "turing",
    data: { edgeValue: "_,_,>" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "turing",
    data: { edgeValue: "_,_,>" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
  },
];
