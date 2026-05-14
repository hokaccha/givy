import React, { useCallback, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import type { DiffFile, DiffLine, DiffHunk } from "../lib/diff-parser";
import { FileTreeNav } from "./FileTreeNav";

type ViewMode = "split" | "unified";

interface SimpleDiffViewerProps {
  files: DiffFile[];
}

function fileAdditions(file: DiffFile): number {
  return file.hunks.reduce(
    (sum, h) => sum + h.lines.filter((l) => l.type === "add").length,
    0
  );
}

function fileDeletions(file: DiffFile): number {
  return file.hunks.reduce(
    (sum, h) => sum + h.lines.filter((l) => l.type === "remove").length,
    0
  );
}

export function SimpleDiffViewer({ files }: SimpleDiffViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("givy:viewMode");
    return saved === "split" || saved === "unified" ? saved : "unified";
  });

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("givy:viewMode", mode);
  };

  const filePaths = useMemo(() => files.map((f) => f.newPath), [files]);

  const scrollToFile = useCallback((path: string) => {
    document
      .getElementById(`diff-${path}`)
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const totalAdditions = files.reduce((sum, f) => sum + fileAdditions(f), 0);
  const totalDeletions = files.reduce((sum, f) => sum + fileDeletions(f), 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div data-testid="diff-stats" className="text-sm text-[#1f2328]">
          Showing <strong>{files.length}</strong> changed file
          {files.length !== 1 ? "s" : ""} with{" "}
          <span className="text-[#1a7f37] font-semibold">
            {totalAdditions} additions
          </span>{" "}
          and{" "}
          <span className="text-[#cf222e] font-semibold">
            {totalDeletions} deletions
          </span>
          .
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-[#d0d7de] overflow-hidden">
            <button
              onClick={() => changeViewMode("split")}
              className={`px-3 py-1 text-xs font-medium ${viewMode === "split" ? "bg-[#ddf4ff] text-[#0969da] border-[#0969da]" : "bg-[#f6f8fa] text-[#57606a] hover:bg-[#eaeef2]"}`}
            >
              Split
            </button>
            <button
              onClick={() => changeViewMode("unified")}
              className={`px-3 py-1 text-xs font-medium border-l border-[#d0d7de] ${viewMode === "unified" ? "bg-[#ddf4ff] text-[#0969da] border-[#0969da]" : "bg-[#f6f8fa] text-[#57606a] hover:bg-[#eaeef2]"}`}
            >
              Unified
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left sidebar - File tree */}
        <div className="w-64 shrink-0">
          <FileTreeNav paths={filePaths} onFileClick={scrollToFile} />
        </div>

        {/* Right side - Diff content */}
        <div className="flex-1 min-w-0">
          {files.map((file) => (
            <SimpleFileDiff
              key={file.newPath}
              file={file}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleFileDiff({
  file,
  viewMode,
}: {
  file: DiffFile;
  viewMode: ViewMode;
}) {
  const { owner, repo } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const adds = fileAdditions(file);
  const dels = fileDeletions(file);
  const total = adds + dels;
  const maxBlocks = 5;
  const addBlocks = total > 0 ? Math.round((adds / total) * maxBlocks) : 0;
  const delBlocks = total > 0 ? maxBlocks - addBlocks : 0;

  return (
    <div
      id={`diff-${file.newPath}`}
      className="border border-[#d0d7de] rounded-md mb-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 bg-[#f6f8fa] border-b border-[#d0d7de] px-3 py-2 sticky top-0 z-10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#57606a] hover:text-[#1f2328]"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : ""}`}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <Link to={`/${owner}/${repo}/blob/${file.newPath}`} className="text-xs font-mono text-[#1f2328] font-semibold hover:text-[#0969da] hover:underline">
          {file.newPath}
        </Link>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-[#1a7f37]">+{adds}</span>
          <span className="text-[#cf222e]">-{dels}</span>
          <span className="flex gap-px ml-1">
            {Array.from({ length: addBlocks }).map((_, i) => (
              <span
                key={`a${i}`}
                className="inline-block w-2 h-2 rounded-sm bg-[#2da44e]"
              />
            ))}
            {Array.from({ length: delBlocks }).map((_, i) => (
              <span
                key={`d${i}`}
                className="inline-block w-2 h-2 rounded-sm bg-[#cf222e]"
              />
            ))}
            {total === 0 && (
              <span className="inline-block w-2 h-2 rounded-sm bg-[#d0d7de]" />
            )}
          </span>
        </div>
      </div>

      {!collapsed &&
        (viewMode === "split" ? (
          <SimpleSplitView file={file} />
        ) : (
          <SimpleUnifiedView file={file} />
        ))}
    </div>
  );
}

function lineClass(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "diff-line-add bg-[#e6ffec]";
    case "remove":
      return "diff-line-remove bg-[#ffebe9]";
    default:
      return "";
  }
}

function gutterClass(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "bg-[#aceebb] text-[#24292f]";
    case "remove":
      return "bg-[#ffd7d5] text-[#24292f]";
    default:
      return "text-[#6e7781]";
  }
}

function HunkHeaderRow({
  hunk,
  colSpan,
}: {
  hunk: DiffHunk;
  colSpan: number;
}) {
  const text = `@@ -${hunk.header.oldStart},${hunk.header.oldCount} +${hunk.header.newStart},${hunk.header.newCount} @@ ${hunk.header.section}`;
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="bg-[#ddf4ff] text-[#0550ae] text-xs font-mono px-3 py-1 select-none"
      >
        {text}
      </td>
    </tr>
  );
}

function SimpleSplitView({ file }: { file: DiffFile }) {
  const rows: Array<{
    left: DiffLine | null;
    right: DiffLine | null;
    hunk?: DiffHunk;
  }> = [];

  for (const hunk of file.hunks) {
    rows.push({ left: null, right: null, hunk });
    let i = 0;
    while (i < hunk.lines.length) {
      const line = hunk.lines[i];
      if (line.type === "context") {
        rows.push({ left: line, right: line });
        i++;
      } else if (line.type === "remove") {
        const removes: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "remove") {
          removes.push(hunk.lines[i]);
          i++;
        }
        const adds: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "add") {
          adds.push(hunk.lines[i]);
          i++;
        }
        const max = Math.max(removes.length, adds.length);
        for (let j = 0; j < max; j++) {
          rows.push({
            left: j < removes.length ? removes[j] : null,
            right: j < adds.length ? adds[j] : null,
          });
        }
      } else if (line.type === "add") {
        rows.push({ left: null, right: line });
        i++;
      }
    }
  }

  return (
    <div>
      <table className="w-full text-xs font-mono border-collapse leading-5">
        <tbody>
          {rows.map((row, idx) => {
            if (row.hunk) {
              return <HunkHeaderRow key={idx} hunk={row.hunk} colSpan={4} />;
            }
            const leftType = row.left?.type ?? "context";
            const rightType = row.right?.type ?? "context";

            return (
              <tr key={idx}>
                <td
                  className={`w-[1%] min-w-[50px] text-right px-2.5 py-0 align-top select-none ${gutterClass(leftType)}`}
                >
                  {row.left?.oldLine ?? ""}
                </td>
                <td
                  className={`px-2 py-0 w-[49%] whitespace-pre-wrap break-all ${lineClass(leftType)}`}
                >
                  {row.left?.content ?? ""}
                </td>
                <td
                  className={`w-[1%] min-w-[50px] text-right px-2.5 py-0 align-top select-none ${gutterClass(rightType)}`}
                >
                  {row.right?.newLine ?? ""}
                </td>
                <td
                  className={`px-2 py-0 w-[49%] whitespace-pre-wrap break-all ${lineClass(rightType)}`}
                >
                  {row.right?.content ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SimpleUnifiedView({ file }: { file: DiffFile }) {
  return (
    <div>
      <table className="w-full text-xs font-mono border-collapse leading-5">
        <tbody>
          {file.hunks.map((hunk, hunkIdx) => (
            <React.Fragment key={hunkIdx}>
              <HunkHeaderRow hunk={hunk} colSpan={3} />
              {hunk.lines.map((line, idx) => (
                <tr key={idx}>
                  <td
                    className={`w-[1%] min-w-[50px] text-right px-2.5 py-0 align-top select-none ${gutterClass(line.type)}`}
                  >
                    {line.oldLine ?? ""}
                  </td>
                  <td
                    className={`w-[1%] min-w-[50px] text-right px-2.5 py-0 align-top select-none ${gutterClass(line.type)}`}
                  >
                    {line.newLine ?? ""}
                  </td>
                  <td
                    className={`px-2 py-0 whitespace-pre-wrap break-all ${lineClass(line.type)}`}
                  >
                    <span className="inline-block w-4 select-none text-[#636c76]">
                      {line.type === "add"
                        ? "+"
                        : line.type === "remove"
                          ? "-"
                          : " "}
                    </span>
                    {line.content}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
