import {
  CircleIcon,
  DownloadIcon,
  HardDriveUploadIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
  SplineIcon,
  TrashIcon,
} from "lucide-react";

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

export default function TuringMachine() {
  const { theme } = useTheme();
  const machine = useMachine();
  const colorMode = useMemo(
    () => (theme == "system" ? "system" : theme == "light" ? "light" : "dark"),
    [theme]
  );

  return (
    <div className="relative h-full">
      <div className="absolute left-4 top-4 h-full z-10 w-20">
        <ScrollArea className="h-5/6 border bg-background gap-2 py-3 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <span className="font-extralight text-sm">DRAW</span>
            <ToolButton
              name="addMoveNode"
              tooltip="Add/Move Node"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <CircleIcon className="w-14 h-14" />
            </ToolButton>
            <ToolButton
              name="addEdge"
              tooltip="Add Edge"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SplineIcon className="w-14 h-14" />
            </ToolButton>
            <ToolButton
              name="delete"
              tooltip="Delete"
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <TrashIcon className="w-14 h-14" />
            </ToolButton>
            <Separator className="w-14 mt-2" />
            <span className="font-extralight text-sm">MACHINE</span>
            <ToolButton
              name="saveMachine"
              tooltip="Save Machine"
              onClick={machine.saveMachine}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadMachine"
              tooltip="Load Machine"
              onClick={machine.loadMachine}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <HardDriveUploadIcon />
            </ToolButton>
            <Separator className="w-14 mt-2" />
            <span className="font-extralight text-sm">TEST</span>
            <ToolButton
              name="saveEdgeToNodeDict"
              tooltip="Download"
              onClick={machine.saveEdgeToNodeDict}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <DownloadIcon />
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
              onClick={machine.saveTape}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <SaveIcon />
            </ToolButton>
            <ToolButton
              name="loadTape"
              tooltip="Load Tape"
              onClick={machine.loadTape}
              activeTool={machine.activeTool}
              setActiveTool={machine.setActiveTool}
            >
              <HardDriveUploadIcon />
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
