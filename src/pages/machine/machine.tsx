import {
  ALargeSmallIcon,
  CircleIcon,
  DownloadIcon,
  HardDriveUploadIcon,
  PlayIcon,
  PointerIcon,
  RotateCcwIcon,
  SaveIcon,
  SplineIcon,
  TrashIcon,
} from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ToolButton } from "./ToolButton";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useMachine } from "./useMachine";
import {
  edgeTypes,
  fitViewOptions,
  defaultEdgeOptions,
  nodeTypes,
} from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SaveDialog } from "./SaveDialog";
import { convertABEncodingToDG } from "@/lib/encodings";

export default function TuringMachine() {
  const { theme } = useTheme();
  const machine = useMachine();
  const colorMode = useMemo(
    () => (theme == "system" ? "system" : theme == "light" ? "light" : "dark"),
    [theme]
  );

  return (
    <div className="relative h-full">
      {/* Load Machines Drawer */}
      <Drawer
        open={machine.showLoadMachinesDrawer}
        onOpenChange={machine.setShowLoadMachinesDrawer}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Load Machine</DrawerTitle>
              <DrawerDescription>
                Choose a machine to load into the canvas.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                {machine.machines.map((loadedMachine) => (
                  <Button
                    onClick={() => {
                      machine.setNodes(loadedMachine.nodes);
                      machine.setEdges(loadedMachine.edges);
                      machine.setShowLoadMachinesDrawer(false);
                    }}
                  >
                    {loadedMachine.id}
                  </Button>
                ))}
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      {/* Load Tapes Drawer */}
      <Drawer
        open={machine.showLoadTapesDrawer}
        onOpenChange={machine.setShowLoadTapesDrawer}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Load Tape</DrawerTitle>
              <DrawerDescription>Choose a tape to load.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                {machine.tapes.map((loadedTape) => (
                  <Button
                    onClick={() => {
                      machine.setTape(loadedTape.contents);
                      machine.setShowLoadTapesDrawer(false);
                    }}
                  >
                    {loadedTape.id}
                  </Button>
                ))}
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
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
      <div className="absolute left-4 top-4 h-full z-10 w-20">
        <ScrollArea className="h-5/6 border bg-background gap-2 py-3 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <span className="font-extralight text-sm">DRAW</span>
            <ToolButton
              name="select"
              tooltip="Select"
              keyboardShortcut="a"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <PointerIcon className="w-14 h-14" />
            </ToolButton>
            <ToolButton
              name="addMoveNode"
              tooltip="Add/Move Node"
              keyboardShortcut="s"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <CircleIcon className="w-14 h-14" />
            </ToolButton>
            <ToolButton
              name="addEdge"
              tooltip="Add Edge"
              keyboardShortcut="d"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SplineIcon className="w-14 h-14" />
            </ToolButton>
            <ToolButton
              name="delete"
              tooltip="Delete"
              keyboardShortcut="f"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <TrashIcon className="w-14 h-14" />
            </ToolButton>
            <Separator className="w-14 mt-2" />
            <span className="font-extralight text-sm">TAPE</span>
            <ToolButton
              name="playTape"
              tooltip="Play Tape"
              onClick={machine.playTape}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <PlayIcon />
            </ToolButton>
            <ToolButton
              name="changeSpeed"
              tooltip="Change Speed"
              onClick={machine.changeSpeed}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <span className="font-light text-sm">{machine.speed}%</span>
            </ToolButton>
            <ToolButton
              name="resetTapeHead"
              tooltip="Reset Tape"
              onClick={machine.resetTape}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <RotateCcwIcon />
            </ToolButton>
            <ToolButton
              name="saveTape"
              tooltip="Save Tape"
              onClick={() => machine.setShowSaveTapeDialog(true)}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadTape"
              tooltip="Load Tape"
              onClick={machine.loadTapes}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <HardDriveUploadIcon />
            </ToolButton>
            <Separator className="w-14 mt-2" />
            <span className="font-extralight text-sm">MACHINE</span>
            <ToolButton
              name="saveMachine"
              tooltip="Save Machine"
              onClick={() => machine.setShowSaveMachineDialog(true)}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadMachine"
              tooltip="Load Machine"
              onClick={machine.loadMachines}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <HardDriveUploadIcon />
            </ToolButton>
            <Separator className="w-14 mt-2" />
            <span className="font-extralight text-sm">MISC</span>
            <ToolButton
              name="createMachineFromEncoding"
              tooltip="TM from Encoding"
              onClick={() => {
                const exampleEncoding =
                  "abaaabaaaababaaabababbaaabaaaabababbaaaabaabbabab";
                const [nodes, edges] = convertABEncodingToDG(exampleEncoding);
                machine.setNodes(nodes);
                machine.setEdges(edges);
              }}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <ALargeSmallIcon />
            </ToolButton>
            <ToolButton
              name="saveEdgeToNodeDict"
              tooltip="Download"
              onClick={machine.saveEdgeToNodeDict}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <DownloadIcon />
            </ToolButton>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
      <div className="absolute right-4 top-4 h-full z-10 w-20">
        <ScrollArea className="h-5/6 border bg-background gap-2 py-3 rounded-lg">
          <div className="flex flex-col items-center gap-1">
            {machine.tape.map((_, idx) => (
              <Input
                key={idx}
                className={`h-14 w-14 text-center text-3xl ${
                  idx == machine.tapeHead && "border-primary border-2"
                }`}
                maxLength={1}
                value={machine.tape[idx]}
                onChange={(e) => machine.setTapeValue(e, idx)}
                onClick={machine.handleSymbolClick}
                onBlur={() => machine.setIsEditingTape(false)}
              />
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
      <div className="h-full w-full">
        <ReactFlow
          nodes={machine.nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              isActive: machine.activeNodeId == node.id,
              activeTool: machine.activeTool,
              isHovered: machine.hoveredNodeId == node.id,
            },
          }))}
          nodeTypes={nodeTypes}
          edges={machine.edges}
          edgeTypes={edgeTypes}
          onNodesChange={machine.onNodesChange}
          onEdgesChange={machine.onEdgesChange}
          onConnect={machine.onConnect}
          fitView
          fitViewOptions={fitViewOptions}
          defaultEdgeOptions={defaultEdgeOptions}
          colorMode={colorMode}
          onClick={machine.clickHandler}
          onNodeClick={machine.nodeClickHandler}
          onNodeMouseEnter={machine.nodeMouseEnterHandler}
          onNodeMouseLeave={machine.nodeMouseLeaveHandler}
          onEdgeClick={machine.edgeClickHandler}
          nodesConnectable={machine.activeTool == "addEdge"}
        >
          <Background />
          <Controls position="bottom-center" orientation="horizontal" />
        </ReactFlow>
      </div>
    </div>
  );
}
