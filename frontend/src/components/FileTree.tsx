import { Link } from "react-router";
import type { TreeEntry } from "../api/client";

interface FileTreeProps {
  entries: TreeEntry[];
  owner: string;
  repo: string;
  refName: string;
  currentPath: string;
}

function FileIcon({ type }: { type: "blob" | "tree" }) {
  if (type === "tree") {
    return (
      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function entryName(fullName: string): string {
  // ls-tree returns "path/to/name" when listing with a prefix — extract last segment
  const parts = fullName.split("/");
  return parts[parts.length - 1];
}

export function FileTree({ entries, owner, repo, refName, currentPath }: FileTreeProps) {
  // Sort: directories first, then files, alphabetically within each group
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return entryName(a.name).localeCompare(entryName(b.name));
  });

  function buildLink(entry: TreeEntry): string {
    const name = entryName(entry.name);
    const pathSegment = currentPath ? `${currentPath}/${name}` : name;
    const routeType = entry.type === "tree" ? "tree" : "blob";
    return `/${owner}/${repo}/${routeType}/${refName}/${pathSegment}`;
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.name} className="border-t border-gray-100 first:border-t-0 hover:bg-gray-50">
              <td className="px-3 py-2 w-8">
                <FileIcon type={entry.type} />
              </td>
              <td className="px-3 py-2">
                <Link
                  to={buildLink(entry)}
                  className="text-blue-600 hover:underline"
                >
                  {entryName(entry.name)}
                </Link>
              </td>
              <td className="px-3 py-2 text-right text-gray-500 w-24">
                {entry.type === "blob" ? formatSize(entry.size) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
