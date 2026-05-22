import { useCallback, useEffect, useState } from "react";

import { createNote, type Note, notesDb, titleFromContent, WELCOME_NOTE } from "@/lib/notes";

import { useLocalStorage } from "./use-local-storage";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useLocalStorage<null | string>("active-note-id", null);

  useEffect(() => {
    notesDb.getAll().then((all) => {
      const sorted = all.sort((a, b) => a.createdAt - b.createdAt);
      if (sorted.length === 0) {
        const note = createNote(WELCOME_NOTE);
        notesDb.save(note).then(() => {
          setNotes([note]);
          setActiveId(note.id);
        });
      }
      else {
        setNotes(sorted);
        setActiveId(prev => sorted.find(n => n.id === prev) ? prev! : sorted[0].id);
      }
    });
  }, []);

  const activeNote = notes.find(n => n.id === activeId) ?? null;

  const addNote = useCallback(() => {
    const note = createNote();
    notesDb.save(note).then(() => {
      setNotes(prev => [...prev, note]);
      setActiveId(note.id);
    });
  }, []);

  const importNote = useCallback((content: string) => {
    const note = createNote(content);
    notesDb.save(note).then(() => {
      setNotes(prev => [...prev, note]);
      setActiveId(note.id);
    });
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, content, title: titleFromContent(content), updatedAt: Date.now() };
        notesDb.save(updated);
        return updated;
      }),
    );
  }, []);

  const renameNote = useCallback((id: string, title: string) => {
    setNotes(prev =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, title };
        notesDb.save(updated);
        return updated;
      }),
    );
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      notesDb.delete(id).then(() => {
        setNotes((prev) => {
          const next = prev.filter(n => n.id !== id);
          if (next.length === 0) {
            const fresh = createNote();
            notesDb.save(fresh);
            setActiveId(fresh.id);
            return [fresh];
          }
          if (activeId === id) {
            setActiveId(next[0].id);
          }
          return next;
        });
      });
    },
    [activeId],
  );

  return {
    activeId,
    activeNote,
    addNote,
    deleteNote,
    importNote,
    notes,
    renameNote,
    setActiveId,
    updateNote,
  };
}
