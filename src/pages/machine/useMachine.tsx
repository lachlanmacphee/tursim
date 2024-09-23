import { useState, useCallback, ChangeEvent } from "react";

import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  MarkerType,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initialEdges, initialNodes } from "@/lib/constants";
import { createEdgesToNodesRecord } from "@/lib/utils";

const BASE_INTERVAL = 500;

export const useMachine = () => {
  const [activeTool, setActiveTool] = useState<string>("");
  const [tape, setTape] = useState<string[]>(new Array(50).fill("_"));
  const [tapeHead, setTapeHead] = useState<number>(0);
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>(
    undefined
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [speed, setSpeed] = useState<number>(100);

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
      position: { x: Math.random() * 100, y: Math.random() * 100 },
    };
    const newNodesArray = [...nodes, newNode];
    setNodes(newNodesArray);
  }, [nodes]);

  const saveEdgeToNodeDict = () => {
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
    const newSymbol = e.target.value;

    setTape((prevTape: string[]) => {
      const updatedTape = [...prevTape]; // Create a copy of the tape
      updatedTape[idx] = newSymbol; // Overwrite the symbol at the specific index
      return updatedTape; // Return the updated tape to set as the new state
    });
  };

  const saveTape = () => {
    localStorage.setItem("tape", JSON.stringify(tape));
  };

  const loadTape = () => {
    const lsTape = localStorage.getItem("tape");
    if (lsTape) {
      const parsedTape = JSON.parse(lsTape) as string[];
      setTape(parsedTape);
    }
  };

  const resetTape = () => {
    setTapeHead(0);
    const startStates = nodes.filter((node) => node.data.isStart);
    if (startStates.length == 1) {
      setActiveNodeId(startStates[0].id);
    }
  };

  const saveMachine = () => {
    localStorage.setItem("nodes", JSON.stringify(nodes));
    localStorage.setItem("edges", JSON.stringify(edges));
  };

  const loadMachine = () => {
    const lsNodes = localStorage.getItem("nodes");
    const lsEdges = localStorage.getItem("edges");
    if (lsNodes && lsEdges) {
      const parsedNodes = JSON.parse(lsNodes) as Node[];
      const parsedEdges = JSON.parse(lsEdges) as Edge[];
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    }
  };

  const changeSpeed = () => {
    if (speed == 20) {
      setSpeed(100);
    } else {
      setSpeed(speed - 20);
    }
  };

  return {
    // states
    nodes,
    setNodes,
    edges,
    setEdges,
    tape,
    setTape,
    tapeHead,
    setTapeHead,
    speed,
    setSpeed,
    activeTool,
    setActiveTool,
    activeNodeId,
    setActiveNodeId,
    // react flow callbacks
    onNodesChange,
    onEdgesChange,
    onConnect,
    // handlers
    addNode,
    handleSymbolClick,
    playTape,
    setTapeValue,
    saveTape,
    loadTape,
    resetTape,
    saveMachine,
    loadMachine,
    saveEdgeToNodeDict,
    changeSpeed,
  };
};
