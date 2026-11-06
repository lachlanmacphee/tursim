import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

// Same background as the format block, so inline code stands out from the text
const inlineCodeClass = "rounded bg-muted px-1 py-0.5 font-mono text-foreground";

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert Encoding to TM</DialogTitle>
          <DialogDescription>
            Enter an encoding in the correct format to automatically create an
            auto-layouted Turing Machine.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              The encoding is a string of <code className={inlineCodeClass}>a</code>s and <code className={inlineCodeClass}>b</code>s
              made up of one block per transition, written back to back with no
              separators. Each block is:
            </p>
            <code className={`${inlineCodeClass} px-2 py-1`}>
              a<sup>from</sup> b a<sup>to</sup> b RR WW M
            </code>
            <ul className="list-disc pl-5">
              <li>
                <code className={inlineCodeClass}>a<sup>from</sup></code> and <code className={inlineCodeClass}>a<sup>to</sup></code>{" "}
                are the source and target states, written as that many{" "}
                <code className={inlineCodeClass}>a</code>s (so state 3 is <code className={inlineCodeClass}>aaa</code>).
              </li>
              <li>
                <code className={inlineCodeClass}>RR</code> is the symbol read and <code className={inlineCodeClass}>WW</code> the
                symbol written, each as two letters: <code className={inlineCodeClass}>aa</code> = a,{" "}
                <code className={inlineCodeClass}>ab</code> = b, <code className={inlineCodeClass}>ba</code> = blank (_),{" "}
                <code className={inlineCodeClass}>bb</code> = #.
              </li>
              <li>
                <code className={inlineCodeClass}>M</code> is the move: <code className={inlineCodeClass}>a</code> = left,{" "}
                <code className={inlineCodeClass}>b</code> = right.
              </li>
            </ul>
            <p>
              The target state of the last transition is the final state. For
              example, <code className={inlineCodeClass}>abaabaaabb</code> is a single transition from state
              1 to state 2 that reads a, writes b and moves right.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="encoding">Encoding</Label>
            <Textarea
              id="encoding"
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="font-mono"
              rows={5}
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
