import { useState, useCallback } from "react";
import type { DiffFile, DiffLine } from "../lib/diff-parser";
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
  onCopyPrompt: (filePath: string) => void;
  onCopyAllPrompts: () => void;
}

export function DiffViewer({
  files,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCopyPrompt,
  onCopyAllPrompts,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div data-testid="diff-stats" className="text-sm text-gray-600">
          {files.length} file{files.length !== 1 ? "s" : ""} changed
        </div>
        <div className="flex items-center gap-2">
          <CopyPromptButton label="Copy All Prompt" onClick={onCopyAllPrompts} />
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 text-sm ${viewMode === "split" ? "bg-blue-50 text-blue-700 font-medium" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${viewMode === "unified" ? "bg-blue-50 text-blue-700 font-medium" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Unified
            </button>
          </div>
        </div>
      </div>

      {/* File list */}
      <div data-testid="file-list" className="border border-gray-200 rounded-md mb-4 p-3">
        <ul className="space-y-1">
          {files.map((file) => (
            <li key={file.newPath}>
              <a
                href={`#diff-${file.newPath}`}
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`diff-${file.newPath}`)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {file.newPath}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Diffs */}
      {files.map((file) => (
        <FileDiff
          key={file.newPath}
          file={file}
          viewMode={viewMode}
          comments={comments.filter((c) => c.filePath === file.newPath)}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onCopyPrompt={() => onCopyPrompt(file.newPath)}
        />
      ))}
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
  onCopyPrompt: () => void;
}

function FileDiff({
  file,
  viewMode,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCopyPrompt,
}: FileDiffProps) {
  const [commentForm, setCommentForm] = useState<{
    startLine: number;
    endLine: number;
    side: "left" | "right";
  } | null>(null);

  const [selectStart, setSelectStart] = useState<{
    line: number;
    side: "left" | "right";
  } | null>(null);

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
      className="border border-gray-200 rounded-md mb-4 overflow-hidden"
    >
      {/* File header */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-mono">{file.newPath}</span>
        <CopyPromptButton label="Copy Prompt" onClick={onCopyPrompt} />
      </div>

      {/* Diff content */}
      {viewMode === "split" ? (
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
      )}
    </div>
  );
}

// --- Split View ---

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
      return "diff-line-add bg-green-50";
    case "remove":
      return "diff-line-remove bg-red-50";
    default:
      return "";
  }
}

function gutterClass(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "bg-green-100 text-green-700";
    case "remove":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-50 text-gray-400";
  }
}

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
  // Build paired rows for split view
  const rows: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];

  for (const hunk of file.hunks) {
    let i = 0;
    while (i < hunk.lines.length) {
      const line = hunk.lines[i];
      if (line.type === "context") {
        rows.push({ left: line, right: line });
        i++;
      } else if (line.type === "remove") {
        // Pair removes with subsequent adds
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
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {rows.map((row, idx) => {
            const leftLine = row.left?.oldLine;
            const rightLine = row.right?.newLine;
            const leftType = row.left?.type ?? "context";
            const rightType = row.right?.type ?? "context";

            return (
              <tr key={idx}>
                {/* Left gutter */}
                <td
                  data-line={leftLine ?? ""}
                  data-side="left"
                  className={`w-10 text-right px-2 py-0 select-none cursor-pointer border-r border-gray-200 ${gutterClass(leftType)}`}
                  onClick={(e) => {
                    if (leftLine) onGutterClick(leftLine, "left", e.shiftKey);
                  }}
                >
                  {leftLine ?? ""}
                </td>
                {/* Left content */}
                <td className={`px-2 py-0 w-1/2 whitespace-pre-wrap break-all ${lineClass(leftType)}`}>
                  {row.left?.content ?? ""}
                </td>
                {/* Right gutter */}
                <td
                  data-line={rightLine ?? ""}
                  data-side="right"
                  className={`w-10 text-right px-2 py-0 select-none cursor-pointer border-l border-r border-gray-200 ${gutterClass(rightType)}`}
                  onClick={(e) => {
                    if (rightLine) onGutterClick(rightLine, "right", e.shiftKey);
                  }}
                >
                  {rightLine ?? ""}
                </td>
                {/* Right content */}
                <td className={`px-2 py-0 w-1/2 whitespace-pre-wrap break-all ${lineClass(rightType)}`}>
                  {row.right?.content ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Comment form */}
      {commentForm && (
        <div className="px-4">
          <DiffCommentForm
            startLine={commentForm.startLine}
            endLine={commentForm.endLine}
            onSubmit={onSubmitComment}
            onCancel={onCancelComment}
          />
        </div>
      )}

      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="px-4 pb-2">
          {comments.map((c) => (
            <CommentDisplay
              key={c.id}
              body={c.body}
              onEdit={(body) => onUpdateComment(c.id, body)}
              onDelete={() => onDeleteComment(c.id)}
            />
          ))}
        </div>
      )}
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
  const allLines: DiffLine[] = file.hunks.flatMap((h) => h.lines);

  return (
    <div data-testid="diff-unified">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {allLines.map((line, idx) => (
            <tr key={idx}>
              <td
                data-line={line.oldLine ?? ""}
                data-side="left"
                className={`w-10 text-right px-2 py-0 select-none border-r border-gray-200 ${gutterClass(line.type)}`}
              >
                {line.oldLine ?? ""}
              </td>
              <td
                data-line={line.newLine ?? ""}
                data-side="right"
                className={`w-10 text-right px-2 py-0 select-none cursor-pointer border-r border-gray-200 ${gutterClass(line.type)}`}
                onClick={(e) => {
                  const ln = line.newLine ?? line.oldLine;
                  if (ln) onGutterClick(ln, "right", e.shiftKey);
                }}
              >
                {line.newLine ?? ""}
              </td>
              <td className={`px-2 py-0 whitespace-pre-wrap break-all ${lineClass(line.type)}`}>
                <span className="select-none text-gray-400 mr-2">
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                </span>
                {line.content}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {commentForm && (
        <div className="px-4">
          <DiffCommentForm
            startLine={commentForm.startLine}
            endLine={commentForm.endLine}
            onSubmit={onSubmitComment}
            onCancel={onCancelComment}
          />
        </div>
      )}

      {comments.length > 0 && (
        <div className="px-4 pb-2">
          {comments.map((c) => (
            <CommentDisplay
              key={c.id}
              body={c.body}
              onEdit={(body) => onUpdateComment(c.id, body)}
              onDelete={() => onDeleteComment(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
