import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { MermaidDiagram } from "@/components/mermaid-diagram";
import { buttonVariants } from "@/components/ui/button";
import { highlight } from "@/lib/highlighter";
import { cn } from "@/lib/utils";

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<null | string>(null);
  const [copied, setCopied] = useState(false);
  const isMermaid = lang === "mermaid";

  useEffect(() => {
    if (!lang || isMermaid) return;
    highlight(code, lang).then(setHtml).catch(() => setHtml(null));
  }, [code, isMermaid, lang]);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="group relative mb-5 mx-0.5">
      <button
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          buttonVariants({ size: "icon-sm", variant: "ghost" }),
          "absolute top-2.5 right-2.5 z-10 bg-background/70 opacity-0 backdrop-blur-sm transition-[opacity,scale] duration-150 ease-out group-hover:opacity-100 focus-visible:opacity-100 active:scale-[0.96]",
        )}
        onClick={copy}
        type="button"
      >
        <CheckIcon
          className={cn(
            "absolute size-3.5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            copied ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-sm",
          )}
        />
        <CopyIcon
          className={cn(
            "size-3.5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            copied ? "scale-[0.25] opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
          )}
        />
      </button>
      {isMermaid
        ? <MermaidDiagram code={code} />
        : html
          ? (
              <div
                className="shiki-wrap"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          : (
              <pre>
                <code>{code}</code>
              </pre>
            )}
    </div>
  );
}
