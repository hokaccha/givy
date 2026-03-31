import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import { stripTrailingNewline, detectLanguage } from "../lib/code-utils";

interface CodeViewerProps {
  code: string;
  language: string;
  fileName: string;
  filePath?: string;
  absolutePath?: string;
  githubUrl?: string;
}

interface LinePopoverState {
  lineNumber: number;
  top: number;
  left: number;
}

function LineNumberPopover({
  filePath,
  absolutePath,
  lineNumber,
  top,
  left,
  onClose,
}: {
  filePath: string;
  absolutePath?: string;
  lineNumber: number;
  top: number;
  left: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const copyPathAndLine = () => {
    navigator.clipboard.writeText(`${filePath}:${lineNumber}`);
    onClose();
  };

  const copyAbsolutePathAndLine = () => {
    if (absolutePath) {
      navigator.clipboard.writeText(`${absolutePath}:${lineNumber}`);
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[220px]"
      style={{ top, left }}
    >
      <button
        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
        onClick={copyPathAndLine}
      >
        Copy file path and line number
      </button>
      {absolutePath && (
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
          onClick={copyAbsolutePathAndLine}
        >
          Copy absolute path and line number
        </button>
      )}
    </div>
  );
}

export function CodeViewer({ code, language, fileName, filePath, absolutePath, githubUrl }: CodeViewerProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<LinePopoverState | null>(null);
  const [prevCodeKey, setPrevCodeKey] = useState("");

  const lang = language || detectLanguage(fileName);
  const trimmedCode = stripTrailingNewline(code);
  const codeKey = `${trimmedCode}:${lang}`;
  if (prevCodeKey !== codeKey) {
    setPrevCodeKey(codeKey);
    setLoading(true);
  }
  const lines = trimmedCode.split("\n");
  const lineCount = lines.length;
  const lineNumberPx = lineCount >= 1000 ? 64 : lineCount >= 100 ? 56 : 48;

  useEffect(() => {
    let cancelled = false;
    codeToHtml(trimmedCode, {
      lang,
      theme: "github-light",
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback to plain text on error
        if (!cancelled) {
          const escaped = trimmedCode
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
  }, [trimmedCode, lang]);

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
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-400 hover:text-gray-700" title="View on GitHub">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
          </a>
        )}
      </div>
      {/* Code area */}
      <div className="overflow-auto">
        <div className="flex">
          <div className="flex-shrink-0 text-right px-3 py-2 select-none bg-gray-50 border-r border-gray-200" style={{ width: lineNumberPx }}>
              {lines.map((_, i) => (
                <div
                  key={i}
                  data-line-number={i + 1}
                  className={`relative text-xs text-gray-500 leading-5 h-5 font-mono group${filePath ? " cursor-pointer" : ""}`}
                  onClick={
                    filePath
                      ? (e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setPopover({
                            lineNumber: i + 1,
                            top: rect.top,
                            left: rect.right + 4,
                          });
                        }
                      : undefined
                  }
                >
                  {filePath && (
                    <span className="absolute -left-2 top-0.5 h-4 flex items-center justify-center rounded bg-gray-200 px-0.5 opacity-0 group-hover:opacity-100 text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="13" cy="8" r="1.5" />
                      </svg>
                    </span>
                  )}
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
      {popover && filePath && (
        <LineNumberPopover
          filePath={filePath}
          absolutePath={absolutePath}
          lineNumber={popover.lineNumber}
          top={popover.top}
          left={popover.left}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
