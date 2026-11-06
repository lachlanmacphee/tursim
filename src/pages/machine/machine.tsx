import {
  ALargeSmallIcon,
  DownloadIcon,
  EraserIcon,
  HardDriveUploadIcon,
  RotateCcwIcon,
  SaveIcon,
  SettingsIcon,
  StepBackIcon,
  StepForwardIcon,
} from "lucide-react";


import { ReactFlow, Background, Controls, Viewport } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ToolButton } from "./ToolButton";
import { Input } from "@/components/ui/input";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useMachine } from "./useMachine";
import {
  edgeTypes,
  EXAMPLE_MACHINE_NAME,
  EXAMPLE_TAPE_NAME,
  fitViewOptions,
  defaultEdgeOptions,
  nodeTypes,
} from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SaveDialog } from "./SaveDialog";
import { EncodingDialog } from "./EncodingDialog";
import { SettingsDialog } from "./SettingsDialog";
import { LoadDialog } from "./LoadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NODE_DRAG_HANDLE } from "./TuringNode";

// Header + toolbar spacing + the one-column toolbar content, in px
const SINGLE_COLUMN_MIN_HEIGHT = 1040;
// The progress ring only appears after this delay, so click-and-drag panning
// never flashes it; the node is created LONG_PRESS_MS after the ring appears
const LONG_PRESS_DELAY_MS = 150;
const LONG_PRESS_MS = 300;
const COLUMNS_STORAGE_KEY = "tursim:toolbar-two-columns";
const VIEWPORT_STORAGE_KEY = "tursim:viewport";

const loadSavedViewport = (): Viewport | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEWPORT_STORAGE_KEY) ?? "");
    if (
      Number.isFinite(saved?.x) &&
      Number.isFinite(saved?.y) &&
      Number.isFinite(saved?.zoom)
    ) {
      return saved;
    }
  } catch {}
  return null;
};
const LONG_PRESS_MOVE_TOLERANCE = 6;

function PlayPauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="2 5 12 12 2 19 2 5" />
      <line x1="17" y1="5" x2="17" y2="19" />
      <line x1="22" y1="5" x2="22" y2="19" />
    </svg>
  );
}

