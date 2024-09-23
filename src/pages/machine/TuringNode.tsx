import {
  Handle,
  Node,
  NodeProps,
  Position,
  useConnection,
} from "@xyflow/react";

import "./TuringNodeStyles.css";

export type TuringNode = Node<
  { isStart: boolean; isFinal: boolean; isActive: boolean },
  "turing"
>;

export function TuringNode({ id, data }: NodeProps<TuringNode>) {
  const connection = useConnection();

  return (
    <div className="customNode">
      <div
        className={`w-16 h-16 relative overflow-hidden rounded-full flex justify-center items-center font-bold ${
          data.isFinal
            ? "bg-destructive"
            : data.isStart
            ? "bg-primary"
            : "bg-secondary"
        }`}
        style={{
          border: data.isActive ? "4px solid lightpink" : "none",
        }}
      >
        {!connection.inProgress && (
          <Handle
            className="customHandle"
            position={Position.Right}
            type="source"
          />
        )}
        <Handle
          className="customHandle"
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
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
