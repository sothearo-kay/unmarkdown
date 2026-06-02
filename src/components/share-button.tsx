import { CopyIcon, LinkIcon, Share2Icon } from "lucide-react";

import { toastManager } from "@/components/ui/toast";
import { buildShareURL } from "@/lib/share";

import { buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/menu";

export function ShareButton({ content, disabled }: { content: string; disabled?: boolean }) {
  function copyMarkdown() {
    navigator.clipboard.writeText(content);
    toastManager.add({ id: "copy-markdown", title: "Copied Markdown", type: "success" });
  }

  function copyLink() {
    navigator.clipboard.writeText(buildShareURL(content));
    toastManager.add({ id: "copy-link", title: "Copied Share Link", type: "success" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ size: "xs", variant: "ghost" })} disabled={disabled}>
        <Share2Icon className="size-3.5" />
        Share
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={6}>
        <DropdownMenuItem className="text-xs!" onClick={copyMarkdown}>
          <CopyIcon className="size-3.5 opacity-60" />
          Copy Markdown
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs!" onClick={copyLink}>
          <LinkIcon className="size-3.5 opacity-60" />
          Copy Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
