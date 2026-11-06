import {
  useState,
  useCallback,
  ChangeEvent,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  deleteData,
  getStoreData,
  initDB,
  Machine,
  nameExists,
  renameData,
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
import {
  blankNodes,
  EXAMPLE_MACHINE_NAME,
  EXAMPLE_TAPE_NAME,
  initialEdges,
  initialNodes,
  initialTape,
} from "@/lib/constants";
import { createEdgesToNodesRecord, getId } from "@/lib/utils";
import { convertABEncodingToDG } from "@/lib/encodings";

// A transition takes three steps (pick the edge, apply it, arrive), so each is
// shorter than the single step it used to be
const BASE_INTERVAL = 250;
const MAX_HISTORY = 100;
const MACHINE_STORAGE_KEY = "tursim:machine";
const SAVE_DEBOUNCE_MS = 300;

type SavedMachine = { nodes: Node[]; edges: Edge[]; tape: string[] };

// The machine as it was when the page was last open, if there is one
const loadSavedMachine = (): SavedMachine | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(MACHINE_STORAGE_KEY) ?? "");
    if (
      Array.isArray(saved?.nodes) &&
      Array.isArray(saved?.edges) &&
      Array.isArray(saved?.tape)
    ) {
      return saved;
    }
  } catch {}
  return null;
};

const startNodeId = (nodes: Node[]) =>
  nodes.find((node) => node.data.isStart)?.id ?? "1";

type CanvasSnapshot = { nodes: Node[]; edges: Edge[] };
// The rule (row) of an edge that the last step followed
export type ActiveTransition = {
  edgeId: string;
  ruleIndex: number;
  // Whether the rule's write and move have happened yet
  applied: boolean;
};
type RunState = {
  tape: string[];
  tapeHead: number;
  // Only one of the active node and the active transition is set at a time
  activeNodeId: string | null;
  transition: ActiveTransition | null;
};

