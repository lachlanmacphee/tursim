import {
  Handle,
  Node,
  NodeProps,
  Position,
  useConnection,
  useReactFlow,
} from "@xyflow/react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TuringNode = Node<
  {
    isStart: boolean;
    isFinal: boolean;
    isActive: boolean;
  },
  "turing"
>;

export const NODE_DRAG_HANDLE = ".node-drag-handle";

export function TuringNode({ id, data }: NodeProps<TuringNode>) {
  const connection = useConnection();
  const { deleteElements } = useReactFlow();
  const isConnectTarget =
    connection.inProgress && connection.toNode?.id == id;

  return (
    <div className="group relative isolate w-16 h-16 rounded-full animate-node-in">
      {/* Coloured body. The whole circle (outside the centre) is the connect area. */}
      <div
        className={`absolute inset-0 rounded-full ${
          data.isActive || isConnectTarget ? "ring-2 ring-inset ring-ring" : ""
        } ${
          data.isFinal
            ? "bg-destructive"
            : data.isStart
            ? "bg-green-600"
            : "bg-secondary"
        }`}
      />
      {!connection.inProgress && (
        <Handle
          className="absolute top-0 left-0 w-16 h-16 rounded-full transform-none border-none opacity-0"
          position={Position.Right}
          type="source"
        />
      )}
      <Handle
        className="absolute top-0 left-0 w-16 h-16 rounded-full transform-none border-none opacity-0"
        position={Position.Left}
        type="target"
        isConnectableStart={false}
      />
      {/* Centre circle: drag to move the node */}
      <div
        className={`node-drag-handle absolute inset-3.5 z-10 flex items-center justify-center rounded-full font-bold cursor-grab active:cursor-grabbing ${
          data.isFinal
            ? "text-destructive-foreground"
            : data.isStart
            ? "text-white"
            : "text-secondary-foreground"
        }`}
      >
        {id}
      </div>
      {!connection.inProgress && !data.isStart && !data.isFinal && (
        <div className="absolute top-full left-1/2 -z-10 -mt-1 hidden -translate-x-1/2 group-hover:flex">
          <Button
            variant="destructive"
            aria-label="Delete node"
            className="nodrag h-3 w-8 rounded-t-none rounded-b-full px-0 pb-0 pt-1"
            onClick={() => deleteElements({ nodes: [{ id }] })}
          >
            <XIcon className="h-2 w-2" strokeWidth={3} />
          </Button>
        </div>
      )}
    </div>
  );
}