export default function TuringMachine() {
  const { theme } = useTheme();
  const machine = useMachine();
  // Reopen where the canvas was left, instead of fitting to the whole machine
  const [savedViewport] = useState(loadSavedViewport);
  // Use the saved column state if there is one, otherwise go by screen height
  const [twoColumns, setTwoColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (saved == "true") return true;
      if (saved == "false") return false;
    } catch {}
    return window.innerHeight < SINGLE_COLUMN_MIN_HEIGHT;
  });

  // Only called from the rail, so the calculated default is never persisted
  const toggleColumns = () => {
    const next = !twoColumns;
    setTwoColumns(next);
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, String(next));
    } catch {}
  };
  // What the clear confirmation is about. The target is kept after closing so
  // the dialog's text doesn't change while it fades out.
  const [clearTarget, setClearTarget] = useState<"tape" | "machine">("tape");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmClear = (target: "tape" | "machine") => {
    setClearTarget(target);
    setConfirmOpen(true);
  };
  const [press, setPress] = useState<{ x: number; y: number } | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout>>();
  const createTimer = useRef<ReturnType<typeof setTimeout>>();

  const cancelPress = () => {
    clearTimeout(showTimer.current);
    clearTimeout(createTimer.current);
    pressStart.current = null;
    setPress(null);
  };

  // Holding the empty canvas adds a node there
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!(e.target as HTMLElement).classList.contains("react-flow__pane"))
      return;
    const { clientX, clientY } = e;
    cancelPress();
    pressStart.current = { x: clientX, y: clientY };
    showTimer.current = setTimeout(
      () => setPress({ x: clientX, y: clientY }),
      LONG_PRESS_DELAY_MS
    );
    createTimer.current = setTimeout(() => {
      machine.addNodeAt(clientX, clientY);
      cancelPress();
    }, LONG_PRESS_DELAY_MS + LONG_PRESS_MS);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pressStart.current;
    if (!start) return;
    if (
      Math.hypot(e.clientX - start.x, e.clientY - start.y) >
      LONG_PRESS_MOVE_TOLERANCE
    ) {
      cancelPress();
    }
  };
  // Toolbars scroll without a visible scrollbar or overscroll bounce
  const scrollClass =
    "h-full overflow-y-auto overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  const labelClass = "col-span-full font-extralight text-sm";
  // In two-column mode a lone button spans both columns
  const wideClass = twoColumns ? "col-span-full w-full" : "";
  const separatorClass = `col-span-full mt-2 ${twoColumns ? "w-full" : "w-14"}`;
  const colorMode = useMemo(
    () => (theme == "system" ? "system" : theme == "light" ? "light" : "dark"),
    [theme],
  );

  return (
    <div className="flex h-full">
      <LoadDialog
        title="Load Machine"
        description="Choose a machine to load into the canvas, or rename or delete saved machines."
        emptyMessage="No saved machines yet."
        items={machine.machines}
        open={machine.showLoadMachinesDialog}
        onOpenChange={machine.setShowLoadMachinesDialog}
        onLoad={(id) => {
          const loaded = machine.machines.find((m) => m.id == id);
          if (!loaded) return;
          // Copies, so editing a loaded example never changes the example itself
          machine.loadMachine(
            structuredClone(loaded.nodes),
            structuredClone(loaded.edges)
          );
          machine.setShowLoadMachinesDialog(false);
        }}
        onDelete={machine.deleteMachine}
        onRename={machine.renameMachine}
        lockedIds={[EXAMPLE_MACHINE_NAME]}
      />
      <LoadDialog
        title="Load Tape"
        description="Choose a tape to load, or rename or delete saved tapes."
        emptyMessage="No saved tapes yet."
        items={machine.tapes}
        open={machine.showLoadTapesDialog}
        onOpenChange={machine.setShowLoadTapesDialog}
        onLoad={(id) => {
          const loaded = machine.tapes.find((t) => t.id == id);
          if (!loaded) return;
          machine.setTape([...loaded.contents]);
          machine.setShowLoadTapesDialog(false);
        }}
        onDelete={machine.deleteTape}
        onRename={machine.renameTape}
        lockedIds={[EXAMPLE_TAPE_NAME]}
      />
      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the {clearTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              {clearTarget == "machine"
                ? "This removes every node and edge, leaving just a start and an end node. You can undo it afterwards with Cmd/Ctrl+Z."
                : "This sets every cell on the tape back to a blank. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                clearTarget == "machine"
                  ? machine.clearMachine()
                  : machine.clearTape()
              }
            >
              Clear {clearTarget}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SettingsDialog
        open={machine.showSettingsDialog}
        onOpenChange={machine.setShowSettingsDialog}
        speed={machine.speed}
        setSpeed={machine.setSpeed}
      />
      <EncodingDialog
        open={machine.showEncodingDialog}
        onOpenChange={machine.setShowEncodingDialog}
        createHandler={machine.createEncoding}
      />
      {/* Save Machine Dialog */}
      <SaveDialog
        item="Machine"
        open={machine.showSaveMachineDialog}
        onOpenChange={machine.setShowSaveMachineDialog}
        saveHandler={machine.saveMachineHandler}
      />
      {/* Save Tape Dialog */}
      <SaveDialog
        item="Tape"
        open={machine.showSaveTapeDialog}
        onOpenChange={machine.setShowSaveTapeDialog}
        saveHandler={machine.saveTapeHandler}
      />
      <div
        className={`relative z-10 h-full shrink-0 border-r bg-background transition-[width] ${
          twoColumns ? "w-36" : "w-20"
        }`}
      >
        <div className={scrollClass}>
          <div
            className={`grid justify-items-center gap-2 py-3 ${
              twoColumns
                ? "grid-cols-[repeat(2,3.5rem)] justify-center"
                : "grid-cols-1"
            }`}
          >
            <span className={labelClass}>RUN</span>
            <ToolButton
              name="playTape"
              tooltip="Play/Pause"
              onClick={machine.playTape}
            >
              <PlayPauseIcon />
            </ToolButton>
            <ToolButton
              name="resetTapeHead"
              tooltip="Restart"
              onClick={machine.resetTape}
            >
              <RotateCcwIcon />
            </ToolButton>
            <ToolButton
              name="stepBack"
              tooltip="Step Back"
              onClick={machine.stepBack}
              disabled={!machine.canStepBack}
            >
              <StepBackIcon />
            </ToolButton>
            <ToolButton
              name="stepForward"
              tooltip="Step Forward"
              onClick={machine.stepForward}
              disabled={!machine.canStepForward}
            >
              <StepForwardIcon />
            </ToolButton>
            <ToolButton
              name="settings"
              className={wideClass}
              tooltip="Settings"
              onClick={() => machine.setShowSettingsDialog(true)}
            >
              <SettingsIcon />
            </ToolButton>
            <Separator className={separatorClass} />
            <span className={labelClass}>TAPE</span>
            <ToolButton
              name="saveTape"
              tooltip="Save Tape"
              onClick={() => machine.setShowSaveTapeDialog(true)}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadTape"
              tooltip="Load Tape"
              onClick={machine.loadTapes}
            >
              <HardDriveUploadIcon />
            </ToolButton>
            <ToolButton
              name="clearTape"
              className={wideClass}
              tooltip="Clear Tape"
              onClick={() => confirmClear("tape")}
            >
              <EraserIcon />
            </ToolButton>
            <Separator className={separatorClass} />
            <span className={labelClass}>MACHINE</span>
            <ToolButton
              name="saveMachine"
              tooltip="Save Machine"
              onClick={() => machine.setShowSaveMachineDialog(true)}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadMachine"
              tooltip="Load Machine"
              onClick={machine.loadMachines}
            >
              <HardDriveUploadIcon />
            </ToolButton>
            <ToolButton
              name="clearMachine"
              className={wideClass}
              tooltip="Clear Machine"
              onClick={() => confirmClear("machine")}
            >
              <EraserIcon />
            </ToolButton>
            <Separator className={separatorClass} />
            <span className={labelClass}>MISC</span>
            <ToolButton
              name="createMachineFromEncoding"
              tooltip="Import from Encoding"
              onClick={() => machine.setShowEncodingDialog(true)}
            >
              <ALargeSmallIcon />
            </ToolButton>
            <ToolButton
              name="saveEdgeToNodeDict"
              tooltip="Download"
              onClick={machine.saveEdgeToNodeDict}
            >
              <DownloadIcon />
            </ToolButton>
          </div>
        </div>
        <button
          type="button"
          aria-label={twoColumns ? "Use one column" : "Use two columns"}
          title={twoColumns ? "Use one column" : "Use two columns"}
          onClick={toggleColumns}
          className="group absolute -right-2 top-0 bottom-0 flex w-4 cursor-pointer justify-center"
        >
          <span className="h-full w-px bg-transparent transition-colors group-hover:bg-primary" />
        </button>
      </div>
      <div
        data-tour="canvas"
        className="relative h-full min-w-0 flex-1"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
      >
        {press && (
          <div
            className="pointer-events-none fixed z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2"
            style={{ left: press.x, top: press.y }}
          >
            <div className="animate-ghost-in absolute inset-2 rounded-full border bg-secondary" />
            <svg
              viewBox="0 0 56 56"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="150.8"
                className="animate-ring-fill stroke-primary"
              />
            </svg>
          </div>
        )}
        <ReactFlow
          nodes={machine.nodes.map((node) => ({
            ...node,
            dragHandle: NODE_DRAG_HANDLE,
            data: {
              ...node.data,
              isActive: machine.activeNodeId == node.id,
            },
          }))}
          nodeTypes={nodeTypes}
          edges={machine.edges.map((edge) => ({
            ...edge,
            data: {
              ...edge.data,
              activeRule:
                machine.activeTransition?.edgeId == edge.id
                  ? machine.activeTransition.ruleIndex
                  : null,
              ruleApplied:
                machine.activeTransition?.edgeId == edge.id &&
                machine.activeTransition.applied,
            },
          }))}
          edgeTypes={edgeTypes}
          onNodesChange={machine.onNodesChange}
          onEdgesChange={machine.onEdgesChange}
          onConnect={machine.onConnect}
          onNodeDragStart={machine.onNodeDragStart}
          fitView={!savedViewport}
          fitViewOptions={fitViewOptions}
          defaultViewport={savedViewport ?? undefined}
          onMoveEnd={(_, viewport) => {
            try {
              localStorage.setItem(
                VIEWPORT_STORAGE_KEY,
                JSON.stringify(viewport)
              );
            } catch {}
          }}
          defaultEdgeOptions={defaultEdgeOptions}
          colorMode={colorMode}
          nodesConnectable
          // Start and end nodes can't be deleted, so no deleting with the keyboard
          deleteKeyCode={null}
        >
          <Background />
          <Controls position="bottom-center" orientation="horizontal" />
        </ReactFlow>
      </div>
      <div
        data-tour="tape"
        className="h-full w-20 shrink-0 border-l bg-background"
      >
        <div className="square-scrollbar h-full overflow-y-auto overscroll-none">
          <div className="flex flex-col">
            {machine.tape.map((_, idx) => (
              <Input
                key={idx}
                className={cn(
                  "relative h-14 w-full rounded-none border-x-0 text-center text-3xl focus-visible:z-10",
                  idx > 0 && "-mt-px",
                  idx == machine.tapeHead &&
                    "!shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                )}
                maxLength={1}
                value={machine.tape[idx]}
                onChange={(e) => machine.setTapeValue(e, idx)}
                onClick={machine.handleSymbolClick}
                onBlur={() => machine.setIsEditingTape(false)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
