import { MinusIcon, PlusIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsDark } from "@/hooks/use-is-dark";
import { renderMermaid } from "@/lib/mermaid";

type State
  = | { message: string; status: "error" }
    | { status: "loading" }
    | { status: "ready"; svg: string };

const MIN_SCALE = 0.5;
const MAX_SCALE = 6;
const TAP = "transition-[background-color,scale] duration-150 ease-out active:not-disabled:scale-[0.96]";

export function MermaidDiagram({ code }: { code: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [zoomed, setZoomed] = useState(false);
  const dark = useIsDark();
  const id = useId();
  const name = `mermaid-${id.replace(/[^\w-]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    renderMermaid(code, id, dark)
      .then((svg) => {
        if (!cancelled) setState({ status: "ready", svg });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to render diagram";
        setState({ message, status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [code, dark, id]);

  if (state.status === "error") {
    return (
      <div className="mermaid-error">
        <p>{state.message.trim()}</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div aria-busy className="mermaid-figure" data-loading>
        <span className="mermaid-spinner" />
      </div>
    );
  }

  return (
    <>
      <button
        aria-label="Expand diagram"
        className="mermaid-figure"
        data-hidden={zoomed || undefined}
        onClick={() => withViewTransition(() => setZoomed(true))}
        style={{ viewTransitionName: zoomed ? undefined : name }}
        type="button"
      >
        <div className="mermaid-svg" dangerouslySetInnerHTML={{ __html: state.svg }} />
      </button>

      {zoomed && (
        <MermaidLightbox
          name={name}
          onClose={() => withViewTransition(() => setZoomed(false))}
          svg={state.svg}
        />
      )}
    </>
  );
}

function MermaidLightbox({
  name,
  onClose,
  svg,
}: {
  name: string;
  onClose: () => void;
  svg: string;
}) {
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef<null | { originX: number; originY: number; x: number; y: number }>(null);

  const applyOffset = useCallback(() => {
    const el = svgRef.current;
    if (el) el.style.translate = `${offset.current.x}px ${offset.current.y}px`;
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    offset.current = { x: 0, y: 0 };
    applyOffset();
  }, [applyOffset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "+" || e.key === "=") zoomBy(1.25);
      if (e.key === "-") zoomBy(0.8);
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, reset, zoomBy]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // macOS delivers a trackpad pinch as ctrl+wheel
      if (e.ctrlKey || e.metaKey) {
        zoomBy(Math.exp(-e.deltaY * 0.01));
        return;
      }
      offset.current = {
        x: offset.current.x - e.deltaX,
        y: offset.current.y - e.deltaY,
      };
      applyOffset();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [applyOffset, zoomBy]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    drag.current = {
      originX: offset.current.x,
      originY: offset.current.y,
      x: e.clientX,
      y: e.clientY,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  // Written straight to the DOM — a setState per pointermove re-renders the
  // whole lightbox (toolbar included) and makes the pan stutter.
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    offset.current = { x: d.originX + (e.clientX - d.x), y: d.originY + (e.clientY - d.y) };
    applyOffset();
  }

  function onPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  return createPortal(
    <div
      aria-label="Diagram"
      aria-modal
      className="mermaid-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) onClose();
      }}
      role="dialog"
    >
      <div className="mermaid-stage" data-backdrop>
        <div
          className="mermaid-figure mermaid-figure-zoomed"
          onDoubleClick={reset}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={stageRef}
          style={{
            cursor: dragging ? "grabbing" : "grab",
            viewTransitionName: name,
          }}
        >
          <div
            className="mermaid-svg"
            dangerouslySetInnerHTML={{ __html: svg }}
            ref={svgRef}
            style={{ scale: `${scale}` }}
          />
        </div>

        {/* After the card in DOM order so its transition group paints on top */}
        <div className="mermaid-toolbar">
          <Button
            aria-label="Zoom out"
            className={TAP}
            disabled={scale <= MIN_SCALE}
            onClick={() => zoomBy(0.8)}
            size="icon-sm"
            variant="ghost"
          >
            <MinusIcon />
          </Button>
          <span className="mermaid-zoom-level tabular-nums">
            {Math.round(scale * 100)}
            %
          </span>
          <Button
            aria-label="Zoom in"
            className={TAP}
            disabled={scale >= MAX_SCALE}
            onClick={() => zoomBy(1.25)}
            size="icon-sm"
            variant="ghost"
          >
            <PlusIcon />
          </Button>
          <Button
            aria-label="Reset zoom"
            className={TAP}
            onClick={reset}
            size="icon-sm"
            variant="ghost"
          >
            <RotateCcwIcon />
          </Button>
          <Separator className="mx-0.5 h-4" orientation="vertical" />
          <Button
            aria-label="Close"
            className={TAP}
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function withViewTransition(update: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
