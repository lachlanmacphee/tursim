import {
  ChevronUpIcon,
  CirclePlusIcon,
  DownloadIcon,
  FolderOpenIcon,
  PlayIcon,
  SaveIcon,
  Undo2Icon,
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
            onClick={machine.addNode}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <CirclePlusIcon className="w-10 h-10" />
          </ToolButton>
          <Separator className="w-14 mt-2" />
          <span className="font-extralight text-sm">TAPE</span>
          <ToolButton
            name="playTape"
            onClick={machine.playTape}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <PlayIcon className="w-10 h-10" />
          </ToolButton>
          <ToolButton
            name="changeSpeed"
            onClick={machine.changeSpeed}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <span>{machine.speed}%</span>
          </ToolButton>
          <ToolButton
            name="resetTapeHead"
            onClick={machine.resetTape}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <Undo2Icon className="w-10 h-10" />
          </ToolButton>
          <ToolButton
            name="saveTape"
            onClick={machine.saveTape}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <SaveIcon className="w-10 h-10" />
          </ToolButton>
          <ToolButton
            name="loadTape"
            onClick={machine.loadTape}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <FolderOpenIcon className="w-10 h-10" />
          </ToolButton>
          <Separator className="w-14 mt-2" />
          <span className="font-extralight text-sm">MACHINE</span>
          <ToolButton
            name="saveMachine"
            onClick={machine.saveMachine}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <SaveIcon className="w-10 h-10" />
          </ToolButton>
          <ToolButton
            name="loadMachine"
            onClick={machine.loadMachine}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <FolderOpenIcon className="w-10 h-10" />
          </ToolButton>
          <Separator className="w-14 mt-2" />
          <span className="font-extralight text-sm">TEST</span>
          <ToolButton
            name="saveEdgeToNodeDict"
            onClick={machine.saveEdgeToNodeDict}
            activeTool={machine.activeTool}
            setActiveTool={machine.setActiveTool}
          >
            <DownloadIcon className="w-10 h-10" />
          </ToolButton>
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
