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
  children,
  activeTool,
  setActiveTool,
  onClick,
  keyboardShortcut,
}: {
  name: string;
  tooltip: string;
  children: ReactNode;
  activeTool: string;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
  onClick?: VoidFunction;
  keyboardShortcut?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool == name ? "default" : "outline"}
            className="relative w-14 h-14"
            onClick={() =>
              onClick
                ? onClick()
                : activeTool == name
                ? setActiveTool("select")
                : setActiveTool(name)
            }
          >
            {children}
            {keyboardShortcut && (
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-md rounded-br-md text-center text-xs ${
                  activeTool == name
                    ? "bg-background text-foreground"
                    : "bg-primary text-background"
                }`}
              >
                {keyboardShortcut}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
