import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeViewerProps {
  code: string;
  language: string;
  fileName: string;
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    go: "go",
    py: "python",
    rb: "ruby",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    css: "css",
    scss: "scss",
    html: "html",
    xml: "xml",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "fish",
    sql: "sql",
    graphql: "graphql",
    proto: "proto",
    dockerfile: "dockerfile",
    makefile: "makefile",
    md: "markdown",
  };
  return map[ext] || "text";
}

export function CodeViewer({ code, language, fileName }: CodeViewerProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const lang = language || detectLanguage(fileName);
  const lines = code.split("\n");
  const lineCount = lines.length;
  const lineNumberPx = lineCount >= 1000 ? 64 : lineCount >= 100 ? 56 : 48;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    codeToHtml(code, {
      lang,
      theme: "github-light",
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback to plain text on error
        if (!cancelled) {
          const escaped = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          setHtml(`<pre><code>${escaped}</code></pre>`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-md p-4 text-xs text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      {/* File header */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-700 font-medium">{fileName}</span>
        <span className="ml-auto text-xs text-gray-500">
          {lineCount} lines
        </span>
      </div>
      {/* Code area */}
      <div className="overflow-auto">
        <div className="flex">
          <div className="flex-shrink-0 text-right px-3 py-2 select-none bg-gray-50 border-r border-gray-200" style={{ width: lineNumberPx }}>
              {lines.map((_, i) => (
                <div
                  key={i}
                  data-line-number={i + 1}
                  className="text-xs text-gray-500 leading-5 h-5 font-mono"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div
              className="flex-1 overflow-auto text-xs [&_pre]:!m-0 [&_pre]:!py-2 [&_pre]:!pl-4 [&_pre]:!pr-4 [&_pre]:!bg-transparent [&_code]:leading-5 [&_code]:!text-xs"
              dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
      </div>
    </div>
  );
}
