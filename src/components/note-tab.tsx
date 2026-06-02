import { XIcon } from "lucide-react";
import { useRef, useState } from "react";

import type { Note } from "@/lib/notes";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type NoteTabProps = {
  active: boolean;
  deletable: boolean;
  note: Note;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSelect: (id: string) => void;
};

export function NoteTab({ active, deletable, note, onDelete, onRename, onSelect }: NoteTabProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasContent = note.content.trim().length > 0;

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onRename(note.id, trimmed);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        buttonVariants({ size: "xs", variant: "ghost" }),
        "group shrink-0 cursor-pointer select-none transition-[background-color,color]",
        active ? "bg-foreground/5 hover:bg-foreground/5" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
      onClick={() => !editing && !confirmOpen && onSelect(note.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setValue(note.title);
        setEditing(true);
      }}
    >
      <div className="relative">
        <span className={cn("max-w-32 truncate block", editing ? "invisible" : "")}>{editing ? (value || " ") : note.title}</span>
        {editing && (
          <input
            autoFocus
            className="absolute inset-0 w-full border-none bg-transparent text-xs outline-none"
            onBlur={commit}
            onChange={e => setValue(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            ref={inputRef}
            value={value}
          />
        )}
      </div>

      {deletable && (
        <Popover
          onOpenChange={(open) => {
            if (open && !hasContent) return;
            setConfirmOpen(open);
          }}
          open={confirmOpen}
        >
          <PopoverTrigger
            className={cn(
              "-mr-0.75 flex size-3.5 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100",
              confirmOpen ? "bg-foreground/10 opacity-100" : "opacity-0",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasContent) onDelete(note.id);
            }}
          >
            <XIcon className="size-2.5" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="font-sans"
            side="bottom"
            sideOffset={6}
          >
            <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <div className="text-sm space-y-1">
                <p className="font-medium">Delete this note?</p>
                <p className="text-muted-foreground">
                  All content will be permanently lost.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setConfirmOpen(false)} size="xs" variant="ghost">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onDelete(note.id);
                    setConfirmOpen(false);
                  }}
                  size="xs"
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
