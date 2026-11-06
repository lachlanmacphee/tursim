import { cn, getEdgeGeometry } from "@/lib/utils";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  ReactFlowState,
  useInternalNode,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOVES = [">", "<"];

// "r,w,m" (or legacy "r,m") -> ["r", "w", "m"]
const toCells = (transition: string) => {
  const parts = transition.split(",");
  return parts.length == 2 ? [parts[0], parts[0], parts[1]] : parts;
};

const toEdgeValue = (rows: string[][]) =>
  rows.map((row) => row.join(",")).join(";");

const TransitionEditor = ({
  edgeValue,
  onChangeHandler,
  onDeleteEdge,
  activeRule,
  ruleApplied,
}: {
  edgeValue: string;
  onChangeHandler: (value: string) => void;
  onDeleteEdge: () => void;
  // Index of the row the machine last followed, if it was on this edge
  activeRule: number | null;
  // Whether that row's write and move have happened yet
  ruleApplied: boolean;
}) => {
  const [rows, setRowsState] = useState(() =>
    edgeValue.split(";").map(toCells)
  );
  // Always holds the latest rows, so fast typing never works from stale state
  const rowsRef = useRef(rows);

  const setRows = (next: string[][]) => {
    rowsRef.current = next;
    setRowsState(next);
  };

  useEffect(() => {
    setRows(edgeValue.split(";").map(toCells));
  }, [edgeValue]);

  const updateRows = (update: (current: string[][]) => string[][]) => {
    const next = update(rowsRef.current);
    setRows(next);
    // Only commit once every transition has read, write and move filled in
    if (next.every((row) => row.length == 3 && row.every((c) => c != ""))) {
      onChangeHandler(toEdgeValue(next));
    }
  };

  const setCell = (rowIdx: number, cellIdx: number, value: string) =>
    updateRows((current) =>
      current.map((row, r) =>
        r == rowIdx ? row.map((c, i) => (i == cellIdx ? value : c)) : row
      )
    );

  const cycleMove = (rowIdx: number) =>
    setCell(
      rowIdx,
      2,
      MOVES[(MOVES.indexOf(rowsRef.current[rowIdx][2]) + 1) % MOVES.length]
    );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowIdx: number,
    cellIdx: number
  ) => {
    const value = e.target.value.slice(-1);
    setCell(rowIdx, cellIdx, value);
    if (value) {
      (e.target.nextElementSibling as HTMLInputElement | null)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    cellIdx: number
  ) => {
    if (e.key == "Backspace" && rows[rowIdx][cellIdx] == "") {
      (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus();
    }
  };

  // The parts of the active rule in play: the symbol being read until the rule
  // is applied, then the symbol written and the move
  const inPlayClass = (rowIdx: number, cellIdx: number) =>
    rowIdx == activeRule && (ruleApplied ? cellIdx > 0 : cellIdx == 0)
      ? "bg-primary/25"
      : "";

  // Rows and cells join into one block: only the block's outer corners are rounded
  const cornerClass = (rowIdx: number, cellIdx: number) =>
    cn(
      "rounded-none",
      rowIdx == 0 && cellIdx == 0 && "rounded-tl-md",
      rowIdx == 0 && cellIdx == 2 && "rounded-tr-md",
      rowIdx == rows.length - 1 && cellIdx == 0 && "rounded-bl-md",
      rowIdx == rows.length - 1 && cellIdx == 2 && "rounded-br-md"
    );

  return (
    <div data-tour="transition" className="group/edge relative flex flex-col items-center p-1">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            "group/row relative flex items-center bg-background",
            rowIdx > 0 && "-mt-px",
            rowIdx == 0 && "rounded-t-md",
            rowIdx == rows.length - 1 && "rounded-b-md",
            // Match the direction button, which squares off beside the delete buttons
            rows.length > 1 &&
              rowIdx == 0 &&
              "group-hover/edge:rounded-tr-none",
            rows.length > 1 &&
              rowIdx == rows.length - 1 &&
              "group-hover/edge:rounded-br-none"
          )}
        >
          {rowIdx == activeRule && (
            <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] ring-2 ring-inset ring-ring" />
          )}
          <div className="flex">
            {row.slice(0, 2).map((cell, cellIdx) => (
              <Input
                key={cellIdx}
                value={cell}
                maxLength={2}
                spellCheck={false}
                className={cn(
                  "relative h-8 w-8 p-0 text-center text-base focus-visible:z-10",
                  cellIdx > 0 && "-ml-px",
                  cornerClass(rowIdx, cellIdx),
                  inPlayClass(rowIdx, cellIdx)
                )}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleChange(e, rowIdx, cellIdx)}
                onKeyDown={(e) => handleKeyDown(e, rowIdx, cellIdx)}
              />
            ))}
            <Button
              variant="outline"
              className={cn(
                "relative -ml-px h-8 w-8 p-0 text-base shadow-sm focus-visible:z-10",
                cornerClass(rowIdx, 2),
                inPlayClass(rowIdx, 2),
                // Squares off to join the delete button while it's showing
                rows.length > 1 &&
                  "group-hover/edge:rounded-tr-none group-hover/edge:rounded-br-none"
              )}
              aria-label="Move direction"
              onClick={() => cycleMove(rowIdx)}
            >
              {row[2]}
            </Button>
          </div>
          {rows.length > 1 && (
            <Button
              variant="destructive"
              aria-label="Remove transition"
              className={cn(
                "absolute left-full top-0 -ml-px hidden h-8 w-2.5 border border-destructive-foreground/30 p-0 shadow-sm group-hover/edge:flex",
                cornerClass(rowIdx, 2)
              )}
              onClick={() =>
                updateRows((current) => current.filter((_, i) => i != rowIdx))
              }
            >
              <XIcon className="h-2 w-2" strokeWidth={3} />
            </Button>
          )}
        </div>
      ))}
      <div className="absolute bottom-full left-1/2 -mb-1 hidden -translate-x-1/2 group-hover/edge:flex">
        <Button
          variant="destructive"
          aria-label="Delete edge"
          className="h-2.5 w-8 rounded-b-none rounded-t-md p-0"
          onClick={onDeleteEdge}
        >
          <XIcon className="h-2 w-2" strokeWidth={3} />
        </Button>
      </div>
      <div className="absolute left-1/2 top-full -mt-1 hidden -translate-x-1/2 group-hover/edge:flex">
        <Button
          variant="default"
          aria-label="Add transition"
          className="h-2.5 w-8 rounded-b-md rounded-t-none border-t-0 p-0"
          onClick={() =>
            updateRows((current) => [...current, ["_", "_", ">"]])
          }
        >
          <PlusIcon className="h-2 w-2" strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
};

