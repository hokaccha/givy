import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import { remarkAlert } from "remark-github-blockquote-alert";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useMemo, useRef, useState } from "react";
import { MermaidDiagram } from "./MermaidDiagram";
import "github-markdown-css/github-markdown-light.css";
import "highlight.js/styles/github.css";
import "remark-github-blockquote-alert/alert.css";
import "katex/dist/katex.min.css";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "svg",
    "path",
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height"],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", "math", "math-inline", "math-display"],
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      [
        "className",
        "math",
        "math-inline",
        "math-display",
        "markdown-alert",
        "markdown-alert-note",
        "markdown-alert-tip",
        "markdown-alert-important",
        "markdown-alert-warning",
        "markdown-alert-caution",
      ],
    ],
    p: [
      ...(defaultSchema.attributes?.p ?? []),
      ["className", "markdown-alert-title"],
    ],
    svg: ["viewBox", "width", "height", "ariaHidden", ["className", "octicon"]],
    path: ["d"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align", "dir"],
  },
};

function isRelativeUrl(url: string): boolean {
  return (
    !!url &&
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("//") &&
    !url.startsWith("data:")
  );
}

function extractFrontmatter(content: string): {
  metadata: Record<string, string> | null;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { metadata: null, body: content };
  const pairs: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      pairs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  if (Object.keys(pairs).length === 0) return { metadata: null, body: content };
  return { metadata: pairs, body: content.slice(match[0].length) };
}

function FrontmatterDisplay({
  metadata,
}: {
  metadata: Record<string, string>;
}) {
  return (
    <details className="mb-4 border border-gray-200 rounded-md">
      <summary className="px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer bg-gray-50 rounded-t-md">
        Metadata
      </summary>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(metadata).map(([key, value]) => (
            <tr key={key} className="border-t border-gray-200">
              <td className="px-4 py-1.5 font-mono text-gray-500 whitespace-nowrap">
                {key}
              </td>
              <td className="px-4 py-1.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function CopyableCodeBlock({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-wrapper">
      <button
        onClick={handleCopy}
        className="code-copy-button"
        aria-label="Copy code"
      >
        {copied ? (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

interface MarkdownViewerProps {
  content: string;
  rawBaseUrl?: string;
}

export function MarkdownViewer({ content, rawBaseUrl }: MarkdownViewerProps) {
  const { metadata, body } = useMemo(
    () => extractFrontmatter(content),
    [content],
  );

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
        return <CopyableCodeBlock>{children}</CopyableCodeBlock>;
      },
    };
  }, [rawBaseUrl]);

  return (
    <div className="border border-gray-200 rounded-md p-6">
      <article className="markdown-body">
        {metadata && <FrontmatterDisplay metadata={metadata} />}
        <ReactMarkdown
          remarkPlugins={[remarkFrontmatter, remarkGfm, remarkMath, remarkAlert]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeSanitize, sanitizeSchema],
            rehypeKatex,
            rehypeHighlight,
          ]}
          components={components}
        >
          {body}
        </ReactMarkdown>
      </article>
    </div>
  );
}
