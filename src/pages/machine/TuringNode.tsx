import {
  Handle,
  Node,
  NodeProps,
  Position,
  useConnection,
} from "@xyflow/react";

export type TuringNode = Node<
  {
    isStart: boolean;
    isFinal: boolean;
    isActive: boolean;
    activeTool: string;
    isHovered: boolean;
  },
  "turing"
>;

export function TuringNode({ id, data }: NodeProps<TuringNode>) {
  const connection = useConnection();
  const isAddEdgeTool = data.activeTool == "addEdge";
  const isPotentialForDeletion = data.isHovered && data.activeTool == "delete";

  return (
    <div
      className={`w-16 h-16 relative overflow-hidden rounded-full flex justify-center items-center font-bold ${
        data.isFinal
          ? "bg-destructive"
          : data.isStart
          ? "bg-primary"
          : "bg-secondary"
      } ${data.isActive ? "drop-shadow-glow" : ""} ${
        isPotentialForDeletion ? "opacity-50" : ""
      }`}
    >
      {!connection.inProgress && (
        <Handle
          className={`w-16 h-16 ${
            !isAddEdgeTool && "-z-10"
          } absolute top-0 left-0 rounded-none transform-none border-none opacity-0`}
          position={Position.Right}
          type="source"
        />
      )}
      <Handle
        className={`w-16 h-16 ${
          !isAddEdgeTool && "-z-10"
        } absolute top-0 left-0 rounded-none transform-none border-none opacity-0`}
        position={Position.Left}
        type="target"
        isConnectableStart={false}
      />
      <div className="w-16 h-16 flex justify-center items-center cursor-pointer">
        <span
          className={
            data.isFinal
              ? "text-destructive-foreground"
              : data.isStart
              ? "text-primary-foreground"
              : "text-secondary-foreground"
          }
        >
          {id}
        </span>
      </div>
    </div>
  );
}
