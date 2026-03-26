import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { listBranches } from "../api/client";
import type { Branch } from "../api/client";

interface ReviewLauncherProps {
  owner: string;
  repo: string;
}

export function ReviewLauncher({ owner, repo }: ReviewLauncherProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [base, setBase] = useState("");
  const [head, setHead] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    listBranches(owner, repo)
      .then((data) => {
        setBranches(data);
        const defaultBranch = data.find((b) => b.isDefault)?.name ?? data[0]?.name ?? "main";
        setBase(defaultBranch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [owner, repo]);

  function handleReview() {
    if (!base || !head || base === head) return;
    navigate(`/${owner}/${repo}/compare/${base}...${head}`);
  }

  if (loading || branches.length < 2) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <BranchSelector
        label="base"
        branches={branches}
        value={base}
        onChange={setBase}
      />
      <span className="text-gray-400 text-lg select-none">...</span>
      <BranchSelector
        label="compare"
        branches={branches}
        value={head}
        onChange={setHead}
        placeholder="select branch"
      />
      <button
        onClick={handleReview}
        disabled={!base || !head || base === head}
        className="ml-1 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
}: {
  label: string;
  branches: Branch[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <BranchIcon className="text-gray-500 shrink-0" />
        {value ? (
          <span className="font-mono truncate max-w-[200px]">{value}</span>
        ) : (
          <span className="text-gray-400">{placeholder ?? label}</span>
        )}
        <svg
          className="text-gray-400 shrink-0 ml-0.5"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-72">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              Switch branches
            </span>
            <button
              type="button"
              onClick={() => { setOpen(false); setQuery(""); }}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find a branch..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No matching branches</li>
            ) : (
              filtered.map((b, i) => (
                <li
                  key={b.name}
                  onMouseDown={() => select(b.name)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
                    i === highlightIndex ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`shrink-0 ${b.name === value ? "text-blue-600" : "text-transparent"}`}
                  >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                  <span className={`font-mono truncate ${b.name === value ? "font-semibold" : ""}`}>
                    {b.name}
                  </span>
                  {b.isDefault && (
                    <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0 ml-auto">
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
