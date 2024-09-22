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
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  return (
    <div className="customNode">
      <div
        className="customNodeBody"
        style={{
          backgroundColor: data.isFinal
            ? "lightcoral"
            : data.isStart
            ? "lightseagreen"
            : "lightskyblue",
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
        <span className="text-white">{id}</span>
      </div>
    </div>
  );
}
