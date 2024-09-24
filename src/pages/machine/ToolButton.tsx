import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

export function ToolButton({
  name,
  tooltip,
  onClick,
  children,
  activeTool,
  setActiveTool,
}: {
  name: string;
  tooltip: string;
  onClick?: VoidFunction;
  children: ReactNode;
  activeTool: string;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool == name ? "default" : "outline"}
            className="w-14 h-14"
            onClick={() =>
              onClick
                ? onClick()
                : activeTool == name
                ? setActiveTool("")
                : setActiveTool(name)
            }
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
