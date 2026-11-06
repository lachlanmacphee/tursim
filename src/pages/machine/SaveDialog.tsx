import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function SaveDialog({
  item,
  open,
  onOpenChange,
  saveHandler,
}: {
  item: string;
  open: boolean;
  onOpenChange: any;
  // Resolves to an error message to show, or null once saved
  saveHandler: (name: string) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    const problem = await saveHandler(name);
    if (problem) {
      setError(problem);
    } else {
      setName("");
      setError("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setError("");
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save {item}</DialogTitle>
          <DialogDescription>
            Enter a name for your {item.toLowerCase()} and click Save to persist
            it to your browser's storage. {item}s can be loaded from the
            corresponding Load button.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key == "Enter" && save()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={save} type="submit">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
