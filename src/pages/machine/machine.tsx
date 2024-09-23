import {
  ChevronUpIcon,
  CirclePlusIcon,
  DownloadIcon,
  HardDriveUploadIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
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
    <div className="flex-grow flex flex-col p-4 gap-4 container">
      <div className="border grid grid-cols-[80px,1fr] flex-grow rounded-lg shadow">
        <div className="border-r p-2 flex flex-col items-center gap-2">
          <span className="font-extralight text-sm">DRAW</span>
          <ToolButton
            name="addNode"
            tooltip="Add Node"
            onClick={machine.addNode}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <CirclePlusIcon className="w-14 h-14" />
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
          <Separator className="w-14 mt-2" />
        </div>
        <div className="h-full">
          <ReactFlow
            nodes={machine.nodes.map((node) => ({
              ...node,
              data: { ...node.data, isActive: machine.activeNodeId == node.id },
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
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <ScrollArea className="w-full border h-32 flex gap-2 shadow p-2">
        <div className="flex gap-1 p-1">
          {machine.tape.map((_, idx) => {
            if (idx == machine.tapeHead) {
              return (
                <div key={idx} className="flex flex-col items-center">
                  <Input
                    className="h-16 w-16 text-center text-3xl"
                    maxLength={1}
                    value={machine.tape[idx]}
                    onChange={(e) => machine.setTapeValue(e, idx)}
                    onClick={machine.handleSymbolClick}
                  />
                  {idx == machine.tapeHead && (
                    <ChevronUpIcon className="w-8 h-8" />
                  )}
                </div>
              );
            }
            return (
              <Input
                key={idx}
                className="h-16 w-16 text-center text-3xl"
                maxLength={1}
                value={machine.tape[idx]}
                onChange={(e) => machine.setTapeValue(e, idx)}
                onClick={machine.handleSymbolClick}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
