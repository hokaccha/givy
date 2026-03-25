import { useEffect, useState } from "react";
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
    <div className="border border-gray-200 rounded-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Review Changes</h3>
      <div className="flex items-center gap-2 flex-wrap">
        <BranchSelect
          label="base"
          branches={branches}
          value={base}
          onChange={setBase}
        />
        <span className="text-gray-400 text-lg">...</span>
        <BranchSelect
          label="compare"
          branches={branches}
          value={head}
          onChange={setHead}
        />
        <button
          onClick={handleReview}
          disabled={!base || !head || base === head}
          className="ml-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Compare
        </button>
      </div>
      {base && head && base === head && (
        <p className="text-xs text-gray-400 mt-2">Choose different branches to compare.</p>
      )}
    </div>
  );
}

function BranchSelect({
  label,
  branches,
  value,
  onChange,
}: {
  label: string;
  branches: Branch[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-600">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white font-mono"
      >
        <option value="">--</option>
        {branches.map((b) => (
          <option key={b.name} value={b.name}>
            {b.name}
            {b.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
