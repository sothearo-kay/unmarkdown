import { XIcon } from "lucide-react";
import { useRef, useState } from "react";

import type { Note } from "@/lib/notes";

import { buttonVariants } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      onClick={() => !editing && onSelect(note.id)}
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
        <span
          className="-mr-0.75 flex size-3.5 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          role="button"
        >
          <XIcon className="size-2.5" />
        </span>
      )}
    </div>
  );
}
