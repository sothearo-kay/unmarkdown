import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { stripText } from "@/lib/notes";
import { cn } from "@/lib/utils";

interface HeadingNode {
  children: HeadingNode[];
  level: number;
  text: string;
}

export function OutlineTree({ content }: { content: string }) {
  const [open, setOpen] = useState(true);
  const roots = buildTree(content);

  return (
    <ul>
      <li>
        <div
          className="flex cursor-pointer items-center gap-1 py-1 pr-3 text-[13px] text-foreground transition-colors hover:bg-foreground/5"
          onClick={() => setOpen(o => !o)}
          style={{ paddingLeft: "8px" }}
        >
          <span
            className={cn(
              "flex size-[13px] shrink-0 items-center justify-center text-muted-foreground/60 transition-transform duration-150",
              open ? "rotate-90" : "",
            )}
          >
            <ChevronRightIcon className="size-[13px]" />
          </span>
          <span>/</span>
        </div>
        {open && (
          <ul>
            {roots.length === 0
              ? (
                  <li className="py-1 pr-3 text-[13px] text-muted-foreground " style={{ paddingLeft: "36px" }}>
                    No headings
                  </li>
                )
              : roots.map((node, i) => (
                  <TreeNode depth={1} key={i} node={node} />
                ))}
          </ul>
        )}
      </li>
    </ul>
  );
}

function buildTree(content: string): HeadingNode[] {
  const lines = content.split("\n");
  const roots: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+)/);
    if (!m) continue;
    const level = m[1].length;
    const text = stripText(m[2]);
    const node: HeadingNode = { children: [], level, text };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    }
    else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }

  return roots;
}

function TreeNode({ depth = 0, node }: { depth?: number; node: HeadingNode }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group flex cursor-pointer items-center gap-1 py-1 pr-3 text-[13px] text-foreground transition-colors hover:bg-foreground/5"
        onClick={() => hasChildren && setOpen(o => !o)}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <span
          className={cn(
            "flex size-[13px] shrink-0 items-center justify-center transition-transform duration-150",
            hasChildren ? "opacity-50" : "opacity-0",
            open && hasChildren ? "rotate-90" : "",
          )}
        >
          <ChevronRightIcon className="size-[13px]" />
        </span>
        <span className="truncate ">{node.text}</span>
        <span className="ml-auto shrink-0  text-[10px] font-bold tracking-[0.04em] opacity-40">
          H
          {node.level}
        </span>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((child, i) => (
            <TreeNode depth={depth + 1} key={i} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
