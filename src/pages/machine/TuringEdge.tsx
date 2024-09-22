import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import { useState } from "react";

export function TuringEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const [edgeValue, setEdgeValue] = useState(data!.edgeValue as string);
  const { setEdges } = useReactFlow();

  const onChangeHandler = (value: string) => {
    setEdgeValue(value);
    setEdges((edges) => {
      const filteredEdges = edges.filter((edge) => edge.id !== id);
      const edgeToAddBack = edges.filter((edge) => edge.id === id)[0];
      edgeToAddBack.data = { ...edgeToAddBack.data, edgeValue: value };
      const newEdges = [...filteredEdges, edgeToAddBack];
      console.log(newEdges);
      return newEdges;
    });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            // if you have an interactive element, set pointer-events: all
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <input
            className="w-14 border rounded-sm text-center text-lg"
            value={edgeValue}
            onChange={(e) => onChangeHandler(e.target.value)}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
