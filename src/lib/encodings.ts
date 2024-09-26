import { Edge, MarkerType, Node } from "@xyflow/react";
import { getLayoutedElements } from "./layout";

type TableRow = {
  from: string;
  to: string;
  read: string;
  write: string;
  move: string;
};

const transform = (char1: string, char2: string): string => {
  if (char1 === "a" && char2 === "a") return "a";
  if (char1 === "a" && char2 === "b") return "b";
  if (char1 === "b" && char2 === "a") return "_";
  if (char1 === "b" && char2 === "b") return "#";
  return "#";
};

function getNextRow(encoding: string): [TableRow, string] {
  let index = 0;
  let from = 0;
  let to = 0;

  // Read a's until we see a b and count them
  while (index < encoding.length && encoding[index] === "a") {
    from++;
    index++;
  }

  // Move past the 'b'
  index++;

  // Read a's after the b until we see another b and count them
  while (index < encoding.length && encoding[index] === "a") {
    to++;
    index++;
  }

  // Move past the second 'b'
  index++;

  const read = transform(encoding[index], encoding[index + 1]);
  index += 2;

  const write = transform(encoding[index], encoding[index + 1]);
  index += 2;

  const move = encoding[index] === "a" ? "<" : ">";
  index++;

  // Prepare the result to return
  return [
    { from: from.toString(), to: to.toString(), read, write, move },
    encoding.slice(index),
  ];
}

export function convertABEncodingToDG(
  encoding: string
): [nodes: Node[], edges: Edge[]] {
  const tableRows: TableRow[] = [];
  const result = getNextRow(encoding);
  tableRows.push(result[0]);
  let remEncoding: string = result[1];
  while (remEncoding != "") {
    const result = getNextRow(remEncoding);
    tableRows.push(result[0]);
    remEncoding = result[1];
  }

  const nodes: Node[] = [];
  tableRows.forEach((row) => {
    if (nodes.findIndex((node) => node.id == row.from) == -1) {
      nodes.push({
        id: row.from,
        type: "turing",
        data: {
          isStart: false,
          isFinal: tableRows[tableRows.length - 1].to == row.from,
          isActive: false,
        },
        position: { x: 0, y: 0 },
      });
    }

    if (nodes.findIndex((node) => node.id == row.to) == -1) {
      nodes.push({
        id: row.to,
        type: "turing",
        data: {
          isStart: false,
          isFinal: tableRows[tableRows.length - 1].to == row.to,
          isActive: false,
        },
        position: { x: 0, y: 0 },
      });
    }
  });

  const edges: Edge[] = [];
  tableRows.forEach((row) => {
    const id = `e${row.from}-${row.to}`;
    const idx = edges.findIndex((edge) => edge.id == id);
    const newEdgeValue = `${row.read},${row.write},${row.move}`;

    if (idx != -1) {
      edges[idx] = {
        ...edges[idx],
        data: { edgeValue: edges[idx]!.data!.edgeValue + ";" + newEdgeValue },
      };
      return;
    }

    edges.push({
      id,
      source: row.from,
      target: row.to,
      type: "turing",
      data: { edgeValue: newEdgeValue },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    });
  });

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    nodes,
    edges
  );
  return [layoutedNodes, layoutedEdges];
}