export const useMachine = () => {
  const [isEditingTape, setIsEditingTape] = useState<boolean>(false);
  const [saved] = useState(loadSavedMachine);
  const [tape, setTape] = useState<string[]>(saved?.tape ?? initialTape);
  const [tapeHead, setTapeHead] = useState<number>(0);
  const [nodes, setNodes] = useState<Node[]>(saved?.nodes ?? initialNodes);
  const [edges, setEdges] = useState<Edge[]>(saved?.edges ?? initialEdges);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(() =>
    startNodeId(saved?.nodes ?? initialNodes)
  );
  const { screenToFlowPosition } = useReactFlow();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showSaveMachineDialog, setShowSaveMachineDialog] =
    useState<boolean>(false);
  const [showLoadMachinesDialog, setShowLoadMachinesDialog] =
    useState<boolean>(false);
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [showSaveTapeDialog, setShowSaveTapeDialog] = useState<boolean>(false);
  const [showLoadTapesDialog, setShowLoadTapesDialog] =
    useState<boolean>(false);
  const [showEncodingDialog, setShowEncodingDialog] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(100);
  const [showSettingsDialog, setShowSettingsDialog] =
    useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Incremented on every play/pause/reset so a stale run loop knows to stop
  const runIdRef = useRef<number>(0);
  // Lets a speed change apply to a run that's already in progress
  const speedRef = useRef<number>(speed);
  speedRef.current = speed;

  // Canvas undo/redo: snapshots of nodes + edges taken just before a change
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  const pastRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);
  const snapshotLockRef = useRef(false);

  // Several changes in one tick (e.g. a node and its edges being deleted)
  // count as a single undo step
  const takeSnapshot = useCallback(() => {
    if (snapshotLockRef.current) return;
    snapshotLockRef.current = true;
    setTimeout(() => (snapshotLockRef.current = false), 0);
    pastRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
    futureRef.current = [];
  }, []);

  const restoreSnapshot = (snapshot: CanvasSnapshot) => {
    nodesRef.current = snapshot.nodes;
    edgesRef.current = snapshot.edges;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
  };

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    });
    restoreSnapshot(previous);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    restoreSnapshot(next);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Leave native undo alone while typing in a field
      if (
        target.tagName == "INPUT" ||
        target.tagName == "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key == "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (key == "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Keep the machine across refreshes (debounced, as dragging changes it a lot)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          MACHINE_STORAGE_KEY,
          JSON.stringify({
            nodes: nodes.map(({ selected, dragging, ...node }) => node),
            edges: edges.map(({ selected, ...edge }) => edge),
            tape,
          })
        );
      } catch {}
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nodes, edges, tape]);

  const handleInitDB = async () => {
    await initDB();
  };

  useEffect(() => {
    handleInitDB();
  }, []);

  const isStructuralChange = (type: string) =>
    type == "add" || type == "remove" || type == "replace";

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (changes.some((c) => isStructuralChange(c.type))) takeSnapshot();
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes, takeSnapshot]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (changes.some((c) => isStructuralChange(c.type))) takeSnapshot();
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges, takeSnapshot]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      takeSnapshot();
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
      );
    },
    [setEdges, takeSnapshot]
  );

  const addNodeAt = useCallback(
    (clientX: number, clientY: number) => {
      const position = screenToFlowPosition({
        x: clientX - 32,
        y: clientY - 32,
      });
      takeSnapshot();
      setNodes((nds) => [
        ...nds,
        {
          id: getId(nds),
          type: "turing",
          data: { isStart: false, isFinal: false },
          position,
        },
      ]);
    },
    [screenToFlowPosition, takeSnapshot]
  );

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

  const historyRef = useRef<RunState[]>([]);
  const [activeTransition, setActiveTransition] =
    useState<ActiveTransition | null>(null);
  const [stepHistoryLength, setStepHistoryLength] = useState<number>(0);

  const pushStepHistory = (state: RunState) => {
    historyRef.current.push(state);
    setStepHistoryLength(historyRef.current.length);
  };

  const clearStepHistory = () => {
    historyRef.current = [];
    setStepHistoryLength(0);
  };

  const applyRunState = (state: RunState) => {
    setTape(state.tape);
    setTapeHead(state.tapeHead);
    setActiveNodeId(state.activeNodeId);
    setActiveTransition(state.transition);
  };

  // Runs one transition. Returns null when the machine can't go any further.
  const computeNextState = (
    state: RunState,
    silent = false
  ): RunState | null => {
    const startStates = nodes.filter((node) => node.data.isStart);

    if (startStates.length != 1) {
      if (!silent) console.error("There should be only 1 start state");
      return null;
    }

    const { transition } = state;
    const records = createEdgesToNodesRecord(edges, nodes);

    // At a node: pick the edge to follow
    if (!transition) {
      const currentNode = nodes.find((node) => node.id == state.activeNodeId);
      if (!currentNode || currentNode.data.isFinal) return null;

      const rule = (records[currentNode.id] ?? []).find(
        ({ readLetter }) => readLetter == state.tape[state.tapeHead]
      );

      if (!rule) {
        if (!silent)
          console.error("Couldn't find current symbol leaving this node");
        return null;
      }

      return {
        ...state,
        activeNodeId: null,
        transition: {
          edgeId: rule.edgeId,
          ruleIndex: rule.ruleIndex,
          applied: false,
        },
      };
    }

    const rule = Object.values(records)
      .flat()
      .find(
        (r) =>
          r.edgeId == transition.edgeId && r.ruleIndex == transition.ruleIndex
      );
    if (!rule) return null;

    // On the edge: take its action
    if (!transition.applied) {
      const newTape = [...state.tape];
      if (rule.writeLetter) {
        newTape[state.tapeHead] = rule.writeLetter;
      }

      let newTapeHead = state.tapeHead;
      if (rule.direction == "<") {
        if (newTapeHead == 0) {
          if (!silent)
            console.error(
              "Can't move left from leftmost symbol. You fell off the tape!"
            );
          return null;
        }
        newTapeHead--;
      } else if (rule.direction == ">") {
        newTapeHead++;
      }

      return {
        tape: newTape,
        tapeHead: newTapeHead,
        activeNodeId: null,
        transition: { ...transition, applied: true },
      };
    }

    // Action taken: arrive at the node the edge points to
    if (!rule.node) return null;
    return { ...state, activeNodeId: rule.node.id, transition: null };
  };

  const currentRunState = (): RunState => ({
    tape,
    tapeHead,
    activeNodeId,
    transition: activeTransition,
  });

  const canStepForward = useMemo(
    () => computeNextState(currentRunState(), true) !== null,
    [nodes, edges, tape, tapeHead, activeNodeId, activeTransition]
  );

  const pauseTape = () => {
    runIdRef.current++;
    setIsPlaying(false);
  };

  const playTape = async () => {
    if (isPlaying) {
      pauseTape();
      return;
    }

    const runId = ++runIdRef.current;
    setIsPlaying(true);

    let state = currentRunState();
    while (true) {
      const next = computeNextState(state);
      if (!next) break;

      pushStepHistory(state);
      applyRunState(next);
      await new Promise((resolve) =>
        setTimeout(resolve, BASE_INTERVAL / (speedRef.current / 100))
      );

      // Paused or reset while waiting; state already holds the latest step
      if (runIdRef.current != runId) return;
      state = next;
    }

    setIsPlaying(false);
  };

  const stepForward = () => {
    pauseTape();
    const state = currentRunState();
    const next = computeNextState(state);
    if (!next) return;
    pushStepHistory(state);
    applyRunState(next);
  };

  const stepBack = () => {
    pauseTape();
    const previous = historyRef.current.pop();
    if (!previous) return;
    setStepHistoryLength(historyRef.current.length);
    applyRunState(previous);
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
    pauseTape();
    clearStepHistory();
    setActiveTransition(null);
    setTapeHead(0);
    const startStates = nodes.filter((node) => node.data.isStart);
    if (startStates.length == 1) {
      setActiveNodeId(startStates[0].id);
    }
  };

  // Names are unique per kind, and can't be the built-in example's name either
  const checkName = async (
    store: Stores,
    name: string,
    reserved: string
  ): Promise<string | null> => {
    if (!name) return "Enter a name";
    if (name == reserved || (await nameExists(store, name))) {
      return "That name is already taken";
    }
    return null;
  };

  // The save handlers resolve to an error message, or null once saved
  const saveMachineHandler = async (name: string) => {
    const trimmed = name.trim();
    const error = await checkName(
      Stores.Machines,
      trimmed,
      EXAMPLE_MACHINE_NAME
    );
    if (error) return error;
    await saveMachine(trimmed, nodes, edges);
    setShowSaveMachineDialog(false);
    return null;
  };

  const saveTapeHandler = async (name: string) => {
    const trimmed = name.trim();
    const error = await checkName(Stores.Tapes, trimmed, EXAMPLE_TAPE_NAME);
    if (error) return error;
    await saveTape(trimmed, tape);
    setShowSaveTapeDialog(false);
    return null;
  };

  const loadTapes = async () => {
    const dbTapes = await getStoreData<Tape>(Stores.Tapes);
    setTapes([{ id: EXAMPLE_TAPE_NAME, contents: initialTape }, ...dbTapes]);
    setShowLoadTapesDialog(true);
  };

  const loadMachines = async () => {
    const dbMachines = await getStoreData<Machine>(Stores.Machines);
    setMachines([
      { id: EXAMPLE_MACHINE_NAME, nodes: initialNodes, edges: initialEdges },
      ...dbMachines,
    ]);
    setShowLoadMachinesDialog(true);
  };

  const deleteTape = async (id: string) => {
    if (await deleteData(Stores.Tapes, id)) {
      setTapes((current) => current.filter((t) => t.id != id));
    }
  };

  const renameTape = async (oldId: string, newId: string) => {
    if (newId == EXAMPLE_TAPE_NAME) return false;
    const renamed = await renameData(Stores.Tapes, oldId, newId);
    if (renamed) {
      setTapes((current) =>
        current.map((t) => (t.id == oldId ? { ...t, id: newId } : t))
      );
    }
    return renamed;
  };

  const deleteMachine = async (id: string) => {
    if (await deleteData(Stores.Machines, id)) {
      setMachines((current) => current.filter((m) => m.id != id));
    }
  };

  const renameMachine = async (oldId: string, newId: string) => {
    if (newId == EXAMPLE_MACHINE_NAME) return false;
    const renamed = await renameData(Stores.Machines, oldId, newId);
    if (renamed) {
      setMachines((current) =>
        current.map((m) => (m.id == oldId ? { ...m, id: newId } : m))
      );
    }
    return renamed;
  };

  const clearTape = () => {
    pauseTape();
    clearStepHistory();
    setActiveTransition(null);
    setTape(new Array(tape.length).fill("_"));
  };

  // Back to the start of a run, on the start node of a freshly swapped-in machine
  const resetRunFor = (machineNodes: Node[]) => {
    setActiveNodeId(startNodeId(machineNodes));
    setTapeHead(0);
    pauseTape();
    clearStepHistory();
    setActiveTransition(null);
  };

  const loadMachine = (nodes: Node[], edges: Edge[]) => {
    takeSnapshot();
    setNodes(nodes);
    setEdges(edges);
    resetRunFor(nodes);
  };

  const clearMachine = () => {
    takeSnapshot();
    setNodes(blankNodes);
    setEdges([]);
    resetRunFor(blankNodes);
  };

  const createEncoding = (encoding: string) => {
    const [nodes, edges] = convertABEncodingToDG(encoding);
    takeSnapshot();
    setNodes(nodes);
    setEdges(edges);
    resetRunFor(nodes);
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
    activeNodeId,
    setActiveNodeId,
    activeTransition,
    // react flow callbacks
    onNodesChange,
    onEdgesChange,
    onConnect,
    // handlers
    handleSymbolClick,
    playTape,
    isPlaying,
    stepForward,
    stepBack,
    canStepForward,
    canStepBack: stepHistoryLength > 0,
    undo,
    redo,
    // One undo step per drag: snapshot as the drag starts, before anything moves
    onNodeDragStart: () => takeSnapshot(),
    loadMachine,
    clearMachine,
    setTapeValue,
    loadMachines,
    machines,
    showLoadMachinesDialog,
    setShowLoadMachinesDialog,
    loadTapes,
    saveMachineHandler,
    resetTape,
    tapes,
    saveTapeHandler,
    showLoadTapesDialog,
    setShowLoadTapesDialog,
    showSaveMachineDialog,
    setShowSaveMachineDialog,
    showSaveTapeDialog,
    setShowSaveTapeDialog,
    saveEdgeToNodeDict,
    clearTape,
    deleteTape,
    renameTape,
    deleteMachine,
    renameMachine,
    addNodeAt,
    showSettingsDialog,
    setShowSettingsDialog,
    isEditingTape,
    setIsEditingTape,
    showEncodingDialog,
    setShowEncodingDialog,
    createEncoding,
  };
};
