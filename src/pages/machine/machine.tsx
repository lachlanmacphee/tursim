import { ChevronUpIcon, PlayIcon, PlusIcon } from "@radix-ui/react-icons";
import { useState, useCallback, useMemo, ChangeEvent } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type FitViewOptions,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type DefaultEdgeOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@/hooks/useTheme";
import { ToolButton } from "./ToolButton";
import { TuringNode } from "./TuringNode";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TuringEdge } from "./TuringEdge";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};

const nodeTypes: NodeTypes = {
  turing: TuringNode,
};

const edgeTypes = {
  turing: TuringEdge,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "turing",
    data: { isStart: true, isFinal: false },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    type: "turing",
    data: { isStart: false, isFinal: false },
    position: { x: 100, y: 0 },
  },
  {
    id: "3",
    type: "turing",
    data: { isStart: false, isFinal: true },
    position: { x: 200, y: 0 },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "turing",
    data: { edgeValue: "_,_,>" },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    type: "turing",
    data: { edgeValue: "_,_,>" },
  },
];

export default function TuringMachine() {
  const [activeTool, setActiveTool] = useState<string>("");
  const [tape, setTape] = useState<string[]>(new Array(50).fill("_"));
  const [tapeHead, setTapeHead] = useState<number>(0);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { theme } = useTheme();
  const colorMode = useMemo(
    () => (theme == "system" ? "system" : theme == "light" ? "light" : "dark"),
    [theme]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const id = (
      Math.max.apply(
        Math,
        nodes.map((node) => parseInt(node.id))
      ) + 1
    ).toString();
    const newNode = {
      id,
      type: "turing",
      data: { isStart: false, isFinal: false },
      position: { x: 5, y: 100 },
    };
    const newNodesArray = [...nodes, newNode];
    console.log(newNodesArray);
    setNodes(newNodesArray);
  }, [nodes]);

  const playTape = () => {
    const startStates = nodes.filter((node) => node.data.isStart);

    if (startStates.length != 1) {
      console.error("There should be only 1 start state");
      return;
    }

    // create the edge to node object
    const edgesToNodesRecord: {
      [id: string]: {
        readLetter: string;
        writeLetter: string | undefined;
        direction: string;
        node: Node;
      }[];
    } = {};
    edges.forEach((edge) => {
      const withoutE = edge.id.slice(1);
      const ids = withoutE.split("-");
      const sourceId = ids[0];
      const targetId = ids[1];
      const edgeValue = edge!.data!.edgeValue as string;
      const edgeValueSplit = edgeValue.split(",");

      let newReadLetter = undefined;
      let newWriteLetter = undefined;
      let newDirection = undefined;
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

    let currentNode = startStates[0];
    let tapeIdx = tapeHead;
    while (!currentNode.data.isFinal) {
      const tapeLetter = tape[tapeIdx];
      const nodeRecords = edgesToNodesRecord[currentNode.id];
      const edge = nodeRecords.find(
        ({ readLetter }) => readLetter == tapeLetter
      );
      if (!edge) {
        console.error("Couldn't find current symbol leaving this node");
        return;
      }

      if (edge.writeLetter) {
        setTape((currentTape) => {
          const updatedTape = [...currentTape];
          console.log(updatedTape);
          updatedTape[tapeIdx] = edge.writeLetter as string;
          return updatedTape;
        });
      }

      if (edge.direction == "<") {
        if (tapeHead == 0) {
          console.error(
            "Can't move left from leftmost symbol. You fell off the tape!"
          );
          return;
        }
        setTapeHead((currVal) => currVal - 1);
        tapeIdx = tapeIdx - 1;
      } else if (edge.direction == ">") {
        setTapeHead((currVal) => currVal + 1);
        tapeIdx = tapeIdx + 1;
      }
      currentNode = edge.node;
    }

    setTapeHead(0);
    console.log("Got to a final state!");
  };

  const handleSymbolClick = (event: React.MouseEvent<HTMLInputElement>) => {
    const inputElement = event.target as HTMLInputElement;
    inputElement.select();
  };

  const setTapeValue = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    const newSymbol = e.target.value; // Get the new symbol from the input field

    // Only allow single character updates due to minLength and maxLength constraints
    if (newSymbol.length === 1) {
      setTape((prevTape: string[]) => {
        const updatedTape = [...prevTape]; // Create a copy of the tape
        updatedTape[idx] = newSymbol; // Overwrite the symbol at the specific index
        return updatedTape; // Return the updated tape to set as the new state
      });
    }
  };

  return (
    <div className="flex-grow flex flex-col p-4 gap-4 container">
      <div className="border grid grid-cols-[80px,1fr] flex-grow rounded-lg shadow">
        <div className="border-r p-2 flex flex-col items-center gap-2">
          <ToolButton
            name="addNode"
            onClick={addNode}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          >
            <PlusIcon className="w-12 h-12" />
          </ToolButton>
          <ToolButton
            name="playTape"
            onClick={playTape}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          >
            <PlayIcon className="w-12 h-12" />
          </ToolButton>
        </div>
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            edges={edges}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={fitViewOptions}
            defaultEdgeOptions={defaultEdgeOptions}
            colorMode={colorMode}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <ScrollArea className="w-full border h-32 flex gap-2 shadow p-2">
        <div className="flex gap-1 p-1">
          {tape.map((_, idx) => {
            if (idx == tapeHead) {
              return (
                <div key={idx} className="flex flex-col items-center">
                  <Input
                    className="h-16 w-16 text-center text-3xl"
                    minLength={1}
                    maxLength={1}
                    value={tape[idx]}
                    onChange={(e) => setTapeValue(e, idx)}
                    onClick={handleSymbolClick}
                  />
                  {idx == tapeHead && <ChevronUpIcon className="w-8 h-8" />}
                </div>
              );
            }
            return (
              <Input
                key={idx}
                className="h-16 w-16 text-center text-3xl"
                minLength={1}
                maxLength={1}
                value={tape[idx]}
                onChange={(e) => setTapeValue(e, idx)}
                onClick={handleSymbolClick}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
