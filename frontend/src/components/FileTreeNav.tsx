import { useMemo, useState } from "react";
import {
  buildFileTree,
  collectDirPaths,
  type FileTreeNode,
} from "../lib/file-tree";

interface FileTreeNavProps {
  paths: string[];
  commentCounts?: Map<string, number>;
  onFileClick: (path: string) => void;
}

export function FileTreeNav({
  paths,
  commentCounts,
  onFileClick,
}: FileTreeNavProps) {
  const [filterText, setFilterText] = useState("");
  const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<string>>(
    () => new Set()
  );

  const filteredPaths = useMemo(() => {
    if (!filterText) return paths;
    const needle = filterText.toLowerCase();
    return paths.filter((p) => p.toLowerCase().includes(needle));
  }, [paths, filterText]);

  const tree = useMemo(() => buildFileTree(filteredPaths), [filteredPaths]);

  // While filtering, force-expand everything so matches are visible.
  const isFiltering = filterText.length > 0;
  const collapsedSet = isFiltering ? new Set<string>() : manuallyCollapsed;

  const toggle = (path: string) => {
    setManuallyCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => setManuallyCollapsed(new Set());
  const collapseAll = () =>
    setManuallyCollapsed(new Set(collectDirPaths(buildFileTree(paths))));

  return (
    <div className="sticky top-4">
      <div className="relative mb-2">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636c76]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
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
      <div className="flex items-center justify-end gap-2 mb-1 text-xs text-[#57606a]">
        <button
          type="button"
          onClick={expandAll}
          className="hover:text-[#0969da] cursor-pointer"
        >
          Expand all
        </button>
        <span className="text-[#d0d7de]">|</span>
        <button
          type="button"
          onClick={collapseAll}
          className="hover:text-[#0969da] cursor-pointer"
        >
          Collapse all
        </button>
      </div>
      <div
        data-testid="file-list"
        className="max-h-[calc(100vh-12rem)] overflow-y-auto text-sm"
      >
        {tree.length === 0 ? (
          <div className="px-2 py-2 text-xs text-[#57606a]">No files</div>
        ) : (
          <TreeNodes
            nodes={tree}
            depth={0}
            collapsedSet={collapsedSet}
            onToggle={toggle}
            onFileClick={onFileClick}
            commentCounts={commentCounts}
          />
        )}
      </div>
    </div>
  );
}

interface TreeNodesProps {
  nodes: FileTreeNode[];
  depth: number;
  collapsedSet: Set<string>;
  onToggle: (path: string) => void;
  onFileClick: (path: string) => void;
  commentCounts?: Map<string, number>;
}

function TreeNodes({
  nodes,
  depth,
  collapsedSet,
  onToggle,
  onFileClick,
  commentCounts,
}: TreeNodesProps) {
  return (
    <ul role="group" className="list-none">
      {nodes.map((node) =>
        node.type === "dir" ? (
          <DirItem
            key={node.path}
            node={node}
            depth={depth}
            collapsedSet={collapsedSet}
            onToggle={onToggle}
            onFileClick={onFileClick}
            commentCounts={commentCounts}
          />
        ) : (
          <FileItem
            key={node.path}
            node={node}
            depth={depth}
            onFileClick={onFileClick}
            commentCount={commentCounts?.get(node.path) ?? 0}
          />
        )
      )}
    </ul>
  );
}

const INDENT_PX = 12;

function DirItem({
  node,
  depth,
  collapsedSet,
  onToggle,
  onFileClick,
  commentCounts,
}: {
  node: Extract<FileTreeNode, { type: "dir" }>;
  depth: number;
  collapsedSet: Set<string>;
  onToggle: (path: string) => void;
  onFileClick: (path: string) => void;
  commentCounts?: Map<string, number>;
}) {
  const isCollapsed = collapsedSet.has(node.path);
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(node.path)}
        aria-expanded={!isCollapsed}
        className="w-full flex items-center gap-1 px-1 py-1.5 rounded hover:bg-[#f6f8fa] text-left cursor-pointer"
        style={{ paddingLeft: 4 + depth * INDENT_PX }}
      >
        <svg
          className={`w-3 h-3 shrink-0 text-[#57606a] transition-transform ${
            isCollapsed ? "-rotate-90" : ""
          }`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
        </svg>
        <svg
          className="w-4 h-4 shrink-0 text-[#54aeff]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 13 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.909.513-1.237Z" />
        </svg>
        <span className="truncate text-[#1f2328]">{node.name}</span>
      </button>
      {!isCollapsed && (
        <TreeNodes
          nodes={node.children}
          depth={depth + 1}
          collapsedSet={collapsedSet}
          onToggle={onToggle}
          onFileClick={onFileClick}
          commentCounts={commentCounts}
        />
      )}
    </li>
  );
}

function FileItem({
  node,
  depth,
  onFileClick,
  commentCount,
}: {
  node: Extract<FileTreeNode, { type: "file" }>;
  depth: number;
  onFileClick: (path: string) => void;
  commentCount: number;
}) {
  return (
    <li>
      <a
        href={`#diff-${node.path}`}
        data-path={node.path}
        title={node.path}
        onClick={(e) => {
          e.preventDefault();
          onFileClick(node.path);
        }}
        className="flex items-center gap-1 px-1 py-1.5 rounded hover:bg-[#f6f8fa] text-[#1f2328]"
        style={{ paddingLeft: 4 + depth * INDENT_PX + 16 }}
      >
        <svg
          className="w-4 h-4 shrink-0 text-[#57606a]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
        </svg>
        <span className="truncate flex-1 min-w-0">{node.name}</span>
        {commentCount > 0 && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 text-xs text-[#57606a]"
            title={`${commentCount} comment${commentCount === 1 ? "" : "s"}`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Z" />
            </svg>
            {commentCount}
          </span>
        )}
      </a>
    </li>
  );
}
