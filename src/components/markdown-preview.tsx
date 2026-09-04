import { Children, isValidElement } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "./code-block";

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <Markdown
      components={{
        pre({ children }) {
          type CodeProps = { children?: React.ReactNode; className?: string };
          const codeEl = Children.toArray(children).find(
            child => isValidElement(child) && child.type === "code",
          ) as React.ReactElement<CodeProps> | undefined;
          const lang = (codeEl?.props.className ?? "").replace("language-", "");
          const code = String(codeEl?.props.children ?? "").trimEnd();
          return <CodeBlock code={code} lang={lang} />;
        },
        table({ children }) {
          return (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          );
        },
      }}
      rehypePlugins={[rehypeRaw]}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </Markdown>
  );
}
