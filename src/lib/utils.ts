import { Connection } from "@xyflow/react";
import { devWarn, EdgeBase, errorMessages, isEdgeBase } from "@xyflow/system";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getEdgeId = ({ source, target }: Connection | EdgeBase): string =>
  `e${source}-${target}`;

const connectionExists = (edge: EdgeBase, edges: EdgeBase[]) => {
  return edges.some(
    (el) => el.source === edge.source && el.target === edge.target
  );
};

export const customAddEdge = <EdgeType extends EdgeBase>(
  edgeParams: EdgeType | Connection,
  edges: EdgeType[]
): EdgeType[] => {
  if (!edgeParams.source || !edgeParams.target) {
    devWarn("006", errorMessages["error006"]());

    return edges;
  }

  let edge: EdgeType;
  if (isEdgeBase(edgeParams)) {
    edge = {
      ...edgeParams,
      type: "turing",
      data: { ...edgeParams.data, edgeValue: "_,_,>" },
    };
  } else {
    edge = {
      ...edgeParams,
      id: getEdgeId(edgeParams),
      type: "turing",
      // @ts-ignore
      data: { ...edgeParams.data, edgeValue: "_,_,>" },
    } as EdgeType;
  }

  if (connectionExists(edge, edges)) {
    return edges;
  }

  if (edge.sourceHandle === null) {
    delete edge.sourceHandle;
  }

  if (edge.targetHandle === null) {
    delete edge.targetHandle;
  }

  return edges.concat(edge);
};
