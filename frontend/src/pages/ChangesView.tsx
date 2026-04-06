import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Layout, Breadcrumb } from "../components/Layout";
import { DiffViewer } from "../components/DiffViewer";
import {
  getDiffUnstaged,
  getDiffStaged,
  getCompare,
  listBranches,
} from "../api/client";
import type { Branch } from "../api/client";
import { parseDiff } from "../lib/diff-parser";
import { useComments } from "../hooks/useComments";
import type { DiffFile } from "../lib/diff-parser";
import { useTitle } from "../hooks/useTitle";

type Mode = "unstaged" | "staged" | "branch";

function parseSpec(spec: string): { mode: Mode; base: string; head: string } {
  if (spec === "@unstaged") {
    return { mode: "unstaged", base: "index", head: "worktree" };
  }
  if (spec === "@staged") {
    return { mode: "staged", base: "HEAD", head: "index" };
  }
  const dotIndex = spec.indexOf("...");
  if (dotIndex >= 0) {
    return {
      mode: "branch",
      base: spec.slice(0, dotIndex),
      head: spec.slice(dotIndex + 3),
    };
  }
  return { mode: "unstaged", base: "index", head: "worktree" };
}

export function ChangesView() {
  const params = useParams();
  const owner = params.owner!;
  const repo = params.repo!;
  const spec = params["*"] || "@unstaged";
  const navigate = useNavigate();

  const { mode, base, head } = parseSpec(spec);

  useTitle(
    mode === "branch"
      ? `${base}...${head} · ${owner}/${repo}`
      : `Changes · ${owner}/${repo}`,
  );

  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevFetchKey, setPrevFetchKey] = useState("");

  const fetchKey = `${owner}/${repo}/${spec}`;
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearAll,
    copyAllPrompts,
  } = useComments(owner, repo, base, head);

  useEffect(() => {
    let fetcher: Promise<{ patch: string }>;
    if (mode === "staged") {
      fetcher = getDiffStaged(owner, repo);
    } else if (mode === "branch") {
      fetcher = getCompare(owner, repo, base, head);
    } else {
      fetcher = getDiffUnstaged(owner, repo);
    }
    fetcher
      .then((data) => setDiffFiles(parseDiff(data.patch)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo, mode, base, head]);

  const breadcrumbItems = [
    { label: repo, href: `/${owner}/${repo}` },
    { label: "Diff" },
  ];

  const basePath = `/${owner}/${repo}/changes`;

  return (
    <Layout>
      <div className="mx-auto p-4" style={{ maxWidth: "1600px" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} size="base" />
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <TabButton
                active={mode === "unstaged"}
                onClick={() => navigate(`${basePath}/@unstaged`)}
              >
                Unstaged
              </TabButton>
              <TabButton
                active={mode === "staged"}
                onClick={() => navigate(`${basePath}/@staged`)}
              >
                Staged
              </TabButton>
            </div>
            <span className="text-[#d1d9e0]">|</span>
            <BranchCompareSelector
              owner={owner}
              repo={repo}
              active={mode === "branch"}
              currentBase={mode === "branch" ? base : ""}
              currentHead={mode === "branch" ? head : ""}
            />
            {mode === "branch" && (
              <Link
                to={`/${owner}/${repo}/commits/${base}...${head}`}
                className="text-sm text-[#0969da] hover:underline"
              >
                View commits
              </Link>
            )}
          </div>
        </div>

        {loading && <p className="text-[#636c76]">Loading...</p>}
        {error && <p className="text-[#cf222e]">{error}</p>}
        {!loading && !error && diffFiles.length === 0 && (
          <p className="text-[#636c76] mt-4">No changes.</p>
        )}
        {!loading && !error && diffFiles.length > 0 && (
          <DiffViewer
            files={diffFiles}
            comments={comments}
            onAddComment={addComment}
            onUpdateComment={updateComment}
            onDeleteComment={deleteComment}
            onClearAllComments={clearAll}
            onCopyAllPrompts={() =>
              copyAllPrompts(diffFiles.map((f) => ({ filePath: f.newPath })))
            }
          />
        )}
      </div>
    </Layout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer ${
        active
          ? "bg-[#0969da] text-white"
          : "bg-[#f6f8fa] text-[#1f2328] hover:bg-[#eaeef2]"
      }`}
    >
      {children}
    </button>
  );
}

function BranchCompareSelector({
  owner,
  repo,
  active,
  currentBase,
  currentHead,
}: {
  owner: string;
  repo: string;
  active: boolean;
  currentBase: string;
  currentHead: string;
}) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [base, setBase] = useState(currentBase);
  const [head, setHead] = useState(currentHead);
  const [prevKey, setPrevKey] = useState("");
  const [prevProps, setPrevProps] = useState(`${currentBase}/${currentHead}`);

  const propsKey = `${currentBase}/${currentHead}`;
  if (prevProps !== propsKey && currentBase && currentHead) {
    setPrevProps(propsKey);
    setBase(currentBase);
    setHead(currentHead);
  }

  const fetchKey = `${owner}/${repo}`;
  if (prevKey !== fetchKey) {
    setPrevKey(fetchKey);
    setLoading(true);
  }

  useEffect(() => {
    listBranches(owner, repo)
      .then((data) => {
        setBranches(data);
        let resolvedBase = base;
        if (!resolvedBase) {
          resolvedBase =
            data.find((b) => b.isDefault)?.name ?? data[0]?.name ?? "main";
          setBase(resolvedBase);
        }
        if (!head) {
          const currentBranch = data.find((b) => b.isCurrent);
          if (currentBranch && currentBranch.name !== resolvedBase) {
            setHead(currentBranch.name);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [owner, repo]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCompare() {
    if (!base || !head || base === head) return;
    navigate(`/${owner}/${repo}/changes/${base}...${head}`);
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <BranchSelector
        label="base"
        branches={branches.filter((b) => b.name !== head)}
        value={base}
        onChange={setBase}
        active={active}
      />
      <span className="text-[#636c76] text-lg select-none">...</span>
      <BranchSelector
        label="compare"
        branches={branches.filter((b) => b.name !== base)}
        value={head}
        onChange={setHead}
        placeholder="select branch"
        active={active}
      />
      <button
        onClick={handleCompare}
        disabled={!base || !head || base === head}
        className="px-4 py-1.5 text-sm font-medium text-white bg-[#0969da] rounded-md hover:bg-[#0860ca] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Compare
      </button>
    </div>
  );
}

function BranchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
    </svg>
  );
}

function BranchSelector({
  label,
  branches,
  value,
  onChange,
  placeholder,
  active,
}: {
  label: string;
  branches: Branch[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (prevQuery !== query) {
    setPrevQuery(query);
    setHighlightIndex(0);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle() {
    if (open) {
      setOpen(false);
      setQuery("");
    } else {
      setOpen(true);
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function select(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
      scrollToHighlight(Math.min(highlightIndex + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      scrollToHighlight(Math.max(highlightIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIndex]) {
        select(filtered[highlightIndex].name);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  function scrollToHighlight(index: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }

  const borderColor = active ? "border-[#0969da]" : "border-[#d1d9e0]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 border ${borderColor} rounded-md px-3 py-1.5 text-sm bg-white hover:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]`}
      >
        <BranchIcon className="text-[#636c76] shrink-0" />
        {value ? (
          <span className="font-mono truncate max-w-[200px]">{value}</span>
        ) : (
          <span className="text-[#636c76]">{placeholder ?? label}</span>
        )}
        <svg
          className="text-[#636c76] shrink-0 ml-0.5"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#d1d9e0] rounded-lg shadow-lg w-72">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#d1d9e0]">
            <span className="text-sm font-semibold text-[#1f2328]">
              Switch branches
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="text-[#636c76] hover:text-[#1f2328] p-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
          <div className="p-2 border-b border-[#d1d9e0]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find a branch..."
              className="w-full px-2 py-1.5 text-sm border border-[#d1d9e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            />
          </div>
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#636c76]">
                No matching branches
              </li>
            ) : (
              filtered.map((b, i) => (
                <li
                  key={b.name}
                  onMouseDown={() => select(b.name)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
                    i === highlightIndex
                      ? "bg-[#ddf4ff]"
                      : "hover:bg-[#f6f8fa]"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`shrink-0 ${b.name === value ? "text-[#0969da]" : "text-transparent"}`}
                  >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                  <span
                    className={`font-mono truncate ${b.name === value ? "font-semibold" : ""}`}
                  >
                    {b.name}
                  </span>
                  {b.isDefault && (
                    <span className="text-xs text-[#636c76] bg-[#f6f8fa] rounded px-1.5 py-0.5 shrink-0 ml-auto">
                      default
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
