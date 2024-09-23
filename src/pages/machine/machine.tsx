import {
  ChevronUpIcon,
  DownloadIcon,
  PlayIcon,
  PlusIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import { useState, useCallback, useMemo, ChangeEvent } from "react";

import {
  ReactFlow,
  Background,
  Controls,
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
  MarkerType,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@/hooks/useTheme";
import { ToolButton } from "./ToolButton";
import { TuringNode } from "./TuringNode";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TuringEdge } from "./TuringEdge";

const BASE_INTERVAL = 500;

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

const initialEdges: Edge[] = [
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

const createEdgesToNodesRecord = (edges: Edge[], nodes: Node[]) => {
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

export default function TuringMachine() {
  const [activeTool, setActiveTool] = useState<string>("");
  const [tape, setTape] = useState<string[]>(new Array(50).fill("_"));
  const [tapeHead, setTapeHead] = useState<number>(0);
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>(
    undefined
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [speed, setSpeed] = useState<number>(100);
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
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "turing",
            // @ts-ignore
            data: { ...params.data, edgeValue: "_,_,>" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
          },
          eds
        )
      ),
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
    setNodes(newNodesArray);
  }, [nodes]);

  const saveMachine = () => {
    const edgesToNodesRecord = createEdgesToNodesRecord(edges, nodes);
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(edgesToNodesRecord)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "data.json";
    link.click();
    link.remove();
  };

  const playTape = async () => {
    const startStates = nodes.filter((node) => node.data.isStart);

    if (startStates.length != 1) {
      console.error("There should be only 1 start state");
      return;
    }

    const edgesToNodesRecord = createEdgesToNodesRecord(edges, nodes);

    let currentNode = startStates[0];
    setActiveNodeId(currentNode.id);
    let tapeIdx = tapeHead;
    let updatedTape = [...tape]; // Work with a local copy of tape

    const updateTapeHeadActive = async (
      newTape: string[],
      newTapeHead: number,
      active: string
    ) => {
      return new Promise((resolve) => {
        setTape(newTape);
        setTapeHead(newTapeHead);
        setActiveNodeId(active);
        setTimeout(resolve, BASE_INTERVAL / (speed / 100));
      });
    };

    while (!currentNode.data.isFinal) {
      const tapeLetter = updatedTape[tapeIdx];
      const nodeRecords = edgesToNodesRecord[currentNode.id];
      const edge = nodeRecords.find(
        ({ readLetter }) => readLetter == tapeLetter
      );

      if (!edge) {
        console.error("Couldn't find current symbol leaving this node");
        return;
      }

      // Update the tape symbol if needed
      if (edge.writeLetter) {
        updatedTape[tapeIdx] = edge.writeLetter; // Modify the local copy of tape
      }

      // Update tape head based on direction
      if (edge.direction == "<") {
        if (tapeIdx == 0) {
          console.error(
            "Can't move left from leftmost symbol. You fell off the tape!"
          );
          return;
        }
        tapeIdx = tapeIdx - 1; // Update tape index locally
      } else if (edge.direction == ">") {
        tapeIdx = tapeIdx + 1; // Update tape index locally
      }

      // Await the update of tape and tape head for visual feedback
      await updateTapeHeadActive(updatedTape, tapeIdx, edge.node.id);

      // Move to the next node in the machine
      currentNode = edge.node;
    }
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
          <ToolButton
            name="resetTapeHead"
            onClick={() => {
              setTapeHead(0);
              const startStates = nodes.filter((node) => node.data.isStart);
              if (startStates.length == 1) {
                setActiveNodeId(startStates[0].id);
              }
            }}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          >
            <ResetIcon className="w-12 h-12" />
          </ToolButton>
          <ToolButton
            name="changeSpeed"
            onClick={() => {
              if (speed == 20) {
                setSpeed(100);
              } else {
                setSpeed(speed - 20);
              }
            }}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          >
            <span>{speed}%</span>
          </ToolButton>
          <ToolButton
            name="saveMachine"
            onClick={saveMachine}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          >
            <DownloadIcon className="w-12 h-12" />
          </ToolButton>
        </div>
        <div className="h-full">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: { ...node.data, isActive: activeNodeId == node.id },
            }))}
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
