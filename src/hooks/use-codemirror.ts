import type { Extension } from "@codemirror/state";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";

import { catppuccinLatte, catppuccinMocha } from "@catppuccin/codemirror";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { indentUnit } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { RangeSetBuilder } from "@codemirror/state";
import { Compartment, EditorState } from "@codemirror/state";
import { Decoration, drawSelection, EditorView, keymap, lineNumbers, ViewPlugin, WidgetType } from "@codemirror/view";
import { useEffect, useLayoutEffect, useRef } from "react";

class HeadingLabelWidget extends WidgetType {
  readonly level: number;
  constructor(level: number) {
    super();
    this.level = level;
  }

  eq(other: WidgetType) { return other instanceof HeadingLabelWidget && other.level === this.level; }
  ignoreEvent() { return false; }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-heading-label";
    el.textContent = `H${this.level}`;
    return el;
  }
}

let vimExt: (() => Extension) | null = null;

async function getVim() {
  if (!vimExt) {
    const mod = await import("@replit/codemirror-vim");
    vimExt = mod.vim;
  }
  return vimExt;
}

const headingLabels = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    build(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
          const line = view.state.doc.lineAt(pos);
          const m = line.text.match(/^(#{1,6})\s/);
          if (m) {
            builder.add(line.from, line.from, Decoration.widget({
              side: -1,
              widget: new HeadingLabelWidget(m[1].length),
            }));
          }
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) this.decorations = this.build(update.view);
    }
  },
  { decorations: v => v.decorations },
);

const scrollFollowCursor = ViewPlugin.fromClass(class {
  update(update: ViewUpdate) {
    if (!update.selectionSet && !update.docChanged) return;
    const { view } = update;
    requestAnimationFrame(() => {
      const head = view.state.selection.main.head;
      const coords = view.coordsAtPos(head);
      if (!coords) return;
      const viewport = view.scrollDOM.closest("[data-slot='scroll-area-viewport']") as HTMLElement | null;
      if (!viewport) return;
      const vp = viewport.getBoundingClientRect();
      const pad = 80;
      if (coords.top < vp.top + pad) {
        viewport.scrollTop += coords.top - vp.top - pad;
      }
      else if (coords.bottom > vp.bottom - pad) {
        viewport.scrollTop += coords.bottom - vp.bottom + pad;
      }
    });
  }
});

const transparentOverride = EditorView.theme({
  "&": { background: "transparent !important", backgroundColor: "transparent !important", fontSize: "12.5px", height: "auto", minHeight: "100%" },
  "&.cm-focused": { outline: "none !important" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "#88888830 !important",
  },
  ".cm-activeLine": { backgroundColor: "transparent !important" },
  ".cm-activeLineGutter": { backgroundColor: "transparent !important" },
  ".cm-content": {
    caretColor: "var(--foreground)",
    fontFamily: "var(--font-mono)",
    padding: "16px 16px 16px 0",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground) !important" },
  ".cm-fat-cursor .cm-cursor": {
    background: "#88888880 !important",
    borderColor: "transparent !important",
  },
  ".cm-gutters": { background: "transparent !important", backgroundColor: "transparent !important", border: "none" },
  ".cm-heading-label": {
    display: "inline-block",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    marginRight: "6px",
    opacity: "0.35",
    verticalAlign: "middle",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    fontFamily: "var(--font-mono)",
    fontSize: "12.5px",
    minWidth: "36px",
    paddingLeft: "12px",
    paddingRight: "8px",
  },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.7" },
  ".cm-selectionBackground": {
    backgroundColor: "#88888830 !important",
  },
});

export function useCodemirror({
  initialContent,
  noteId,
  onChange,
  vimMode,
}: {
  initialContent: string;
  noteId: string;
  onChange: (content: string) => void;
  vimMode: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const stateCache = useRef<Map<string, EditorState>>(new Map());
  const onChangeRef = useRef(onChange);
  const vimModeRef = useRef(vimMode);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    vimModeRef.current = vimMode;
  });

  useEffect(() => {
    if (!editorRef.current) return;
    const cache = stateCache.current;

    const extensions = [
      lineNumbers(),
      drawSelection(),
      history(),
      EditorState.tabSize.of(2),
      indentUnit.of("  "),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      headingLabels,
      scrollFollowCursor,
      vimCompartment.current.of([]),
      themeCompartment.current.of([catppuccinTheme(), transparentOverride]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString());
      }),
    ];

    const cached = cache.get(noteId);
    const startState = cached ?? EditorState.create({ doc: initialContent, extensions });

    const view = new EditorView({ parent: editorRef.current, state: startState });
    viewRef.current = view;
    view.focus();

    // Seed vim on the new view; the [vimMode] effect only runs on vimMode change, not note switch.
    if (vimModeRef.current) {
      getVim().then((vim) => {
        if (viewRef.current === view) {
          view.dispatch({ effects: vimCompartment.current.reconfigure(vim()) });
        }
      });
    }

    return () => {
      cache.set(noteId, view.state);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    if (!vimMode) {
      viewRef.current?.dispatch({
        effects: vimCompartment.current.reconfigure([]),
      });
      return;
    }
    getVim().then((vim) => {
      viewRef.current?.dispatch({
        effects: vimCompartment.current.reconfigure(vim()),
      });
    });
  }, [vimMode]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      viewRef.current?.dispatch({
        effects: themeCompartment.current.reconfigure([catppuccinTheme(), transparentOverride]),
      });
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  function setContent(content: string) {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, insert: content, to: view.state.doc.length },
    });
  }

  return { editorRef, setContent };
}

function catppuccinTheme() {
  return document.documentElement.classList.contains("dark")
    ? catppuccinMocha
    : catppuccinLatte;
}
