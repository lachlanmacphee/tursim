import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Edge, type InternalNode, type Node } from "@xyflow/react";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Point = { x: number; y: number };

// A self-loop's label sits this far above the node
const SELF_LOOP_LABEL_GAP = 44;
// How far a label is pushed sideways when an edge has one going back the other way
const BIDIRECTIONAL_OFFSET = 44;

const nodeCenter = (node: InternalNode): Point => ({
  x: node.internals.positionAbsolute.x + (node.measured.width ?? 0) / 2,
  y: node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2,
});

const nodeRadius = (node: InternalNode) => (node.measured.width ?? 0) / 2;

const towards = (from: Point, to: Point, distance: number): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  };
};

export type EdgeGeometry = {
  // node -> label, then label -> node; the paths run under the label so they
  // look like they end at its edge
  pathToLabel: string;
  pathFromLabel: string;
  label: Point;
  // Whether `label` is the label's centre or the middle of its bottom edge
  labelAnchor: "center" | "bottom";
};

export function getEdgeGeometry(
  sourceNode: InternalNode,
  targetNode: InternalNode,
  isBidirectional: boolean
): EdgeGeometry {
  const sourceCenter = nodeCenter(sourceNode);
  const sourceRadius = nodeRadius(sourceNode);

  if (sourceNode.id == targetNode.id) {
    const r = sourceRadius;
    const start = { x: sourceCenter.x - r / 2, y: sourceCenter.y - r * 0.866 };
    const end = { x: sourceCenter.x + r / 2, y: sourceCenter.y - r * 0.866 };
    const labelBottom = sourceCenter.y - r - SELF_LOOP_LABEL_GAP;
    const left = { x: sourceCenter.x - 24, y: labelBottom - 8 };
    const right = { x: sourceCenter.x + 24, y: labelBottom - 8 };
    const bulgeY = sourceCenter.y - r * 1.5;

    return {
      pathToLabel: `M ${start.x} ${start.y} Q ${sourceCenter.x - r * 1.4} ${bulgeY} ${left.x} ${left.y}`,
      pathFromLabel: `M ${right.x} ${right.y} Q ${sourceCenter.x + r * 1.4} ${bulgeY} ${end.x} ${end.y}`,
      label: { x: sourceCenter.x, y: labelBottom },
      labelAnchor: "bottom",
    };
  }

  const targetCenter = nodeCenter(targetNode);
  const mid = {
    x: (sourceCenter.x + targetCenter.x) / 2,
    y: (sourceCenter.y + targetCenter.y) / 2,
  };
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = isBidirectional ? BIDIRECTIONAL_OFFSET : 0;
  // Perpendicular to the edge's own direction, so opposite edges split apart
  const label = {
    x: mid.x + (-dy / length) * offset,
    y: mid.y + (dx / length) * offset,
  };
  // Control point that makes the curve pass through the label
  const control = { x: 2 * label.x - mid.x, y: 2 * label.y - mid.y };

  const start = towards(sourceCenter, control, sourceRadius);
  const end = towards(targetCenter, control, nodeRadius(targetNode));
  // Where the curve meets the label, which is where it's split in two
  const split = {
    x: (start.x + 2 * control.x + end.x) / 4,
    y: (start.y + 2 * control.y + end.y) / 4,
  };

  return {
    pathToLabel: `M ${start.x} ${start.y} Q ${(start.x + control.x) / 2} ${(start.y + control.y) / 2} ${split.x} ${split.y}`,
    pathFromLabel: `M ${split.x} ${split.y} Q ${(control.x + end.x) / 2} ${(control.y + end.y) / 2} ${end.x} ${end.y}`,
    label,
    labelAnchor: "center",
  };
}

export const createEdgesToNodesRecord = (edges: Edge[], nodes: Node[]) => {
  const edgesToNodesRecord: {
    [id: string]: {
      readLetter: string;
      writeLetter: string | undefined;
      direction: string;
      node: Node;
      edgeId: string;
      ruleIndex: number;
    }[];
  } = {};

  edges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const edgeValue = edge!.data!.edgeValue as string;
    const connections = edgeValue.split(";");

    connections.forEach((connection, ruleIndex) => {
      const edgeValueSplit = connection.split(",");

      let newReadLetter: string | undefined = undefined;
      let newWriteLetter: string | undefined = undefined;
      let newDirection: string | undefined = undefined;
      if (edgeValueSplit.length == 2) {
        newReadLetter = edgeValueSplit[0];
        newDirection = edgeValueSplit[1];
      } else if (edgeValueSplit.length == 3) {
        newReadLetter = edgeValueSplit[0];
        newWriteLetter = edgeValueSplit[1];
        newDirection = edgeValueSplit[2];
      } else {
        console.error("Each edge must have either 2 or 3 values");
        return;
      }

      const currArr = edgesToNodesRecord[sourceId];
      if (currArr) {
        const isLetterPresent =
          currArr.filter(({ readLetter }) => readLetter == newReadLetter)
            .length > 0;
        if (isLetterPresent) {
          console.error(
            "Each node must have only one of each letter outgoing max"
          );
          return;
        }
        edgesToNodesRecord[sourceId] = [
          ...currArr,
          {
            readLetter: newReadLetter,
            writeLetter: newWriteLetter,
            direction: newDirection,
            node: nodes.filter((node) => node.id == targetId)[0],
            edgeId: edge.id,
            ruleIndex,
          },
        ];
      } else {
        edgesToNodesRecord[sourceId] = [
          {
            readLetter: newReadLetter,
            writeLetter: newWriteLetter,
            direction: newDirection,
            node: nodes.filter((node) => node.id == targetId)[0],
            edgeId: edge.id,
            ruleIndex,
          },
        ];
      }
    });
  });

  return edgesToNodesRecord;
};

export function getId(nodes: Node[]): string {
  const ids = nodes.map((node) => parseInt(node.id)).sort((a, b) => a - b);

  const newId = ids.reduce((smallestMissing, id) => {
    if (id === smallestMissing) {
      return smallestMissing + 1;
    }
    return smallestMissing;
  }, 1);

  return newId.toString();
}
