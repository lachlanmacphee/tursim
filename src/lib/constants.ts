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

const TAPE_LENGTH = 50;

// "a_aa": the machine below adds the two blocks, leaving "aaa"
export const initialTape: string[] = [
  "a",
  "_",
  "a",
  "a",
  ...new Array(TAPE_LENGTH - 4).fill("_"),
];

const arrow = { type: MarkerType.ArrowClosed, width: 20, height: 20 };

// Unary addition: fill the gap between the blocks with an "a", then erase the
// last "a" at the end to correct for the extra one
export const initialNodes: Node[] = [
  { id: "1", position: { x: -360, y: 0 }, data: { isStart: true } },
  { id: "3", position: { x: -120, y: 0 }, data: {} },
  { id: "4", position: { x: 120, y: 0 }, data: {} },
  { id: "2", position: { x: 360, y: 0 }, data: { isFinal: true } },
].map((node) => ({
  ...node,
  type: "turing",
  data: { isStart: false, isFinal: false, isActive: false, ...node.data },
}));

const edge = (source: string, target: string, edgeValue: string): Edge => ({
  id: `e${source}-${target}`,
  source,
  target,
  type: "turing",
  data: { edgeValue },
  markerEnd: arrow,
});

export const initialEdges: Edge[] = [
  edge("1", "1", "a,a,>"),
  edge("1", "3", "_,a,>"),
  edge("3", "3", "a,a,>"),
  edge("3", "4", "_,_,<"),
  edge("4", "2", "a,_,>"),
];

// What "clear machine" goes back to: just a start and an end node
export const blankNodes: Node[] = [
  { id: "1", position: { x: -120, y: 0 }, data: { isStart: true } },
  { id: "2", position: { x: 120, y: 0 }, data: { isFinal: true } },
].map((node) => ({
  ...node,
  type: "turing",
  data: { isStart: false, isFinal: false, isActive: false, ...node.data },
}));

// Built-in examples, listed in the load dialogs but never stored, renamed or deleted
export const EXAMPLE_MACHINE_NAME = "Example: unary addition";
export const EXAMPLE_TAPE_NAME = "Example: a_aa";
