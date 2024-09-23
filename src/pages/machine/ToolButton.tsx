import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

export function ToolButton({
  name,
  onClick,
  children,
  activeTool,
  setActiveTool,
}: {
  name: string;
  onClick?: VoidFunction;
  children: ReactNode;
  activeTool: string;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <Button
      variant={activeTool == name ? "default" : "outline"}
      className="w-12 h-12"
      onClick={() => (onClick ? onClick() : setActiveTool(name))}
    >
      {children}
    </Button>
  );
}
