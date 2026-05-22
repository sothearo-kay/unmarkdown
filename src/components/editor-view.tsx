import { useEffect } from "react";

import type { Note } from "@/lib/notes";

import { useCodemirror } from "@/hooks/use-codemirror";

interface EditorViewProps {
  note: Note;
  onReady?: (setContent: (content: string) => void) => void;
  onUpdate: (id: string, content: string) => void;
  vimMode: boolean;
};

export function EditorView({ note, onReady, onUpdate, vimMode }: EditorViewProps) {
  const { editorRef, setContent } = useCodemirror({
    initialContent: note.content,
    noteId: note.id,
    onChange: content => onUpdate(note.id, content),
    vimMode,
  });

  useEffect(() => {
    onReady?.(setContent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="size-full" ref={editorRef} />;
}
