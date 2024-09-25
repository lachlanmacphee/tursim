import { getEdgeParams, getSpecialPath } from "@/lib/utils";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  ReactFlowState,
  useInternalNode,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

const EditableDiv = ({
  edgeValue,
  onChangeHandler,
}: {
  edgeValue: string;
  onChangeHandler: (value: string) => void;
}) => {
  const contentEditableRef = useRef(null);

  useEffect(() => {
    if (contentEditableRef.current) {
      // @ts-ignore
      const currentText = contentEditableRef.current.textContent;
      if (currentText !== edgeValue) {
        // @ts-ignore
        contentEditableRef.current.textContent = edgeValue;
      }
    }
  }, [edgeValue]);

  const handleInput = () => {
    if (contentEditableRef.current) {
      // @ts-ignore
      const text = contentEditableRef.current.textContent || "";
      onChangeHandler(text);
    }
  };

  return (
    <div
      contentEditable="true"
      spellCheck="false"
      ref={contentEditableRef}
      className="min-w-14 px-2 bg-background border rounded-sm text-center text-lg overflow-auto cursor-text"
      onInput={handleInput}
    />
  );
};

export function TuringEdge({
  id,
  source,
  sourceX,
  sourceY,
  target,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const isSelfConnecting = source == target;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const [edgeValue, setEdgeValue] = useState(data!.edgeValue as string);
  const { setEdges } = useReactFlow();

  const isBiDirectionEdge = useStore((s: ReactFlowState) =>
    s.edges.some(
      (e) =>
        (e.source === target && e.target === source) ||
        (e.target === source && e.source === target)
    )
  );

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
  };

  const offset = sourceX < targetX ? 50 : -50;
  const bidirectionalPath = getSpecialPath(edgePathParams, offset);

  const [bezierEdgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  const onChangeHandler = (value: string) => {
    setEdgeValue(value);
    setEdges((edges) => {
      const filteredEdges = edges.filter((edge) => edge.id !== id);
      const edgeToAddBack = edges.find((edge) => edge.id === id)!;
      edgeToAddBack.data = { ...edgeToAddBack.data, edgeValue: value };
      return [...filteredEdges, edgeToAddBack];
    });
  };

  useEffect(() => {
    setEdgeValue(data!.edgeValue as string);
  }, [data]);

  const radiusX = (sourceX - targetX) * 0.6;
  const radiusY = 50;
  const selfConnectingEdgePath = `M ${
    sourceX - 5
  } ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;
  const bezierTransform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;
  const selfConnectingTransform = `translate(-50%, -300%) translate(${
    (targetX + sourceX) / 2
  }px, ${sourceY}px)`;
  const bidirectionTransform = `translate(-50%, -50%) translate(${labelX}px, ${
    labelY + offset / 2
  }px)`;

  return (
    <>
      <BaseEdge
        path={
          isSelfConnecting
            ? selfConnectingEdgePath
            : isBiDirectionEdge
            ? bidirectionalPath
            : bezierEdgePath
        }
        markerEnd={isSelfConnecting ? undefined : markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: isSelfConnecting
              ? selfConnectingTransform
              : isBiDirectionEdge
              ? bidirectionTransform
              : bezierTransform,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <EditableDiv
            edgeValue={edgeValue}
            onChangeHandler={onChangeHandler}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
