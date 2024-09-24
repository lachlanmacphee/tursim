import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Edge, Position } from "@xyflow/react";
import { type Node } from "@xyflow/react";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(
  // @ts-ignore
  intersectionNode,
  // @ts-ignore
  targetNode
) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } =
    intersectionNode.measured;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNode.measured.width / 2;
  const y1 = targetPosition.y + targetNode.measured.height / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getEdgePosition(
  node: { internals: { positionAbsolute: any } },
  intersectionPoint: { x: number; y: number }
) {
  const n = { ...node.internals.positionAbsolute, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + n.measured.width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + n.measured.height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

// @ts-ignore
export function getEdgeParams(source, target) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

export const createEdgesToNodesRecord = (edges: Edge[], nodes: Node[]) => {
  const edgesToNodesRecord: {
    [id: string]: {
      readLetter: string;
      writeLetter: string | undefined;
      direction: string;
      node: Node;
    }[];
  } = {};

  edges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const edgeValue = edge!.data!.edgeValue as string;
    const connections = edgeValue.split(";");

    connections.forEach((connection) => {
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
          },
        ];
      } else {
        edgesToNodesRecord[sourceId] = [
          {
            readLetter: newReadLetter,
            writeLetter: newWriteLetter,
            direction: newDirection,
            node: nodes.filter((node) => node.id == targetId)[0],
          },
        ];
      }
    });
  });

  return edgesToNodesRecord;
};

export function getId(nodes: Node[]): string {
  const ids = nodes.map((node) => parseInt(node.id)).toSorted((a, b) => a - b);

  const newId = ids.reduce((smallestMissing, id) => {
    if (id === smallestMissing) {
      return smallestMissing + 1;
    }
    return smallestMissing;
  }, 1);

  return newId.toString();
}
