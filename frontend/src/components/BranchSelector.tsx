import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listBranches } from "../api/client";
import type { Branch } from "../api/client";

interface BranchSelectorProps {
  owner: string;
  repo: string;
  currentRef: string;
  basePath: "tree" | "blob";
  subPath?: string;
}

export function BranchSelector({
  owner,
  repo,
  currentRef,
  basePath,
  subPath,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listBranches(owner, repo)
      .then(setBranches)
      .catch(() => {});
  }, [owner, repo]);

  function handleSelect(branchName: string) {
    setOpen(false);
    const path = subPath ? `/${subPath}` : "";
    navigate(`/${owner}/${repo}/${basePath}/${branchName}${path}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        aria-haspopup="listbox"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l-3 3m0 0l3 3M10 10h7m-7 0a7 7 0 110 14 7 7 0 010-14z" />
        </svg>
        {currentRef}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto" role="listbox">
            {branches.map((branch) => (
              <button
                key={branch.name}
                role="option"
                aria-selected={branch.name === currentRef}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  branch.name === currentRef ? "font-semibold bg-blue-50" : ""
                }`}
                onClick={() => handleSelect(branch.name)}
              >
                {branch.name}
                {branch.isDefault && (
                  <span className="ml-2 text-xs text-gray-400">default</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
