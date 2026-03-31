import React, { useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import type { DiffFile, DiffLine, DiffHunk } from "../lib/diff-parser";
import type { Comment } from "../lib/comments";
import { DiffCommentForm, CommentDisplay } from "./DiffComment";
import { CopyPromptButton } from "./CopyPromptButton";

type ViewMode = "split" | "unified";

interface DiffViewerProps {
  files: DiffFile[];
  comments: Comment[];
  onAddComment: (input: Omit<Comment, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateComment: (id: string, body: string) => void;
  onDeleteComment: (id: string) => void;
  onCopyAllPrompts: () => void;
  onClearAllComments: () => void;
}

function fileAdditions(file: DiffFile): number {
  return file.hunks.reduce((sum, h) => sum + h.lines.filter((l) => l.type === "add").length, 0);
}

function fileDeletions(file: DiffFile): number {
  return file.hunks.reduce((sum, h) => sum + h.lines.filter((l) => l.type === "remove").length, 0);
}

export function DiffViewer({
  files,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCopyAllPrompts,
  onClearAllComments,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("givy:viewMode");
    return saved === "split" || saved === "unified" ? saved : "unified";
  });

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("givy:viewMode", mode);
  };
  const [filterText, setFilterText] = useState("");

  const filteredFiles = filterText
    ? files.filter((f) => f.newPath.toLowerCase().includes(filterText.toLowerCase()))
    : files;

  const totalAdditions = files.reduce((sum, f) => sum + fileAdditions(f), 0);
  const totalDeletions = files.reduce((sum, f) => sum + fileDeletions(f), 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
          <div data-testid="diff-stats" className="text-sm text-[#1f2328]">
            Showing{" "}
            <strong>{files.length}</strong>{" "}
            changed file{files.length !== 1 ? "s" : ""}{" "}
            with{" "}
            <span className="text-[#1a7f37] font-semibold">{totalAdditions} additions</span>
            {" "}and{" "}
            <span className="text-[#cf222e] font-semibold">{totalDeletions} deletions</span>.
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[#d0d7de] overflow-hidden">
              <button
                onClick={() => changeViewMode("split")}
                className={`px-3 py-1.5 text-sm font-medium cursor-pointer ${viewMode === "split" ? "bg-[#ddf4ff] text-[#0969da] border-[#0969da]" : "bg-[#f6f8fa] text-[#57606a] hover:bg-[#eaeef2]"}`}
              >
                Split
              </button>
              <button
                onClick={() => changeViewMode("unified")}
                className={`px-3 py-1.5 text-sm font-medium border-l border-[#d0d7de] cursor-pointer ${viewMode === "unified" ? "bg-[#ddf4ff] text-[#0969da] border-[#0969da]" : "bg-[#f6f8fa] text-[#57606a] hover:bg-[#eaeef2]"}`}
              >
                Unified
              </button>
            </div>
            <CopyPromptButton label="Copy All Comments" onClick={onCopyAllPrompts} />
            <button
              onClick={() => {
                if (window.confirm("Clear all comments?")) {
                  onClearAllComments();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-[#ffebe9] hover:text-[#cf222e] hover:border-[#cf222e] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Comments
            </button>
          </div>
        </div>

      <div className="flex gap-4">
        {/* Left sidebar - File tree */}
        <div className="w-64 shrink-0">
          <div className="sticky top-4">
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636c76]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
              </svg>
              <input
                type="search"
                placeholder="Filter files..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full text-sm pl-8 pr-3 py-1.5 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]"
              />
            </div>
            <div data-testid="file-list" className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              {filteredFiles.map((file) => {
                return (
                  <a
                    key={file.newPath}
                    href={`#diff-${file.newPath}`}
                    className="flex items-center gap-2 px-1 py-1.5 text-sm text-[#1f2328] hover:bg-[#f6f8fa] rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`diff-${file.newPath}`)?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0 text-[#57606a]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
                    </svg>
                    <span className="truncate">{file.newPath}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side - Diff content */}
        <div className="flex-1 min-w-0">
          {files.map((file) => (
            <FileDiff
              key={file.newPath}
              file={file}
              viewMode={viewMode}
              comments={comments.filter((c) => c.filePath === file.newPath)}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FileDiffProps {
  file: DiffFile;
  viewMode: ViewMode;
  comments: Comment[];
  onAddComment: (input: Omit<Comment, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateComment: (id: string, body: string) => void;
  onDeleteComment: (id: string) => void;
}


function FileDiff({
  file,
  viewMode,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: FileDiffProps) {
  const { owner, repo } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [commentForm, setCommentForm] = useState<{
    startLine: number;
    endLine: number;
    side: "left" | "right";
  } | null>(null);

  const [selectStart, setSelectStart] = useState<{
    line: number;
    side: "left" | "right";
  } | null>(null);

  const adds = fileAdditions(file);
  const dels = fileDeletions(file);
  const total = adds + dels;
  const maxBlocks = 5;
  const addBlocks = total > 0 ? Math.round((adds / total) * maxBlocks) : 0;
  const delBlocks = total > 0 ? maxBlocks - addBlocks : 0;

  const handleGutterClick = useCallback(
    (line: number, side: "left" | "right", shiftKey: boolean) => {
      if (shiftKey && selectStart && selectStart.side === side) {
        const start = Math.min(selectStart.line, line);
        const end = Math.max(selectStart.line, line);
        setCommentForm({ startLine: start, endLine: end, side });
        setSelectStart(null);
      } else {
        setSelectStart({ line, side });
        setCommentForm({ startLine: line, endLine: line, side });
      }
    },
    [selectStart]
  );

  const handleSubmitComment = useCallback(
    (body: string) => {
      if (!commentForm) return;
      onAddComment({
        filePath: file.newPath,
        startLine: commentForm.startLine,
        endLine: commentForm.endLine,
        side: commentForm.side,
        body,
      });
      setCommentForm(null);
    },
    [commentForm, file.newPath, onAddComment]
  );

  return (
    <div
      id={`diff-${file.newPath}`}
      data-testid={`diff-file-${file.newPath}`}
      className="border border-[#d0d7de] rounded-md mb-4 overflow-hidden"
    >
      {/* File header */}
      <div className="flex items-center gap-2 bg-[#f6f8fa] border-b border-[#d0d7de] px-3 py-2 sticky top-0 z-10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#57606a] hover:text-[#1f2328]"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <Link to={`/${owner}/${repo}/blob/${file.newPath}`} className="text-xs font-mono text-[#1f2328] font-semibold hover:text-[#0969da] hover:underline">{file.newPath}</Link>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-[#1a7f37]">+{adds}</span>
          <span className="text-[#cf222e]">-{dels}</span>
          <span className="flex gap-px ml-1">
            {Array.from({ length: addBlocks }).map((_, i) => (
              <span key={`a${i}`} className="inline-block w-2 h-2 rounded-sm bg-[#2da44e]" />
            ))}
            {Array.from({ length: delBlocks }).map((_, i) => (
              <span key={`d${i}`} className="inline-block w-2 h-2 rounded-sm bg-[#cf222e]" />
            ))}
            {total === 0 && (
              <span className="inline-block w-2 h-2 rounded-sm bg-[#d0d7de]" />
            )}
          </span>
        </div>
      </div>

      {/* Diff content */}
      {!collapsed && (
        viewMode === "split" ? (
          <SplitDiffView
            file={file}
            comments={comments}
            commentForm={commentForm}
            onGutterClick={handleGutterClick}
            onSubmitComment={handleSubmitComment}
            onCancelComment={() => setCommentForm(null)}
            onUpdateComment={onUpdateComment}
            onDeleteComment={onDeleteComment}
          />
        ) : (
          <UnifiedDiffView
            file={file}
            comments={comments}
            commentForm={commentForm}
            onGutterClick={handleGutterClick}
            onSubmitComment={handleSubmitComment}
            onCancelComment={() => setCommentForm(null)}
            onUpdateComment={onUpdateComment}
            onDeleteComment={onDeleteComment}
          />
        )
      )}
    </div>
  );
}

// --- Shared helpers ---

interface DiffViewProps {
  file: DiffFile;
  comments: Comment[];
  commentForm: { startLine: number; endLine: number; side: "left" | "right" } | null;
  onGutterClick: (line: number, side: "left" | "right", shiftKey: boolean) => void;
  onSubmitComment: (body: string) => void;
  onCancelComment: () => void;
  onUpdateComment: (id: string, body: string) => void;
  onDeleteComment: (id: string) => void;
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

function GutterCell({
  lineNumber,
  side,
  type,
  clickable = false,
  onClick,
}: {
  lineNumber: number | undefined;
  side: "left" | "right";
  type: DiffLine["type"];
  clickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      data-line={lineNumber ?? ""}
      data-side={side}
      className={`group/gutter relative w-[1%] min-w-[50px] text-right px-2.5 py-0 align-top select-none ${clickable ? "cursor-pointer" : ""} ${gutterClass(type)}`}
      onClick={onClick}
    >
      {clickable && (
        <span className="absolute left-0 top-0 -translate-x-1/2 hidden group-hover/gutter:flex items-center justify-center w-5 h-5 bg-[#0969da] text-white rounded-md cursor-pointer z-10">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
        </span>
      )}
      {lineNumber ?? ""}
    </td>
  );
}

function HunkHeaderRow({ hunk, colSpan }: { hunk: DiffHunk; colSpan: number }) {
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

function InlineCommentRow({
  layout,
  commentForm,
  lineComments,
  onSubmitComment,
  onCancelComment,
  onUpdateComment,
  onDeleteComment,
}: {
  layout:
    | { mode: "unified"; gutterTypes: DiffLine["type"][] }
    | { mode: "split"; leftType: DiffLine["type"]; rightType: DiffLine["type"] };
  commentForm: DiffViewProps["commentForm"] | null;
  lineComments: Comment[];
  onSubmitComment: (body: string) => void;
  onCancelComment: () => void;
  onUpdateComment: (id: string, body: string) => void;
  onDeleteComment: (id: string) => void;
}) {
  if (!commentForm && lineComments.length === 0) return null;

  const commentContent = (
    <div className="py-2 px-4 max-w-[700px] font-sans">
      {lineComments.map((c) => (
        <CommentDisplay
          key={c.id}
          body={c.body}
          onEdit={(body) => onUpdateComment(c.id, body)}
          onDelete={() => onDeleteComment(c.id)}
        />
      ))}
      {commentForm && (
        <DiffCommentForm
          startLine={commentForm.startLine}
          endLine={commentForm.endLine}
          onSubmit={onSubmitComment}
          onCancel={onCancelComment}
        />
      )}
    </div>
  );

  if (layout.mode === "split") {
    // Match split view column order: [left gutter | left content | right gutter | right content]
    return (
      <tr className="bg-white">
        <td className={gutterClass(layout.leftType)} />
        <td className={lineClass(layout.leftType)} />
        <td className={gutterClass(layout.rightType)} />
        <td>{commentContent}</td>
      </tr>
    );
  }

  return (
    <tr className="bg-white">
      {layout.gutterTypes.map((type, i) => (
        <td key={i} className={gutterClass(type)} />
      ))}
      <td>{commentContent}</td>
    </tr>
  );
}

// --- Split View ---

function SplitDiffView({
  file,
  comments,
  commentForm,
  onGutterClick,
  onSubmitComment,
  onCancelComment,
  onUpdateComment,
  onDeleteComment,
}: DiffViewProps) {
  const rows: Array<{ left: DiffLine | null; right: DiffLine | null; hunk?: DiffHunk }> = [];

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
    <div data-testid="diff-split">
      <table className="w-full text-xs font-mono border-collapse leading-5">
        <tbody>
          {rows.map((row, idx) => {
            if (row.hunk) {
              return <HunkHeaderRow key={idx} hunk={row.hunk} colSpan={4} />;
            }
            const leftLine = row.left?.oldLine;
            const rightLine = row.right?.newLine;
            const leftType = row.left?.type ?? "context";
            const rightType = row.right?.type ?? "context";

            // Determine the line number to match for inline comments
            const matchLine = rightLine ?? leftLine;
            const matchSide = rightLine ? "right" : "left";
            const showForm = commentForm && commentForm.endLine === matchLine && commentForm.side === matchSide;
            const lineComments = comments.filter(
              (c) => c.endLine === matchLine && c.side === matchSide
            );

            return (
              <React.Fragment key={idx}>
                <tr>
                  <GutterCell
                    lineNumber={leftLine ?? undefined}
                    side="left"
                    type={leftType}
                    clickable={!!leftLine}
                    onClick={(e) => {
                      if (leftLine) onGutterClick(leftLine, "left", e.shiftKey);
                    }}
                  />
                  <td className={`px-2 py-0 w-[49%] whitespace-pre-wrap break-all ${lineClass(leftType)}`}>
                    {row.left?.content ?? ""}
                  </td>
                  <GutterCell
                    lineNumber={rightLine ?? undefined}
                    side="right"
                    type={rightType}
                    clickable={!!rightLine}
                    onClick={(e) => {
                      if (rightLine) onGutterClick(rightLine, "right", e.shiftKey);
                    }}
                  />
                  <td className={`px-2 py-0 w-[49%] whitespace-pre-wrap break-all ${lineClass(rightType)}`}>
                    {row.right?.content ?? ""}
                  </td>
                </tr>
                <InlineCommentRow
                  layout={{ mode: "split", leftType, rightType }}
                  commentForm={showForm ? commentForm : null}
                  lineComments={lineComments}
                  onSubmitComment={onSubmitComment}
                  onCancelComment={onCancelComment}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                />
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Unified View ---

function UnifiedDiffView({
  file,
  comments,
  commentForm,
  onGutterClick,
  onSubmitComment,
  onCancelComment,
  onUpdateComment,
  onDeleteComment,
}: DiffViewProps) {
  return (
    <div data-testid="diff-unified">
      <table className="w-full text-xs font-mono border-collapse leading-5">
        <tbody>
          {file.hunks.map((hunk, hunkIdx) => (
            <React.Fragment key={hunkIdx}>
              <HunkHeaderRow hunk={hunk} colSpan={3} />
              {hunk.lines.map((line, idx) => {
                const matchLine = line.newLine ?? line.oldLine;
                const matchSide = line.newLine != null ? "right" : "left";
                const showForm = commentForm && commentForm.endLine === matchLine && commentForm.side === matchSide;
                const lineComments = comments.filter(
                  (c) => c.endLine === matchLine && c.side === matchSide
                );

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <GutterCell
                        lineNumber={line.oldLine ?? undefined}
                        side="left"
                        type={line.type}
                      />
                      <GutterCell
                        lineNumber={line.newLine ?? undefined}
                        side="right"
                        type={line.type}
                        clickable
                        onClick={(e) => {
                          const ln = line.newLine ?? line.oldLine;
                          const side = line.newLine != null ? "right" : "left";
                          if (ln) onGutterClick(ln, side, e.shiftKey);
                        }}
                      />
                      <td className={`px-2 py-0 whitespace-pre-wrap break-all ${lineClass(line.type)}`}>
                        <span className="inline-block w-4 select-none text-[#636c76]">
                          {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                        </span>
                        {line.content}
                      </td>
                    </tr>
                    <InlineCommentRow
                      layout={{ mode: "unified", gutterTypes: [line.type, line.type] }}
                      commentForm={showForm ? commentForm : null}
                      lineComments={lineComments}
                      onSubmitComment={onSubmitComment}
                      onCancelComment={onCancelComment}
                      onUpdateComment={onUpdateComment}
                      onDeleteComment={onDeleteComment}
                    />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
