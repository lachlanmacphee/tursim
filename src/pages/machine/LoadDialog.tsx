import { ReactNode, useState } from "react";
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// A disabled button doesn't fire pointer events, so the tooltip hangs off a
// wrapper around it
function LockedButton({
  reason,
  children,
}: {
  reason: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-block cursor-not-allowed">
          <Button
            size="icon"
            variant="outline"
            disabled
            aria-label={reason}
            className="pointer-events-none"
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{reason}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function LoadDialog({
  title,
  description,
  emptyMessage,
  items,
  open,
  onOpenChange,
  onLoad,
  onDelete,
  onRename,
  lockedIds = [],
}: {
  title: string;
  description: string;
  emptyMessage: string;
  items: { id: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (oldId: string, newId: string) => Promise<boolean>;
  // Items that can be loaded but not renamed or deleted
  lockedIds?: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const stopEditing = () => {
    setEditingId(null);
    setError("");
  };

  const startEditing = (id: string) => {
    setEditingId(id);
    setDraft(id);
    setError("");
  };

  const confirmRename = async (id: string) => {
    const name = draft.trim();
    if (!name || name == id) {
      stopEditing();
      return;
    }
    if (await onRename(id, name)) {
      stopEditing();
    } else {
      setError("That name is already taken");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) stopEditing();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TooltipProvider>
        <div className="grid max-h-[50vh] gap-2 overflow-y-auto py-2">
          {items.length == 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
          {items.map(({ id }) =>
            editingId == id ? (
              <div key={id} className="grid gap-1">
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") confirmRename(id);
                      if (e.key == "Escape") {
                        e.stopPropagation();
                        stopEditing();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    aria-label="Confirm rename"
                    onClick={() => confirmRename(id)}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Cancel rename"
                    onClick={stopEditing}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            ) : (
              <div key={id} className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-start truncate"
                  onClick={() => onLoad(id)}
                >
                  {id}
                </Button>
                {lockedIds.includes(id) ? (
                  <>
                    <LockedButton reason="Built-in examples can't be renamed">
                      <PencilIcon className="h-4 w-4" />
                    </LockedButton>
                    <LockedButton reason="Built-in examples can't be deleted">
                      <TrashIcon className="h-4 w-4" />
                    </LockedButton>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Rename ${id}`}
                      onClick={() => startEditing(id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label={`Delete ${id}`}
                      onClick={() => onDelete(id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )
          )}
        </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
