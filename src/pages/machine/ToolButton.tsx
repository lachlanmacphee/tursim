import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolButton({
  name,
  tooltip,
  children,
  onClick,
  disabled,
  className,
}: {
  name: string;
  tooltip: string;
  children: ReactNode;
  onClick: VoidFunction;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            data-tour={name}
            className={cn("w-14 h-14", className)}
            disabled={disabled}
            onClick={onClick}
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
