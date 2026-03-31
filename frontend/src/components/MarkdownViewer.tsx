import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useMemo } from "react";
import { MermaidDiagram } from "./MermaidDiagram";
import "github-markdown-css/github-markdown-light.css";
import "highlight.js/styles/github.css";
import "remark-github-blockquote-alert/alert.css";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "width",
      "height",
    ],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align"],
  },
};

function isRelativeUrl(url: string): boolean {
  return !!url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//") && !url.startsWith("data:");
}

interface MarkdownViewerProps {
  content: string;
  rawBaseUrl?: string;
}

export function MarkdownViewer({ content, rawBaseUrl }: MarkdownViewerProps) {
  const components = useMemo<Components>(() => {
    return {
      img: rawBaseUrl
        ? ({ src, ...props }) => {
            const resolved =
              src && isRelativeUrl(src) ? `${rawBaseUrl}/${src}` : src;
            return <img src={resolved} {...props} />;
          }
        : undefined,
      code: ({ className, children }) => {
        const match = className?.match(/language-mermaid/);
        if (match) {
          const code = String(children).replace(/\n$/, "");
          return <MermaidDiagram code={code} />;
        }
        return <code className={className}>{children}</code>;
      },
      pre: ({ children }) => {
        // If the child is a MermaidDiagram, render without <pre> wrapper
        const child = Array.isArray(children) ? children[0] : children;
        if (
          child &&
          typeof child === "object" &&
          "type" in child &&
          child.type === MermaidDiagram
        ) {
          return <>{children}</>;
        }
        return <pre>{children}</pre>;
      },
    };
  }, [rawBaseUrl]);

  return (
    <div className="border border-gray-200 rounded-md p-6">
      <article className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkAlert]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeSanitize, sanitizeSchema],
            rehypeHighlight,
          ]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
