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
    <div className="flex items-center justify-end gap-2 flex-wrap">
      <BranchCombobox
        label="base"
        branches={branches}
        value={base}
        onChange={setBase}
      />
      <span className="text-gray-400 text-lg select-none">...</span>
      <BranchCombobox
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

function BranchCombobox({
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

  function openDropdown() {
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
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
      <label className="flex items-center gap-1.5 text-sm text-gray-600">
        {label}:
        <button
          type="button"
          onClick={openDropdown}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white font-mono text-left min-w-[180px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {value ? (
            <span>
              {value}
              {branches.find((b) => b.name === value)?.isDefault ? (
                <span className="text-gray-400 ml-1">(default)</span>
              ) : null}
            </span>
          ) : (
            <span className="text-gray-400">{placeholder ?? "--"}</span>
          )}
        </button>
      </label>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg w-72">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Filter branches..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className={`px-3 py-1.5 text-sm font-mono cursor-pointer flex items-center justify-between ${
                    i === highlightIndex ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  } ${b.name === value ? "font-semibold" : ""}`}
                >
                  <span className="truncate">{b.name}</span>
                  {b.isDefault && (
                    <span className="text-xs text-gray-400 ml-2 shrink-0">default</span>
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
