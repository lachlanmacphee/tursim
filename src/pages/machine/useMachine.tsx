import {
  useState,
  useCallback,
  ChangeEvent,
  MouseEventHandler,
  useEffect,
} from "react";
import {
  getStoreData,
  initDB,
  Machine,
  saveMachine,
  saveTape,
  Stores,
  Tape,
} from "@/lib/db";

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
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initialEdges, initialNodes } from "@/lib/constants";
import { createEdgesToNodesRecord, getId } from "@/lib/utils";
import { convertABEncodingToDG } from "@/lib/encodings";

const BASE_INTERVAL = 500;

export const useMachine = () => {
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isEditingTape, setIsEditingTape] = useState<boolean>(false);
  const [tape, setTape] = useState<string[]>(new Array(50).fill("_"));
  const [tapeHead, setTapeHead] = useState<number>(0);
  const [activeNodeId, setActiveNodeId] = useState<string>("1");
  const [hoveredNodeId, setHoveredNodeId] = useState<string>("");
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showSaveMachineDialog, setShowSaveMachineDialog] =
    useState<boolean>(false);
  const [showLoadMachinesDrawer, setShowLoadMachinesDrawer] =
    useState<boolean>(false);
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [showSaveTapeDialog, setShowSaveTapeDialog] = useState<boolean>(false);
  const [showLoadTapesDrawer, setShowLoadTapesDrawer] =
    useState<boolean>(false);
  const [showEncodingDialog, setShowEncodingDialog] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(100);

  const handleInitDB = async () => {
    await initDB();
  };

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (isEditingTape) return;
      switch (event.key) {
        case "a":
          setActiveTool("select");
          break;
        case "s":
          setActiveTool("addMoveNode");
          break;
        case "d":
          setActiveTool("addEdge");
          break;
        case "f":
          setActiveTool("delete");
          break;
        default:
          break;
      }
    },
    [isEditingTape]
  );

  useEffect(() => {
    handleInitDB();
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

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

  const clickHandler: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      switch (activeTool) {
        case "addMoveNode":
          const position = screenToFlowPosition({
            x: event.clientX - 32,
            y: event.clientY - 32,
          });
          setNodes([
            ...nodes,
            {
              id: getId(nodes),
              type: "turing",
              data: { isStart: false, isFinal: false },
              position,
            },
          ]);
          break;

        default:
          break;
      }
    },
    [activeTool, nodes]
  );

  const nodeClickHandler = useCallback(
    (_: any, clickedNode: any) => {
      switch (activeTool) {
        case "delete":
          setNodes(nodes.filter((node) => node.id != clickedNode.id));
          setEdges(
            edges
              .filter((edge) => edge.source != clickedNode.id)
              .filter((edge) => edge.target != clickedNode.id)
          );
          break;

        default:
          break;
      }
    },
    [activeTool, nodes, edges]
  );

  const edgeClickHandler = useCallback(
    (_: any, clickedEdge: any) => {
      switch (activeTool) {
        case "delete":
          setEdges(edges.filter((edge) => edge.id != clickedEdge.id));
          break;

        default:
          break;
      }
    },
    [activeTool, nodes, edges]
  );

  const nodeMouseEnterHandler = (_: any, node: any) => {
    setHoveredNodeId(node.id);
  };

  const nodeMouseLeaveHandler = () => {
    setHoveredNodeId("");
  };

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

  const playTape = async () => {
    const startStates = nodes.filter((node) => node.data.isStart);

    if (startStates.length != 1) {
      console.error("There should be only 1 start state");
      return;
    }

    const edgesToNodesRecord = createEdgesToNodesRecord(edges, nodes);

    let currentNode = nodes.find((node) => node.id == activeNodeId)!;
    let tapeIdx = tapeHead;
    let updatedTape = [...tape];

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
        updatedTape[tapeIdx] = edge.writeLetter;
      }

      // Update tape head based on direction
      if (edge.direction == "<") {
        if (tapeIdx == 0) {
          console.error(
            "Can't move left from leftmost symbol. You fell off the tape!"
          );
          return;
        }
        tapeIdx = tapeIdx - 1;
      } else if (edge.direction == ">") {
        tapeIdx = tapeIdx + 1;
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
    setIsEditingTape(true);
  };

  const setTapeValue = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    const newSymbol = e.target.value;

    setTape((prevTape: string[]) => {
      const updatedTape = [...prevTape]; // Create a copy of the tape
      updatedTape[idx] = newSymbol; // Overwrite the symbol at the specific index
      return updatedTape; // Return the updated tape to set as the new state
    });
  };

  const resetTape = () => {
    setTapeHead(0);
    const startStates = nodes.filter((node) => node.data.isStart);
    if (startStates.length == 1) {
      setActiveNodeId(startStates[0].id);
    }
  };

  const saveMachineHandler = (name: string) => {
    saveMachine(name, nodes, edges);
    setShowSaveMachineDialog(false);
  };

  const saveTapeHandler = (name: string) => {
    saveTape(name, tape);
    setShowSaveTapeDialog(false);
  };

  const loadTapes = async () => {
    const dbTapes = await getStoreData<Tape>(Stores.Tapes);
    setTapes(dbTapes);
    setShowLoadTapesDrawer(true);
  };

  const loadMachines = async () => {
    const dbMachines = await getStoreData<Machine>(Stores.Machines);
    setMachines(dbMachines);
    setShowLoadMachinesDrawer(true);
  };

  const changeSpeed = () => {
    if (speed == 20) {
      setSpeed(100);
    } else {
      setSpeed(speed - 20);
    }
  };

  const createEncoding = (encoding: string) => {
    const [nodes, edges] = convertABEncodingToDG(encoding);
    setNodes(nodes);
    setEdges(edges);
    setShowEncodingDialog(false);
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
    handleSymbolClick,
    playTape,
    setTapeValue,
    loadMachines,
    machines,
    showLoadMachinesDrawer,
    setShowLoadMachinesDrawer,
    loadTapes,
    saveMachineHandler,
    resetTape,
    tapes,
    saveTapeHandler,
    showLoadTapesDrawer,
    setShowLoadTapesDrawer,
    showSaveMachineDialog,
    setShowSaveMachineDialog,
    showSaveTapeDialog,
    setShowSaveTapeDialog,
    saveEdgeToNodeDict,
    changeSpeed,
    clickHandler,
    nodeClickHandler,
    edgeClickHandler,
    nodeMouseEnterHandler,
    nodeMouseLeaveHandler,
    hoveredNodeId,
    isEditingTape,
    setIsEditingTape,
    showEncodingDialog,
    setShowEncodingDialog,
    createEncoding,
  };
};
