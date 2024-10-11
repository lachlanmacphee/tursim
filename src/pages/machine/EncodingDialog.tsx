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

export function EncodingDialog({
  open,
  onOpenChange,
  createHandler,
}: {
  open: boolean;
  onOpenChange: any;
  createHandler: (name: string) => void;
}) {
  const [encoding, setEncoding] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert Encoding to TM</DialogTitle>
          <DialogDescription>
            Enter an encoding in the correct format to automatically create an
            auto-layouted Turing Machine.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="encoding" className="text-right">
              Encoding
            </Label>
            <Input
              id="name"
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => createHandler(encoding)} type="submit">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
