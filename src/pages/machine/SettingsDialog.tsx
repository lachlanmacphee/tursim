import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const MIN_SPEED = 10;
export const MAX_SPEED = 200;

export function SettingsDialog({
  open,
  onOpenChange,
  speed,
  setSpeed,
}: {
  open: boolean;
  onOpenChange: any;
  speed: number;
  setSpeed: (speed: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Adjust how the machine runs when the tape is played.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="speed">Speed</Label>
            <span className="text-sm text-muted-foreground">{speed}%</span>
          </div>
          <input
            id="speed"
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={10}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
