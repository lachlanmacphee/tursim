import {
  Handle,
  Node,
  NodeProps,
  Position,
  useConnection,
} from "@xyflow/react";

import "./TuringNodeStyles.css";
import { useTheme } from "@/hooks/useTheme";

export type TuringNode = Node<
  { isStart: boolean; isFinal: boolean; isActive: boolean },
  "turing"
>;

function getBackgroundColour(
  isDark: boolean,
  isStart: boolean,
  isFinal: boolean
) {
  if (isDark)
    return isFinal ? "indianred" : isStart ? "mediumseagreen" : "midnightblue";
  return isFinal ? "lightcoral" : isStart ? "lightseagreen" : "lightskyblue";
}

export function TuringNode({ id, data }: NodeProps<TuringNode>) {
  const connection = useConnection();
  const { theme } = useTheme();
  const isDark =
    theme == "dark" ||
    (theme == "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches == true);

  return (
    <div className="customNode">
      <div
        className="customNodeBody"
        style={{
          backgroundColor: getBackgroundColour(
            isDark,
            data.isStart,
            data.isFinal
          ),
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
