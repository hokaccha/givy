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
      <div className="border border-gray-200 rounded-md p-4 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-auto">
      <div className="relative">
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200" />
        <div className="flex">
          <div className="w-12 flex-shrink-0 text-right pr-2 pt-4 pb-4 select-none">
            {code.split("\n").map((_, i) => (
              <div
                key={i}
                data-line-number={i + 1}
                className="text-xs text-gray-400 leading-5 h-5"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div
            className="flex-1 overflow-auto text-sm [&_pre]:!m-0 [&_pre]:!p-4 [&_pre]:!bg-transparent [&_code]:leading-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
