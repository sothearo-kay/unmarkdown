import { createStore, del, entries, get, set } from "idb-keyval";

export type Note = {
  content: string;
  createdAt: number;
  id: string;
  title: string;
  updatedAt: number;
};

const store = createStore("unmarkdown", "notes");

export const WELCOME_NOTE = `# <img src="/favicon.svg" width="32" height="32"/> UnMarkdown

A minimalist markdown editor that lives in your browser. No accounts, no sync, no noise.

## Typography

You can write **bold**, *italic*, ~~strikethrough~~, and \`inline code\`. Links like [this one](https://github.com) use a subtle underline.

> "The best tool is the one that gets out of your way."

## Task List

* [x] Live preview
* [x] Syntax highlighting
* [x] Vim mode
* [ ] Collaborative editing

## Code

\`\`\`ts
function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return \`\${m}m ago\`;
  return \`\${Math.floor(m / 60)}h ago\`;
}
\`\`\`

## Table

| Feature             | Status |
| ------------------- | ------ |
| Live preview        | ✓      |
| GFM support         | ✓      |
| Syntax highlighting | ✓      |
| Share via URL       | ✓      |
| Vim mode            | ✓      |

## Lists

### Unordered

* React 19 + TypeScript
* CodeMirror 6
* Tailwind CSS v4

### Ordered

1. Open a note
2. Write markdown
3. Share the link

---

*Made with focus.*
`;

export function createNote(content = ""): Note {
  return {
    content,
    createdAt: Date.now(),
    id: crypto.randomUUID(),
    title: titleFromContent(content) || "Untitled",
    updatedAt: Date.now(),
  };
}

export function stripText(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/[*_~`[\]]/g, "").trim();
}

export function titleFromContent(content: string): string {
  const first = content.split("\n").find(l => l.trim());
  if (!first) return "Untitled";
  return stripText(first.replace(/^#+\s*/, "")) || "Untitled";
}

export const notesDb = {
  delete: (id: string) => del(id, store),
  get: (id: string) => get<Note>(id, store),
  getAll: () => entries<string, Note>(store).then(e => e.map(([, v]) => v)),
  save: (note: Note) => set(note.id, note, store),
};
