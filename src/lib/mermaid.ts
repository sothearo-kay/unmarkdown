type Mermaid = typeof import("mermaid").default;

interface Palette {
  background: string;
  border: string;
  line: string;
  node: string;
  surface: string;
  text: string;
  textMuted: string;
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    background: "#0a0a0a",
    border: "#333333",
    line: "#8a8a8a",
    node: "#1c1c1c",
    surface: "#141414",
    text: "#fafafa",
    textMuted: "#a1a1a1",
  },
  light: {
    background: "#ffffff",
    border: "#d4d4d4",
    line: "#737373",
    node: "#f7f7f7",
    surface: "#fafafa",
    text: "#0a0a0a",
    textMuted: "#737373",
  },
};

const FONT_FAMILY = "\"Satoshi\", ui-sans-serif, system-ui, sans-serif";

function configFor(p: Palette) {
  return {
    flowchart: { curve: "basis" as const, htmlLabels: true, useMaxWidth: false },
    fontFamily: FONT_FAMILY,
    securityLevel: "strict" as const,
    sequence: { useMaxWidth: false },
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: "base" as const,
    themeVariables: {
      actorBkg: p.node,
      actorBorder: p.border,
      actorLineColor: p.line,
      actorTextColor: p.text,
      altBackground: p.node,
      background: p.background,
      clusterBkg: p.surface,
      clusterBorder: p.border,
      edgeLabelBackground: p.surface,
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      labelBoxBkgColor: p.node,
      labelBoxBorderColor: p.border,
      labelTextColor: p.text,
      lineColor: p.line,
      loopTextColor: p.text,
      mainBkg: p.node,
      nodeBorder: p.border,
      noteBkgColor: p.surface,
      noteBorderColor: p.border,
      noteTextColor: p.textMuted,
      primaryBorderColor: p.border,
      primaryColor: p.node,
      primaryTextColor: p.text,
      secondaryBorderColor: p.border,
      secondaryColor: p.surface,
      secondaryTextColor: p.text,
      signalColor: p.line,
      signalTextColor: p.text,
      tertiaryBorderColor: p.border,
      tertiaryColor: p.surface,
      tertiaryTextColor: p.text,
      textColor: p.text,
      titleColor: p.text,
    },
  };
}

let mermaidPromise: null | Promise<Mermaid> = null;
let appliedTheme: "dark" | "light" | null = null;
let queue: Promise<unknown> = Promise.resolve();

// Mermaid is configured through module-level globals, so renders are queued to
// keep a theme switch from re-initializing mid-render.
export async function renderMermaid(
  code: string,
  id: string,
  dark: boolean,
): Promise<string> {
  const run = queue.then(async () => {
    const mermaid = await load();
    const theme = dark ? "dark" : "light";

    if (appliedTheme !== theme) {
      mermaid.initialize(configFor(PALETTES[theme]));
      appliedTheme = theme;
    }

    // useId returns `:r0:`, which is not a valid selector for mermaid's <svg>.
    const { svg } = await mermaid.render(`mermaid-${id.replace(/[^\w-]/g, "")}`, code);
    return svg;
  });

  queue = run.catch(() => {});
  return run;
}

async function load() {
  mermaidPromise ??= import("mermaid").then(m => m.default);
  return mermaidPromise;
}
