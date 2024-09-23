import { useTheme } from "@/hooks/useTheme";
import { getEdgeParams } from "@/lib/utils";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useInternalNode,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

const EditableDiv = ({
  edgeValue,
  onChangeHandler,
  theme,
}: {
  edgeValue: string;
  onChangeHandler: (value: string) => void;
  theme: string;
}) => {
  const contentEditableRef = useRef(null);
  const isDark =
    theme == "dark" ||
    (theme == "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches == true);

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
      if (contentEditableRef.current) {
        // @ts-ignore
        const text = contentEditableRef.current.textContent || '';
        onChangeHandler(text);
      }
    }
  };

  return (
    <div
      contentEditable="true"
      ref={contentEditableRef}
      className={`min-w-14 px-2 ${
        isDark ? "bg-slate-800 text-white" : "bg-white text-black"
      } border rounded-sm text-center text-lg overflow-auto cursor-text`}
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
  const { theme } = useTheme();

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [bezierEdgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  const [edgeValue, setEdgeValue] = useState(data!.edgeValue as string);
  const { setEdges } = useReactFlow();

  const onChangeHandler = (value: string) => {
    setEdgeValue(value);
    setEdges((edges) => {
      const filteredEdges = edges.filter((edge) => edge.id !== id);
      const edgeToAddBack = edges.filter((edge) => edge.id === id)[0];
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

  return (
    <>
      <BaseEdge
        path={isSelfConnecting ? selfConnectingEdgePath : bezierEdgePath}
        markerEnd={isSelfConnecting ? undefined : markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: isSelfConnecting
              ? selfConnectingTransform
              : bezierTransform,
            // if you have an interactive element, set pointer-events: all
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <EditableDiv
            edgeValue={edgeValue}
            onChangeHandler={onChangeHandler}
            theme={theme}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