export function TuringEdge({
  id,
  source,
  target,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const { setEdges, deleteElements } = useReactFlow();
  const [edgeValue, setEdgeValue] = useState(data!.edgeValue as string);

  const isBidirectional = useStore((s: ReactFlowState) =>
    s.edges.some((e) => e.source === target && e.target === source)
  );

  useEffect(() => {
    setEdgeValue(data!.edgeValue as string);
  }, [data]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const activeRule = (data!.activeRule as number | null | undefined) ?? null;
  const ruleApplied = (data!.ruleApplied as boolean | undefined) ?? false;
  const highlighted = { ...style, stroke: "hsl(var(--ring))", strokeWidth: 2 };
  // Step 1 lights the way in (node to rule), step 2 the way out (rule to node)
  const toLabelStyle = activeRule != null && !ruleApplied ? highlighted : style;
  const fromLabelStyle = activeRule != null && ruleApplied ? highlighted : style;

  const { pathToLabel, pathFromLabel, label, labelAnchor } = getEdgeGeometry(
    sourceNode,
    targetNode,
    source != target && isBidirectional
  );

  const onChangeHandler = (value: string) => {
    setEdgeValue(value);
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, edgeValue: value } }
          : edge
      )
    );
  };

  return (
    <>
      <BaseEdge path={pathToLabel} style={toLabelStyle} />
      <BaseEdge path={pathFromLabel} markerEnd={markerEnd} style={fromLabelStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, ${
              labelAnchor == "bottom" ? "-100%" : "-50%"
            }) translate(${label.x}px, ${label.y}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <TransitionEditor
            edgeValue={edgeValue}
            onChangeHandler={onChangeHandler}
            onDeleteEdge={() => deleteElements({ edges: [{ id }] })}
            activeRule={activeRule}
            ruleApplied={ruleApplied}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
